-- Hill Country Consultants — full employee profile (self-service + HR + documents)
-- =============================================================================
-- Employee self-edits: name, phone, personal email, address, timezone, emergency
-- contact, direct deposit. Admin-managed: role, rate, commission, employment type,
-- start date, employee id. Plus a documents area (paystubs, agreements, tax forms)
-- the admin uploads and the employee downloads.
--
-- Run AFTER employee-profile.sql. Idempotent. SQL Editor -> Run.
-- =============================================================================

alter table staff add column if not exists avatar_path text;
alter table staff add column if not exists address text;
alter table staff add column if not exists timezone text;
alter table staff add column if not exists personal_email text;
alter table staff add column if not exists emergency_contact_name text;
alter table staff add column if not exists emergency_contact_phone text;
alter table staff add column if not exists employment_type text;   -- 'W-2' | '1099'
alter table staff add column if not exists start_date date;
alter table staff add column if not exists dd_bank_name text;
alter table staff add column if not exists dd_routing text;
alter table staff add column if not exists dd_account text;
alter table staff add column if not exists dd_account_type text;   -- 'Checking' | 'Savings'

-- Expand the self-service RPC to every employee-editable field (jsonb payload).
drop function if exists update_my_profile(text, text);
create or replace function update_my_profile(p jsonb) returns void
  language sql security definer set search_path = public, pg_temp as $$
  update staff set
    name = nullif(btrim(p->>'name'), ''),
    phone = nullif(btrim(p->>'phone'), ''),
    personal_email = nullif(btrim(p->>'personal_email'), ''),
    address = nullif(btrim(p->>'address'), ''),
    timezone = nullif(btrim(p->>'timezone'), ''),
    emergency_contact_name = nullif(btrim(p->>'emergency_contact_name'), ''),
    emergency_contact_phone = nullif(btrim(p->>'emergency_contact_phone'), ''),
    dd_bank_name = nullif(btrim(p->>'dd_bank_name'), ''),
    dd_routing = nullif(btrim(p->>'dd_routing'), ''),
    dd_account = nullif(btrim(p->>'dd_account'), ''),
    dd_account_type = nullif(btrim(p->>'dd_account_type'), '')
  where user_id = auth.uid();
$$;
revoke execute on function update_my_profile(jsonb) from public, anon;
grant execute on function update_my_profile(jsonb) to authenticated;

-- Employee documents: paystubs, agreements, NDAs, tax forms. Admin writes; the
-- owning employee (or a privileged staffer) reads.
create table if not exists staff_documents (
  id          uuid primary key default gen_random_uuid(),
  staff_id    uuid not null references staff(id) on delete cascade,
  name        text not null,
  path        text not null,
  kind        text not null default 'document',   -- paystub | contract | nda | tax | document
  requires_signature boolean not null default false,
  signed_at   timestamptz,
  signed_name text,
  signed_ip   text,
  uploaded_by uuid,
  created_at  timestamptz not null default now()
);
alter table staff_documents add column if not exists requires_signature boolean not null default false;
alter table staff_documents add column if not exists signed_at timestamptz;
alter table staff_documents add column if not exists signed_name text;
alter table staff_documents add column if not exists signed_ip text;
alter table staff_documents enable row level security;
create policy staff_docs_read on staff_documents for select
  using (is_privileged() or exists (select 1 from staff s where s.id = staff_documents.staff_id and s.user_id = auth.uid()));
create policy staff_docs_write on staff_documents for all using (is_privileged()) with check (is_privileged());

-- An employee can sign their OWN document (records the e-signature). Scoped by auth.uid().
create or replace function sign_staff_document(p_doc uuid, p_name text, p_ip text) returns void
  language sql security definer set search_path = public, pg_temp as $$
  update staff_documents d
    set signed_at = now(), signed_name = nullif(btrim(p_name), ''), signed_ip = p_ip
  where d.id = p_doc and d.signed_at is null and d.requires_signature
    and exists (select 1 from staff s where s.id = d.staff_id and s.user_id = auth.uid());
$$;
revoke execute on function sign_staff_document(uuid, text, text) from public, anon;
grant execute on function sign_staff_document(uuid, text, text) to authenticated;

insert into storage.buckets (id, name, public) values ('staff-docs', 'staff-docs', false) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('staff-avatars', 'staff-avatars', true) on conflict (id) do nothing;
