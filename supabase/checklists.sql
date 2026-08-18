-- Hill Country Consultants — per-client checklists
-- =============================================================================
-- Freeform checklists attached to a client account. The account team (VA/AM,
-- privileged) builds and checks off items to stay on task (e.g. a branding
-- client's 34-day launch). Items can be grouped into sections. The client can
-- SEE their checklist and progress (read-only) but cannot edit it.
--
-- Run anytime. Idempotent. SQL Editor -> Run.
-- =============================================================================

create table if not exists client_checklist_items (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid not null references clients(id) on delete cascade,
  section     text,                       -- optional group heading (e.g. "Day 1")
  label       text not null,
  done        boolean not null default false,
  done_at     timestamptz,
  position    integer not null default 0, -- ordering within the list
  created_by  text,
  created_at  timestamptz not null default now()
);

alter table client_checklist_items enable row level security;

-- Read: the client's team, a privileged staffer, OR the client themselves.
drop policy if exists checklist_read on client_checklist_items;
create policy checklist_read on client_checklist_items for select
  using (can_access_client(client_id));

-- Write: staff on the client's team (or privileged) only — clients can't edit.
drop policy if exists checklist_write on client_checklist_items;
create policy checklist_write on client_checklist_items for all
  using (is_staff() and can_access_client(client_id))
  with check (is_staff() and can_access_client(client_id));

create index if not exists client_checklist_items_client_idx
  on client_checklist_items (client_id, position, created_at);
