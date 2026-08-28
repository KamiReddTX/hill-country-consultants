import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/database.types";
import { AUTH_BYPASS } from "@/lib/auth-bypass";

/**
 * Server Supabase client for Server Components, Route Handlers and Server Actions.
 * Reads the user's session from cookies, so every query runs under that user's
 * RLS policies — a client can only ever read their own rows.
 */
export function createClient() {
  // TEMPORARY: while the login bypass is on, run reads/writes with the
  // service role so RLS-scoped pages show real data without a session.
  // Restore normal behavior by setting AUTH_BYPASS = false in lib/auth-bypass.ts.
  if (AUTH_BYPASS) return createServiceClient();
  return createAnonClient();
}

/** Cookie-bound anon client (the normal, RLS-scoped server client). */
function createAnonClient() {
  const cookieStore = cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component — safe to ignore; middleware refreshes.
          }
        },
      },
    },
  );
}

/**
 * Service-role client — SERVER ONLY (webhooks, seed, admin jobs).
 * Bypasses RLS. Never import this into anything that reaches the browser.
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  // If the service env isn't present (e.g. offline build without secrets),
  // fall back to the anon client so builds don't crash at construction.
  // On Vercel these vars exist, so the real service-role client is used.
  if (!url || !key) return createAnonClient();
  const { createClient: createSb } = require("@supabase/supabase-js");
  return createSb<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
