-- =============================================================================
-- 002 — Anonymous comments, word filter (English + Dhivehi), richer reports,
--       moderation log.   Run AFTER schema.sql.  Safe to re-run.
--
-- How the filter works
--   * Every blocked term is compiled into a regular expression (blocked_terms.pattern)
--     that tolerates repeated letters ("fuuuck"), leetspeak ("sh1t", "@ss") and, for
--     'anywhere' terms, separators ("f.u.c.k").  Matching is done on text normalised the
--     same way (lower-case, NFKC, zero-width chars + apostrophes stripped, leet mapped).
--   * Boundaries are Thaana-aware, so Dhivehi in Thaana script and in Latin letters
--     ("dv-latin") both work.
--   * Terms live in a table, so moderators / the Fodibey dashboard can add or remove
--     them without a deploy.   scope 'comments' = only checked in comments;
--     scope 'all' = also checked in posts (reserved for slurs, so people can still
--     vent honestly in their own letters).
--   * The filter runs in the database (add_comment / posts trigger), so it can't be
--     bypassed by a modified client.
-- =============================================================================

-- ------------------------------------------------------------ text helpers ----
create or replace function public.normalize_text(p_text text) returns text
language sql immutable as $$
  select translate(
    regexp_replace(
      regexp_replace(lower(normalize(coalesce(p_text, ''), NFKC)),
        '[​-‏‪-‮⁠﻿­]', '', 'g'),   -- zero-width / bidi tricks
      '[''’`]', '', 'g'),                                              -- apostrophes: "i'll" -> "ill"
    '013457$@', 'oieastsa')                                            -- leetspeak (not '!': that's punctuation)
$$;

-- joins isolated single letters ("k y s", "k.y.s" -> "kys") so spaced-out evasions are caught too
create or replace function public.squash_text(p_text text) returns text
language sql immutable as $$
  select regexp_replace(p_text, '(?<=\m[a-z0-9])[^a-z0-9\u0780-\u07b1](?=[a-z0-9]\M)', '', 'g')
$$;

-- term -> regex.  word: whole word only.  anywhere: also inside words and with separators.
create or replace function public.build_block_pattern(p_term text, p_mode text) returns text
language plpgsql immutable as $$
declare
  t   text := public.normalize_text(btrim(p_term));
  sep text := '[^a-z0-9ހ-ޱ]';        -- anything that is not a Latin letter, digit or Thaana letter
  r   text := '';
  ch  text;
  i   int;
begin
  for i in 1 .. char_length(t) loop
    ch := substr(t, i, 1);
    if ch ~ '\s' then
      r := r || sep || '+';
    else
      r := r || regexp_replace(ch, '([.^$*+?(){}\[\]|\\])', '\\\1', 'g') || '+';   -- repeated letters allowed
      if p_mode = 'anywhere' and i < char_length(t) and substr(t, i + 1, 1) !~ '\s' then
        r := r || sep || '*';                                                       -- f.u.c.k
      end if;
    end if;
  end loop;
  if p_mode = 'word' then
    return '(^|' || sep || ')' || r || '($|' || sep || ')';
  end if;
  return r;
end $$;

-- ----------------------------------------------------------- blocked terms ----
create table if not exists public.blocked_terms (
  id         bigserial primary key,
  term       text not null,
  lang       text not null default 'en' check (lang in ('en', 'dv', 'dv-latin', 'any')),
  scope      text not null default 'comments' check (scope in ('comments', 'all')),
  mode       text not null default 'word' check (mode in ('word', 'anywhere')),
  pattern    text not null default '',
  note       text,
  created_at timestamptz not null default now(),
  unique (term, lang)
);

create or replace function public.blocked_terms_compile() returns trigger language plpgsql as $$
begin
  new.pattern := public.build_block_pattern(new.term, new.mode);
  return new;
end $$;
drop trigger if exists blocked_terms_compile_trg on public.blocked_terms;
create trigger blocked_terms_compile_trg before insert or update of term, mode on public.blocked_terms
  for each row execute function public.blocked_terms_compile();

alter table public.blocked_terms enable row level security;          -- no policies: invisible to anon
revoke all on public.blocked_terms from anon, authenticated;

-- scope: 'comments' checks scope IN (comments, all); 'posts' checks scope = all only
create or replace function public.check_blocked(p_text text, p_scope text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from blocked_terms bt, (select normalize_text(p_text) as t) n
    where (n.t ~ bt.pattern or squash_text(n.t) ~ bt.pattern) and (bt.scope = 'all' or p_scope = 'comments')
  )
$$;

-- links / e-mail addresses (and, optionally, phone numbers): doxxing + spam protection
create or replace function public.contains_contact_info(p_text text, p_phone boolean default false) returns boolean
language sql immutable as $$
  select p_text ~* '(https?://|www\.|\m[a-z0-9-]+\.(com|net|org|mv|me|io|co|ly|gl)\M)'
      or p_text ~* '[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}'
      or (p_phone and p_text ~ '\+?\d[\d\s().-]{5,}\d')
$$;

-- ---- seed: English ------------------------------------------------------------
-- 'comments' scope: rude / harsh / invalidating / encouraging self-harm. Careful to avoid phrases
-- that appear in SUPPORTIVE notes ("it's not your fault", "you're not weak" are NOT blocked).
insert into public.blocked_terms (term, lang, scope, mode, note) values
  ('fuck','en','comments','anywhere','profanity'), ('motherfucker','en','comments','anywhere','profanity'),
  ('shit','en','comments','word','profanity'), ('bullshit','en','comments','word','profanity'), ('shitty','en','comments','word','profanity'),
  ('bitch','en','comments','word','profanity'), ('bitches','en','comments','word','profanity'),
  ('bastard','en','comments','word','profanity'), ('bastards','en','comments','word','profanity'),
  ('asshole','en','comments','word','profanity'), ('assholes','en','comments','word','profanity'), ('arsehole','en','comments','word','profanity'),
  ('dickhead','en','comments','word','profanity'), ('dick','en','comments','word','profanity'), ('prick','en','comments','word','profanity'),
  ('pussy','en','comments','word','profanity'), ('cunt','en','comments','word','profanity'), ('twat','en','comments','word','profanity'), ('wanker','en','comments','word','profanity'),
  ('whore','en','comments','word','profanity'), ('slut','en','comments','word','profanity'), ('slag','en','comments','word','profanity'),
  ('idiot','en','comments','word','insult'), ('idiots','en','comments','word','insult'), ('stupid','en','comments','word','insult'),
  ('moron','en','comments','word','insult'), ('dumbass','en','comments','word','insult'), ('loser','en','comments','word','insult'), ('losers','en','comments','word','insult'),
  ('pathetic','en','comments','word','insult'), ('disgusting','en','comments','word','insult'), ('scum','en','comments','word','insult'),
  ('shut up','en','comments','word','harsh'), ('stfu','en','comments','word','harsh'), ('gtfo','en','comments','word','harsh'),
  ('attention seeker','en','comments','word','invalidating'), ('attention seekers','en','comments','word','invalidating'), ('attention seeking','en','comments','word','invalidating'),
  ('stop whining','en','comments','word','invalidating'), ('stop crying','en','comments','word','invalidating'),
  ('nobody cares','en','comments','word','invalidating'), ('no one cares','en','comments','word','invalidating'),
  ('get over it','en','comments','word','invalidating'), ('man up','en','comments','word','invalidating'), ('drama queen','en','comments','word','invalidating'),
  -- encouraging self-harm / threats / sexual harassment
  ('kill yourself','en','comments','word','self-harm encouragement'), ('kill your self','en','comments','word','self-harm encouragement'),
  ('kys','en','comments','word','self-harm encouragement'), ('go die','en','comments','word','self-harm encouragement'), ('go and die','en','comments','word','self-harm encouragement'),
  ('hang yourself','en','comments','word','self-harm encouragement'), ('end yourself','en','comments','word','self-harm encouragement'),
  ('you should die','en','comments','word','self-harm encouragement'), ('hope you die','en','comments','word','self-harm encouragement'),
  ('wish you were dead','en','comments','word','self-harm encouragement'), ('drop dead','en','comments','word','self-harm encouragement'),
  ('i will kill you','en','comments','word','threat'), ('ill kill you','en','comments','word','threat'), ('gonna kill you','en','comments','word','threat'),
  ('rape you','en','comments','word','threat'), ('i will rape','en','comments','word','threat'),
  ('i know where you live','en','comments','word','threat'), ('i will find you','en','comments','word','threat'), ('send nudes','en','comments','word','harassment'),
  -- slurs: blocked everywhere, including posts
  ('nigger','en','all','anywhere','racial slur'), ('nigga','en','all','anywhere','racial slur'),
  ('faggot','en','all','anywhere','homophobic slur'), ('fag','en','all','word','homophobic slur'), ('tranny','en','all','word','transphobic slur'),
  ('retard','en','all','word','ableist slur'), ('retards','en','all','word','ableist slur'), ('retarded','en','all','word','ableist slur'),
  ('chink','en','all','word','racial slur'), ('kike','en','all','word','antisemitic slur'), ('spic','en','all','word','racial slur'), ('paki','en','all','word','racial slur'),
  -- accusing someone of apostasy is dangerous harassment in the Maldives
  ('kafir','any','all','word','apostasy accusation'), ('kaafir','any','all','word','apostasy accusation'), ('kuffar','any','all','word','apostasy accusation')
on conflict (term, lang) do nothing;

-- ---- seed: Dhivehi — a STARTER SET only ---------------------------------------
-- No public Dhivehi profanity lexicon exists. Only terms we are confident about are seeded.
-- Native-speaker moderators MUST review and extend this (insert rows; patterns compile automatically).
-- Thaana-script comments also get a lower report threshold (see report_comment) because the list is thin.
insert into public.blocked_terms (term, lang, scope, mode, note) values
  ('foshi','dv-latin','comments','word','vulgar (starter set — needs native review)'),
  ('ފޮށި','dv','comments','word','vulgar (starter set — needs native review)')
on conflict (term, lang) do nothing;

-- recompile every pattern (idempotent; picks up any change to the helpers above)
update public.blocked_terms set pattern = public.build_block_pattern(term, mode);

-- ------------------------------------------------------------------ comments --
create table if not exists public.comments (
  id           uuid primary key default gen_random_uuid(),
  post_id      uuid not null references public.posts(id) on delete cascade,
  created_at   timestamptz not null default now(),
  body         text not null check (char_length(btrim(body)) between 2 and 500),
  device_token text not null,
  report_count integer not null default 0,
  is_hidden    boolean not null default false
);
create index if not exists comments_post_idx   on public.comments (post_id, created_at) where not is_hidden;
create index if not exists comments_device_idx on public.comments (device_token, created_at desc);

alter table public.posts add column if not exists comment_count integer not null default 0;

alter table public.comments enable row level security;
-- anon can't read posts.is_hidden directly (column grants), so the policy asks this helper instead
create or replace function public.post_visible(p_post_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from posts where id = p_post_id and not is_hidden)
$$;
grant execute on function public.post_visible(uuid) to anon, authenticated;

drop policy if exists comments_read on public.comments;
create policy comments_read on public.comments for select to anon, authenticated
  using (not is_hidden and public.post_visible(post_id));
revoke all on public.comments from anon, authenticated;
grant select (id, post_id, created_at, body) on public.comments to anon, authenticated;
-- (no insert grant: comments are only created through add_comment(), which enforces the filter + limits)

grant select (comment_count) on public.posts to anon, authenticated;

-- keep posts.comment_count right (insert / hide / unhide / delete)
create or replace function public.comments_count_sync() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' and not new.is_hidden then
    update posts set comment_count = comment_count + 1 where id = new.post_id;
  elsif tg_op = 'UPDATE' and old.is_hidden is distinct from new.is_hidden then
    update posts set comment_count = greatest(comment_count + case when new.is_hidden then -1 else 1 end, 0) where id = new.post_id;
  elsif tg_op = 'DELETE' and not old.is_hidden then
    update posts set comment_count = greatest(comment_count - 1, 0) where id = old.post_id;
  end if;
  return null;
end $$;
drop trigger if exists comments_count_trg on public.comments;
create trigger comments_count_trg after insert or update of is_hidden or delete on public.comments
  for each row execute function public.comments_count_sync();

-- Leave a note. Everything is enforced here, in the database.
create or replace function public.add_comment(p_post_id uuid, p_body text, p_device text)
returns table (id uuid, post_id uuid, created_at timestamptz, body text)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare
  v_body text := btrim(coalesce(p_body, ''));
begin
  if coalesce(length(p_device), 0) < 16 then raise exception 'invalid device' using errcode = 'P0001'; end if;
  if char_length(v_body) < 2 or char_length(v_body) > 500 then
    raise exception 'Notes need between 2 and 500 characters.' using errcode = 'P0001';
  end if;
  if not exists (select 1 from posts p where p.id = p_post_id and not p.is_hidden) then
    raise exception 'That bottle has drifted away.' using errcode = 'P0001';
  end if;
  if contains_contact_info(v_body, true) then
    raise exception 'Please don''t share links, emails or phone numbers.' using errcode = 'P0001', hint = 'contact';
  end if;
  if check_blocked(v_body, 'comments') then
    raise exception 'That wording isn''t allowed here. Try saying it more gently.' using errcode = 'P0001', hint = 'blocked';
  end if;
  if (select count(*) from comments c where c.device_token = p_device and c.created_at > now() - interval '1 minute') >= 3 then
    raise exception 'Slow down a little. Try again in a minute.' using errcode = 'P0001';
  end if;
  if (select count(*) from comments c where c.device_token = p_device and c.created_at > now() - interval '1 hour') >= 20 then
    raise exception 'You''ve left a lot of notes. Take a breather and come back later.' using errcode = 'P0001';
  end if;
  if exists (select 1 from comments c where c.post_id = p_post_id and c.device_token = p_device and lower(c.body) = lower(v_body)) then
    raise exception 'You already left that note.' using errcode = 'P0001';
  end if;

  return query
    insert into comments (post_id, body, device_token) values (p_post_id, v_body, p_device)
    returning comments.id, comments.post_id, comments.created_at, comments.body;
end $$;

grant execute on function public.add_comment(uuid, text, text) to anon, authenticated;

-- ---------------------------------------------- posts: filter + contact info ---
create or replace function public.posts_content_filter() returns trigger language plpgsql as $$
begin
  if contains_contact_info(new.body || ' ' || coalesce(new.island, '') || ' ' || coalesce(new.trigger_warning, ''), false) then
    raise exception 'Please keep links and email addresses out of your letter. Nothing here should point back to you.' using errcode = 'P0001', hint = 'contact';
  end if;
  if check_blocked(new.body || ' ' || coalesce(new.island, '') || ' ' || coalesce(new.trigger_warning, ''), 'posts') then
    raise exception 'Your letter contains a slur or hateful wording that isn''t allowed here. Please rephrase it.' using errcode = 'P0001', hint = 'blocked';
  end if;
  return new;
end $$;
drop trigger if exists posts_content_filter_trg on public.posts;   -- runs before posts_rate_limit_trg (alphabetical)
create trigger posts_content_filter_trg before insert on public.posts
  for each row execute function public.posts_content_filter();

-- ------------------------------------------------------------------- reports --
-- Reports can now target a post OR a comment, carry a reason, and have a status for the dashboard.
do $$
begin
  if exists (select 1 from pg_constraint where conrelid = 'public.reports'::regclass and conname = 'reports_pkey')
     and not exists (select 1 from information_schema.columns where table_name = 'reports' and column_name = 'id') then
    alter table public.reports drop constraint reports_pkey;
    alter table public.reports add column id uuid not null default gen_random_uuid();
    alter table public.reports add primary key (id);
  end if;
end $$;
alter table public.reports alter column post_id drop not null;
alter table public.reports add column if not exists comment_id  uuid references public.comments(id) on delete cascade;
alter table public.reports add column if not exists reason      text not null default 'other';
alter table public.reports add column if not exists status      text not null default 'open';
alter table public.reports add column if not exists resolved_at timestamptz;
alter table public.reports drop constraint if exists reports_reason_chk;
alter table public.reports add constraint reports_reason_chk check (reason in ('rude', 'hate', 'self_harm', 'spam', 'privacy', 'other'));
alter table public.reports drop constraint if exists reports_status_chk;
alter table public.reports add constraint reports_status_chk check (status in ('open', 'actioned', 'dismissed'));
alter table public.reports drop constraint if exists reports_target_chk;
alter table public.reports add constraint reports_target_chk check ((post_id is not null)::int + (comment_id is not null)::int = 1);
create unique index if not exists reports_post_device_uidx    on public.reports (post_id, device_token)    where post_id is not null;
create unique index if not exists reports_comment_device_uidx on public.reports (comment_id, device_token) where comment_id is not null;
create index if not exists reports_open_idx on public.reports (status, created_at desc);

-- Three distinct reports hide a post/comment pending review (two for Thaana-script comments, where the word
-- list is thin). "self_harm" reports never hide anything: they flag a person who may need help.
drop function if exists public.report_post(uuid, text);
create or replace function public.report_post(p_post_id uuid, p_device text, p_reason text default 'other')
returns void language plpgsql security definer set search_path = public as $$
declare
  v_threshold int;
  v_new boolean;
begin
  if coalesce(length(p_device), 0) < 16 then raise exception 'invalid device'; end if;
  if p_reason not in ('rude', 'hate', 'self_harm', 'spam', 'privacy', 'other') then p_reason := 'other'; end if;
  select case when body ~ '[ހ-ޱ]' then 2 else 3 end into v_threshold from posts where id = p_post_id;
  if v_threshold is null then return; end if;
  insert into reports (post_id, device_token, reason) values (p_post_id, p_device, p_reason) on conflict do nothing;
  get diagnostics v_new = row_count;
  if v_new and p_reason <> 'self_harm' then
    update posts set report_count = report_count + 1,
                     is_hidden = is_hidden or (report_count + 1 >= v_threshold)
    where id = p_post_id;
  end if;
end $$;

create or replace function public.report_comment(p_comment_id uuid, p_device text, p_reason text default 'other')
returns void language plpgsql security definer set search_path = public as $$
declare
  v_threshold int;
  v_new boolean;
begin
  if coalesce(length(p_device), 0) < 16 then raise exception 'invalid device'; end if;
  if p_reason not in ('rude', 'hate', 'self_harm', 'spam', 'privacy', 'other') then p_reason := 'other'; end if;
  select case when body ~ '[ހ-ޱ]' then 2 else 3 end into v_threshold from comments where id = p_comment_id;
  if v_threshold is null then return; end if;
  insert into reports (comment_id, device_token, reason) values (p_comment_id, p_device, p_reason) on conflict do nothing;
  get diagnostics v_new = row_count;
  if v_new and p_reason <> 'self_harm' then
    update comments set report_count = report_count + 1,
                        is_hidden = is_hidden or (report_count + 1 >= v_threshold)
    where id = p_comment_id;
  end if;
end $$;

grant execute on function public.report_post(uuid, text, text)    to anon, authenticated;
grant execute on function public.report_comment(uuid, text, text) to anon, authenticated;

-- ---------------------------------------------------------- moderation log ----
-- Audit trail written by the Fodibey API (service role). Invisible to the public.
create table if not exists public.moderation_log (
  id          bigserial primary key,
  at          timestamptz not null default now(),
  actor       text not null,
  action      text not null,
  target_type text not null,
  target_id   text,
  detail      jsonb not null default '{}'::jsonb
);
create index if not exists moderation_log_at_idx on public.moderation_log (at desc);
alter table public.moderation_log enable row level security;
revoke all on public.moderation_log from anon, authenticated;
