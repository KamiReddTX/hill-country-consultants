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
