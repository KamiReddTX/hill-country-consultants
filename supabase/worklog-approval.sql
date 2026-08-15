-- Hill Country Consultants — Work Log admin approval
-- =============================================================================
-- A VA/AM logs client work daily (client_work_log). Those hours only reach the
-- CLIENT's Work Log tab after an ADMIN approves them — so the client always sees
-- verified, approved time against the hours their package covers.
--
-- SAFE TO RUN ONCE ON PRODUCTION: additive. Existing rows default to unapproved,
-- so they'll show once an admin approves them. SQL Editor -> New query -> Run.
-- =============================================================================

alter table client_work_log add column if not exists approved     boolean not null default false;
alter table client_work_log add column if not exists approved_by  text;
alter table client_work_log add column if not exists approved_at   timestamptz;
