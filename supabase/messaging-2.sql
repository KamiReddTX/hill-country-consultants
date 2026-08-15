-- Hill Country Consultants — messaging unread tracking
-- =============================================================================
-- Tracks the last time each employee read each channel, so we can show unread
-- badges. (DMs already carry read_at on direct_messages.) Run after messaging.sql.
--
-- Run anytime. Idempotent. SQL Editor -> Run.
-- =============================================================================

create table if not exists channel_reads (
  staff_id     uuid not null references staff(id) on delete cascade,
  channel_id   uuid not null references channels(id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (staff_id, channel_id)
);
alter table channel_reads enable row level security;

-- Each employee manages only their own read markers.
create policy channel_reads_rw on channel_reads for all
  using (staff_id = my_staff_id())
  with check (staff_id = my_staff_id());
