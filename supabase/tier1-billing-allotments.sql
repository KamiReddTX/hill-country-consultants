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
create policy allot_adj_sales on client_allotment_adjustments for all using (is_sales()) with check (is_sales());
