import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  // Fail loudly in dev; otherwise the UI just shows empty states.
  console.warn("Raalhu: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are not set.");
}

// Anonymous client: no sessions, no cookies, no stored identity.
export const supabase = createClient(url ?? "http://localhost", key ?? "anon", {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});
