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
create policy leads_sales on leads for all using (is_sales()) with check (is_sales());
