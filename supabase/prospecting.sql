-- Hill Country Consultants — National Prospecting Module (Build Order Step 1)
-- =============================================================================
-- Schema + indexes + RLS + permission mapping for the Salesgenie-style national
-- prospecting module. Additive: creates only new prospect_/list/metering tables
-- and drops the confirmed-null stray staff.full_name column. Existing 48 tables
-- are untouched. Identity always resolves via staff.user_id (never auth.uid()
-- against staff.id). Idempotent + safe to re-run.  SQL Editor -> Run.
-- =============================================================================

create extension if not exists pgcrypto;
create extension if not exists cube;
create extension if not exists earthdistance;   -- ll_to_earth() for radius search

-- 0) Cleanup: drop the stray duplicate column (verified 0 non-null rows).
alter table staff drop column if exists full_name;

-- ───────────────────────────── Permission mapping
-- Maps existing free-text role titles to capabilities, so new titles are added
-- with a row here instead of a migration.
create table if not exists role_permissions (
  role_title            text primary key,
  can_search            boolean not null default false,
  can_reveal            boolean not null default false,
  can_export            boolean not null default false,
  monthly_credit_default int    not null default 0,
  can_admin             boolean not null default false
);
insert into role_permissions (role_title, can_search, can_reveal, can_export, monthly_credit_default, can_admin) values
  ('Administrator',         true, true, true, 2000, true),
  ('Engagement Specialist', true, true, true,  500, false)
on conflict (role_title) do update set
  can_search = excluded.can_search, can_reveal = excluded.can_reveal,
  can_export = excluded.can_export, monthly_credit_default = excluded.monthly_credit_default,
  can_admin = excluded.can_admin;

-- ───────────────────────────── Identity + capability helpers (security definer)
-- The staff row for the signed-in user (id, NOT auth.uid()).
create or replace function current_staff_id() returns uuid
  language sql stable security definer set search_path = public, pg_temp as $$
  select id from staff where user_id = auth.uid() and active limit 1;
$$;

-- Does the signed-in staff member hold a capability? Checks role + roles[] against
-- role_permissions. capability in ('search','reveal','export','admin').
create or replace function staff_can(capability text) returns boolean
  language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from staff s
    join role_permissions rp
      on rp.role_title = s.role or rp.role_title = any(coalesce(s.roles, array[]::text[]))
    where s.user_id = auth.uid() and s.active
      and case capability
        when 'search' then rp.can_search
        when 'reveal' then rp.can_reveal
        when 'export' then rp.can_export
        when 'admin'  then rp.can_admin
        else false end
  );
$$;

-- Is the signed-in staff member the manager of target_staff?
create or replace function manages(target_staff uuid) returns boolean
  language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from staff me
    where me.user_id = auth.uid() and me.active
      and exists (select 1 from staff t where t.id = target_staff and t.manager_id = me.id)
  );
$$;

-- Are the signed-in staff member and target on the same (non-null) team?
create or replace function same_team_as(target_staff uuid) returns boolean
  language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from staff me join staff t on t.id = target_staff
    where me.user_id = auth.uid() and me.active and me.team is not null and me.team = t.team
  );
$$;

-- ───────────────────────────── Base layer: companies (bulk, stored)
create table if not exists prospect_accounts (
  id               uuid primary key default gen_random_uuid(),
  legal_name       text not null,
  dba_name         text,
  domain           text unique,
  naics_code       text,
  industry         text,
  street           text,
  city             text,
  state            text,
  county           text,
  zip              text,
  latitude         numeric(9,6),
  longitude        numeric(9,6),
  employee_est     int,
  revenue_est      numeric,
  years_in_business int,
  location_type    text,           -- 'HQ' | 'branch'
  formation_date   date,
  vendor           text,
  vendor_record_id text,
  source_url       text,
  icp_score        int,
  status           text not null default 'new',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create unique index if not exists prospect_accounts_vendor_idx on prospect_accounts (vendor, vendor_record_id) where vendor_record_id is not null;
create index if not exists prospect_accounts_state_county_idx on prospect_accounts (state, county);
create index if not exists prospect_accounts_naics_idx on prospect_accounts (naics_code);
create index if not exists prospect_accounts_score_idx on prospect_accounts (status, icp_score desc);
create index if not exists prospect_accounts_geo_idx on prospect_accounts using gist (ll_to_earth(latitude, longitude))
  where latitude is not null and longitude is not null;

-- keep updated_at fresh
create or replace function prospect_touch_updated_at() returns trigger
  language plpgsql as $$ begin new.updated_at = now(); return new; end $$;
drop trigger if exists prospect_accounts_touch on prospect_accounts;
create trigger prospect_accounts_touch before update on prospect_accounts
  for each row execute function prospect_touch_updated_at();

-- ───────────────────────────── People (contact fields; revealed on demand)
create table if not exists prospect_contacts (
  id             uuid primary key default gen_random_uuid(),
  account_id     uuid references prospect_accounts(id) on delete cascade,
  first_name     text,
  last_name      text,
  title          text,
  seniority      text,
  email          text,
  email_status   text not null default 'unverified',
  phone_direct   text,
  phone_mobile   text,
  linkedin_url   text,
  is_primary     boolean,
  do_not_contact boolean not null default false,
  revealed_at    timestamptz,
  created_at     timestamptz not null default now()
);
create unique index if not exists prospect_contacts_email_idx on prospect_contacts (lower(email)) where email is not null;
create index if not exists prospect_contacts_account_idx on prospect_contacts (account_id);

-- ───────────────────────────── Timing signals
create table if not exists prospect_signals (
  id           uuid primary key default gen_random_uuid(),
  account_id   uuid references prospect_accounts(id) on delete cascade,
  signal_type  text,
  summary      text,
  evidence_url text,
  observed_at  date,
  strength     int check (strength between 1 and 5),
  created_at   timestamptz not null default now()
);
create index if not exists prospect_signals_account_idx on prospect_signals (account_id);

-- ───────────────────────────── Saved searches + lists
create table if not exists saved_searches (
  id           uuid primary key default gen_random_uuid(),
  staff_id     uuid not null references staff(id) on delete cascade,
  name         text,
  filters      jsonb not null default '{}'::jsonb,
  shared_team  boolean not null default false,
  result_count int,
  last_run_at  timestamptz,
  created_at   timestamptz not null default now()
);
create index if not exists saved_searches_staff_idx on saved_searches (staff_id);

create table if not exists lead_lists (
  id           uuid primary key default gen_random_uuid(),
  staff_id     uuid not null references staff(id) on delete cascade,
  name         text,
  shared_team  boolean not null default false,
  created_at   timestamptz not null default now()
);
create index if not exists lead_lists_staff_idx on lead_lists (staff_id);

create table if not exists lead_list_members (
  id         uuid primary key default gen_random_uuid(),
  list_id    uuid not null references lead_lists(id) on delete cascade,
  account_id uuid references prospect_accounts(id) on delete cascade,
  contact_id uuid references prospect_contacts(id) on delete set null,
  added_at   timestamptz not null default now()
);
create unique index if not exists lead_list_members_contact_idx on lead_list_members (list_id, contact_id) where contact_id is not null;
create index if not exists lead_list_members_list_idx on lead_list_members (list_id);

-- ───────────────────────────── Metering: reveals + credits + exports
create table if not exists reveals (
  id          uuid primary key default gen_random_uuid(),
  staff_id    uuid not null references staff(id),
  contact_id  uuid not null references prospect_contacts(id) on delete cascade,
  field       text not null check (field in ('email','phone_direct','phone_mobile')),
  vendor      text,
  vendor_cost numeric(8,4),
  credits_used int not null default 1,
  cache_hit   boolean not null default false,
  revealed_at timestamptz not null default now()
);
create index if not exists reveals_staff_idx on reveals (staff_id, revealed_at desc);
create index if not exists reveals_contact_field_idx on reveals (contact_id, field);

create table if not exists credit_allowance (
  id           uuid primary key default gen_random_uuid(),
  staff_id     uuid not null references staff(id) on delete cascade,
  period_month date not null,
  credits      int not null default 500,
  unique (staff_id, period_month)
);

create table if not exists exports (
  id          uuid primary key default gen_random_uuid(),
  staff_id    uuid not null references staff(id),
  list_id     uuid references lead_lists(id) on delete set null,
  row_count   int,
  fields      text[],
  file_format text,
  ip_address  inet,
  exported_at timestamptz not null default now()
);
create index if not exists exports_staff_idx on exports (staff_id, exported_at desc);

-- ───────────────────────────── Compliance suppression
create table if not exists phone_suppression (
  phone       text primary key,
  reason      text check (reason in ('national_dnc','internal_dnc','state_dnc','wireless','litigator')),
  scrubbed_at timestamptz not null default now()
);
create table if not exists email_suppression (
  id       uuid primary key default gen_random_uuid(),
  email    text,
  domain   text,
  reason   text check (reason in ('unsubscribed','complained','bounced','client','competitor')),
  added_at timestamptz not null default now()
);
create unique index if not exists email_suppression_email_idx on email_suppression (lower(email)) where email is not null;
create unique index if not exists email_suppression_domain_idx on email_suppression (lower(domain)) where domain is not null;

-- ═════════════════════════════ Row-Level Security ═════════════════════════════
-- Enable RLS on every new table.
alter table role_permissions   enable row level security;
alter table prospect_accounts  enable row level security;
alter table prospect_contacts  enable row level security;
alter table prospect_signals   enable row level security;
alter table saved_searches     enable row level security;
alter table lead_lists         enable row level security;
alter table lead_list_members  enable row level security;
alter table reveals            enable row level security;
alter table credit_allowance   enable row level security;
alter table exports            enable row level security;
alter table phone_suppression  enable row level security;
alter table email_suppression  enable row level security;

-- role_permissions: any active staff may read; only admins write.
drop policy if exists role_permissions_read on role_permissions;
create policy role_permissions_read on role_permissions for select using (current_staff_id() is not null);
drop policy if exists role_permissions_admin on role_permissions;
create policy role_permissions_admin on role_permissions for all using (staff_can('admin')) with check (staff_can('admin'));

-- Base layer (accounts / contacts / signals): readable by can_search staff;
-- writable only by service role (bypasses RLS) and admins.
drop policy if exists prospect_accounts_read on prospect_accounts;
create policy prospect_accounts_read on prospect_accounts for select using (staff_can('search'));
drop policy if exists prospect_accounts_admin on prospect_accounts;
create policy prospect_accounts_admin on prospect_accounts for all using (staff_can('admin')) with check (staff_can('admin'));

drop policy if exists prospect_contacts_read on prospect_contacts;
create policy prospect_contacts_read on prospect_contacts for select using (staff_can('search'));
drop policy if exists prospect_contacts_admin on prospect_contacts;
create policy prospect_contacts_admin on prospect_contacts for all using (staff_can('admin')) with check (staff_can('admin'));

drop policy if exists prospect_signals_read on prospect_signals;
create policy prospect_signals_read on prospect_signals for select using (staff_can('search'));
drop policy if exists prospect_signals_admin on prospect_signals;
create policy prospect_signals_admin on prospect_signals for all using (staff_can('admin')) with check (staff_can('admin'));

-- saved_searches / lead_lists: own + team-shared + managed + admin.
drop policy if exists saved_searches_rw on saved_searches;
create policy saved_searches_rw on saved_searches for all
  using (staff_id = current_staff_id() or (shared_team and same_team_as(staff_id)) or manages(staff_id) or staff_can('admin'))
  with check (staff_id = current_staff_id() or manages(staff_id) or staff_can('admin'));

drop policy if exists lead_lists_rw on lead_lists;
create policy lead_lists_rw on lead_lists for all
  using (staff_id = current_staff_id() or (shared_team and same_team_as(staff_id)) or manages(staff_id) or staff_can('admin'))
  with check (staff_id = current_staff_id() or manages(staff_id) or staff_can('admin'));

-- lead_list_members: visible/editable if you can see the parent list.
drop policy if exists lead_list_members_rw on lead_list_members;
create policy lead_list_members_rw on lead_list_members for all
  using (exists (select 1 from lead_lists l where l.id = list_id
      and (l.staff_id = current_staff_id() or (l.shared_team and same_team_as(l.staff_id)) or manages(l.staff_id) or staff_can('admin'))))
  with check (exists (select 1 from lead_lists l where l.id = list_id
      and (l.staff_id = current_staff_id() or manages(l.staff_id) or staff_can('admin'))));

-- reveals / exports: select for owner, manager, admin. Insert is server-side (service role).
drop policy if exists reveals_read on reveals;
create policy reveals_read on reveals for select
  using (staff_id = current_staff_id() or manages(staff_id) or staff_can('admin'));

drop policy if exists exports_read on exports;
create policy exports_read on exports for select
  using (staff_id = current_staff_id() or manages(staff_id) or staff_can('admin'));

-- credit_allowance: readable by owner/manager/admin; writable by admin only.
drop policy if exists credit_allowance_read on credit_allowance;
create policy credit_allowance_read on credit_allowance for select
  using (staff_id = current_staff_id() or manages(staff_id) or staff_can('admin'));
drop policy if exists credit_allowance_admin on credit_allowance;
create policy credit_allowance_admin on credit_allowance for all using (staff_can('admin')) with check (staff_can('admin'));

-- Suppression lists: admin-managed. The reveal/export path reads them via the
-- service role (bypasses RLS), so reps never query these directly.
drop policy if exists phone_suppression_admin on phone_suppression;
create policy phone_suppression_admin on phone_suppression for all using (staff_can('admin')) with check (staff_can('admin'));
drop policy if exists email_suppression_admin on email_suppression;
create policy email_suppression_admin on email_suppression for all using (staff_can('admin')) with check (staff_can('admin'));
