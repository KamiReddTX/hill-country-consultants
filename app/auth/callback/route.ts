import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * Auth email-link handler. Supabase invite / recovery / magic-link emails land
 * here (as ?code= for the PKCE flow, or ?token_hash=&type= for the OTP flow).
 * We establish the session, bind this auth user to their staff and/or client
 * row (link_* RPCs match by email — a no-op if there's no match), then send the
 * user to set a password. This is what lets a paying client — and a newly added
 * staff member — actually sign in after being invited.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type"); // invite | recovery | magiclink | email
  const rawNext = url.searchParams.get("next") || "/portal";
  const next = rawNext.startsWith("/staff") ? "/staff" : "/portal";

  const db = createClient();
  let ok = false;
  try {
    if (code) {
      const { error } = await db.auth.exchangeCodeForSession(code);
      ok = !error;
    } else if (tokenHash && type) {
      const { error } = await db.auth.verifyOtp({ token_hash: tokenHash, type: type as never });
      ok = !error;
    }
  } catch {
    ok = false;
  }

  if (!ok) {
    const login = next === "/staff" ? "/staff/login" : "/portal/login";
    return NextResponse.redirect(new URL(`${login}?error=link`, url.origin));
  }

  // Bind the auth user to their staff/client row on first sign-in.
  try { await db.rpc("link_staff_to_user"); } catch { /* not a staff member */ }
  try { await db.rpc("link_client_to_user"); } catch { /* not a client */ }

  // Invited users have no password yet — send them to set one, keeping their
  // final destination.
  const dest = new URL("/auth/set-password", url.origin);
  dest.searchParams.set("next", next);
  return NextResponse.redirect(dest);
}
