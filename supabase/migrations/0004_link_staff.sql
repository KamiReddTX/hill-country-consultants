-- Additive migration — run after schema.sql. Links a signed-in staff member to
-- their pre-created staff row by email on first login (admins create the row;
-- the person is invited via Supabase Auth and claims it here).
create or replace function link_staff_to_user() returns void
  language plpgsql security definer as $$
begin
  update staff
    set user_id = auth.uid()
  where user_id is null
    and lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''));
end $$;

grant execute on function link_staff_to_user() to authenticated;
