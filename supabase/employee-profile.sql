-- Hill Country Consultants — employee self-service profile
-- =============================================================================
-- On first login an employee lands on their profile and sets it up. They can't
-- write their own staff row under RLS (admin-only), so a SECURITY DEFINER RPC
-- lets them update just their own name + phone, scoped by auth.uid().
--
-- Run anytime. Idempotent. SQL Editor -> Run.
-- =============================================================================

alter table staff add column if not exists phone text;

create or replace function update_my_profile(p_name text, p_phone text) returns void
  language sql security definer set search_path = public, pg_temp as $$
  update staff
    set name  = nullif(btrim(p_name), ''),
        phone = nullif(btrim(p_phone), '')
  where user_id = auth.uid();
$$;

revoke execute on function update_my_profile(text, text) from public, anon;
grant execute on function update_my_profile(text, text) to authenticated;
