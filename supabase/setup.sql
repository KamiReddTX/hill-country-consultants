-- ============================================================================
-- Hill Country Consultants — CANONICAL DATABASE SETUP  (supabase/setup.sql)
-- ============================================================================
-- Builds the entire database in dependency-safe order, strict RLS applied last,
-- team-aware access helpers asserted at the end, and the current role names
-- (Engagement Specialist / Creative Specialist). Validated on a fresh Postgres:
-- runs clean, idempotent, passes the per-role access matrix, and the role-rename
-- converts legacy titles. Do NOT run against the live DB (already set up); use
-- for a fresh Supabase project or to read the whole schema. Individual *.sql
-- files are historical migrations. Supabase provides pgcrypto + auth/storage.
-- ============================================================================

-- ============================================================ schema.sql
-- ============================================================================

-- Hill Country Consultants — Supabase schema
-- Paste into Supabase → SQL Editor → New query → Run.
-- Creates every table the three apps use, plus row-level security so a client
-- can only ever read their own data.

-- ─────────────────────────── extensions
create extension if not exists "pgcrypto";

-- ─────────────────────────── staff
create table if not exists staff (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid unique references auth.users(id) on delete cascade,
  email        text unique not null,
  name         text,
  role         text not null default 'Engagement Specialist',
  rate         numeric(8,2) default 0,
  employee_code text,
  hourly       boolean not null default true,
  active       boolean not null default true,
  created_at   timestamptz not null default now()
);

-- SECURITY DEFINER + pinned search_path: these run inside the staff RLS policies,
-- so they must bypass RLS on staff to avoid "infinite recursion detected in policy".
create or replace function is_staff() returns boolean
  language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from staff s where s.user_id = auth.uid() and s.active);
$$;

create or replace function is_admin() returns boolean
  language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from staff s where s.user_id = auth.uid()
                 and s.active and s.role = 'Administrator');
$$;

create or replace function my_role() returns text
  language sql stable security definer set search_path = public, pg_temp as $$
  select role from staff where user_id = auth.uid() limit 1;
$$;

-- ─────────────────────────── clients
create table if not exists clients (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid unique references auth.users(id) on delete set null,
  email         text unique not null,
  business      text,
  contact       text,
  phone         text,
  status        text not null default 'In review',
  assigned_to   text default '',
  rep_code      text default '',
  created_at    timestamptz not null default now(),
  retained_since date
);
create index if not exists clients_assigned_idx on clients (assigned_to);
create index if not exists clients_rep_idx on clients (rep_code);

-- ─────────────────────────── bookings
create table if not exists bookings (
  id           uuid primary key default gen_random_uuid(),
  client_id    uuid not null references clients(id) on delete cascade,
  ref          text unique not null,
  booked_on    date not null default current_date,
  start_date   date,
  items        jsonb not null default '[]',
  quotes       jsonb not null default '[]',
  paid_cents   integer not null default 0,
  pay_mode     text default 'full',
  class_name   text,
  class_date   text,
  class_slot   text,
  notes        text,
  stripe_payment_intent text,
  created_at   timestamptz not null default now()
);
create index if not exists bookings_client_idx on bookings (client_id);
-- MA7: idempotency guard — at most one booking per Stripe PaymentIntent, so a
-- retried/duplicate webhook can't create a second paid booking.
create unique index if not exists bookings_stripe_pi_unique
  on bookings (stripe_payment_intent) where stripe_payment_intent is not null;

-- ─────────────────────────── client working data
create table if not exists client_tasks (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid not null references clients(id) on delete cascade,
  title      text not null,
  service    text,
  due_date   date,
  column_name text not null default 'Requested',
  paid       boolean default false,
  booking_ref text,
  created_by text default 'client',
  created_at timestamptz not null default now()
);

create table if not exists client_notes (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid not null references clients(id) on delete cascade,
  body       text not null,
  created_at timestamptz not null default now()
);

-- Credential REGISTER only. Never store passwords here; keep them in the
-- password manager and record that a re-sync is needed.
create table if not exists client_vault (
  id           uuid primary key default gen_random_uuid(),
  client_id    uuid not null references clients(id) on delete cascade,
  name         text not null,
  username     text,
  url          text,
  purpose      text,
  needs_resync boolean not null default false,
  updated_at   timestamptz not null default now()
);

create table if not exists client_work_log (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid not null references clients(id) on delete cascade,
  worked_on  date not null,
  service    text,
  task       text,
  performed_by text,
  hours      numeric(6,2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists client_deliverables (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid not null references clients(id) on delete cascade,
  name       text not null,
  service    text,
  status     text default 'Delivered',
  file_url   text,
  delivered_on date default current_date
);

-- ─────────────────────────── sales
create table if not exists leads (
  id         uuid primary key default gen_random_uuid(),
  business   text,
  contact    text,
  email      text,
  phone      text,
  industry   text,
  timeline   text,
  pain       text,
  lead_with  text,
  tier       text,
  stage      text not null default 'New lead',
  next_step  text,
  next_touch date,
  rep_name   text,
  rep_code   text,
  created_at timestamptz not null default now()
);

-- ─────────────────────────── time clock
create table if not exists punches (
  id         uuid primary key default gen_random_uuid(),
  staff_id   uuid not null references staff(id) on delete cascade,
  started_at timestamptz not null default now(),
  ended_at   timestamptz,
  hours      numeric(6,2),
  note       text,
  closed_by_admin boolean default false
);
create index if not exists punches_staff_idx on punches (staff_id, started_at);

create table if not exists timesheet_approvals (
  id           uuid primary key default gen_random_uuid(),
  staff_id     uuid not null references staff(id) on delete cascade,
  period_start date not null,
  period_end   date not null,
  approved_by  uuid references staff(id),
  approved_at  timestamptz not null default now(),
  unique (staff_id, period_start)
);

-- ═══════════════════════════ row-level security
alter table staff               enable row level security;
alter table clients             enable row level security;
alter table bookings            enable row level security;
alter table client_tasks        enable row level security;
alter table client_notes        enable row level security;
alter table client_vault        enable row level security;
alter table client_work_log     enable row level security;
alter table client_deliverables enable row level security;
alter table leads               enable row level security;
alter table punches             enable row level security;
alter table timesheet_approvals enable row level security;

-- staff: read self, admins manage everyone
drop policy if exists staff_self_read on staff;
create policy staff_self_read on staff for select
  using (user_id = auth.uid() or is_admin());
drop policy if exists staff_admin_write on staff;
create policy staff_admin_write on staff for all
  using (is_admin()) with check (is_admin());

-- clients: a client sees only their own row; staff see all; admins edit
drop policy if exists clients_own_read on clients;
create policy clients_own_read on clients for select
  using (user_id = auth.uid() or is_staff());
drop policy if exists clients_admin_write on clients;
create policy clients_admin_write on clients for all
  using (is_admin()) with check (is_admin());

-- everything hanging off a client follows the same test
drop policy if exists bookings_scope on bookings;
create policy bookings_scope on bookings for select
  using (exists (select 1 from clients c where c.id = bookings.client_id
                 and (c.user_id = auth.uid() or is_staff())));
drop policy if exists bookings_staff_write on bookings;
create policy bookings_staff_write on bookings for all
  using (is_staff()) with check (is_staff());

drop policy if exists tasks_scope on client_tasks;
create policy tasks_scope on client_tasks for select
  using (exists (select 1 from clients c where c.id = client_tasks.client_id
                 and (c.user_id = auth.uid() or is_staff())));
drop policy if exists tasks_write on client_tasks;
create policy tasks_write on client_tasks for insert
  with check (exists (select 1 from clients c where c.id = client_tasks.client_id
                      and (c.user_id = auth.uid() or is_staff())));
drop policy if exists tasks_update on client_tasks;
create policy tasks_update on client_tasks for update using (is_staff());

drop policy if exists notes_scope on client_notes;
create policy notes_scope on client_notes for select
  using (exists (select 1 from clients c where c.id = client_notes.client_id
                 and (c.user_id = auth.uid() or is_staff())));
drop policy if exists notes_write on client_notes;
create policy notes_write on client_notes for insert
  with check (exists (select 1 from clients c where c.id = client_notes.client_id
                      and (c.user_id = auth.uid() or is_staff())));

-- Tradeoff: client_vault stays is_staff() (not sales/admin) so virtual assistants
-- can read the credential register to deliver work; any active staff member sees it.
drop policy if exists vault_scope on client_vault;
create policy vault_scope on client_vault for all
  using (exists (select 1 from clients c where c.id = client_vault.client_id
                 and (c.user_id = auth.uid() or is_staff())))
  with check (exists (select 1 from clients c where c.id = client_vault.client_id
                      and (c.user_id = auth.uid() or is_staff())));

drop policy if exists worklog_scope on client_work_log;
create policy worklog_scope on client_work_log for select
  using (exists (select 1 from clients c where c.id = client_work_log.client_id
                 and (c.user_id = auth.uid() or is_staff())));
drop policy if exists worklog_staff_write on client_work_log;
create policy worklog_staff_write on client_work_log for all
  using (is_staff()) with check (is_staff());

drop policy if exists deliverables_scope on client_deliverables;
create policy deliverables_scope on client_deliverables for select
  using (exists (select 1 from clients c where c.id = client_deliverables.client_id
                 and (c.user_id = auth.uid() or is_staff())));
drop policy if exists deliverables_staff_write on client_deliverables;
create policy deliverables_staff_write on client_deliverables for all
  using (is_staff()) with check (is_staff());

-- sales: only sales reps and admins may see or touch leads.
-- Mirrors isSalesOrAdmin() in the app UI (lib/staff.ts, lib/auth.ts).
drop policy if exists leads_sales on leads;
create policy leads_sales on leads for all
  using (my_role() in ('Sales / account manager', 'Administrator'))
  with check (my_role() in ('Sales / account manager', 'Administrator'));

-- punches: an employee sees and closes only their own; admins see and close all
drop policy if exists punches_own on punches;
create policy punches_own on punches for select
  using (is_admin() or staff_id in (select id from staff where user_id = auth.uid()));
drop policy if exists punches_insert on punches;
create policy punches_insert on punches for insert
  with check (staff_id in (select id from staff where user_id = auth.uid()));
drop policy if exists punches_update on punches;
create policy punches_update on punches for update
  using (is_admin() or staff_id in (select id from staff where user_id = auth.uid()));

drop policy if exists approvals_read on timesheet_approvals;
create policy approvals_read on timesheet_approvals for select using (is_staff());
drop policy if exists approvals_admin on timesheet_approvals;
create policy approvals_admin on timesheet_approvals for all
  using (is_admin()) with check (is_admin());

-- ═══════════════════════════ helper: create a client account after payment
-- Call from your Stripe webhook (service-role key), then invite the user by email.
create or replace function create_client_after_payment(
  p_email text, p_business text, p_contact text, p_phone text,
  p_ref text, p_items jsonb, p_quotes jsonb, p_paid_cents int,
  p_start date, p_rep_code text default ''
) returns uuid language plpgsql security definer as $$
declare v_client uuid;
begin
  insert into clients (email, business, contact, phone, rep_code)
  values (lower(p_email), p_business, p_contact, p_phone, p_rep_code)
  on conflict (email) do update
    set business = coalesce(excluded.business, clients.business),
        contact  = coalesce(excluded.contact,  clients.contact),
        phone    = coalesce(excluded.phone,    clients.phone)
  returning id into v_client;

  insert into bookings (client_id, ref, items, quotes, paid_cents, start_date)
  values (v_client, p_ref, p_items, p_quotes, p_paid_cents, p_start);

  -- Purchased services are staff-owned and already in flight, so they land in
  -- "In progress" as created_by 'staff' (not the client's default "Requested"/
  -- "Your request"), which also surfaces them in the staff delivery queue.
  insert into client_tasks (client_id, title, service, due_date, paid, booking_ref, created_by, column_name)
  select v_client, i->>'name', i->>'svc', p_start, true, p_ref, 'staff', 'In progress'
  from jsonb_array_elements(p_items) i;

  return v_client;
end $$;

-- C1: SECURITY DEFINER + Supabase's default execute grants would let anon/authenticated
-- forge "paid" bookings and overwrite clients by email. Lock it to the service-role key
-- (the Stripe webhook); Supabase's direct grant to service_role survives this revoke.
revoke execute on function create_client_after_payment(
  text, text, text, text, text, jsonb, jsonb, integer, date, text
) from public, anon, authenticated;

set check_function_bodies = off;
create or replace function is_privileged() returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from staff s where s.user_id = auth.uid() and s.active
    and ('Administrator' = any(s.roles) or 'Business Manager' = any(s.roles) or s.role in ('Administrator','Business Manager'))); $$;
create or replace function manages_client(cid uuid) returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select is_privileged() or exists (select 1 from staff s where s.user_id = auth.uid() and s.active and s.id::text = (select assigned_to from clients c where c.id = cid)); $$;
create or replace function can_access_client(cid uuid) returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select is_privileged() or exists (select 1 from clients c where c.id = cid and c.user_id = auth.uid())
    or exists (select 1 from staff s where s.user_id = auth.uid() and s.active and s.id::text = (select assigned_to from clients c2 where c2.id = cid))
    or exists (select 1 from client_assignments a join staff s on s.id = a.staff_id where a.client_id = cid and s.user_id = auth.uid() and s.active); $$;

-- ============================================================ team-model.sql
-- Hill Country Consultants — multi-role staff + account teams + task assignees
-- =============================================================================
-- 1) staff.roles  — an employee can hold several roles at once (VA + Submittals…).
-- 2) client_assignments — the AM's coordination layer: extra workers pulled onto
--    an account, beyond the single owner (clients.assigned_to).
-- 3) client_tasks.assignee_id — who is doing a specific task.
-- Access ties together through can_access_client(): owner OR team member OR
-- privileged (admin/BM) OR the client.
--
-- Run AFTER strict-access.sql. Additive + idempotent. SQL Editor -> Run.
-- =============================================================================

-- 1) Multiple roles per employee -------------------------------------------------
alter table staff add column if not exists roles text[] not null default '{}';
-- Backfill from the existing single role (only where roles is still empty).
update staff set roles = array[role] where coalesce(array_length(roles, 1), 0) = 0 and role is not null;

-- 2) Per-task assignee -----------------------------------------------------------
alter table client_tasks add column if not exists assignee_id uuid references staff(id) on delete set null;

-- 3) Account team roster ---------------------------------------------------------
create table if not exists client_assignments (
  id              uuid primary key default gen_random_uuid(),
  client_id       uuid not null references clients(id) on delete cascade,
  staff_id        uuid not null references staff(id) on delete cascade,
  role_on_account text,
  added_by        uuid,
  created_at      timestamptz not null default now(),
  unique (client_id, staff_id)
);
alter table client_assignments enable row level security;

-- ---- role-aware helpers (fall back to the legacy single role for safety) -------
create or replace function is_admin() returns boolean
  language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from staff s where s.user_id = auth.uid() and s.active
      and ('Administrator' = any(s.roles) or s.role = 'Administrator')
  );
$$;

create or replace function is_privileged() returns boolean
  language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from staff s where s.user_id = auth.uid() and s.active
      and ('Administrator' = any(s.roles) or 'Business Manager' = any(s.roles)
           or s.role in ('Administrator', 'Business Manager'))
  );
$$;

-- ---- access: owner OR team member OR privileged OR the client ------------------
create or replace function can_access_client(cid uuid) returns boolean
  language sql stable security definer set search_path = public, pg_temp as $$
  select
    is_privileged()
    or exists (select 1 from clients c where c.id = cid and c.user_id = auth.uid())
    or exists (
      select 1 from staff s
      where s.user_id = auth.uid() and s.active
        and s.id::text = (select assigned_to from clients c2 where c2.id = cid)
    )
    or exists (
      select 1 from client_assignments a
      join staff s on s.id = a.staff_id
      where a.client_id = cid and s.user_id = auth.uid() and s.active
    );
$$;

-- team roster: readable by anyone who can access the client; writable by the
-- managing team (owner or privileged).
drop policy if exists client_assignments_read on client_assignments;
create policy client_assignments_read on client_assignments for select
  using (can_access_client(client_assignments.client_id));
drop policy if exists client_assignments_write on client_assignments;
create policy client_assignments_write on client_assignments for all
  using (manages_client(client_assignments.client_id)) with check (manages_client(client_assignments.client_id));

-- ============================================================ clients-and-roles.sql
-- Hill Country Consultants — manual clients, billing type, and role split
-- =============================================================================
-- 1) clients.billing_type — 'standard' | 'comp' (zeroed) | 'barter'.
-- 2) Split the old combined "Sales / account manager" role into two:
--    "Account manager" and "Sales staff". Existing holders become Account
--    managers (they can add "Sales staff" from the directory if they also sell).
-- 3) A roles-aware is_sales() so the leads/pipeline stays visible to the right
--    people even though one employee can now hold several roles.
--
-- Run AFTER team-model.sql. Additive + idempotent. SQL Editor -> Run.
-- =============================================================================

-- 1) Billing type ---------------------------------------------------------------
alter table clients add column if not exists billing_type text not null default 'standard';

-- 2) Role split (remap existing data) ------------------------------------------
update staff set role = 'Account manager' where role = 'Sales / account manager';
update staff set roles = array_replace(roles, 'Sales / account manager', 'Account manager')
  where 'Sales / account manager' = any(roles);

-- 3) Sales visibility (Account manager, Sales staff, or privileged) -------------
create or replace function is_sales() returns boolean
  language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from staff s where s.user_id = auth.uid() and s.active
      and (
        s.roles && array['Administrator','Business Manager','Sales Manager','Account manager','Sales staff']::text[]
        or s.role in ('Administrator','Business Manager','Sales Manager','Account manager','Sales staff')
      )
  );
$$;

drop policy if exists leads_sales on leads;
drop policy if exists leads_sales on leads;
create policy leads_sales on leads for all using (is_sales()) with check (is_sales());

-- ============================================================ role-array-fix.sql
-- Hill Country Consultants — authoritative role helpers (roles[] aware)
-- =============================================================================
-- The app authorizes off the staff.roles[] array (a staffer can hold several
-- roles), but some earlier migrations defined is_admin()/is_privileged() against
-- the legacy scalar staff.role column only. That means editing someone's roles
-- in the UI could leave RLS out of sync with what the app shows.
--
-- This migration is the LAST word: it (re)defines both helpers to check the
-- roles[] array first, with the scalar column as a fallback, so the database and
-- the app always agree. Run anytime after the other migrations. Idempotent.
-- SQL Editor -> Run.
-- =============================================================================

create or replace function is_admin() returns boolean
  language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from staff s
    where s.user_id = auth.uid() and s.active
      and ('Administrator' = any(s.roles) or s.role = 'Administrator')
  );
$$;

create or replace function is_privileged() returns boolean
  language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from staff s
    where s.user_id = auth.uid() and s.active
      and ('Administrator' = any(s.roles) or 'Business Manager' = any(s.roles)
           or s.role in ('Administrator', 'Business Manager'))
  );
$$;

-- can_access_client() already composes is_privileged() + owner + team, so it
-- inherits the fix. Nothing else to change.

-- ============================================================ employee-profile.sql
-- Hill Country Consultants — employee self-service profile
-- =============================================================================
-- On first login an employee lands on their profile and sets it up. They can't
-- write their own staff row under RLS (admin-only), so a SECURITY DEFINER RPC
-- lets them update just their own name + phone, scoped by auth.uid().
--
-- Run anytime. Idempotent. SQL Editor -> Run.
-- =============================================================================

alter table staff add column if not exists phone text;

create or replace function update_my_profile(p_name text, p_phone text) returns void
  language sql security definer set search_path = public, pg_temp as $$
  update staff
    set name  = nullif(btrim(p_name), ''),
        phone = nullif(btrim(p_phone), '')
  where user_id = auth.uid();
$$;

revoke execute on function update_my_profile(text, text) from public, anon;
grant execute on function update_my_profile(text, text) to authenticated;

-- ============================================================ employee-profile-2.sql
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
drop policy if exists staff_docs_read on staff_documents;
create policy staff_docs_read on staff_documents for select
  using (is_privileged() or exists (select 1 from staff s where s.id = staff_documents.staff_id and s.user_id = auth.uid()));
drop policy if exists staff_docs_write on staff_documents;
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

-- ============================================================ messages.sql
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

-- ============================================================ messaging.sql
-- Hill Country Consultants — internal messaging
-- =============================================================================
-- Three new channels of communication, on top of the existing client threads
-- (client_notes, which are retained per client and already visible to admins and
-- to whichever VA/AM currently owns the client — so history survives VA changes):
--
--   1. direct_messages     — 1:1 DMs between employees. Admins/BMs can read all
--                            (company oversight); otherwise only the two parties.
--   2. channels / channel_messages — shared topic channels, readable by all staff.
--   3. client_staff_notes  — private staff-only notes attached to a client (the
--                            team discusses the account; the client NEVER sees it).
--
-- Run anytime. Idempotent. SQL Editor -> Run.
-- =============================================================================

-- Current user's staff id (null if not staff). Used by DM policies.
create or replace function my_staff_id() returns uuid
  language sql stable security definer set search_path = public, pg_temp as $$
  select id from staff where user_id = auth.uid() and active limit 1;
$$;

-- ── 1. Direct messages (employee ↔ employee) ────────────────────────────────
create table if not exists direct_messages (
  id           uuid primary key default gen_random_uuid(),
  sender_id    uuid not null references staff(id) on delete cascade,
  recipient_id uuid not null references staff(id) on delete cascade,
  body         text not null,
  read_at      timestamptz,
  created_at   timestamptz not null default now()
);
create index if not exists dm_pair_idx on direct_messages (sender_id, recipient_id, created_at);
create index if not exists dm_recipient_idx on direct_messages (recipient_id, created_at);
alter table direct_messages enable row level security;

-- Read: the two parties, or a privileged staffer (oversight). Employees should
-- know these DMs are company records, not private.
drop policy if exists dm_read on direct_messages;
create policy dm_read on direct_messages for select using (
  is_privileged() or sender_id = my_staff_id() or recipient_id = my_staff_id()
);
drop policy if exists dm_send on direct_messages;
create policy dm_send on direct_messages for insert with check (
  sender_id = my_staff_id() and is_staff()
);
-- Mark-as-read: recipient may update their own received messages; priv may too.
drop policy if exists dm_update on direct_messages;
create policy dm_update on direct_messages for update using (
  is_privileged() or recipient_id = my_staff_id()
);

-- ── 2. Channels + channel messages (shared topic chat) ──────────────────────
create table if not exists channels (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  archived    boolean not null default false,
  created_by  uuid,
  created_at  timestamptz not null default now()
);
alter table channels enable row level security;
drop policy if exists channels_read on channels;
create policy channels_read   on channels for select using (is_staff());
drop policy if exists channels_insert on channels;
create policy channels_insert on channels for insert with check (is_staff());
drop policy if exists channels_modify on channels;
create policy channels_modify on channels for update using (is_privileged() or created_by = my_staff_id());
drop policy if exists channels_delete on channels;
create policy channels_delete on channels for delete using (is_privileged());

create table if not exists channel_messages (
  id          uuid primary key default gen_random_uuid(),
  channel_id  uuid not null references channels(id) on delete cascade,
  author_id   uuid not null references staff(id) on delete cascade,
  author_name text,
  body        text not null,
  created_at  timestamptz not null default now()
);
create index if not exists chanmsg_idx on channel_messages (channel_id, created_at);
alter table channel_messages enable row level security;
drop policy if exists chanmsg_read on channel_messages;
create policy chanmsg_read on channel_messages for select using (is_staff());
drop policy if exists chanmsg_send on channel_messages;
create policy chanmsg_send on channel_messages for insert with check (is_staff() and author_id = my_staff_id());

-- Seed a company-wide channel so the tab isn't empty.
insert into channels (name, description)
  select 'general', 'Company-wide chat' where not exists (select 1 from channels);

-- ── 3. Per-client staff-only notes (client never sees these) ─────────────────
create table if not exists client_staff_notes (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid not null references clients(id) on delete cascade,
  author_id   uuid references staff(id) on delete set null,
  author_name text,
  body        text not null,
  created_at  timestamptz not null default now()
);
create index if not exists csn_idx on client_staff_notes (client_id, created_at);
alter table client_staff_notes enable row level security;
-- Staff who can reach the client (privileged, owner, or team) — is_staff() gate
-- excludes the client themselves even though can_access_client() would allow them.
drop policy if exists csn_read on client_staff_notes;
create policy csn_read on client_staff_notes for select using (is_staff() and can_access_client(client_id));
drop policy if exists csn_write on client_staff_notes;
create policy csn_write on client_staff_notes for insert with check (is_staff() and can_access_client(client_id));

-- ============================================================ messaging-2.sql
-- Hill Country Consultants — messaging unread tracking
-- =============================================================================
-- Tracks the last time each employee read each channel, so we can show unread
-- badges. (DMs already carry read_at on direct_messages.) Run after messaging.sql.
--
-- Run anytime. Idempotent. SQL Editor -> Run.
-- =============================================================================

create table if not exists channel_reads (
  staff_id     uuid not null references staff(id) on delete cascade,
  channel_id   uuid not null references channels(id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (staff_id, channel_id)
);
alter table channel_reads enable row level security;

-- Each employee manages only their own read markers.
drop policy if exists channel_reads_rw on channel_reads;
create policy channel_reads_rw on channel_reads for all
  using (staff_id = my_staff_id())
  with check (staff_id = my_staff_id());

-- ============================================================ messaging-3.sql
-- Hill Country Consultants — channel management & posting permissions
-- =============================================================================
-- Admins/BMs manage channels (create, rename, archive) and decide who may post
-- in each one. Every staffer can still READ every channel; posting can be locked
-- to a chosen set of members.
--
--   channels.post_policy = 'all'        -> any staffer may post
--                        = 'restricted' -> only listed members (+ admins/BMs) post
--   channel_posters                     -> the allowed members when restricted
--
-- Run after messaging.sql. Idempotent. SQL Editor -> Run.
-- =============================================================================

alter table channels add column if not exists post_policy text not null default 'all';

create table if not exists channel_posters (
  channel_id uuid not null references channels(id) on delete cascade,
  staff_id   uuid not null references staff(id) on delete cascade,
  primary key (channel_id, staff_id)
);
alter table channel_posters enable row level security;
drop policy if exists channel_posters_read on channel_posters;
create policy channel_posters_read  on channel_posters for select using (is_staff());
drop policy if exists channel_posters_write on channel_posters;
create policy channel_posters_write on channel_posters for all using (is_privileged()) with check (is_privileged());

-- Can the current user post in this channel?
create or replace function can_post_channel(cid uuid) returns boolean
  language sql stable security definer set search_path = public, pg_temp as $$
  select
    is_privileged()
    or exists (select 1 from channels c where c.id = cid and coalesce(c.post_policy, 'all') = 'all')
    or exists (select 1 from channel_posters p where p.channel_id = cid and p.staff_id = my_staff_id());
$$;

-- Only admins/BMs create channels now (they manage them).
drop policy if exists channels_insert on channels;
drop policy if exists channels_insert on channels;
create policy channels_insert on channels for insert with check (is_privileged());

-- Posting respects the channel's policy.
drop policy if exists chanmsg_send on channel_messages;
drop policy if exists chanmsg_send on channel_messages;
create policy chanmsg_send on channel_messages for insert with check (
  is_staff() and author_id = my_staff_id() and can_post_channel(channel_id)
);

-- ============================================================ message-files.sql
-- Hill Country Consultants — message attachments
-- =============================================================================
-- Files attached to a client message (client_notes). VA/AM and the client can
-- attach; everyone who can_access_client() can see/download. Files live in the
-- existing private "client-files" storage bucket under a messages/ prefix.
--
-- Run anytime. Idempotent. SQL Editor -> Run.
-- =============================================================================

create table if not exists note_files (
  id          uuid primary key default gen_random_uuid(),
  note_id     uuid not null references client_notes(id) on delete cascade,
  client_id   uuid not null references clients(id) on delete cascade,
  name        text not null,
  path        text not null,
  size        bigint,
  uploaded_by text,
  created_at  timestamptz not null default now()
);
create index if not exists note_files_note_idx on note_files (note_id);
create index if not exists note_files_client_idx on note_files (client_id);
alter table note_files enable row level security;

drop policy if exists note_files_read on note_files;
create policy note_files_read  on note_files for select using (can_access_client(client_id));
drop policy if exists note_files_write on note_files;
create policy note_files_write on note_files for insert with check (can_access_client(client_id));

-- ============================================================ client-contacts.sql
-- Hill Country Consultants — additional client contacts + account suspension
-- =============================================================================
-- 1. client_contacts: extra people/emails on a client account. Admins/BMs manage
--    them; the account team can see them. Client emails go to every address on
--    file (primary + these).
-- 2. clients.suspended: suspend an account (e.g. non-payment). Suspended clients
--    are blocked from the portal until reactivated.
--
-- Run anytime. Idempotent. SQL Editor -> Run.
-- =============================================================================

create table if not exists client_contacts (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid not null references clients(id) on delete cascade,
  name       text,
  email      text,
  phone      text,
  title      text,
  created_at timestamptz not null default now()
);
create index if not exists client_contacts_idx on client_contacts (client_id);
alter table client_contacts enable row level security;
-- Anyone who can reach the client can see the contacts; only admins/BMs edit.
drop policy if exists client_contacts_read on client_contacts;
create policy client_contacts_read  on client_contacts for select using (can_access_client(client_id));
drop policy if exists client_contacts_write on client_contacts;
create policy client_contacts_write on client_contacts for all using (is_privileged()) with check (is_privileged());

-- Account suspension (non-payment, etc.)
alter table clients add column if not exists suspended        boolean not null default false;
alter table clients add column if not exists suspended_reason text;
alter table clients add column if not exists suspended_at     timestamptz;

-- ============================================================ client-events.sql
-- Hill Country Consultants — client calendar events
-- =============================================================================
-- Events on a CLIENT's calendar. The client can add their own; their account
-- team (assigned VA/AM, team members) and admins/BMs can add too. Everyone who
-- can_access_client() can see and manage them. Shown on both the client portal
-- calendar and the staff calendar (for that client's team).
--
-- Run anytime. Idempotent. SQL Editor -> Run.
-- =============================================================================

create table if not exists client_events (
  id              uuid primary key default gen_random_uuid(),
  client_id       uuid not null references clients(id) on delete cascade,
  title           text not null,
  event_date      date not null,
  event_time      text,
  note            text,
  created_by_role text,   -- 'client' | 'staff'
  created_by_name text,
  created_at      timestamptz not null default now()
);
create index if not exists client_events_idx on client_events (client_id, event_date);
alter table client_events enable row level security;

drop policy if exists client_events_read on client_events;
create policy client_events_read   on client_events for select using (can_access_client(client_id));
drop policy if exists client_events_insert on client_events;
create policy client_events_insert on client_events for insert with check (can_access_client(client_id));
drop policy if exists client_events_delete on client_events;
create policy client_events_delete on client_events for delete using (can_access_client(client_id));

-- ============================================================ client-feedback.sql
-- Hill Country Consultants — client satisfaction check-ins
-- =============================================================================
-- Clients rate how things are going (1–5 + optional comment) from their portal.
-- Staff who can access the client (owner, team, or privileged) can read it.
-- Referrals reuse the existing leads table (no new table needed).
--
-- Run after team-model.sql (which defines can_access_client). Idempotent.
-- =============================================================================

create table if not exists client_feedback (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid not null references clients(id) on delete cascade,
  rating     smallint not null,
  comment    text,
  created_at timestamptz not null default now()
);

create index if not exists client_feedback_client_idx on client_feedback (client_id);

alter table client_feedback enable row level security;

-- The client submits their own; staff with access (and the client) can read.
drop policy if exists client_feedback_insert on client_feedback;
drop policy if exists client_feedback_insert on client_feedback;
create policy client_feedback_insert on client_feedback for insert
  with check (client_id in (select id from clients where user_id = auth.uid()));

drop policy if exists client_feedback_read on client_feedback;
drop policy if exists client_feedback_read on client_feedback;
create policy client_feedback_read on client_feedback for select
  using (can_access_client(client_id));

-- ============================================================ client-files.sql
-- Hill Country Consultants — shared client Files space
-- =============================================================================
-- A private shared drive per client. VA/AM and admin upload files for the
-- client; the client can open/download anything uploaded to their space. Only
-- the owning client, their VA/AM, and admins can see it (RLS + private bucket).
--
-- SAFE TO RUN ONCE ON PRODUCTION: additive. SQL Editor -> New query -> Run.
-- =============================================================================

create table if not exists client_files (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid not null references clients(id) on delete cascade,
  name        text not null,
  path        text not null,
  size        bigint,
  uploaded_by text,
  created_at  timestamptz not null default now()
);
alter table client_files enable row level security;

-- Strict, idempotent policies (match strict-access.sql). Safe to re-run: the
-- drops make this converge to the correct policy instead of a weaker one.
drop policy if exists client_files_read on client_files;
drop policy if exists client_files_read on client_files;
create policy client_files_read on client_files for select
  using (can_access_client(client_files.client_id));
drop policy if exists client_files_staff_write on client_files;
drop policy if exists client_files_staff_write on client_files;
create policy client_files_staff_write on client_files for all
  using (can_access_client(client_files.client_id)) with check (can_access_client(client_files.client_id));

insert into storage.buckets (id, name, public) values ('client-files','client-files', false)
  on conflict (id) do nothing;

-- ============================================================ client-file-links.sql
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

-- ============================================================ checklists.sql
-- Hill Country Consultants — per-client checklists
-- =============================================================================
-- Freeform checklists attached to a client account. The account team (VA/AM,
-- privileged) builds and checks off items to stay on task (e.g. a branding
-- client's 34-day launch). Items can be grouped into sections. The client can
-- SEE their checklist and progress (read-only) but cannot edit it.
--
-- Run anytime. Idempotent. SQL Editor -> Run.
-- =============================================================================

create table if not exists client_checklist_items (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid not null references clients(id) on delete cascade,
  section     text,                       -- optional group heading (e.g. "Day 1")
  label       text not null,
  done        boolean not null default false,
  done_at     timestamptz,
  position    integer not null default 0, -- ordering within the list
  created_by  text,
  created_at  timestamptz not null default now()
);

alter table client_checklist_items enable row level security;

-- Read: the client's team, a privileged staffer, OR the client themselves.
drop policy if exists checklist_read on client_checklist_items;
drop policy if exists checklist_read on client_checklist_items;
create policy checklist_read on client_checklist_items for select
  using (can_access_client(client_id));

-- Write: staff on the client's team (or privileged) only — clients can't edit.
drop policy if exists checklist_write on client_checklist_items;
drop policy if exists checklist_write on client_checklist_items;
create policy checklist_write on client_checklist_items for all
  using (is_staff() and can_access_client(client_id))
  with check (is_staff() and can_access_client(client_id));

create index if not exists client_checklist_items_client_idx
  on client_checklist_items (client_id, position, created_at);

-- ============================================================ roadmap.sql
-- Hill Country Consultants — per-client 30-day roadmap
-- =============================================================================
-- Backs the client Roadmap tab. The five phases are fixed in code; this table
-- carries each client's per-phase STATUS ("Not started" | "In progress" |
-- "Complete") and an optional client-specific NOTE. Rows are sparse — only
-- phases an AM/VA has touched exist here.
--
-- RLS: a client reads only their own roadmap; staff (AM/VA/admin) read and
-- write. Mirrors the client_deliverables pattern.
--
-- SAFE TO RUN ONCE ON PRODUCTION: additive; creates one table + its policies.
-- Paste the whole file into Supabase -> SQL Editor -> New query -> Run.
-- =============================================================================

create table if not exists client_roadmap (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid not null references clients(id) on delete cascade,
  phase      text not null,
  status     text not null default 'Not started',
  note       text,
  updated_at timestamptz not null default now(),
  unique (client_id, phase)
);

alter table client_roadmap enable row level security;

-- Client sees only their own roadmap; staff see all.
drop policy if exists client_roadmap_read on client_roadmap;
create policy client_roadmap_read on client_roadmap for select
  using (exists (select 1 from clients c
                 where c.id = client_roadmap.client_id
                   and (c.user_id = auth.uid() or is_staff())));

-- Staff (any active staffer — AM, VA, admin) create/update roadmap rows.
drop policy if exists client_roadmap_staff_write on client_roadmap;
create policy client_roadmap_staff_write on client_roadmap for all
  using (is_staff()) with check (is_staff());

-- ============================================================ onboarding-steps.sql
-- Hill Country Consultants — onboarding step tracking
-- =============================================================================
-- Adds the two MANUAL onboarding flags to clients and a client-safe RPC:
--   * kickoff_at  — set by the CLIENT when they mark their kickoff call booked
--                   (they book on the Google appointment page, then confirm).
--   * roadmap_at  — set by an ADMIN, by hand, after the kickoff call.
-- The other onboarding steps (credentials, task board, files) stay automatic —
-- they derive from real vault / task / deliverable rows and need nothing here.
--
-- Clients can't UPDATE their own row under RLS (clients_admin_write = is_admin),
-- so the client path goes through a SECURITY DEFINER function scoped to their own
-- row via auth.uid(). Admins set roadmap_at through the existing admin-write RLS.
--
-- SAFE TO RUN ONCE ON PRODUCTION: additive and idempotent. No data is modified.
-- Paste the whole file into Supabase -> SQL Editor -> New query -> Run.
-- =============================================================================

alter table clients add column if not exists kickoff_at timestamptz;
alter table clients add column if not exists roadmap_at timestamptz;

-- Client self-marks their kickoff scheduled. Scoped to their own row; sets once.
create or replace function mark_kickoff_scheduled() returns void
  language sql security definer set search_path = public, pg_temp as $$
  update clients set kickoff_at = coalesce(kickoff_at, now()) where user_id = auth.uid();
$$;

revoke execute on function mark_kickoff_scheduled() from public, anon;
grant execute on function mark_kickoff_scheduled() to authenticated;

-- ============================================================ tasks-workflow.sql
-- Hill Country Consultants — Task board workflow (Phase 1)
-- =============================================================================
-- Adds the fields + file table + RPCs that power the full task lifecycle:
-- Requested -> In progress -> In review -> Delivered, with client-uploaded
-- documents, client approve / request-changes, and a "call the client" flag.
--
-- Also: purchased services now seed into "Requested" (not "In progress") so an
-- AM/VA accepts & assigns them after the kickoff call.
--
-- SAFE TO RUN ONCE ON PRODUCTION: additive + idempotent. Paste the whole file
-- into Supabase -> SQL Editor -> New query -> Run.
-- =============================================================================

-- ── task fields ─────────────────────────────────────────────────────────────
alter table client_tasks add column if not exists details text;
alter table client_tasks add column if not exists approved_at timestamptz;
alter table client_tasks add column if not exists needs_clarification boolean not null default false;

-- ── uploaded documents for a task ───────────────────────────────────────────
create table if not exists client_task_files (
  id          uuid primary key default gen_random_uuid(),
  task_id     uuid not null references client_tasks(id) on delete cascade,
  client_id   uuid not null references clients(id) on delete cascade,
  name        text not null,
  path        text not null,
  size        int,
  uploaded_by text default 'client',
  created_at  timestamptz not null default now()
);
alter table client_task_files enable row level security;

drop policy if exists task_files_read on client_task_files;
create policy task_files_read on client_task_files for select
  using (exists (select 1 from clients c where c.id = client_task_files.client_id
                 and (c.user_id = auth.uid() or is_staff())));
drop policy if exists task_files_write on client_task_files;
create policy task_files_write on client_task_files for all
  using (is_staff() or exists (select 1 from clients c where c.id = client_task_files.client_id and c.user_id = auth.uid()))
  with check (is_staff() or exists (select 1 from clients c where c.id = client_task_files.client_id and c.user_id = auth.uid()));

-- Private bucket for the documents (the app mediates all access via service role).
insert into storage.buckets (id, name, public) values ('task-files', 'task-files', false)
  on conflict (id) do nothing;

-- ── client-safe transitions (clients can't UPDATE client_tasks under RLS) ────
create or replace function client_approve_task(p_task uuid) returns void
  language sql security definer set search_path = public, pg_temp as $$
  update client_tasks set column_name = 'Delivered', approved_at = now(), needs_clarification = false
  where id = p_task
    and client_id in (select id from clients where user_id = auth.uid())
    and column_name = 'In review';
$$;

create or replace function client_request_changes(p_task uuid) returns void
  language sql security definer set search_path = public, pg_temp as $$
  update client_tasks set column_name = 'In progress', needs_clarification = true
  where id = p_task
    and client_id in (select id from clients where user_id = auth.uid())
    and column_name = 'In review';
$$;

revoke execute on function client_approve_task(uuid) from public, anon;
revoke execute on function client_request_changes(uuid) from public, anon;
grant execute on function client_approve_task(uuid) to authenticated;
grant execute on function client_request_changes(uuid) to authenticated;

-- ── purchased services now start in "Requested" ─────────────────────────────
create or replace function create_client_after_payment(
  p_email text, p_business text, p_contact text, p_phone text,
  p_ref text, p_items jsonb, p_quotes jsonb, p_paid_cents int,
  p_start date, p_rep_code text default ''
) returns uuid language plpgsql security definer as $$
declare v_client uuid;
begin
  insert into clients (email, business, contact, phone, rep_code)
  values (lower(p_email), p_business, p_contact, p_phone, p_rep_code)
  on conflict (email) do update
    set business = coalesce(excluded.business, clients.business),
        contact  = coalesce(excluded.contact,  clients.contact),
        phone    = coalesce(excluded.phone,    clients.phone)
  returning id into v_client;

  insert into bookings (client_id, ref, items, quotes, paid_cents, start_date)
  values (v_client, p_ref, p_items, p_quotes, p_paid_cents, p_start);

  -- Purchased services land in "Requested" (paid), for an AM/VA to accept &
  -- assign after the kickoff call.
  insert into client_tasks (client_id, title, service, due_date, paid, booking_ref, created_by, column_name)
  select v_client, i->>'name', i->>'svc', p_start, true, p_ref, 'staff', 'Requested'
  from jsonb_array_elements(p_items) i;

  return v_client;
end $$;

revoke execute on function create_client_after_payment(
  text, text, text, text, text, jsonb, jsonb, integer, date, text
) from public, anon, authenticated;

-- ============================================================ task-charges.sql
-- Hill Country Consultants — per-task charges (Phase 2)
-- =============================================================================
-- When an AM/VA decides a task needs an extra charge, they set an amount and
-- send a payment link. charge_status: 'none' -> 'sent' -> 'paid'. On payment the
-- Stripe webhook flips the task to 'paid' and moves it into "In progress".
--
-- SAFE TO RUN ONCE ON PRODUCTION: additive. SQL Editor -> New query -> Run.
-- =============================================================================

alter table client_tasks add column if not exists charge_cents  int;
alter table client_tasks add column if not exists charge_status text not null default 'none';

-- ============================================================ worklog-approval.sql
-- Hill Country Consultants — Work Log admin approval
-- =============================================================================
-- A VA/AM logs client work daily (client_work_log). Those hours only reach the
-- CLIENT's Work Log tab after an ADMIN approves them — so the client always sees
-- verified, approved time against the hours their package covers.
--
-- SAFE TO RUN ONCE ON PRODUCTION: additive. Existing rows default to unapproved,
-- so they'll show once an admin approves them. SQL Editor -> New query -> Run.
-- =============================================================================

alter table client_work_log add column if not exists approved     boolean not null default false;
alter table client_work_log add column if not exists approved_by  text;
alter table client_work_log add column if not exists approved_at   timestamptz;

-- ============================================================ deliverable-approvals.sql
-- Hill Country Consultants — client deliverable approvals
-- =============================================================================
-- Clients can Approve or Request changes on a delivered item from their portal,
-- with a timestamp and optional note. Read/scoping stays with the existing
-- client_deliverables RLS; clients update only their own via the server action
-- (service role after a portal-auth check), so no new policy is required beyond
-- what already governs the table.
--
-- Idempotent. Run in the Supabase SQL Editor.
-- =============================================================================

alter table client_deliverables add column if not exists approval_status text;   -- approved · changes_requested
alter table client_deliverables add column if not exists approval_note   text;
alter table client_deliverables add column if not exists approval_at      timestamptz;

-- ============================================================ weekly-reports.sql
-- Hill Country Consultants — client weekly report PDFs
-- =============================================================================
-- An admin generates a weekly report per client (from approved work-log hours +
-- deliverables). Each is a PDF in a private bucket, listed on the client's Weekly
-- Report tab, newest first, for 30 days.
--
-- SAFE TO RUN ONCE ON PRODUCTION: additive. SQL Editor -> New query -> Run.
-- =============================================================================

create table if not exists client_reports (
  id           uuid primary key default gen_random_uuid(),
  client_id    uuid not null references clients(id) on delete cascade,
  name         text not null,
  path         text not null,
  period_start date,
  period_end   date,
  created_at   timestamptz not null default now()
);
alter table client_reports enable row level security;

drop policy if exists client_reports_read on client_reports;
create policy client_reports_read on client_reports for select
  using (exists (select 1 from clients c where c.id = client_reports.client_id
                 and (c.user_id = auth.uid() or is_staff())));
drop policy if exists client_reports_staff_write on client_reports;
create policy client_reports_staff_write on client_reports for all
  using (is_staff()) with check (is_staff());

insert into storage.buckets (id, name, public) values ('client-reports','client-reports', false)
  on conflict (id) do nothing;

-- ============================================================ document-templates.sql
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
drop policy if exists doc_templates_read on document_templates;
create policy doc_templates_read  on document_templates for select using (is_privileged());
drop policy if exists doc_templates_write on document_templates;
create policy doc_templates_write on document_templates for all using (is_privileged()) with check (is_privileged());

-- Track which template an assigned document came from (optional).
alter table staff_documents add column if not exists template_id uuid;

-- ============================================================ docusign.sql
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

-- ============================================================ inbound-email.sql
-- Hill Country Consultants — inbound email (email replies -> message thread)
-- =============================================================================
-- Gives every client a stable reply_token. Outbound message emails use a
-- Reply-To of  reply+<token>@<your receiving subdomain>  so that when either
-- side replies, Resend forwards it to our webhook, which posts it into the
-- client_notes thread and forwards it on to the other party.
--
-- Run anytime. Idempotent. SQL Editor -> Run.
-- =============================================================================

alter table clients add column if not exists reply_token text;

-- Backfill existing clients with a random token (no pgcrypto needed).
update clients
  set reply_token = substr(md5(random()::text || clock_timestamp()::text || id::text), 1, 16)
  where reply_token is null;

-- New clients get one automatically.
alter table clients
  alter column reply_token set default substr(md5(random()::text || clock_timestamp()::text || gen_random_uuid()::text), 1, 16);

create unique index if not exists clients_reply_token_idx on clients (reply_token);

-- ============================================================ job-applications.sql
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
drop policy if exists job_applications_read on job_applications;
create policy job_applications_read on job_applications for select using (is_privileged());
drop policy if exists job_applications_write on job_applications;
drop policy if exists job_applications_write on job_applications;
create policy job_applications_write on job_applications for all using (is_privileged()) with check (is_privileged());

create index if not exists job_applications_created_idx on job_applications (created_at desc);

-- Private bucket for resume uploads (service-role access only).
insert into storage.buckets (id, name, public)
values ('applications', 'applications', false)
on conflict (id) do nothing;

-- ============================================================ hiring-pipeline.sql
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

-- ============================================================ careers-credentials.sql
-- Hill Country Consultants — Careers: store an applicant's credentials file.
-- Adds job_applications.credentials_path (points into the existing 'applications'
-- storage bucket, alongside resume_path). SAFE / idempotent. Run once.
alter table job_applications add column if not exists credentials_path text;

-- ============================================================ application-overhaul.sql
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

-- ============================================================ reset-requests.sql
-- Hill Country Consultants — employee password-reset requests
-- =============================================================================
-- Employees can't self-serve a password reset. They file a request from the
-- staff login screen; it lands here as 'pending'. An admin approves it (which
-- sends the recovery email) or denies it. Client resets remain fully self-serve.
--
-- SAFE TO RUN ONCE ON PRODUCTION: additive. SQL Editor -> New query -> Run.
-- =============================================================================

create table if not exists staff_reset_requests (
  id           uuid primary key default gen_random_uuid(),
  email        text not null,
  status       text not null default 'pending',   -- pending | approved | denied
  requested_at timestamptz not null default now(),
  handled_by   uuid,
  handled_at   timestamptz
);
alter table staff_reset_requests enable row level security;

-- Staff can see and manage requests; inserts come from the (public) login screen
-- via the service role, so no anon insert policy is needed.
drop policy if exists staff_reset_read on staff_reset_requests;
create policy staff_reset_read  on staff_reset_requests for select using (is_staff());
drop policy if exists staff_reset_write on staff_reset_requests;
create policy staff_reset_write on staff_reset_requests for all using (is_staff()) with check (is_staff());

-- ============================================================ security-acknowledgment.sql
-- Hill Country Consultants — IT, Security & Confidentiality Acknowledgment
-- =============================================================================
-- New hires read and e-acknowledge the firm's security + confidentiality terms
-- on their employee profile. Each acknowledgment records a typed signature and
-- timestamp, versioned so a new policy version can require re-acknowledgment.
--
-- Writes happen server-side via the service client after an auth check, so the
-- table only needs a read policy (self + privileged). Idempotent. SQL Editor -> Run.
-- =============================================================================

create table if not exists staff_acknowledgments (
  id          uuid primary key default gen_random_uuid(),
  staff_id    uuid not null references staff(id) on delete cascade,
  kind        text not null default 'it_security',
  version     text not null,
  agreed_name text,
  agreed_at   timestamptz not null default now(),
  unique (staff_id, kind, version)
);

create index if not exists staff_ack_staff_idx on staff_acknowledgments (staff_id);

alter table staff_acknowledgments enable row level security;

-- A staffer can read their own acknowledgments; privileged staff read everyone's.
drop policy if exists staff_ack_read on staff_acknowledgments;
drop policy if exists staff_ack_read on staff_acknowledgments;
create policy staff_ack_read on staff_acknowledgments for select
  using (
    staff_id in (select id from staff where user_id = auth.uid())
    or is_privileged()
  );

-- Allow a signed-in staffer to insert their own acknowledgment (defense in depth;
-- the server action uses the service role, but this keeps RLS coherent).
drop policy if exists staff_ack_insert on staff_acknowledgments;
drop policy if exists staff_ack_insert on staff_acknowledgments;
create policy staff_ack_insert on staff_acknowledgments for insert
  with check (staff_id in (select id from staff where user_id = auth.uid()));

-- ============================================================ staff-events.sql
-- Hill Country Consultants — employee calendar events
-- =============================================================================
-- Each employee has a calendar of their own events (due dates, reminders,
-- self-scheduled items). An employee can also put an event on a teammate's
-- calendar (shareable). Admins/BMs see everyone's.
--
-- Run anytime. Idempotent. SQL Editor -> Run.
-- =============================================================================

create table if not exists staff_events (
  id         uuid primary key default gen_random_uuid(),
  staff_id   uuid not null references staff(id) on delete cascade,  -- whose calendar it's on
  created_by uuid,                                                   -- who added it
  title      text not null,
  event_date date not null,
  event_time text,                                                   -- optional 'HH:MM'
  note       text,
  created_at timestamptz not null default now()
);
create index if not exists staff_events_cal_idx on staff_events (staff_id, event_date);
alter table staff_events enable row level security;

-- Read: your own calendar, events you created for others, or privileged (admin/BM).
drop policy if exists staff_events_read on staff_events;
create policy staff_events_read on staff_events for select using (
  is_privileged()
  or exists (select 1 from staff s where s.id = staff_events.staff_id and s.user_id = auth.uid())
  or exists (select 1 from staff s where s.id = staff_events.created_by and s.user_id = auth.uid())
);
-- Write: any active staffer may add an event (to their own or a teammate's calendar);
-- delete/update limited to the owner, the creator, or a privileged staffer.
drop policy if exists staff_events_insert on staff_events;
create policy staff_events_insert on staff_events for insert with check (is_staff());
drop policy if exists staff_events_modify on staff_events;
create policy staff_events_modify on staff_events for update using (
  is_privileged()
  or exists (select 1 from staff s where s.id = staff_events.staff_id and s.user_id = auth.uid())
  or exists (select 1 from staff s where s.id = staff_events.created_by and s.user_id = auth.uid())
);
drop policy if exists staff_events_delete on staff_events;
create policy staff_events_delete on staff_events for delete using (
  is_privileged()
  or exists (select 1 from staff s where s.id = staff_events.staff_id and s.user_id = auth.uid())
  or exists (select 1 from staff s where s.id = staff_events.created_by and s.user_id = auth.uid())
);

-- Colleague roster: minimal directory (id/name/email/roles) of ACTIVE staff, for
-- picking a teammate when sharing a calendar event or starting a DM. Staff-only —
-- clients are authenticated too, so we gate on is_staff() inside the definer.
create or replace function staff_roster()
returns table (id uuid, name text, email text, roles text[], role text)
language plpgsql security definer set search_path = public as $$
begin
  if not is_staff() then return; end if;
  return query
    select s.id, s.name, s.email, s.roles, s.role
    from staff s
    where s.active = true
    order by s.name nulls last;
end;
$$;
revoke all on function staff_roster() from public;
grant execute on function staff_roster() to authenticated;

-- ============================================================ time-off.sql
-- Hill Country Consultants — PTO / time-off requests
-- =============================================================================
-- Employees request time off from their profile; Admin/Business Manager approve
-- or deny on the Capacity page. Approved time off in the current week reduces a
-- staffer's effective weekly target on the capacity model.
--
-- Idempotent. Run in the Supabase SQL Editor.
-- =============================================================================

create table if not exists time_off_requests (
  id          uuid primary key default gen_random_uuid(),
  staff_id    uuid not null references staff(id) on delete cascade,
  kind        text not null default 'PTO',           -- PTO · Sick · Unpaid
  start_date  date not null,
  end_date    date not null,
  note        text,
  status      text not null default 'pending',        -- pending · approved · denied
  decided_by  uuid references staff(id),
  decided_at  timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists time_off_staff_idx on time_off_requests (staff_id);
create index if not exists time_off_status_idx on time_off_requests (status);

alter table time_off_requests enable row level security;

-- Staff see their own requests; privileged (Admin/BM) see everyone's.
drop policy if exists time_off_read on time_off_requests;
drop policy if exists time_off_read on time_off_requests;
create policy time_off_read on time_off_requests for select
  using (
    staff_id in (select id from staff where user_id = auth.uid())
    or is_privileged()
  );

-- Staff create their own requests.
drop policy if exists time_off_insert on time_off_requests;
drop policy if exists time_off_insert on time_off_requests;
create policy time_off_insert on time_off_requests for insert
  with check (staff_id in (select id from staff where user_id = auth.uid()));

-- Staff may cancel (delete) their own still-pending requests.
drop policy if exists time_off_delete on time_off_requests;
drop policy if exists time_off_delete on time_off_requests;
create policy time_off_delete on time_off_requests for delete
  using (status = 'pending' and staff_id in (select id from staff where user_id = auth.uid()));

-- ============================================================ sales.sql
-- Hill Country Consultants — sales console: per-rep commission % + Sales Manager
-- =============================================================================
-- 1) staff.commission_pct — each rep's commission rate (percent, e.g. 10.00).
-- 2) is_sales() also recognizes the new "Sales Manager" role so they can see the
--    pipeline/leads. (Roles are free text; no enum change needed.)
--
-- Run anytime after clients-and-roles.sql. Idempotent. SQL Editor -> Run.
-- =============================================================================

alter table staff add column if not exists commission_pct numeric(5,2) not null default 0;

create or replace function is_sales() returns boolean
  language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from staff s where s.user_id = auth.uid() and s.active
      and ('Account manager' = any(s.roles) or 'Sales staff' = any(s.roles) or 'Sales Manager' = any(s.roles)
           or s.role in ('Account manager', 'Sales staff', 'Sales Manager')
           or 'Administrator' = any(s.roles) or 'Business Manager' = any(s.roles)
           or s.role in ('Administrator', 'Business Manager'))
  );
$$;

-- ============================================================ tier1-billing-allotments.sql
-- Hill Country Consultants — Tier 1 back-office: plans, invoicing/AR, allotments
-- =============================================================================
-- Adds:
--   1) clients.plan            — which retainer tier a client is on (or null)
--   2) invoices                — plan / overage / project invoices with AR status
--   3) client_allotment_adjustments — manual +/- tweaks to computed allotment use
--   4) is_biller()             — Admin or Business Manager (roles[]-aware)
--
-- SAFE: additive + idempotent. Creates two tables and one column; no data is
-- deleted or modified. Run once in Supabase → SQL Editor → Run.
-- =============================================================================

-- 1) Client plan (retainer tier) ------------------------------------------------
alter table clients add column if not exists plan text;   -- 'Foundation' | 'Momentum' | 'Enterprise' | null

-- Billing / admin role check (Admin or Business Manager), roles[]-aware ----------
create or replace function is_biller() returns boolean
  language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from staff s
    where s.user_id = auth.uid() and s.active
      and (
        s.roles && array['Administrator','Business Manager']::text[]
        or s.role in ('Administrator','Business Manager')
      )
  );
$$;

-- 2) Invoices -------------------------------------------------------------------
create table if not exists invoices (
  id           uuid primary key default gen_random_uuid(),
  client_id    uuid not null references clients(id) on delete cascade,
  number       text unique not null,
  kind         text not null default 'plan',      -- 'plan' | 'overage' | 'project'
  period_month date,                               -- first day of billed month (plan invoices)
  description  text,
  amount_cents integer not null default 0,
  status       text not null default 'draft',      -- 'draft' | 'sent' | 'paid' | 'void'
  due_date     date,
  pay_url      text,                                -- Stripe payment link (optional)
  paid_at      timestamptz,
  paid_method  text,                                -- 'stripe' | 'manual'
  created_by   text,
  created_at   timestamptz not null default now()
);
create index if not exists invoices_client_idx on invoices (client_id);
create unique index if not exists invoices_plan_month_uk on invoices (client_id, period_month) where kind = 'plan';
alter table invoices enable row level security;
drop policy if exists invoices_biller on invoices;
drop policy if exists invoices_biller on invoices;
create policy invoices_biller on invoices for all using (is_biller()) with check (is_biller());

-- 3) Manual allotment adjustments ----------------------------------------------
create table if not exists client_allotment_adjustments (
  id           uuid primary key default gen_random_uuid(),
  client_id    uuid not null references clients(id) on delete cascade,
  period_month date not null,                       -- first day of the month
  service_key  text not null,                       -- e.g. 'va_hours', 'submittals'
  delta        numeric not null default 0,          -- + adds use, - credits use
  note         text,
  created_by   text,
  created_at   timestamptz not null default now()
);
create index if not exists allot_adj_client_idx on client_allotment_adjustments (client_id, period_month);
alter table client_allotment_adjustments enable row level security;
drop policy if exists allot_adj_sales on client_allotment_adjustments;
drop policy if exists allot_adj_sales on client_allotment_adjustments;
create policy allot_adj_sales on client_allotment_adjustments for all using (is_sales()) with check (is_sales());

-- ============================================================ tier2-finance-renewals.sql
-- Hill Country Consultants — Tier 2: expenses, budgets, and client renewals
-- =============================================================================
-- Adds:
--   1) is_admin()          — Administrator only (roles[]-aware), for finance RLS
--   2) expenses            — the expense ledger (category, vendor, amount, date)
--   3) expense_budgets     — one steady monthly budget per category
--   4) clients.renewal_date — optional manual override of the auto renewal date
--
-- SAFE: additive + idempotent. Run once in Supabase → SQL Editor → Run.
-- =============================================================================

-- 1) Administrator-only check (roles[]-aware, scalar fallback) ------------------
create or replace function is_admin() returns boolean
  language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from staff s
    where s.user_id = auth.uid() and s.active
      and (s.roles && array['Administrator']::text[] or s.role = 'Administrator')
  );
$$;

-- 2) Expense ledger -------------------------------------------------------------
create table if not exists expenses (
  id           uuid primary key default gen_random_uuid(),
  incurred_on  date not null default current_date,
  category     text not null default 'Other',
  vendor       text,
  description  text,
  amount_cents integer not null default 0,
  created_by   text,
  created_at   timestamptz not null default now()
);
create index if not exists expenses_month_idx on expenses (incurred_on);
alter table expenses enable row level security;
drop policy if exists expenses_admin on expenses;
drop policy if exists expenses_admin on expenses;
create policy expenses_admin on expenses for all using (is_admin()) with check (is_admin());

-- 3) Monthly budget per category (steady; one row per category) -----------------
create table if not exists expense_budgets (
  category      text primary key,
  monthly_cents integer not null default 0,
  created_at    timestamptz not null default now()
);
alter table expense_budgets enable row level security;
drop policy if exists expense_budgets_admin on expense_budgets;
drop policy if exists expense_budgets_admin on expense_budgets;
create policy expense_budgets_admin on expense_budgets for all using (is_admin()) with check (is_admin());

-- 4) Optional manual renewal-date override on clients ---------------------------
-- When null, the app uses retained_since + 12 months. Set it to override.
alter table clients add column if not exists renewal_date date;

-- ============================================================ tier3-ops.sql
-- Hill Country Consultants — Tier 3: contracts, capacity, vendors, audit log, KB
-- =============================================================================
-- Adds:
--   1) contracts               — client agreements/SOWs with e-sign status
--   2) staff.weekly_capacity_hours — capacity target per staffer
--   3) vendors + expenses.vendor_id — vendor / 1099 tracking
--   4) audit_log               — who-changed-what trail
--   5) kb_articles             — internal knowledge base
--
-- Reuses is_admin() and is_biller() from earlier migrations. SAFE: additive +
-- idempotent. Run once in Supabase → SQL Editor → Run.
-- =============================================================================

-- 1) Contracts & SOWs -----------------------------------------------------------
create table if not exists contracts (
  id            uuid primary key default gen_random_uuid(),
  client_id     uuid not null references clients(id) on delete cascade,
  kind          text not null default 'SOW',     -- 'MSA' | 'SOW' | 'NDA' | 'Order' | 'Other'
  title         text not null,
  amount_cents  integer,
  start_date    date,
  end_date      date,
  status        text not null default 'draft',    -- 'draft' | 'sent' | 'signed' | 'void'
  file_path     text,                             -- in the client-files bucket
  signer_email  text,
  signer_name   text,
  docusign_envelope_id text,
  created_by    text,
  created_at    timestamptz not null default now(),
  sent_at       timestamptz,
  signed_at     timestamptz
);
create index if not exists contracts_client_idx on contracts (client_id);
alter table contracts enable row level security;
drop policy if exists contracts_priv on contracts;
drop policy if exists contracts_priv on contracts;
create policy contracts_priv on contracts for all using (is_biller()) with check (is_biller());

-- 2) Capacity target per staffer ------------------------------------------------
alter table staff add column if not exists weekly_capacity_hours numeric not null default 40;

-- 3) Vendors & 1099 -------------------------------------------------------------
create table if not exists vendors (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       text,
  ein_last4   text,
  is_1099     boolean not null default false,
  notes       text,
  created_by  text,
  created_at  timestamptz not null default now()
);
alter table vendors enable row level security;
drop policy if exists vendors_admin on vendors;
drop policy if exists vendors_admin on vendors;
create policy vendors_admin on vendors for all using (is_admin()) with check (is_admin());
-- Link an expense to a vendor (optional).
alter table expenses add column if not exists vendor_id uuid references vendors(id) on delete set null;

-- 4) Audit log ------------------------------------------------------------------
create table if not exists audit_log (
  id          uuid primary key default gen_random_uuid(),
  actor_email text,
  action      text not null,        -- 'create' | 'update' | 'delete' | ...
  entity      text not null,        -- 'invoice' | 'client' | 'contract' | ...
  entity_id   text,
  summary     text,
  created_at  timestamptz not null default now()
);
create index if not exists audit_log_created_idx on audit_log (created_at desc);
create index if not exists audit_log_entity_idx on audit_log (entity, entity_id);
alter table audit_log enable row level security;
drop policy if exists audit_log_admin on audit_log;
drop policy if exists audit_log_admin on audit_log;
create policy audit_log_admin on audit_log for select using (is_admin());
-- Inserts happen server-side with the service role (bypasses RLS); no insert policy needed.

-- 5) Knowledge base -------------------------------------------------------------
create table if not exists kb_articles (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  category    text not null default 'General',
  body        text not null default '',
  tags        text[] not null default '{}',
  created_by  text,
  updated_by  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists kb_articles_cat_idx on kb_articles (category);
alter table kb_articles enable row level security;
drop policy if exists kb_read on kb_articles;
drop policy if exists kb_write on kb_articles;
drop policy if exists kb_read on kb_articles;
create policy kb_read  on kb_articles for select using (is_staff());
drop policy if exists kb_write on kb_articles;
create policy kb_write on kb_articles for all using (is_biller()) with check (is_biller());

-- ============================================================ google-calendar.sql
-- Hill Country Consultants — Google Calendar sync (dedup ledger)
-- =============================================================================
-- Records every Google Calendar event the sync has already processed, so a
-- booking is only flagged to staff once. Written by the sync (service role);
-- privileged staff can read it. No client data beyond a link + summary.
--
-- Idempotent. Run in the Supabase SQL Editor.
-- =============================================================================

create table if not exists synced_calendar_events (
  event_id    text primary key,
  calendar_id text,
  client_id   uuid references clients(id) on delete set null,
  summary     text,
  start_at    timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists synced_cal_client_idx on synced_calendar_events (client_id);

alter table synced_calendar_events enable row level security;

drop policy if exists synced_cal_read on synced_calendar_events;
drop policy if exists synced_cal_read on synced_calendar_events;
create policy synced_cal_read on synced_calendar_events for select using (is_privileged());

-- ============================================================ kickoff-flag.sql
-- Hill Country Consultants — kickoff "needs staff added" flag
-- =============================================================================
-- When a client marks their kickoff call scheduled, it stays on the assigned
-- owner's + managers' dashboards until a staffer confirms they've added the
-- necessary people to the calendar invite. This column records that hand-off.
--
-- Idempotent. Run in the Supabase SQL Editor.
-- =============================================================================

alter table clients add column if not exists kickoff_confirmed_at timestamptz;

-- ============================================================ welcome-drip.sql
-- Hill Country Consultants — onboarding check-in drip flags
-- =============================================================================
-- Records when each new client was sent the day-3 and day-14 onboarding
-- check-in emails, so the daily cron sends each phase exactly once.
-- Only clients created AFTER this ships enter the windows (older clients are
-- already past them), so existing clients are never emailed.
--
-- Idempotent. Run in the Supabase SQL Editor.
-- =============================================================================

alter table clients add column if not exists welcome_d3_at  timestamptz;
alter table clients add column if not exists welcome_d14_at timestamptz;

-- ============================================================ preferred-vendors.sql
-- Hill Country Consultants — Preferred Vendors (partners we work with)
-- =============================================================================
-- Separate from the AP/1099 `vendors` table (vendors we PAY). These are partner
-- businesses we recommend to clients and delegate parts of client work to
-- (e.g. Redd Ladys Chronicles Publishing & Production, TSD Events, Carnetta
-- Dansby — Financial Analyst).
--
--   preferred_vendors         — the directory (public site + portal)
--   client_preferred_vendors  — a vendor assigned to part of a client's services
--   vendor_referrals          — any employee can refer a vendor (managers action)
--
-- Requires can_access_client(), is_staff(), is_privileged() (team-model.sql).
-- Idempotent. Run in the Supabase SQL Editor.
-- =============================================================================

create table if not exists preferred_vendors (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  category      text,                       -- e.g. Publishing & Production, Events, Financial
  blurb         text,                       -- short description shown in the directory
  website       text,
  contact_name  text,
  contact_email text,
  phone         text,
  logo_url      text,
  is_public     boolean not null default true,   -- show on the public marketing site
  active        boolean not null default true,   -- hide everywhere when false
  sort          integer not null default 0,
  created_at    timestamptz not null default now()
);

create table if not exists client_preferred_vendors (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid not null references clients(id) on delete cascade,
  vendor_id   uuid not null references preferred_vendors(id) on delete cascade,
  scope       text,                          -- which part of the client's services
  note        text,
  assigned_by uuid references staff(id) on delete set null,
  created_at  timestamptz not null default now()
);
create index if not exists cpv_client_idx on client_preferred_vendors (client_id);
create index if not exists cpv_vendor_idx on client_preferred_vendors (vendor_id);

create table if not exists vendor_referrals (
  id              uuid primary key default gen_random_uuid(),
  referred_by     uuid references staff(id) on delete set null,
  vendor_id       uuid references preferred_vendors(id) on delete set null, -- existing vendor, if any
  proposed_name   text,                      -- for a brand-new vendor suggestion
  proposed_website text,
  proposed_contact text,
  client_id       uuid references clients(id) on delete set null,           -- suggested for this client, optional
  note            text,
  status          text not null default 'pending',   -- pending | actioned | dismissed
  created_at      timestamptz not null default now(),
  handled_by      uuid references staff(id) on delete set null,
  handled_at      timestamptz
);
create index if not exists vendor_referrals_status_idx on vendor_referrals (status);

-- ── RLS ──────────────────────────────────────────────────────────────────────
alter table preferred_vendors        enable row level security;
alter table client_preferred_vendors enable row level security;
alter table vendor_referrals         enable row level security;

-- Directory: public rows readable by anyone; staff see all (incl. private/inactive).
drop policy if exists preferred_vendors_read on preferred_vendors;
drop policy if exists preferred_vendors_read on preferred_vendors;
create policy preferred_vendors_read on preferred_vendors for select
  using ((is_public and active) or is_staff());

-- Assignments: the owning client, staff-with-access, and managers can read.
drop policy if exists cpv_read on client_preferred_vendors;
drop policy if exists cpv_read on client_preferred_vendors;
create policy cpv_read on client_preferred_vendors for select
  using (can_access_client(client_id)
         or client_id in (select id from clients where user_id = auth.uid()));

-- Referrals: the employee who filed it and any privileged manager can read.
drop policy if exists vendor_referrals_read on vendor_referrals;
drop policy if exists vendor_referrals_read on vendor_referrals;
create policy vendor_referrals_read on vendor_referrals for select
  using (is_privileged()
         or referred_by in (select id from staff where user_id = auth.uid()));

-- All writes go through server actions using the service role (guarded in code),
-- so no INSERT/UPDATE/DELETE policies are granted to anon/authenticated here.

-- ============================================================ preferred-vendors-2.sql
-- Hill Country Consultants — Preferred Vendors: services list + logo bucket
-- =============================================================================
-- Adds a multi-value `services` list to each vendor and a PUBLIC storage bucket
-- for vendor logos (so they render on the marketing site). Run after
-- preferred-vendors.sql. Idempotent.
-- =============================================================================

alter table preferred_vendors add column if not exists services text[] not null default '{}';

-- Public bucket for vendor logos (world-readable by URL; uploads via service role).
insert into storage.buckets (id, name, public)
values ('vendor-logos', 'vendor-logos', true)
on conflict (id) do nothing;

-- ============================================================ service-upgrades.sql
-- Hill Country Consultants — client-requested service upgrades / add-ons
-- =============================================================================
-- Clients pick an upgrade or add-on from their task board; it routes to the
-- account owner + sales/admin. Not a charge — a request the team follows up on.
--
-- Requires can_access_client() (team-model.sql). Idempotent.
-- =============================================================================

create table if not exists service_upgrade_requests (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid not null references clients(id) on delete cascade,
  upgrade_key text,
  label       text not null,
  note        text,
  status      text not null default 'new',   -- new | contacted | closed
  created_at  timestamptz not null default now(),
  handled_by  uuid references staff(id) on delete set null,
  handled_at  timestamptz
);
create index if not exists sur_status_idx on service_upgrade_requests (status);
create index if not exists sur_client_idx on service_upgrade_requests (client_id);

alter table service_upgrade_requests enable row level security;

-- The owning client and staff-with-access can read; writes go via service role.
drop policy if exists sur_read on service_upgrade_requests;
drop policy if exists sur_read on service_upgrade_requests;
create policy sur_read on service_upgrade_requests for select
  using (can_access_client(client_id)
         or client_id in (select id from clients where user_id = auth.uid()));

-- ============================================================ site-content.sql
-- Hill Country Consultants — editable site content (admin CMS, phase 1)
-- =============================================================================
-- Simple key/value overrides for marketing copy + a managed FAQ list. Marketing
-- pages read defaults from code and apply any override found here, so the site
-- never breaks if a key is missing. Admins edit these from /staff/site-content.
--
-- Idempotent. Run in the Supabase SQL Editor.
-- =============================================================================

create table if not exists site_content (
  key        text primary key,
  value      text,
  updated_by uuid references staff(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table if not exists site_faqs (
  id         uuid primary key default gen_random_uuid(),
  question   text not null,
  answer     text not null,
  sort       integer not null default 0,
  active     boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists site_faqs_sort_idx on site_faqs (sort);

alter table site_content enable row level security;
alter table site_faqs    enable row level security;

-- Public site needs to read both; writes go through admin server actions (service role).
drop policy if exists site_content_read on site_content;
drop policy if exists site_content_read on site_content;
create policy site_content_read on site_content for select using (true);

drop policy if exists site_faqs_read on site_faqs;
drop policy if exists site_faqs_read on site_faqs;
create policy site_faqs_read on site_faqs for select using (true);

-- ============================================================ strict-access.sql
-- Hill Country Consultants — strict per-client access + Business Manager role
-- =============================================================================
-- Every client tab (tasks, files, messages, work log, roadmap, deliverables,
-- vault, reports, bookings) becomes visible ONLY to: the client, their assigned
-- VA/AM, a Business Manager, or an Administrator. Non-owner staff lose access.
-- Unassigned clients are visible only to Business Managers and Administrators.
--
-- 'role' on staff is free text, so "Business Manager" needs no schema change —
-- just set a staff member's role to 'Business Manager' from the Admin tab.
--
-- SAFE TO RUN ONCE ON PRODUCTION: it only redefines helper functions and swaps
-- policy predicates. SQL Editor -> New query -> Run.
-- =============================================================================

-- Admin OR Business Manager — full visibility across every client.
create or replace function is_privileged() returns boolean
  language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from staff s
    where s.user_id = auth.uid() and s.active
      and s.role in ('Administrator', 'Business Manager')
  );
$$;

-- Can the current user see this specific client? The client themselves, a
-- privileged staffer (admin/BM), or the assigned VA/AM (clients.assigned_to).
create or replace function can_access_client(cid uuid) returns boolean
  language sql stable security definer set search_path = public, pg_temp as $$
  select
    is_privileged()
    or exists (select 1 from clients c where c.id = cid and c.user_id = auth.uid())
    or exists (
      select 1 from staff s
      where s.user_id = auth.uid() and s.active
        and s.id::text = (select assigned_to from clients c2 where c2.id = cid)
    );
$$;

-- ---- clients ----------------------------------------------------------------
drop policy if exists clients_own_read on clients;
drop policy if exists clients_own_read on clients;
create policy clients_own_read on clients for select
  using (user_id = auth.uid() or can_access_client(id));

-- ---- bookings ---------------------------------------------------------------
drop policy if exists bookings_scope on bookings;
drop policy if exists bookings_scope on bookings;
create policy bookings_scope on bookings for select using (can_access_client(bookings.client_id));
drop policy if exists bookings_staff_write on bookings;
drop policy if exists bookings_staff_write on bookings;
create policy bookings_staff_write on bookings for all
  using (can_access_client(bookings.client_id)) with check (can_access_client(bookings.client_id));

-- ---- client_tasks -----------------------------------------------------------
drop policy if exists tasks_scope on client_tasks;
drop policy if exists tasks_scope on client_tasks;
create policy tasks_scope on client_tasks for select using (can_access_client(client_tasks.client_id));
drop policy if exists tasks_write on client_tasks;
drop policy if exists tasks_write on client_tasks;
create policy tasks_write on client_tasks for insert with check (can_access_client(client_tasks.client_id));
drop policy if exists tasks_update on client_tasks;
drop policy if exists tasks_update on client_tasks;
create policy tasks_update on client_tasks for update using (can_access_client(client_tasks.client_id));

-- ---- client_notes (messages) ------------------------------------------------
drop policy if exists notes_scope on client_notes;
drop policy if exists notes_scope on client_notes;
create policy notes_scope on client_notes for select using (can_access_client(client_notes.client_id));
drop policy if exists notes_write on client_notes;
drop policy if exists notes_write on client_notes;
create policy notes_write on client_notes for insert with check (can_access_client(client_notes.client_id));

-- ---- client_vault -----------------------------------------------------------
drop policy if exists vault_scope on client_vault;
drop policy if exists vault_scope on client_vault;
create policy vault_scope on client_vault for all
  using (can_access_client(client_vault.client_id)) with check (can_access_client(client_vault.client_id));

-- ---- client_work_log --------------------------------------------------------
drop policy if exists worklog_scope on client_work_log;
drop policy if exists worklog_scope on client_work_log;
create policy worklog_scope on client_work_log for select using (can_access_client(client_work_log.client_id));
drop policy if exists worklog_staff_write on client_work_log;
drop policy if exists worklog_staff_write on client_work_log;
create policy worklog_staff_write on client_work_log for all
  using (can_access_client(client_work_log.client_id)) with check (can_access_client(client_work_log.client_id));

-- ---- client_deliverables ----------------------------------------------------
drop policy if exists deliverables_scope on client_deliverables;
drop policy if exists deliverables_scope on client_deliverables;
create policy deliverables_scope on client_deliverables for select using (can_access_client(client_deliverables.client_id));
drop policy if exists deliverables_staff_write on client_deliverables;
drop policy if exists deliverables_staff_write on client_deliverables;
create policy deliverables_staff_write on client_deliverables for all
  using (can_access_client(client_deliverables.client_id)) with check (can_access_client(client_deliverables.client_id));

-- ---- client_task_files ------------------------------------------------------
drop policy if exists task_files_read on client_task_files;
drop policy if exists task_files_read on client_task_files;
create policy task_files_read on client_task_files for select using (can_access_client(client_task_files.client_id));
drop policy if exists task_files_write on client_task_files;
drop policy if exists task_files_write on client_task_files;
create policy task_files_write on client_task_files for all
  using (can_access_client(client_task_files.client_id)) with check (can_access_client(client_task_files.client_id));

-- ---- client_roadmap ---------------------------------------------------------
drop policy if exists client_roadmap_read on client_roadmap;
drop policy if exists client_roadmap_read on client_roadmap;
create policy client_roadmap_read on client_roadmap for select using (can_access_client(client_roadmap.client_id));
drop policy if exists client_roadmap_staff_write on client_roadmap;
drop policy if exists client_roadmap_staff_write on client_roadmap;
create policy client_roadmap_staff_write on client_roadmap for all
  using (can_access_client(client_roadmap.client_id)) with check (can_access_client(client_roadmap.client_id));

-- ---- client_reports ---------------------------------------------------------
drop policy if exists client_reports_read on client_reports;
drop policy if exists client_reports_read on client_reports;
create policy client_reports_read on client_reports for select using (can_access_client(client_reports.client_id));
drop policy if exists client_reports_staff_write on client_reports;
drop policy if exists client_reports_staff_write on client_reports;
create policy client_reports_staff_write on client_reports for all
  using (is_privileged()) with check (is_privileged());

-- ---- client_files -----------------------------------------------------------
drop policy if exists client_files_read on client_files;
drop policy if exists client_files_read on client_files;
create policy client_files_read on client_files for select using (can_access_client(client_files.client_id));
drop policy if exists client_files_staff_write on client_files;
drop policy if exists client_files_staff_write on client_files;
create policy client_files_staff_write on client_files for all
  using (can_access_client(client_files.client_id)) with check (can_access_client(client_files.client_id));

-- ============================================================ vault-access.sql
-- Hill Country Consultants — Shared Vault is VA-maintained, client-visible
-- =============================================================================
-- The vault register lists which accounts the team holds access to. The
-- assigned VA/AM (or a BM/admin) maintains it; the client can VIEW it but not
-- edit it. Run AFTER strict-access.sql (it relies on can_access_client()).
--
-- SAFE TO RUN ONCE ON PRODUCTION. SQL Editor -> New query -> Run.
-- =============================================================================

-- Staff who MANAGE this client (privileged or the assigned owner) — excludes the client.
create or replace function manages_client(cid uuid) returns boolean
  language sql stable security definer set search_path = public, pg_temp as $$
  select is_privileged() or exists (
    select 1 from staff s
    where s.user_id = auth.uid() and s.active
      and s.id::text = (select assigned_to from clients c where c.id = cid)
  );
$$;

drop policy if exists vault_scope on client_vault;
drop policy if exists vault_read on client_vault;
drop policy if exists vault_staff_write on client_vault;

-- Client + team can read; only the managing team can write.
drop policy if exists vault_read on client_vault;
create policy vault_read on client_vault for select using (can_access_client(client_vault.client_id));
drop policy if exists vault_staff_write on client_vault;
create policy vault_staff_write on client_vault for all
  using (manages_client(client_vault.client_id)) with check (manages_client(client_vault.client_id));

-- ============================================================ staff-directory-read.sql
-- Hill Country Consultants — let Business Managers read the staff directory
-- =============================================================================
-- The Admin/Directory tabs need the full staff list to assign owners and teams.
-- Previously only Administrators could read all staff rows; extend that to
-- Business Managers (is_privileged). Regular staff still see only themselves;
-- account managers pick team members through a minimal id+name service read.
--
-- Run anytime after strict-access/team-model. Idempotent. SQL Editor -> Run.
-- =============================================================================

drop policy if exists staff_self_read on staff;
drop policy if exists staff_self_read on staff;
create policy staff_self_read on staff for select
  using (user_id = auth.uid() or is_privileged());

-- ============================================================ fix-leads-visibility.sql
-- Hill Country Consultants — restore lead / customer-request visibility
-- =============================================================================
-- WHY: the security hotfix (security-fixes.sql, item MA4) replaced the leads
-- row-level-security policy with a scalar-column version that only matched the
-- exact role strings 'Sales / account manager' and 'Administrator'. But the app
-- authorizes off the staff.roles[] ARRAY (a staffer can hold several roles) and
-- uses different role names — so leads became invisible on the dashboard for
-- anyone whose access comes from roles[] (including admins/managers set up that
-- way). The leads were still being saved — just not shown.
--
-- WHAT THIS DOES: redefines is_sales() to be roles[]-aware and reinstalls the
-- leads policy so customer requests are visible to Administrator, Business
-- Manager, Sales Manager, Account manager, and Sales staff — matching the app.
--
-- SAFE: idempotent, additive. Creates no tables, deletes/modifies no rows.
-- Run once in Supabase → SQL Editor → Run.
-- =============================================================================

create or replace function is_sales() returns boolean
  language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from staff s
    where s.user_id = auth.uid() and s.active
      and (
        s.roles && array['Administrator','Business Manager','Sales Manager','Account manager','Sales staff']::text[]
        or s.role in ('Administrator','Business Manager','Sales Manager','Account manager','Sales staff')
      )
  );
$$;

drop policy if exists leads_staff on leads;
drop policy if exists leads_sales on leads;
drop policy if exists leads_sales on leads;
create policy leads_sales on leads for all using (is_sales()) with check (is_sales());

-- ============================================================ security-fixes.sql
-- Hill Country Consultants — production security & data-integrity hotfix
-- =============================================================================
-- WHAT THIS DOES (applies fixes C1, C2, MA4, MA7 and the created_by fix to an
-- ALREADY-DEPLOYED database):
--   C1  Revoke public/anon/authenticated EXECUTE on create_client_after_payment
--       so only the service-role key (the Stripe webhook) can create paid
--       bookings. Stops anyone from forging "paid" bookings or overwriting
--       clients by email.
--   C2  Make is_staff() / is_admin() / my_role() SECURITY DEFINER with a pinned
--       search_path, fixing "infinite recursion detected in policy for relation
--       staff" (they are called from the staff RLS policies).
--   MA4 Tighten the leads policy so only Sales / account manager + Administrator
--       can read or write leads (matches isSalesOrAdmin in the app UI).
--   MA7 Add a unique index on bookings(stripe_payment_intent) so a retried or
--       duplicated Stripe webhook cannot create a second paid booking.
--   +   Purchased-service tasks are seeded as created_by 'staff' in "In progress"
--       (not the client default "Requested"/"Your request").
--
-- SAFE TO RUN ONCE ON PRODUCTION: every statement is idempotent and additive.
-- It does NOT create or drop any table and does NOT delete or modify any row.
-- It only replaces functions, swaps one RLS policy, revokes a grant, and adds an
-- index. Paste the whole file into Supabase -> SQL Editor -> New query -> Run.
-- =============================================================================

-- ── C2: helpers become SECURITY DEFINER (breaks the staff-policy recursion) ──
create or replace function is_staff() returns boolean
  language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from staff s where s.user_id = auth.uid() and s.active);
$$;

create or replace function is_admin() returns boolean
  language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from staff s where s.user_id = auth.uid()
                 and s.active and s.role = 'Administrator');
$$;

create or replace function my_role() returns text
  language sql stable security definer set search_path = public, pg_temp as $$
  select role from staff where user_id = auth.uid() limit 1;
$$;

-- ── MA4: leads visible to sales + admin, roles[]-aware (mirrors isSalesOrAdmin) ──
-- The app authorizes off the staff.roles[] array (a staffer can hold several
-- roles) with a scalar staff.role fallback, so the leads policy must do the same.
-- Visible to Administrator, Business Manager, Sales Manager, Account manager, and
-- Sales staff — matching isSalesOrAdmin() in the UI, so the pipeline never renders
-- empty for someone the app let onto the page. (An earlier scalar my_role() version
-- of this policy hid leads from anyone whose access came from the roles[] array.)
create or replace function is_sales() returns boolean
  language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from staff s
    where s.user_id = auth.uid() and s.active
      and (
        s.roles && array['Administrator','Business Manager','Sales Manager','Account manager','Sales staff']::text[]
        or s.role in ('Administrator','Business Manager','Sales Manager','Account manager','Sales staff')
      )
  );
$$;
drop policy if exists leads_staff on leads;
drop policy if exists leads_sales on leads;
drop policy if exists leads_sales on leads;
create policy leads_sales on leads for all using (is_sales()) with check (is_sales());

-- ── C1 + created_by fix: replace the RPC body, then lock down EXECUTE ────────
-- CREATE OR REPLACE keeps the existing privileges; the REVOKE below then removes
-- public/anon/authenticated, leaving Supabase's direct grant to service_role.
create or replace function create_client_after_payment(
  p_email text, p_business text, p_contact text, p_phone text,
  p_ref text, p_items jsonb, p_quotes jsonb, p_paid_cents int,
  p_start date, p_rep_code text default ''
) returns uuid language plpgsql security definer as $$
declare v_client uuid;
begin
  insert into clients (email, business, contact, phone, rep_code)
  values (lower(p_email), p_business, p_contact, p_phone, p_rep_code)
  on conflict (email) do update
    set business = coalesce(excluded.business, clients.business),
        contact  = coalesce(excluded.contact,  clients.contact),
        phone    = coalesce(excluded.phone,    clients.phone)
  returning id into v_client;

  insert into bookings (client_id, ref, items, quotes, paid_cents, start_date)
  values (v_client, p_ref, p_items, p_quotes, p_paid_cents, p_start);

  -- Purchased services are staff-owned and already in flight, so they land in
  -- "In progress" as created_by 'staff' (not the client's default "Requested"/
  -- "Your request"), which also surfaces them in the staff delivery queue.
  insert into client_tasks (client_id, title, service, due_date, paid, booking_ref, created_by, column_name)
  select v_client, i->>'name', i->>'svc', p_start, true, p_ref, 'staff', 'In progress'
  from jsonb_array_elements(p_items) i;

  return v_client;
end $$;

revoke execute on function create_client_after_payment(
  text, text, text, text, text, jsonb, jsonb, integer, date, text
) from public, anon, authenticated;

-- ── MA7: one booking per Stripe PaymentIntent (webhook idempotency) ──────────
-- NOTE: if this errors on a duplicate key, an earlier non-idempotent webhook
-- already wrote two bookings sharing a stripe_payment_intent; de-duplicate those
-- rows first, then re-run this statement. It creates only an index — no data is
-- touched.
create unique index if not exists bookings_stripe_pi_unique
  on bookings (stripe_payment_intent) where stripe_payment_intent is not null;

-- ============================================================ role-rename.sql
-- Hill Country Consultants — role rename: Engagement Specialist / Creative Specialist
-- =============================================================================
-- Merges "Virtual assistant" + "Account manager" + "Sales staff" into a single
-- "Engagement Specialist" title, and renames "Design specialist" to
-- "Creative Specialist". Engagement Specialists keep sales/pipeline access.
-- "Sales Manager", "Business Manager", and "Administrator" are unchanged.
--
-- Updates existing staff records (scalar role + roles[] array) and teaches
-- is_sales() the new title. Idempotent + safe to re-run. SQL Editor -> Run.
-- =============================================================================

-- 1) Scalar role column
update staff set role = 'Engagement Specialist'
  where role in ('Virtual assistant', 'Account manager', 'Sales staff');
update staff set role = 'Creative Specialist'
  where role = 'Design specialist';

-- 2) roles[] array — replace each legacy value, then de-duplicate
update staff set roles = (
  select array(select distinct v from unnest(
    array_replace(array_replace(array_replace(array_replace(
      roles, 'Virtual assistant', 'Engagement Specialist'),
             'Account manager',   'Engagement Specialist'),
             'Sales staff',        'Engagement Specialist'),
             'Design specialist',  'Creative Specialist')
  ) as v)
)
where roles && array['Virtual assistant','Account manager','Sales staff','Design specialist']::text[];

-- 3) Sales visibility now includes Engagement Specialist (legacy titles kept as a
--    safety net in case any record wasn't migrated).
create or replace function is_sales() returns boolean
  language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from staff s
    where s.user_id = auth.uid() and s.active
      and (
        s.roles && array['Administrator','Business Manager','Sales Manager','Engagement Specialist','Account manager','Sales staff']::text[]
        or s.role in ('Administrator','Business Manager','Sales Manager','Engagement Specialist','Account manager','Sales staff')
      )
  );
$$;

-- ============================================================ role-rename-2.sql
-- Hill Country Consultants — role collapse to 5 core roles
-- =============================================================================
-- Final role set: Administrator, Business Manager, Accounts Manager,
-- Engagement Specialist, Creative Specialist.
--   • Sales Manager        -> Accounts Manager
--   • Submittals / Documentation / Grants specialist -> Engagement Specialist
--   • Media / publishing   -> Creative Specialist
--   • (also folds any remaining legacy VA / Account manager / Sales staff ->
--      Engagement Specialist, and Design specialist -> Creative Specialist)
-- Idempotent + safe to re-run. SQL Editor -> Run.
-- =============================================================================

-- 1) Scalar role column
update staff set role = 'Accounts Manager'      where role = 'Sales Manager';
update staff set role = 'Engagement Specialist' where role in ('Submittals specialist','Documentation specialist','Grants specialist','Virtual assistant','Account manager','Sales staff');
update staff set role = 'Creative Specialist'   where role in ('Media / publishing','Design specialist');

-- 2) roles[] array — replace every legacy value, then de-duplicate
update staff set roles = (
  select array(select distinct v from unnest(
    array_replace(array_replace(array_replace(array_replace(array_replace(array_replace(array_replace(array_replace(array_replace(
      roles, 'Sales Manager',          'Accounts Manager'),
             'Submittals specialist',  'Engagement Specialist'),
             'Documentation specialist','Engagement Specialist'),
             'Grants specialist',      'Engagement Specialist'),
             'Virtual assistant',      'Engagement Specialist'),
             'Account manager',        'Engagement Specialist'),
             'Sales staff',            'Engagement Specialist'),
             'Media / publishing',     'Creative Specialist'),
             'Design specialist',      'Creative Specialist')
  ) as v)
)
where roles && array['Sales Manager','Submittals specialist','Documentation specialist','Grants specialist','Virtual assistant','Account manager','Sales staff','Media / publishing','Design specialist']::text[];

-- 3) is_sales() recognizes Accounts Manager (legacy titles kept as a safety net)
create or replace function is_sales() returns boolean
  language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from staff s
    where s.user_id = auth.uid() and s.active
      and (
        s.roles && array['Administrator','Business Manager','Accounts Manager','Engagement Specialist','Creative Specialist','Sales Manager','Account manager','Sales staff']::text[]
        or s.role in ('Administrator','Business Manager','Accounts Manager','Engagement Specialist','Creative Specialist','Sales Manager','Account manager','Sales staff')
      )
  );
$$;

-- ============================================================ kb-seed.sql
-- Hill Country Consultants — Knowledge base seed (Team playbook)
-- =============================================================================
-- Publishes the staff playbook into the portal Knowledge base so every employee
-- can read it in-app. Idempotent: each article inserts only if its title isn't
-- already present, so re-running is safe. Edit articles in-app after seeding.
-- Bodies are plain text (the KB renders whitespace as-is).
--
-- Run in the Supabase SQL Editor.
-- =============================================================================

insert into kb_articles (title, category, body, tags)
select 'Roles & access — who sees and does what', 'Team playbook', $body$Roles are assigned in Directory → Roles; an employee can hold several at once.

- Administrator: everything — Finance, Vendors, Audit log, Payroll, plus all manager and staff surfaces. Final approval on money, clients, hires, policy.
- Business Manager: Directory, Billing & AR, Renewals, Contracts, Capacity, Clients, Daily/Delivery/Reports, Sales console. Not the Admin-only Finance/Vendors/Audit/Payroll.
- Sales Manager: full Directory (roster + hiring pipeline + staff management) and the Sales console.
- Account manager / Sales staff: sales tabs, Clients, Daily, Delivery, Reports for their accounts.
- Delivery specialists (VA, Submittals, Docs, Design, Media, Grants): their client work, Knowledge base, Messages, My profile, Timesheet if hourly.
- Every employee: Dashboard, Knowledge base, Messages, My profile (Time off + IT/Security acknowledgment).

A staffer sees a client only if they are privileged, own it, or are on its team. Clients see only their own data.$body$, array['roles','access','permissions']
where not exists (select 1 from kb_articles where title = 'Roles & access — who sees and does what');

insert into kb_articles (title, category, body, tags)
select 'Hiring pipeline — application to employee', 'Team playbook', $body$Applications from the public Careers page land in Directory → Hiring pipeline as cards, grouped by stage: New → Reviewing → Interview → Offer → Hired / Declined.

On each card: rate 1–5, add reviewer notes, move stage (New/Reviewing/Offer), Set up interview (emails the applicant the scheduling link), Decline (emails a courteous note; résumé kept 6 months), or Hire → create employee (creates the staff profile pre-filled, sends welcome/set-password email — pick the role first).

Access: Administrator, Business Manager, Sales Manager.

To post a new role, add it to the Careers content; it appears with its own application form automatically.$body$, array['hiring','careers','applicants']
where not exists (select 1 from kb_articles where title = 'Hiring pipeline — application to employee');

insert into kb_articles (title, category, body, tags)
select 'Client onboarding — the first 30 days', 'Team playbook', $body$When a client signs (paid booking) or is added by hand, a standard onboarding checklist is auto-seeded (Kickoff, Access & credentials, First deliverables, Ongoing cadence). It shows in the client portal and the staff Checklists tab immediately.

The client gets a welcome email outlining the 30-day sequence, plus automated day-3 and day-14 check-ins (once each; active only when CRON_SECRET is configured).

Staff Onboarding tab (per client): kickoff call, 30-day roadmap, credentials collected, first tasks. The client's roadmap lives in their portal; set each phase's status from the Onboarding tab.

Every account: daily work log, Friday weekly report, shared task board kept current.$body$, array['onboarding','clients','checklist']
where not exists (select 1 from kb_articles where title = 'Client onboarding — the first 30 days');

insert into kb_articles (title, category, body, tags)
select 'Time off (PTO) — requesting and approving', 'Team playbook', $body$Employees: My profile → Time off. Submit a request (PTO / Sick / Unpaid, start/end date, optional note). Track status there; cancel while still pending.

Managers (Admin / Business Manager): the Capacity page shows a "Time-off requests awaiting your decision" panel with Approve / Deny.

Approved time off in the current week reduces that person's effective weekly target — the Capacity table's "Off this wk" column adjusts utilization and headroom automatically.$body$, array['pto','time off','capacity']
where not exists (select 1 from kb_articles where title = 'Time off (PTO) — requesting and approving');

insert into kb_articles (title, category, body, tags)
select 'Billing & AR — invoices, plans, collections', 'Team playbook', $body$Set a client's plan (Foundation / Momentum / Enterprise) on the client hub — it drives MRR and their monthly allotment.

Plan invoices: draft the month's from Billing & AR (one per plan client per month); move draft → sent → paid, or void. One-off invoices cover overage or project work. Per-client allotment tracks automatically with manual adjustments available.

Finance (Admin): MRR/ARR, MRR by tier, billed-recurring trend, AR outstanding, active clients, expenses vs budget, net profit, and CSV exports (clients, invoices/AR, expenses).

Chase overdue invoices early; the five-business-day grace period applies.$body$, array['billing','invoices','finance']
where not exists (select 1 from kb_articles where title = 'Billing & AR — invoices, plans, collections');

insert into kb_articles (title, category, body, tags)
select 'Capacity & utilization', 'Team playbook', $body$Two reads per person: Logged this week (actual work-log hours vs their weekly target) and Committed VA/wk (the recurring VA-hour allotment of the accounts they own or sit on).

Utilization turns amber at 85%, red at 100%+. Approved time off lowers the effective target for the week. Set each person's weekly target inline. Admin / Business Manager.$body$, array['capacity','utilization']
where not exists (select 1 from kb_articles where title = 'Capacity & utilization');

insert into kb_articles (title, category, body, tags)
select 'Admin runbook — recurring tasks & config', 'Team playbook', $body$Monthly: draft plan invoices; review Finance (MRR, expenses vs budget, net profit); log expenses.
Weekly: confirm Friday reports went out; review Capacity for overload; work the hiring pipeline.
As needed: approve/deny time off; approve proposals/exceptions; review contracts; assign onboarding docs.

Employee documents / NDA: upload reusable docs in Directory → Internal document library, then assign to employees or a whole role to e-sign (DocuSign). The IT/Security acknowledgment is self-served on each profile; Directory shows who has signed.

Audit log (Admin) records create/update/delete/sign actions.

Vercel config: NEXT_PUBLIC_SITE_URL (canonical URL); CRON_SECRET (enables the day-3/day-14 onboarding drip); Stripe keys + webhook secret; Resend EMAIL_FROM; Supabase URL + service key; DocuSign creds.

Migrations live in supabase/*.sql, run by hand in the Supabase SQL Editor. Before go-live, run verify-rls-access.sql and confirm every client-scoped table reads "scoped."$body$, array['admin','runbook','config']
where not exists (select 1 from kb_articles where title = 'Admin runbook — recurring tasks & config');

-- ============================================================ preferred-vendors-seed.sql
-- Hill Country Consultants — seed the first three preferred vendors
-- =============================================================================
-- Adds Redd Ladys Chronicles Publishing & Production, TSD Events, and
-- Carnetta Dansby (Financial Analyst). Descriptions are starter copy — edit
-- them, add a website/contact, and upload a logo from the Preferred vendors tab.
-- Safe to re-run: each insert only fires if a vendor with that name isn't present.
-- Run after preferred-vendors.sql and preferred-vendors-2.sql.
-- =============================================================================

insert into preferred_vendors (name, category, services, blurb, is_public, active)
select 'Redd Ladys Chronicles Publishing & Production',
       'Publishing & Production',
       array['Publishing & Production','Photography & Media'],
       'Our publishing and production partner — manuscript development, book production, and launch and media support for authors and brands.',
       true, true
where not exists (select 1 from preferred_vendors where name = 'Redd Ladys Chronicles Publishing & Production');

insert into preferred_vendors (name, category, services, blurb, is_public, active)
select 'TSD Events',
       'Events',
       array['Events'],
       'Full-service event planning and coordination — from concept and logistics to on-site management.',
       true, true
where not exists (select 1 from preferred_vendors where name = 'TSD Events');

insert into preferred_vendors (name, category, services, blurb, is_public, active)
select 'Carnetta Dansby — Financial Analyst',
       'Financial & Accounting',
       array['Financial & Accounting'],
       'Financial analysis and advisory — modeling, planning, and reporting support to keep your numbers clear and decision-ready.',
       true, true
where not exists (select 1 from preferred_vendors where name = 'Carnetta Dansby — Financial Analyst');

-- Authoritative access helpers asserted last (team-aware).
create or replace function can_access_client(cid uuid) returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select is_privileged() or exists (select 1 from clients c where c.id = cid and c.user_id = auth.uid())
    or exists (select 1 from staff s where s.user_id = auth.uid() and s.active and s.id::text = (select assigned_to from clients c2 where c2.id = cid))
    or exists (select 1 from client_assignments a join staff s on s.id = a.staff_id where a.client_id = cid and s.user_id = auth.uid() and s.active); $$;
create or replace function manages_client(cid uuid) returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select is_privileged() or exists (select 1 from staff s where s.user_id = auth.uid() and s.active and s.id::text = (select assigned_to from clients c where c.id = cid)); $$;
