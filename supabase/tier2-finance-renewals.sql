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
create policy expenses_admin on expenses for all using (is_admin()) with check (is_admin());

-- 3) Monthly budget per category (steady; one row per category) -----------------
create table if not exists expense_budgets (
  category      text primary key,
  monthly_cents integer not null default 0,
  created_at    timestamptz not null default now()
);
alter table expense_budgets enable row level security;
drop policy if exists expense_budgets_admin on expense_budgets;
create policy expense_budgets_admin on expense_budgets for all using (is_admin()) with check (is_admin());

-- 4) Optional manual renewal-date override on clients ---------------------------
-- When null, the app uses retained_since + 12 months. Set it to override.
alter table clients add column if not exists renewal_date date;
