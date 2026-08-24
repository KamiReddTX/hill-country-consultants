-- ============================================================================
-- ⛔ DISABLED — DO NOT RUN.  (setup-all.sql)
-- Superseded "run everything" monolith. It re-creates tables and re-applies
-- OLDER, WEAKER row-level-security policies. Production is already set up with
-- the current, stricter policies (strict-access.sql). Running this could
-- downgrade security. The abort below stops the whole script if pasted into the
-- SQL editor. For an intentional from-scratch rebuild: read supabase/README.md
-- and delete ONLY this DO $$ ... $$ block first.
-- ============================================================================
DO $$ BEGIN
  RAISE EXCEPTION 'DISABLED: setup-all.sql is superseded and must not be run. See supabase/README.md.';
END $$;

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
  role         text not null default 'Virtual assistant',
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
create policy staff_self_read on staff for select
  using (user_id = auth.uid() or is_admin());
create policy staff_admin_write on staff for all
  using (is_admin()) with check (is_admin());

-- clients: a client sees only their own row; staff see all; admins edit
create policy clients_own_read on clients for select
  using (user_id = auth.uid() or is_staff());
create policy clients_admin_write on clients for all
  using (is_admin()) with check (is_admin());

-- everything hanging off a client follows the same test
create policy bookings_scope on bookings for select
  using (exists (select 1 from clients c where c.id = bookings.client_id
                 and (c.user_id = auth.uid() or is_staff())));
create policy bookings_staff_write on bookings for all
  using (is_staff()) with check (is_staff());

create policy tasks_scope on client_tasks for select
  using (exists (select 1 from clients c where c.id = client_tasks.client_id
                 and (c.user_id = auth.uid() or is_staff())));
create policy tasks_write on client_tasks for insert
  with check (exists (select 1 from clients c where c.id = client_tasks.client_id
                      and (c.user_id = auth.uid() or is_staff())));
create policy tasks_update on client_tasks for update using (is_staff());

create policy notes_scope on client_notes for select
  using (exists (select 1 from clients c where c.id = client_notes.client_id
                 and (c.user_id = auth.uid() or is_staff())));
create policy notes_write on client_notes for insert
  with check (exists (select 1 from clients c where c.id = client_notes.client_id
                      and (c.user_id = auth.uid() or is_staff())));

-- Tradeoff: client_vault stays is_staff() (not sales/admin) so virtual assistants
-- can read the credential register to deliver work; any active staff member sees it.
create policy vault_scope on client_vault for all
  using (exists (select 1 from clients c where c.id = client_vault.client_id
                 and (c.user_id = auth.uid() or is_staff())))
  with check (exists (select 1 from clients c where c.id = client_vault.client_id
                      and (c.user_id = auth.uid() or is_staff())));

create policy worklog_scope on client_work_log for select
  using (exists (select 1 from clients c where c.id = client_work_log.client_id
                 and (c.user_id = auth.uid() or is_staff())));
create policy worklog_staff_write on client_work_log for all
  using (is_staff()) with check (is_staff());

create policy deliverables_scope on client_deliverables for select
  using (exists (select 1 from clients c where c.id = client_deliverables.client_id
                 and (c.user_id = auth.uid() or is_staff())));
create policy deliverables_staff_write on client_deliverables for all
  using (is_staff()) with check (is_staff());

-- sales: only sales reps and admins may see or touch leads.
-- Mirrors isSalesOrAdmin() in the app UI (lib/staff.ts, lib/auth.ts).
create policy leads_sales on leads for all
  using (my_role() in ('Sales / account manager', 'Administrator'))
  with check (my_role() in ('Sales / account manager', 'Administrator'));

-- punches: an employee sees and closes only their own; admins see and close all
create policy punches_own on punches for select
  using (is_admin() or staff_id in (select id from staff where user_id = auth.uid()));
create policy punches_insert on punches for insert
  with check (staff_id in (select id from staff where user_id = auth.uid()));
create policy punches_update on punches for update
  using (is_admin() or staff_id in (select id from staff where user_id = auth.uid()));

create policy approvals_read on timesheet_approvals for select using (is_staff());
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

-- ═══════════════════════════ consent migration (0001) ═══════════════════════════
-- Additive migration — run AFTER schema.sql. Keeps schema.sql itself unchanged.
-- Stores the dispute evidence required for "all sales final": the consent
-- timestamp, the payer's IP, and an itemised snapshot of what was purchased.
alter table bookings
  add column if not exists consent_at   timestamptz,
  add column if not exists consent_ip   text,
  add column if not exists consent_terms boolean default false,
  add column if not exists scope_snapshot jsonb;

comment on column bookings.scope_snapshot is
  'Itemised scope shown at checkout — evidence for chargeback defense.';

-- ═══════════════════════════ make yourself the administrator ═══════════════════
-- Run this AFTER you create your login in Authentication → Users → Add user
-- (use admin@hillcountryconsultants.com). Change the name if you like.
insert into staff (user_id, email, name, role, hourly)
select id, email, 'Owner', 'Administrator', false
from auth.users
where email = 'admin@hillcountryconsultants.com'
on conflict (email) do nothing;

-- ═══════════════════════════ link client to user (0002) ═════════════════════════
-- Additive migration — run after schema.sql. Lets a signed-in client "claim"
-- their own client row on first login by matching their email. SECURITY DEFINER
-- so it can set user_id despite RLS; it only ever links the caller's own email.
create or replace function link_client_to_user() returns void
  language plpgsql security definer as $$
begin
  update clients
    set user_id = auth.uid()
  where user_id is null
    and lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''));
end $$;

grant execute on function link_client_to_user() to authenticated;

-- ═══════════════════════════ lead → client on won (0003) ═══════════════════════
-- Additive migration — run after schema.sql. Lets a sales rep (or admin) convert
-- a "Closed won" lead into a client. SECURITY DEFINER so the insert clears the
-- admin-only clients write policy, but it verifies the caller is staff first and
-- stamps the client with the lead's rep_code (attribution) + retention start.
create or replace function create_client_from_lead(p_lead uuid) returns uuid
  language plpgsql security definer as $$
declare v_client uuid; v_email text; v_business text; v_contact text; v_phone text; v_rep text;
begin
  if not is_staff() then raise exception 'Only staff can convert a lead.'; end if;
  select lower(coalesce(email,'')), business, contact, phone, coalesce(rep_code,'')
    into v_email, v_business, v_contact, v_phone, v_rep
  from leads where id = p_lead;
  if v_email is null or v_email = '' then raise exception 'Lead needs an email before it can be won.'; end if;

  insert into clients (email, business, contact, phone, rep_code, retained_since, status)
  values (v_email, v_business, v_contact, v_phone, v_rep, current_date, 'In review')
  on conflict (email) do update
    set business = coalesce(excluded.business, clients.business),
        rep_code = coalesce(nullif(excluded.rep_code,''), clients.rep_code)
  returning id into v_client;

  update leads set stage = 'Closed won' where id = p_lead;
  return v_client;
end $$;

grant execute on function create_client_from_lead(uuid) to authenticated;

-- ═══════════════════════════ link staff to user (0004) ═════════════════════════
-- Additive migration — run after schema.sql. Links a signed-in staff member to
-- their pre-created staff row by email on first login (admins create the row;
-- the person is invited via Supabase Auth and claims it here).
create or replace function link_staff_to_user() returns void
  language plpgsql security definer as $$
begin
  update staff
    set user_id = auth.uid()
  where user_id is null
    and lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''));
end $$;

grant execute on function link_staff_to_user() to authenticated;
