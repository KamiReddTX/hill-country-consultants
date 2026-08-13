-- Additive migration — run after schema.sql. Lets a sales rep (or admin) convert
-- a "Closed won" lead into a client. SECURITY DEFINER so the insert clears the
-- admin-only clients write policy, but it verifies the caller is staff first and
-- stamps the client with the lead's rep_code (attribution) + retention start.
create or replace function create_client_from_lead(p_lead uuid) returns uuid
  language plpgsql security definer as $$
declare v_client uuid; v_email text; v_business text; v_contact text; v_phone text; v_rep text;
begin
  if not is_staff() then raise exception 'Only staff can convert a lead.'; end if;
  select lower(coalesce(email,'')), business, contact, phone, coalesce(rep_code,'')
    into v_email, v_business, v_contact, v_phone, v_rep
  from leads where id = p_lead;
  if v_email is null or v_email = '' then raise exception 'Lead needs an email before it can be won.'; end if;

  insert into clients (email, business, contact, phone, rep_code, retained_since, status)
  values (v_email, v_business, v_contact, v_phone, v_rep, current_date, 'In review')
  on conflict (email) do update
    set business = coalesce(excluded.business, clients.business),
        rep_code = coalesce(nullif(excluded.rep_code,''), clients.rep_code)
  returning id into v_client;

  update leads set stage = 'Closed won' where id = p_lead;
  return v_client;
end $$;

grant execute on function create_client_from_lead(uuid) to authenticated;
