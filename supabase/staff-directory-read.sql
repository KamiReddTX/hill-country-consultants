-- Hill Country Consultants — let Business Managers read the staff directory
-- =============================================================================
-- The Admin/Directory tabs need the full staff list to assign owners and teams.
-- Previously only Administrators could read all staff rows; extend that to
-- Business Managers (is_privileged). Regular staff still see only themselves;
-- account managers pick team members through a minimal id+name service read.
--
-- Run anytime after strict-access/team-model. Idempotent. SQL Editor -> Run.
-- =============================================================================

drop policy if exists staff_self_read on staff;
create policy staff_self_read on staff for select
  using (user_id = auth.uid() or is_privileged());
