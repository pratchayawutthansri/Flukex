import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

// Server Components / Server Actions / Route Handlers. Reads the user's session
// from cookies and still enforces RLS as that user (anon key, not service role).
// Never import this from a Client Component — it depends on next/headers.
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Called from a Server Component render; middleware refreshes the session instead.
          }
        },
      },
    },
  );
}

// Server-only. Bypasses RLS entirely — never import this from a Client Component
// or expose SUPABASE_SERVICE_ROLE_KEY to the browser bundle.
export function createServiceRoleSupabaseClient() {
  return createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
