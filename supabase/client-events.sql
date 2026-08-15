-- Hill Country Consultants — client calendar events
-- =============================================================================
-- Events on a CLIENT's calendar. The client can add their own; their account
-- team (assigned VA/AM, team members) and admins/BMs can add too. Everyone who
-- can_access_client() can see and manage them. Shown on both the client portal
-- calendar and the staff calendar (for that client's team).
--
-- Run anytime. Idempotent. SQL Editor -> Run.
-- =============================================================================

create table if not exists client_events (
  id              uuid primary key default gen_random_uuid(),
  client_id       uuid not null references clients(id) on delete cascade,
  title           text not null,
  event_date      date not null,
  event_time      text,
  note            text,
  created_by_role text,   -- 'client' | 'staff'
  created_by_name text,
  created_at      timestamptz not null default now()
);
create index if not exists client_events_idx on client_events (client_id, event_date);
alter table client_events enable row level security;

create policy client_events_read   on client_events for select using (can_access_client(client_id));
create policy client_events_insert on client_events for insert with check (can_access_client(client_id));
create policy client_events_delete on client_events for delete using (can_access_client(client_id));
