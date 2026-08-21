-- Hill Country Consultants — Google Calendar sync (dedup ledger)
-- =============================================================================
-- Records every Google Calendar event the sync has already processed, so a
-- booking is only flagged to staff once. Written by the sync (service role);
-- privileged staff can read it. No client data beyond a link + summary.
--
-- Idempotent. Run in the Supabase SQL Editor.
-- =============================================================================

create table if not exists synced_calendar_events (
  event_id    text primary key,
  calendar_id text,
  client_id   uuid references clients(id) on delete set null,
  summary     text,
  start_at    timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists synced_cal_client_idx on synced_calendar_events (client_id);

alter table synced_calendar_events enable row level security;

drop policy if exists synced_cal_read on synced_calendar_events;
create policy synced_cal_read on synced_calendar_events for select using (is_privileged());
