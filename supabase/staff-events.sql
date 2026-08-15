-- Hill Country Consultants — employee calendar events
-- =============================================================================
-- Each employee has a calendar of their own events (due dates, reminders,
-- self-scheduled items). An employee can also put an event on a teammate's
-- calendar (shareable). Admins/BMs see everyone's.
--
-- Run anytime. Idempotent. SQL Editor -> Run.
-- =============================================================================

create table if not exists staff_events (
  id         uuid primary key default gen_random_uuid(),
  staff_id   uuid not null references staff(id) on delete cascade,  -- whose calendar it's on
  created_by uuid,                                                   -- who added it
  title      text not null,
  event_date date not null,
  event_time text,                                                   -- optional 'HH:MM'
  note       text,
  created_at timestamptz not null default now()
);
create index if not exists staff_events_cal_idx on staff_events (staff_id, event_date);
alter table staff_events enable row level security;

-- Read: your own calendar, events you created for others, or privileged (admin/BM).
create policy staff_events_read on staff_events for select using (
  is_privileged()
  or exists (select 1 from staff s where s.id = staff_events.staff_id and s.user_id = auth.uid())
  or exists (select 1 from staff s where s.id = staff_events.created_by and s.user_id = auth.uid())
);
-- Write: any active staffer may add an event (to their own or a teammate's calendar);
-- delete/update limited to the owner, the creator, or a privileged staffer.
create policy staff_events_insert on staff_events for insert with check (is_staff());
create policy staff_events_modify on staff_events for update using (
  is_privileged()
  or exists (select 1 from staff s where s.id = staff_events.staff_id and s.user_id = auth.uid())
  or exists (select 1 from staff s where s.id = staff_events.created_by and s.user_id = auth.uid())
);
create policy staff_events_delete on staff_events for delete using (
  is_privileged()
  or exists (select 1 from staff s where s.id = staff_events.staff_id and s.user_id = auth.uid())
  or exists (select 1 from staff s where s.id = staff_events.created_by and s.user_id = auth.uid())
);

-- Colleague roster: minimal directory (id/name/email/roles) of ACTIVE staff, for
-- picking a teammate when sharing a calendar event or starting a DM. Staff-only —
-- clients are authenticated too, so we gate on is_staff() inside the definer.
create or replace function staff_roster()
returns table (id uuid, name text, email text, roles text[], role text)
language plpgsql security definer set search_path = public as $$
begin
  if not is_staff() then return; end if;
  return query
    select s.id, s.name, s.email, s.roles, s.role
    from staff s
    where s.active = true
    order by s.name nulls last;
end;
$$;
revoke all on function staff_roster() from public;
grant execute on function staff_roster() to authenticated;
