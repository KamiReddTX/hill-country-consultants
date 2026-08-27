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
