-- =============================================================================
-- Ihusaas (ihusaas.online) — Supabase schema
-- Run in the Supabase SQL editor. Idempotent enough for a fresh project.
--
-- Anonymity model
--   * No auth.users involvement at all: the client uses the anon key only.
--   * A random per-browser "device token" (client-generated UUID, never shown)
--     is used ONLY for dedupe + rate limiting (one reaction per kind, N posts/h).
--     It is stored in columns the anon role cannot SELECT, so tokens can't be
--     scraped and linked to posts.
--   * anon may INSERT posts (column-restricted) and SELECT only public columns
--     of non-hidden posts. Reactions/reports go through SECURITY DEFINER RPCs.
-- =============================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- reference --
-- Atolls are a reference table so posts can FK to it and the heatmap can
-- LEFT JOIN to show zero-count atolls. Codes match the GeoJSON mapping in
-- src/lib/constants.ts.
create table if not exists public.atolls (
  code text primary key,
  name text not null,
  lat  double precision not null,
  lng  double precision not null
);

insert into public.atolls (code, name, lat, lng) values
  ('HA','Haa Alif',6.95,73.20), ('HDh','Haa Dhaalu',6.55,73.05),
  ('Sh','Shaviyani',6.20,73.20), ('N','Noonu',5.80,73.40),
  ('R','Raa',5.50,72.95), ('B','Baa',5.10,72.95),
  ('Lh','Lhaviyani',5.40,73.55), ('K','Kaafu',4.30,73.50),
  ('MLE','Malé City',4.175,73.51), ('AA','Alif Alif',4.05,72.85),
  ('ADh','Alif Dhaal',3.65,72.85), ('V','Vaavu',3.50,73.50),
  ('M','Meemu',3.00,73.55), ('F','Faafu',3.20,72.95),
  ('Dh','Dhaalu',2.85,72.95), ('Th','Thaa',2.20,73.10),
  ('L','Laamu',1.95,73.40), ('GA','Gaafu Alif',0.65,73.30),
  ('GDh','Gaafu Dhaalu',0.30,73.25), ('Gn','Gnaviyani',-0.30,73.43),
  ('S','Addu',-0.65,73.15)
on conflict (code) do nothing;

-- -------------------------------------------------------------------- posts --
create table if not exists public.posts (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),

  body            text not null check (char_length(btrim(body)) between 10 and 5000),
  category        text not null check (category in
                    ('horror','sad','vent','secrets','nostalgia','work','relationships')),
  trigger_warning text check (trigger_warning is null or char_length(trigger_warning) <= 80),
  atoll_code      text not null references public.atolls(code),
  island          text check (island is null or char_length(island) <= 60),

  -- Denormalised reaction counters (maintained by react_to_post()) so the feed
  -- never aggregates the reactions table.
  felt_count      integer not null default 0,
  heart_count     integer not null default 0,
  listening_count integer not null default 0,

  -- Moderation
  report_count    integer not null default 0,
  is_hidden       boolean not null default false,

  -- Private: dedupe/rate-limit token. Not selectable by anon (see grants).
  device_token    text
);

-- Feed: newest first, keyset-paginated on (created_at, id).
create index if not exists posts_feed_idx
  on public.posts (created_at desc, id desc) where not is_hidden;
-- Category-filtered feed.
create index if not exists posts_category_feed_idx
  on public.posts (category, created_at desc, id desc) where not is_hidden;
-- Atoll-filtered feed + heatmap aggregation (atoll, category).
create index if not exists posts_atoll_category_idx
  on public.posts (atoll_code, category) where not is_hidden;
create index if not exists posts_atoll_feed_idx
  on public.posts (atoll_code, created_at desc, id desc) where not is_hidden;
-- Rate-limit lookups.
create index if not exists posts_device_recent_idx
  on public.posts (device_token, created_at desc);

-- Rate limit: max 5 stories per device per hour (cheap abuse brake).
-- SECURITY DEFINER: the anon role can't read device_token (by design), so the count must run as the owner.
create or replace function public.posts_rate_limit() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.device_token is null then
    raise exception 'device token required' using errcode = 'P0001';
  end if;
  if (select count(*) from public.posts
        where device_token = new.device_token
          and created_at > now() - interval '1 hour') >= 5 then
    raise exception 'slow down — you can share up to 5 stories per hour' using errcode = 'P0001';
  end if;
  return new;
end $$;

drop trigger if exists posts_rate_limit_trg on public.posts;
create trigger posts_rate_limit_trg before insert on public.posts
  for each row execute function public.posts_rate_limit();

-- ---------------------------------------------------------------- reactions --
-- One row per (post, device, kind). Unselectable by anon; used for dedupe only.
create table if not exists public.reactions (
  post_id      uuid not null references public.posts(id) on delete cascade,
  device_token text not null,
  kind         text not null check (kind in ('felt','heart','listening')),
  created_at   timestamptz not null default now(),
  primary key (post_id, device_token, kind)
);

create table if not exists public.reports (
  post_id      uuid not null references public.posts(id) on delete cascade,
  device_token text not null,
  created_at   timestamptz not null default now(),
  primary key (post_id, device_token)
);

-- ---------------------------------------------------------------------- RLS --
alter table public.atolls   enable row level security;
alter table public.posts    enable row level security;
alter table public.reactions enable row level security;
alter table public.reports  enable row level security;

drop policy if exists atolls_read on public.atolls;
create policy atolls_read on public.atolls for select to anon, authenticated using (true);

drop policy if exists posts_read on public.posts;
create policy posts_read on public.posts for select to anon, authenticated
  using (not is_hidden);

-- Inserts must start clean: counters zero, not hidden. (Column grants below
-- additionally stop anon from even naming those columns.)
drop policy if exists posts_insert on public.posts;
create policy posts_insert on public.posts for insert to anon, authenticated
  with check (is_hidden = false and felt_count = 0 and heart_count = 0
              and listening_count = 0 and report_count = 0);

-- No policies on reactions/reports => anon cannot read or write them directly.

-- ------------------------------------------------------------------- grants --
revoke all on public.posts, public.reactions, public.reports from anon, authenticated;
revoke all on public.atolls from anon, authenticated;
grant select on public.atolls to anon, authenticated;

-- Public read surface: everything except device_token / moderation internals.
grant select (id, created_at, body, category, trigger_warning, atoll_code, island,
              felt_count, heart_count, listening_count)
  on public.posts to anon, authenticated;
-- Write surface: only what the author may set.
grant insert (body, category, trigger_warning, atoll_code, island, device_token)
  on public.posts to anon, authenticated;

-- --------------------------------------------------------------------- RPCs --
-- Toggle a supportive reaction. Returns fresh counters + whether it is now on.
create or replace function public.react_to_post(p_post_id uuid, p_kind text, p_device text)
returns table (felt integer, heart integer, listening integer, active boolean)
language plpgsql security definer set search_path = public as $$
declare
  v_active boolean;
begin
  if p_kind not in ('felt','heart','listening') or coalesce(length(p_device),0) < 16 then
    raise exception 'invalid reaction';
  end if;

  if exists (select 1 from reactions
              where post_id = p_post_id and device_token = p_device and kind = p_kind) then
    delete from reactions
      where post_id = p_post_id and device_token = p_device and kind = p_kind;
    v_active := false;
  else
    insert into reactions (post_id, device_token, kind) values (p_post_id, p_device, p_kind);
    v_active := true;
  end if;

  update posts set
    felt_count      = felt_count      + case when p_kind = 'felt'      then (case when v_active then 1 else -1 end) else 0 end,
    heart_count     = heart_count     + case when p_kind = 'heart'     then (case when v_active then 1 else -1 end) else 0 end,
    listening_count = listening_count + case when p_kind = 'listening' then (case when v_active then 1 else -1 end) else 0 end
  where id = p_post_id;

  return query
    select p.felt_count, p.heart_count, p.listening_count, v_active
    from posts p where p.id = p_post_id;
end $$;

-- Report a post; 3 distinct reports auto-hide it pending human review.
create or replace function public.report_post(p_post_id uuid, p_device text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if coalesce(length(p_device),0) < 16 then raise exception 'invalid device'; end if;
  insert into reports (post_id, device_token) values (p_post_id, p_device)
    on conflict do nothing;
  if found then
    update posts set report_count = report_count + 1,
                     is_hidden = (report_count + 1 >= 3)
    where id = p_post_id;
  end if;
end $$;

-- Heatmap: story count per atoll, optionally for one category.
-- LEFT JOIN so atolls with zero stories still appear (renders as "quiet").
create or replace function public.atoll_counts(p_category text default null)
returns table (atoll_code text, total bigint)
language sql stable security definer set search_path = public as $$
  select a.code, count(p.id)
  from atolls a
  left join posts p
    on p.atoll_code = a.code
   and not p.is_hidden
   and (p_category is null or p.category = p_category)
  group by a.code
$$;

grant execute on function public.react_to_post(uuid, text, text) to anon, authenticated;
grant execute on function public.report_post(uuid, text)        to anon, authenticated;
grant execute on function public.atoll_counts(text)             to anon, authenticated;
