-- Additive migration — run after schema.sql. Lets a signed-in client "claim"
-- their own client row on first login by matching their email. SECURITY DEFINER
-- so it can set user_id despite RLS; it only ever links the caller's own email.
create or replace function link_client_to_user() returns void
  language plpgsql security definer as $$
begin
  update clients
    set user_id = auth.uid()
  where user_id is null
    and lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''));
end $$;

grant execute on function link_client_to_user() to authenticated;
