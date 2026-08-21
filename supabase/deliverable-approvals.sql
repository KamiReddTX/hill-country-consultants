-- Hill Country Consultants — client deliverable approvals
-- =============================================================================
-- Clients can Approve or Request changes on a delivered item from their portal,
-- with a timestamp and optional note. Read/scoping stays with the existing
-- client_deliverables RLS; clients update only their own via the server action
-- (service role after a portal-auth check), so no new policy is required beyond
-- what already governs the table.
--
-- Idempotent. Run in the Supabase SQL Editor.
-- =============================================================================

alter table client_deliverables add column if not exists approval_status text;   -- approved · changes_requested
alter table client_deliverables add column if not exists approval_note   text;
alter table client_deliverables add column if not exists approval_at      timestamptz;
