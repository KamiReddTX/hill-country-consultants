-- Hill Country Consultants — client satisfaction check-ins
-- =============================================================================
-- Clients rate how things are going (1–5 + optional comment) from their portal.
-- Staff who can access the client (owner, team, or privileged) can read it.
-- Referrals reuse the existing leads table (no new table needed).
--
-- Run after team-model.sql (which defines can_access_client). Idempotent.
-- =============================================================================

create table if not exists client_feedback (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid not null references clients(id) on delete cascade,
  rating     smallint not null,
  comment    text,
  created_at timestamptz not null default now()
);

create index if not exists client_feedback_client_idx on client_feedback (client_id);

alter table client_feedback enable row level security;

-- The client submits their own; staff with access (and the client) can read.
drop policy if exists client_feedback_insert on client_feedback;
create policy client_feedback_insert on client_feedback for insert
  with check (client_id in (select id from clients where user_id = auth.uid()));

drop policy if exists client_feedback_read on client_feedback;
create policy client_feedback_read on client_feedback for select
  using (can_access_client(client_id));
