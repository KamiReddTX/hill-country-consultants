-- Employee-experience improvements — task priority, per-employee notifications,
-- and a logged_by_staff stamp on work entries.

alter table client_tasks add column if not exists priority text not null default 'Normal';
  -- 'Low' | 'Normal' | 'High' | 'Urgent'
create index if not exists client_tasks_priority_idx on client_tasks (priority);

alter table client_work_log add column if not exists logged_by_staff uuid references staff(id) on delete set null;

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references staff(id) on delete cascade,
  kind text not null default 'info',      -- assignment | approval | changes | document | info
  title text not null,
  body text,
  href text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notifications_staff_idx on notifications (staff_id, read, created_at desc);
alter table notifications enable row level security;

-- Employees read/mark-read only their own; inserts go through the service role.
drop policy if exists notifications_own_read on notifications;
create policy notifications_own_read on notifications for select
  using (staff_id = (select s.id from staff s where s.user_id = auth.uid()));
drop policy if exists notifications_own_update on notifications;
create policy notifications_own_update on notifications for update
  using (staff_id = (select s.id from staff s where s.user_id = auth.uid()))
  with check (staff_id = (select s.id from staff s where s.user_id = auth.uid()));
