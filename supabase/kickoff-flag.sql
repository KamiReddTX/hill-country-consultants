-- Hill Country Consultants — kickoff "needs staff added" flag
-- =============================================================================
-- When a client marks their kickoff call scheduled, it stays on the assigned
-- owner's + managers' dashboards until a staffer confirms they've added the
-- necessary people to the calendar invite. This column records that hand-off.
--
-- Idempotent. Run in the Supabase SQL Editor.
-- =============================================================================

alter table clients add column if not exists kickoff_confirmed_at timestamptz;
