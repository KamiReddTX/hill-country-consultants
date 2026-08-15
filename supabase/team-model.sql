-- Hill Country Consultants — multi-role staff + account teams + task assignees
-- =============================================================================
-- 1) staff.roles  — an employee can hold several roles at once (VA + Submittals…).
-- 2) client_assignments — the AM's coordination layer: extra workers pulled onto
--    an account, beyond the single owner (clients.assigned_to).
-- 3) client_tasks.assignee_id — who is doing a specific task.
-- Access ties together through can_access_client(): owner OR team member OR
-- privileged (admin/BM) OR the client.
--
-- Run AFTER strict-access.sql. Additive + idempotent. SQL Editor -> Run.
-- =============================================================================

-- 1) Multiple roles per employee -------------------------------------------------
alter table staff add column if not exists roles text[] not null default '{}';
-- Backfill from the existing single role (only where roles is still empty).
update staff set roles = array[role] where coalesce(array_length(roles, 1), 0) = 0 and role is not null;

-- 2) Per-task assignee -----------------------------------------------------------
alter table client_tasks add column if not exists assignee_id uuid references staff(id) on delete set null;

-- 3) Account team roster ---------------------------------------------------------
create table if not exists client_assignments (
  id              uuid primary key default gen_random_uuid(),
  client_id       uuid not null references clients(id) on delete cascade,
  staff_id        uuid not null references staff(id) on delete cascade,
  role_on_account text,
  added_by        uuid,
  created_at      timestamptz not null default now(),
  unique (client_id, staff_id)
);
alter table client_assignments enable row level security;

-- ---- role-aware helpers (fall back to the legacy single role for safety) -------
create or replace function is_admin() returns boolean
  language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from staff s where s.user_id = auth.uid() and s.active
      and ('Administrator' = any(s.roles) or s.role = 'Administrator')
  );
$$;

create or replace function is_privileged() returns boolean
  language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from staff s where s.user_id = auth.uid() and s.active
      and ('Administrator' = any(s.roles) or 'Business Manager' = any(s.roles)
           or s.role in ('Administrator', 'Business Manager'))
  );
$$;

-- ---- access: owner OR team member OR privileged OR the client ------------------
create or replace function can_access_client(cid uuid) returns boolean
  language sql stable security definer set search_path = public, pg_temp as $$
  select
    is_privileged()
    or exists (select 1 from clients c where c.id = cid and c.user_id = auth.uid())
    or exists (
      select 1 from staff s
      where s.user_id = auth.uid() and s.active
        and s.id::text = (select assigned_to from clients c2 where c2.id = cid)
    )
    or exists (
      select 1 from client_assignments a
      join staff s on s.id = a.staff_id
      where a.client_id = cid and s.user_id = auth.uid() and s.active
    );
$$;

-- team roster: readable by anyone who can access the client; writable by the
-- managing team (owner or privileged).
create policy client_assignments_read on client_assignments for select
  using (can_access_client(client_assignments.client_id));
create policy client_assignments_write on client_assignments for all
  using (manages_client(client_assignments.client_id)) with check (manages_client(client_assignments.client_id));
