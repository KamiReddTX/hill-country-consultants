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
create policy leads_sales on leads for all using (is_sales()) with check (is_sales());
