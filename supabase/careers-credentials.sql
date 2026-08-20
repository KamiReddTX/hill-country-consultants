-- Hill Country Consultants — Careers: store an applicant's credentials file.
-- Adds job_applications.credentials_path (points into the existing 'applications'
-- storage bucket, alongside resume_path). SAFE / idempotent. Run once.
alter table job_applications add column if not exists credentials_path text;
