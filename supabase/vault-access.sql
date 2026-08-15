-- Hill Country Consultants — Shared Vault is VA-maintained, client-visible
-- =============================================================================
-- The vault register lists which accounts the team holds access to. The
-- assigned VA/AM (or a BM/admin) maintains it; the client can VIEW it but not
-- edit it. Run AFTER strict-access.sql (it relies on can_access_client()).
--
-- SAFE TO RUN ONCE ON PRODUCTION. SQL Editor -> New query -> Run.
-- =============================================================================

-- Staff who MANAGE this client (privileged or the assigned owner) — excludes the client.
create or replace function manages_client(cid uuid) returns boolean
  language sql stable security definer set search_path = public, pg_temp as $$
  select is_privileged() or exists (
    select 1 from staff s
    where s.user_id = auth.uid() and s.active
      and s.id::text = (select assigned_to from clients c where c.id = cid)
  );
$$;

drop policy if exists vault_scope on client_vault;
drop policy if exists vault_read on client_vault;
drop policy if exists vault_staff_write on client_vault;

-- Client + team can read; only the managing team can write.
create policy vault_read on client_vault for select using (can_access_client(client_vault.client_id));
create policy vault_staff_write on client_vault for all
  using (manages_client(client_vault.client_id)) with check (manages_client(client_vault.client_id));
