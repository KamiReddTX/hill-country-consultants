-- Hill Country Consultants — authoritative role helpers (roles[] aware)
-- =============================================================================
-- The app authorizes off the staff.roles[] array (a staffer can hold several
-- roles), but some earlier migrations defined is_admin()/is_privileged() against
-- the legacy scalar staff.role column only. That means editing someone's roles
-- in the UI could leave RLS out of sync with what the app shows.
--
-- This migration is the LAST word: it (re)defines both helpers to check the
-- roles[] array first, with the scalar column as a fallback, so the database and
-- the app always agree. Run anytime after the other migrations. Idempotent.
-- SQL Editor -> Run.
-- =============================================================================

create or replace function is_admin() returns boolean
  language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from staff s
    where s.user_id = auth.uid() and s.active
      and ('Administrator' = any(s.roles) or s.role = 'Administrator')
  );
$$;

create or replace function is_privileged() returns boolean
  language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from staff s
    where s.user_id = auth.uid() and s.active
      and ('Administrator' = any(s.roles) or 'Business Manager' = any(s.roles)
           or s.role in ('Administrator', 'Business Manager'))
  );
$$;

-- can_access_client() already composes is_privileged() + owner + team, so it
-- inherits the fix. Nothing else to change.
