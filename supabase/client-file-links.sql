-- Hill Country Consultants — collaborative Google Doc links in client Files
-- =============================================================================
-- Adds an optional `doc_url` to client_files. When set, the row is a link to a
-- Google Doc the client can open & edit (not a stored file). Stored files leave
-- this null and keep using storage + `path` as before.
--
-- Idempotent. Run in the Supabase SQL Editor.
-- =============================================================================

alter table client_files add column if not exists doc_url text;

-- `path` is required for stored files but not for link rows; allow it to be null.
alter table client_files alter column path drop not null;
