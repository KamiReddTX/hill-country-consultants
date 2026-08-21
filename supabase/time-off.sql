-- Hill Country Consultants — PTO / time-off requests
-- =============================================================================
-- Employees request time off from their profile; Admin/Business Manager approve
-- or deny on the Capacity page. Approved time off in the current week reduces a
-- staffer's effective weekly target on the capacity model.
--
-- Idempotent. Run in the Supabase SQL Editor.
-- =============================================================================

create table if not exists time_off_requests (
  id          uuid primary key default gen_random_uuid(),
  staff_id    uuid not null references staff(id) on delete cascade,
  kind        text not null default 'PTO',           -- PTO · Sick · Unpaid
  start_date  date not null,
  end_date    date not null,
  note        text,
  status      text not null default 'pending',        -- pending · approved · denied
  decided_by  uuid references staff(id),
  decided_at  timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists time_off_staff_idx on time_off_requests (staff_id);
create index if not exists time_off_status_idx on time_off_requests (status);

alter table time_off_requests enable row level security;

-- Staff see their own requests; privileged (Admin/BM) see everyone's.
drop policy if exists time_off_read on time_off_requests;
create policy time_off_read on time_off_requests for select
  using (
    staff_id in (select id from staff where user_id = auth.uid())
    or is_privileged()
  );

-- Staff create their own requests.
drop policy if exists time_off_insert on time_off_requests;
create policy time_off_insert on time_off_requests for insert
  with check (staff_id in (select id from staff where user_id = auth.uid()));

-- Staff may cancel (delete) their own still-pending requests.
drop policy if exists time_off_delete on time_off_requests;
create policy time_off_delete on time_off_requests for delete
  using (status = 'pending' and staff_id in (select id from staff where user_id = auth.uid()));
