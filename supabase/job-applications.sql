-- Hill Country Consultants — employee job applications
-- =============================================================================
-- Public employment-application intake. The public form writes via the
-- service role (route handler), so no public insert policy is needed. Only
-- privileged staff (Admin/BM) can read applications. Resumes live in a private
-- "applications" storage bucket, served through signed URLs by the service role.
--
-- Run anytime. Idempotent. SQL Editor -> Run.
-- =============================================================================

create table if not exists job_applications (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  email          text not null,
  phone          text,
  location       text,
  position       text,                 -- role they're applying for
  employment_type text,                -- full-time / part-time / contract
  availability   text,                 -- start date / hours available
  desired_pay    text,
  experience     text,
  skills         text,
  portfolio_url  text,
  resume_path    text,                 -- path in the private "applications" bucket
  why            text,
  referral       text,                 -- how they heard about us
  status         text not null default 'new',   -- new / reviewing / interview / hired / passed
  created_at     timestamptz not null default now()
);

alter table job_applications enable row level security;

-- Only privileged staff read/manage applications. Inserts happen via service role.
drop policy if exists job_applications_read on job_applications;
create policy job_applications_read on job_applications for select using (is_privileged());
drop policy if exists job_applications_write on job_applications;
create policy job_applications_write on job_applications for all using (is_privileged()) with check (is_privileged());

create index if not exists job_applications_created_idx on job_applications (created_at desc);

-- Private bucket for resume uploads (service-role access only).
insert into storage.buckets (id, name, public)
values ('applications', 'applications', false)
on conflict (id) do nothing;
