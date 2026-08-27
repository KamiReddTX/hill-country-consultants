-- Hill Country Consultants — Prospecting: Track A ingest infrastructure
-- =============================================================================
-- The 7-stage public-records ingest pipeline's persistence layer (Data
-- Acquisition Architecture doc). Applied live to project xyusbofhipjnqfohpgid.
-- Stage 1 fetch -> ingest_runs; Stage 2 land raw -> raw_filings; Stage 3
-- normalize via config in source_mappings -> prospect_accounts.
-- Idempotent. Run after prospecting.sql.
-- =============================================================================

create table if not exists ingest_runs (
  id            uuid primary key default gen_random_uuid(),
  source        text not null,
  source_url    text,
  run_started_at timestamptz not null default now(),
  retrieved_at  timestamptz,
  row_count     int,
  checksum      text,
  status        text not null default 'running',  -- running | loaded | halted | error
  note          text
);
create index if not exists ingest_runs_source_idx on ingest_runs (source, run_started_at desc);

create table if not exists raw_filings (
  id        uuid primary key default gen_random_uuid(),
  run_id    uuid references ingest_runs(id) on delete cascade,
  source    text not null,
  raw       jsonb not null,
  landed_at timestamptz not null default now()
);
create index if not exists raw_filings_run_idx on raw_filings (run_id);
create index if not exists raw_filings_source_idx on raw_filings (source);

-- Stage 3 field mapping lives in config (not code): a state label change is an edit.
create table if not exists source_mappings (
  id             uuid primary key default gen_random_uuid(),
  source         text not null,
  source_field   text not null,
  canonical_field text not null,
  transform      text,
  unique (source, source_field)
);

alter table ingest_runs     enable row level security;
alter table raw_filings     enable row level security;
alter table source_mappings enable row level security;

drop policy if exists ingest_runs_admin on ingest_runs;
create policy ingest_runs_admin on ingest_runs for all using (staff_can('admin')) with check (staff_can('admin'));
drop policy if exists raw_filings_admin on raw_filings;
create policy raw_filings_admin on raw_filings for all using (staff_can('admin')) with check (staff_can('admin'));
drop policy if exists source_mappings_admin on source_mappings;
create policy source_mappings_admin on source_mappings for all using (staff_can('admin')) with check (staff_can('admin'));

-- Colorado SOS field mapping (Socrata dataset 4ykn-tg5h -> prospect_accounts).
-- The first proven adapter. Add one block of rows per new state/source.
insert into source_mappings (source, source_field, canonical_field, transform) values
  ('CO_SOS','entityname','legal_name',null),
  ('CO_SOS','principaladdress1','street',null),
  ('CO_SOS','principalcity','city',null),
  ('CO_SOS','principalstate','state',null),
  ('CO_SOS','principalzipcode','zip',null),
  ('CO_SOS','entityformdate','formation_date','date'),
  ('CO_SOS','entityid','vendor_record_id',null),
  ('CO_SOS','entitytype','location_type','const:HQ')
on conflict (source, source_field) do nothing;

-- =============================================================================
-- Phase-1 proof (2026-08): 15 newest CO "Good Standing" filings pulled from
-- https://data.colorado.gov/resource/4ykn-tg5h.json and loaded through the
-- pipeline into prospect_accounts (vendor='CO_SOS'). Records verified callable.
-- Stages still requiring provisioned keys before national load:
--   Stage 4 (CASS address standardization + county FIPS + geocode) — SmartyStreets/Melissa/Lob
--   Stage 5 (NAICS classification)                                  — Google Places
--   Track B (contact reveal: email/phone)                          — PDL/Coresignal/Apollo/waterfall
--   Phase 4 (national 50-state file)                                — GovFiles or equivalent
-- =============================================================================
