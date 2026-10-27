-- 003: posting failed with "permission denied for table posts".
-- The rate-limit trigger counted rows by device_token as the anon role, which (by design) can't read that column.
-- Run it as the owner instead.
alter function public.posts_rate_limit() security definer;
alter function public.posts_rate_limit() set search_path = public;
