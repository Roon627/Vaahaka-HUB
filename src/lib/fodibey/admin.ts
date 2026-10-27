import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

/**
 * Service-role Supabase client: bypasses RLS, sees hidden content and device tokens' tables.
 * Server-only (the `server-only` import makes the build fail if this is ever pulled into client code).
 * Needs SUPABASE_SERVICE_ROLE_KEY: a SECRET. Never prefix it NEXT_PUBLIC_.
 */
export function admin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new ConfigError("SUPABASE_SERVICE_ROLE_KEY is not set, so the Fodibey API can't reach the database.");
  client ??= createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return client;
}

export class ConfigError extends Error {}
