/**
 * ──────────────────────────────────────────────────────────────
 *  TEMPORARY LOGIN BYPASS — FOR TESTING ONLY
 * ──────────────────────────────────────────────────────────────
 *  While AUTH_BYPASS is true, the client portal (/portal) and the
 *  employee portal (/staff) can be opened WITHOUT signing in. They
 *  load as a real admin (staff) and a real active client so the
 *  pages show real data during testing.
 *
 *  ⚠  While this is true, both portals are reachable by ANYONE on
 *     the public domain, with real data and admin tools exposed.
 *     This MUST be set back to false before launch / going public.
 *
 *  To restore the normal login requirement: set AUTH_BYPASS = false
 *  and redeploy. No other change is needed — none of the login,
 *  session, or auth code has been removed.
 * ──────────────────────────────────────────────────────────────
 */
export const AUTH_BYPASS = true;

/** Which staff identity the employee portal assumes while bypassed. */
export const BYPASS_STAFF_EMAIL =
  process.env.TEST_STAFF_EMAIL || "admin@hillcountryconsultants.com";

/** Optional: pin the client portal to a specific client email while bypassed.
 *  If unset, the most recently created active client is used. */
export const BYPASS_CLIENT_EMAIL = process.env.TEST_CLIENT_EMAIL || "";
