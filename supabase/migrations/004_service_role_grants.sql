-- 004: let the Fodibey API (which uses the service_role key) read and moderate our tables.
-- service_role bypasses row-level security, but it still needs ordinary table privileges, and our tables were created
-- without them (the Fodibey API answered "permission denied for table …"). Server-side only: this key is never sent to browsers.
grant usage on schema public to service_role;
grant select, insert, update, delete on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;
-- and for tables/functions added later
alter default privileges in schema public grant select, insert, update, delete on tables to service_role;
alter default privileges in schema public grant usage, select on sequences to service_role;
alter default privileges in schema public grant execute on functions to service_role;
