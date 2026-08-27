-- Hill Country Consultants — role rename: Engagement Specialist / Creative Specialist
-- =============================================================================
-- Merges "Virtual assistant" + "Account manager" + "Sales staff" into a single
-- "Engagement Specialist" title, and renames "Design specialist" to
-- "Creative Specialist". Engagement Specialists keep sales/pipeline access.
-- "Sales Manager", "Business Manager", and "Administrator" are unchanged.
--
-- Updates existing staff records (scalar role + roles[] array) and teaches
-- is_sales() the new title. Idempotent + safe to re-run. SQL Editor -> Run.
-- =============================================================================

-- 1) Scalar role column
update staff set role = 'Engagement Specialist'
  where role in ('Virtual assistant', 'Account manager', 'Sales staff');
update staff set role = 'Creative Specialist'
  where role = 'Design specialist';

-- 2) roles[] array — replace each legacy value, then de-duplicate
update staff set roles = (
  select array(select distinct v from unnest(
    array_replace(array_replace(array_replace(array_replace(
      roles, 'Virtual assistant', 'Engagement Specialist'),
             'Account manager',   'Engagement Specialist'),
             'Sales staff',        'Engagement Specialist'),
             'Design specialist',  'Creative Specialist')
  ) as v)
)
where roles && array['Virtual assistant','Account manager','Sales staff','Design specialist']::text[];

-- 3) Sales visibility now includes Engagement Specialist (legacy titles kept as a
--    safety net in case any record wasn't migrated).
create or replace function is_sales() returns boolean
  language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from staff s
    where s.user_id = auth.uid() and s.active
      and (
        s.roles && array['Administrator','Business Manager','Sales Manager','Engagement Specialist','Account manager','Sales staff']::text[]
        or s.role in ('Administrator','Business Manager','Sales Manager','Engagement Specialist','Account manager','Sales staff')
      )
  );
$$;
