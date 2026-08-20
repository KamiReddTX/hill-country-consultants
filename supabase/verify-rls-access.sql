-- Hill Country Consultants — RLS access verification (READ-ONLY, single result)
-- =============================================================================
-- One question: is per-client access properly SCOPED (owner / team / privileged
-- / the client), or wide open (every staffer sees every client)? Read-only.
--
-- Returns ONE result grid (Supabase shows only the last query's output, so this
-- is a single UNION query). Rows are ordered: overall checks first, then each
-- table. Column `verdict` is what to read.
--
-- HOW TO RUN:  Supabase → SQL Editor → New query → paste all → Run.
-- =============================================================================
with pol as (
  select tablename, policyname, cmd, coalesce(qual, with_check, '') as pred
  from pg_policies where schemaname = 'public'
),
cac as (select to_regprocedure('can_access_client(uuid)') as oid)

-- A) can_access_client function
select 1 as sort, 'FUNCTION' as area, 'can_access_client' as object,
  case
    when (select oid from cac) is null then 'MISSING — strict access NOT installed'
    when pg_get_functiondef((select oid from cac)) ilike '%client_assignments%' then 'GOOD — scoped, team-aware'
    else 'WEAK — owner-only (no team check)'
  end as verdict

union all
-- B) clients read policy
select 2, 'CLIENTS', p.policyname || ' (' || p.cmd || ')',
  case when p.pred ilike '%can_access_client%' then 'GOOD — scoped'
       when p.pred ilike '%is_staff%' then 'OPEN — all staff see all clients'
       else 'CUSTOM — review' end
from pol p
where p.tablename = 'clients' and p.cmd in ('SELECT','ALL')

union all
-- C) per-client + sensitive tables
select 3, upper(p.tablename), p.policyname || ' (' || p.cmd || ')',
  case
    when p.pred ilike '%can_access_client%' then 'scoped'
    when p.pred ilike '%is_staff%' then 'OPEN (is_staff) — review'
    when p.pred ilike '%is_privileged%' or p.pred ilike '%is_admin%' or p.pred ilike '%is_biller%' then 'privileged-only'
    else 'other'
  end
from pol p
where p.tablename in (
  'client_tasks','client_notes','client_vault','client_work_log','client_deliverables',
  'client_task_files','bookings','client_assignments','invoices','contracts',
  'expenses','vendors','audit_log','kb_articles'
)

union all
-- D) RLS enabled flags
select 4, 'RLS ON?', c.relname,
  case when c.relrowsecurity then 'true' else 'FALSE — RLS OFF!' end
from pg_class c
where c.relnamespace = 'public'::regnamespace
  and c.relname in ('clients','client_tasks','client_notes','client_vault','client_work_log',
                    'invoices','contracts','expenses','vendors','audit_log','kb_articles')

order by sort, area, object;

-- =============================================================================
-- WHAT GOOD LOOKS LIKE
--   FUNCTION  can_access_client       -> GOOD — scoped, team-aware
--   CLIENTS   <policy> (SELECT/ALL)    -> GOOD — scoped
--   client_* / bookings rows          -> scoped
--   invoices/contracts/expenses/
--     vendors/audit_log rows          -> privileged-only
--   kb_articles read row              -> other  (all staff read; intended)
--   RLS ON? rows                      -> true
--
-- IF YOU SEE 'OPEN' or 'MISSING' or 'FALSE — RLS OFF':
--   Run once, in order, then re-run this file:
--     supabase/strict-access.sql   then   supabase/team-model.sql
--   Both are safe/idempotent (policy predicates only; no data changes).
-- =============================================================================
