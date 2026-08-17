-- Hill Country Consultants — internal document library + assignment
-- =============================================================================
-- Admins/BMs keep reusable document templates (W-9, NDA, contract, etc.) and
-- assign them to specific employees or to everyone in a role. Assigning creates
-- a staff_documents row per employee (their copy to complete / e-sign).
--
-- Run anytime. Idempotent. SQL Editor -> Run.
-- =============================================================================

create table if not exists document_templates (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null,
  kind               text,
  path               text not null,   -- stored in the staff-docs bucket under templates/
  requires_signature boolean not null default true,
  created_by         uuid,
  created_at         timestamptz not null default now()
);
alter table document_templates enable row level security;
create policy doc_templates_read  on document_templates for select using (is_privileged());
create policy doc_templates_write on document_templates for all using (is_privileged()) with check (is_privileged());

-- Track which template an assigned document came from (optional).
alter table staff_documents add column if not exists template_id uuid;
