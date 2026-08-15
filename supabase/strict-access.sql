-- Hill Country Consultants — strict per-client access + Business Manager role
-- =============================================================================
-- Every client tab (tasks, files, messages, work log, roadmap, deliverables,
-- vault, reports, bookings) becomes visible ONLY to: the client, their assigned
-- VA/AM, a Business Manager, or an Administrator. Non-owner staff lose access.
-- Unassigned clients are visible only to Business Managers and Administrators.
--
-- 'role' on staff is free text, so "Business Manager" needs no schema change —
-- just set a staff member's role to 'Business Manager' from the Admin tab.
--
-- SAFE TO RUN ONCE ON PRODUCTION: it only redefines helper functions and swaps
-- policy predicates. SQL Editor -> New query -> Run.
-- =============================================================================

-- Admin OR Business Manager — full visibility across every client.
create or replace function is_privileged() returns boolean
  language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from staff s
    where s.user_id = auth.uid() and s.active
      and s.role in ('Administrator', 'Business Manager')
  );
$$;

-- Can the current user see this specific client? The client themselves, a
-- privileged staffer (admin/BM), or the assigned VA/AM (clients.assigned_to).
create or replace function can_access_client(cid uuid) returns boolean
  language sql stable security definer set search_path = public, pg_temp as $$
  select
    is_privileged()
    or exists (select 1 from clients c where c.id = cid and c.user_id = auth.uid())
    or exists (
      select 1 from staff s
      where s.user_id = auth.uid() and s.active
        and s.id::text = (select assigned_to from clients c2 where c2.id = cid)
    );
$$;

-- ---- clients ----------------------------------------------------------------
drop policy if exists clients_own_read on clients;
create policy clients_own_read on clients for select
  using (user_id = auth.uid() or can_access_client(id));

-- ---- bookings ---------------------------------------------------------------
drop policy if exists bookings_scope on bookings;
create policy bookings_scope on bookings for select using (can_access_client(bookings.client_id));
drop policy if exists bookings_staff_write on bookings;
create policy bookings_staff_write on bookings for all
  using (can_access_client(bookings.client_id)) with check (can_access_client(bookings.client_id));

-- ---- client_tasks -----------------------------------------------------------
drop policy if exists tasks_scope on client_tasks;
create policy tasks_scope on client_tasks for select using (can_access_client(client_tasks.client_id));
drop policy if exists tasks_write on client_tasks;
create policy tasks_write on client_tasks for insert with check (can_access_client(client_tasks.client_id));
drop policy if exists tasks_update on client_tasks;
create policy tasks_update on client_tasks for update using (can_access_client(client_tasks.client_id));

-- ---- client_notes (messages) ------------------------------------------------
drop policy if exists notes_scope on client_notes;
create policy notes_scope on client_notes for select using (can_access_client(client_notes.client_id));
drop policy if exists notes_write on client_notes;
create policy notes_write on client_notes for insert with check (can_access_client(client_notes.client_id));

-- ---- client_vault -----------------------------------------------------------
drop policy if exists vault_scope on client_vault;
create policy vault_scope on client_vault for all
  using (can_access_client(client_vault.client_id)) with check (can_access_client(client_vault.client_id));

-- ---- client_work_log --------------------------------------------------------
drop policy if exists worklog_scope on client_work_log;
create policy worklog_scope on client_work_log for select using (can_access_client(client_work_log.client_id));
drop policy if exists worklog_staff_write on client_work_log;
create policy worklog_staff_write on client_work_log for all
  using (can_access_client(client_work_log.client_id)) with check (can_access_client(client_work_log.client_id));

-- ---- client_deliverables ----------------------------------------------------
drop policy if exists deliverables_scope on client_deliverables;
create policy deliverables_scope on client_deliverables for select using (can_access_client(client_deliverables.client_id));
drop policy if exists deliverables_staff_write on client_deliverables;
create policy deliverables_staff_write on client_deliverables for all
  using (can_access_client(client_deliverables.client_id)) with check (can_access_client(client_deliverables.client_id));

-- ---- client_task_files ------------------------------------------------------
drop policy if exists task_files_read on client_task_files;
create policy task_files_read on client_task_files for select using (can_access_client(client_task_files.client_id));
drop policy if exists task_files_write on client_task_files;
create policy task_files_write on client_task_files for all
  using (can_access_client(client_task_files.client_id)) with check (can_access_client(client_task_files.client_id));

-- ---- client_roadmap ---------------------------------------------------------
drop policy if exists client_roadmap_read on client_roadmap;
create policy client_roadmap_read on client_roadmap for select using (can_access_client(client_roadmap.client_id));
drop policy if exists client_roadmap_staff_write on client_roadmap;
create policy client_roadmap_staff_write on client_roadmap for all
  using (can_access_client(client_roadmap.client_id)) with check (can_access_client(client_roadmap.client_id));

-- ---- client_reports ---------------------------------------------------------
drop policy if exists client_reports_read on client_reports;
create policy client_reports_read on client_reports for select using (can_access_client(client_reports.client_id));
drop policy if exists client_reports_staff_write on client_reports;
create policy client_reports_staff_write on client_reports for all
  using (is_privileged()) with check (is_privileged());

-- ---- client_files -----------------------------------------------------------
drop policy if exists client_files_read on client_files;
create policy client_files_read on client_files for select using (can_access_client(client_files.client_id));
drop policy if exists client_files_staff_write on client_files;
create policy client_files_staff_write on client_files for all
  using (can_access_client(client_files.client_id)) with check (can_access_client(client_files.client_id));
