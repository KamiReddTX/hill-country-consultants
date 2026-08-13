-- Hill Country Consultants — onboarding step tracking
-- =============================================================================
-- Adds the two MANUAL onboarding flags to clients and a client-safe RPC:
--   * kickoff_at  — set by the CLIENT when they mark their kickoff call booked
--                   (they book on the Google appointment page, then confirm).
--   * roadmap_at  — set by an ADMIN, by hand, after the kickoff call.
-- The other onboarding steps (credentials, task board, files) stay automatic —
-- they derive from real vault / task / deliverable rows and need nothing here.
--
-- Clients can't UPDATE their own row under RLS (clients_admin_write = is_admin),
-- so the client path goes through a SECURITY DEFINER function scoped to their own
-- row via auth.uid(). Admins set roadmap_at through the existing admin-write RLS.
--
-- SAFE TO RUN ONCE ON PRODUCTION: additive and idempotent. No data is modified.
-- Paste the whole file into Supabase -> SQL Editor -> New query -> Run.
-- =============================================================================

alter table clients add column if not exists kickoff_at timestamptz;
alter table clients add column if not exists roadmap_at timestamptz;

-- Client self-marks their kickoff scheduled. Scoped to their own row; sets once.
create or replace function mark_kickoff_scheduled() returns void
  language sql security definer set search_path = public, pg_temp as $$
  update clients set kickoff_at = coalesce(kickoff_at, now()) where user_id = auth.uid();
$$;

revoke execute on function mark_kickoff_scheduled() from public, anon;
grant execute on function mark_kickoff_scheduled() to authenticated;
