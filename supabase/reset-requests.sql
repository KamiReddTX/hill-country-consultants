-- Hill Country Consultants — employee password-reset requests
-- =============================================================================
-- Employees can't self-serve a password reset. They file a request from the
-- staff login screen; it lands here as 'pending'. An admin approves it (which
-- sends the recovery email) or denies it. Client resets remain fully self-serve.
--
-- SAFE TO RUN ONCE ON PRODUCTION: additive. SQL Editor -> New query -> Run.
-- =============================================================================

create table if not exists staff_reset_requests (
  id           uuid primary key default gen_random_uuid(),
  email        text not null,
  status       text not null default 'pending',   -- pending | approved | denied
  requested_at timestamptz not null default now(),
  handled_by   uuid,
  handled_at   timestamptz
);
alter table staff_reset_requests enable row level security;

-- Staff can see and manage requests; inserts come from the (public) login screen
-- via the service role, so no anon insert policy is needed.
create policy staff_reset_read  on staff_reset_requests for select using (is_staff());
create policy staff_reset_write on staff_reset_requests for all using (is_staff()) with check (is_staff());
