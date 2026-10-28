-- 005: suggestions box ("Send us a note") -> Fodibey dashboard.
-- Private table: browsers can't read or write it. Notes arrive only through POST /api/suggestions (server side, service_role),
-- which calls send_suggestion() below. Fodibey reads/triages them through GET/PATCH/DELETE /api/fodibey/v1/suggestions.
-- Anonymous by default: `contact` is optional and only filled if the person chooses to leave a way to reply.
-- Run in the Supabase SQL editor (or psql). Safe to run twice.

create table if not exists public.suggestions (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  kind        text not null default 'idea' check (kind in ('idea', 'bug', 'thanks', 'safety', 'other')),
  message     text not null check (char_length(btrim(message)) between 5 and 2000),
  contact     text check (contact is null or char_length(contact) <= 120),   -- optional, only if they want a reply
  page        text check (page is null or char_length(page) <= 120),         -- path they were on, e.g. /map
  status      text not null default 'new' check (status in ('new', 'read', 'planned', 'done', 'archived')),
  staff_note  text check (staff_note is null or char_length(staff_note) <= 1000),
  handled_by  text,
  handled_at  timestamptz,
  device_token text,   -- rate limiting only. Never returned by the API.
  ip_hash      text    -- salted hash, rate limiting only. Never returned by the API.
);
create index if not exists suggestions_status_created on public.suggestions (status, created_at desc);

alter table public.suggestions enable row level security;      -- no policies: invisible to anon/authenticated
revoke all on public.suggestions from anon, authenticated;

create or replace function public.send_suggestion(p_kind text, p_message text, p_contact text, p_page text, p_device text, p_ip_hash text)
returns table (id uuid, created_at timestamptz)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare
  v_msg  text := btrim(coalesce(p_message, ''));
  v_kind text := case when p_kind in ('idea', 'bug', 'thanks', 'safety', 'other') then p_kind else 'other' end;
  v_contact text := nullif(left(btrim(coalesce(p_contact, '')), 120), '');
  v_page text := nullif(left(btrim(coalesce(p_page, '')), 120), '');
  v_dup uuid;
begin
  if coalesce(length(p_device), 0) < 16 then raise exception 'invalid device' using errcode = 'P0001'; end if;
  if char_length(v_msg) < 5 then raise exception 'Tell us a little more, a few words at least.' using errcode = 'P0001'; end if;
  if char_length(v_msg) > 2000 then raise exception 'That''s a lot! Please keep it under 2,000 characters.' using errcode = 'P0001'; end if;

  -- Double-tap or retry: hand back the note we already have instead of saving it twice.
  select s.id into v_dup from suggestions s where s.device_token = p_device and lower(s.message) = lower(v_msg) and s.created_at > now() - interval '1 day' limit 1;
  if v_dup is not null then return query select s.id, s.created_at from suggestions s where s.id = v_dup; return; end if;

  if (select count(*) from suggestions s where s.device_token = p_device and s.created_at > now() - interval '1 hour') >= 3
     or (select count(*) from suggestions s where s.device_token = p_device and s.created_at > now() - interval '1 day') >= 8 then
    raise exception 'You''ve sent us a few notes already. Thank you! Please try again a little later.' using errcode = 'P0001';
  end if;
  if p_ip_hash is not null and ((select count(*) from suggestions s where s.ip_hash = p_ip_hash and s.created_at > now() - interval '1 hour') >= 6
     or (select count(*) from suggestions s where s.ip_hash = p_ip_hash and s.created_at > now() - interval '1 day') >= 20) then
    raise exception 'We''ve got a lot of notes from here today. Please try again later.' using errcode = 'P0001';
  end if;
  if (select count(*) from suggestions s where s.created_at > now() - interval '1 hour') >= 300 then
    raise exception 'The suggestion box is full for the moment. Please try again soon.' using errcode = 'P0001';
  end if;

  return query
    insert into suggestions (kind, message, contact, page, device_token, ip_hash)
    values (v_kind, v_msg, v_contact, v_page, p_device, p_ip_hash)
    returning suggestions.id, suggestions.created_at;
end $$;

-- Only the server (service_role) may call it: functions are executable by everyone by default, so revoke first.
revoke all on function public.send_suggestion(text, text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.send_suggestion(text, text, text, text, text, text) to service_role;
grant select, insert, update, delete on public.suggestions to service_role;
