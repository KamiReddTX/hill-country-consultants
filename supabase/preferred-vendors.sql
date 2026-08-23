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
create policy preferred_vendors_read on preferred_vendors for select
  using ((is_public and active) or is_staff());

-- Assignments: the owning client, staff-with-access, and managers can read.
drop policy if exists cpv_read on client_preferred_vendors;
create policy cpv_read on client_preferred_vendors for select
  using (can_access_client(client_id)
         or client_id in (select id from clients where user_id = auth.uid()));

-- Referrals: the employee who filed it and any privileged manager can read.
drop policy if exists vendor_referrals_read on vendor_referrals;
create policy vendor_referrals_read on vendor_referrals for select
  using (is_privileged()
         or referred_by in (select id from staff where user_id = auth.uid()));

-- All writes go through server actions using the service role (guarded in code),
-- so no INSERT/UPDATE/DELETE policies are granted to anon/authenticated here.
