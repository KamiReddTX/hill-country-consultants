-- Hill Country Consultants — Hiring pipeline (ATS-lite)
-- =============================================================================
-- Extends job_applications with a reviewer rating and notes. The existing
-- `status` column doubles as the pipeline stage:
--   new · reviewing · interview · offer · hired · declined
-- (interview/declined/hired are set by their own actions, which also email the
-- applicant / create the employee; new/reviewing/offer are manual stage moves.)
--
-- Idempotent. Run in the Supabase SQL Editor.
-- =============================================================================

alter table job_applications add column if not exists rating       smallint;
alter table job_applications add column if not exists review_notes  text;

-- Normalize any legacy NULL/empty status to the first stage.
update job_applications set status = 'new' where status is null or status = '';
