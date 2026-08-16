-- Hill Country Consultants — DocuSign envelope tracking on employee documents
-- =============================================================================
-- Adds DocuSign fields to staff_documents so an employee can sign a document
-- through DocuSign (embedded signing). Completion is recorded back onto the row
-- (signed_at/signed_name), same as the built-in typed signature.
--
-- Run anytime. Idempotent. SQL Editor -> Run.
-- =============================================================================

alter table staff_documents add column if not exists docusign_envelope_id text;
alter table staff_documents add column if not exists docusign_status      text;   -- 'sent' | 'completed'
alter table staff_documents add column if not exists signed_path          text;   -- completed PDF in staff-docs
