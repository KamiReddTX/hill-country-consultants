-- Hill Country Consultants — in-depth employment application
-- =============================================================================
-- Expands job_applications from a short intake into a full employment
-- application: address, work authorization, education, employment history,
-- references, certifications, HCC equipment/security attestations, voluntary
-- EEO self-identification, and a signed applicant certification. Multi-entry
-- sections (education / employment history / references) are stored as jsonb
-- arrays. Everything is nullable so older rows keep working, and inserts still
-- flow through the service role (no public policy change needed).
--
-- Idempotent + safe to re-run. SQL Editor -> Run.  (Run after job-applications.sql
-- and careers-credentials.sql.)
-- =============================================================================

-- Personal / contact
alter table job_applications add column if not exists address        text;   -- street
alter table job_applications add column if not exists city_state_zip text;

-- Position & availability
alter table job_applications add column if not exists available_start text;   -- earliest start date (free text/date)
alter table job_applications add column if not exists hours_available text;
alter table job_applications add column if not exists days_available  text;

-- Work authorization (US)
alter table job_applications add column if not exists work_authorized     boolean;
alter table job_applications add column if not exists over_18             boolean;
alter table job_applications add column if not exists sponsorship_required boolean;

-- Multi-entry sections (arrays of objects)
--   education:          [{ school, degree, field, location, completed }]
--   employment_history: [{ employer, title, location, start, end, duties, reason_leaving, may_contact }]
--   references:         [{ name, relationship, company, phone, email }]
alter table job_applications add column if not exists education          jsonb not null default '[]'::jsonb;
alter table job_applications add column if not exists employment_history jsonb not null default '[]'::jsonb;
alter table job_applications add column if not exists refs               jsonb not null default '[]'::jsonb;

-- Skills / certifications
alter table job_applications add column if not exists certifications text;

-- HCC equipment & security attestations (from the role postings)
alter table job_applications add column if not exists attest_equipment  boolean;  -- Windows dual-monitor, wired Ethernet, phone/tablet (+ Mac for Creative)
alter table job_applications add column if not exists attest_security   boolean;  -- secured network, 2FA, antivirus, encryption
alter table job_applications add column if not exists attest_background boolean;  -- consents to background check
alter table job_applications add column if not exists attest_us_based   boolean;  -- US-based + authorized to work in the US
alter table job_applications add column if not exists attest_confidential boolean; -- willing to sign confidentiality/NDA

-- Voluntary EEO self-identification (confidential; never used to make decisions)
alter table job_applications add column if not exists eeo_gender     text;
alter table job_applications add column if not exists eeo_race       text;
alter table job_applications add column if not exists eeo_veteran    text;
alter table job_applications add column if not exists eeo_disability text;

-- Applicant certification & signature
alter table job_applications add column if not exists certified   boolean;
alter table job_applications add column if not exists signature   text;         -- typed legal name
alter table job_applications add column if not exists signed_at    timestamptz;
