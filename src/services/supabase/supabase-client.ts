import { createBrowserClient } from "@supabase/ssr";

// Client Components only. Uses the anon key; RLS enforces access control.
// Server-side clients (cookie-based and service-role) live in ./supabase-server —
// keep them out of this file so `next/headers` never lands in the client bundle.
//
// process.env.NEXT_PUBLIC_* must stay as static literal property access (not
// process.env[name]) — Next.js inlines these into the browser bundle at build time
// by statically matching that exact syntax. A dynamic lookup silently resolves to
// undefined in the browser regardless of what's in .env.local.
export function createBrowserSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url) throw new Error("Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL");
  if (!anonKey) throw new Error("Missing required environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY");
  return createBrowserClient(url, anonKey);
}
