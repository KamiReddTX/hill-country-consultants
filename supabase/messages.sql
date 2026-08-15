-- Hill Country Consultants — two-way messages
-- =============================================================================
-- client_notes becomes a recorded chat between the client and their VA/AM.
-- 'sender' marks who wrote each line; 'author_name' records the staff name on
-- replies. Existing rows are client messages (the default).
--
-- SAFE TO RUN ONCE ON PRODUCTION: additive. SQL Editor -> New query -> Run.
-- =============================================================================

alter table client_notes add column if not exists sender text not null default 'client';  -- 'client' | 'staff'
alter table client_notes add column if not exists author_name text;
