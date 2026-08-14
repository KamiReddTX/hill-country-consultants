-- Hill Country Consultants — per-client 30-day roadmap
-- =============================================================================
-- Backs the client Roadmap tab. The five phases are fixed in code; this table
-- carries each client's per-phase STATUS ("Not started" | "In progress" |
-- "Complete") and an optional client-specific NOTE. Rows are sparse — only
-- phases an AM/VA has touched exist here.
--
-- RLS: a client reads only their own roadmap; staff (AM/VA/admin) read and
-- write. Mirrors the client_deliverables pattern.
--
-- SAFE TO RUN ONCE ON PRODUCTION: additive; creates one table + its policies.
-- Paste the whole file into Supabase -> SQL Editor -> New query -> Run.
-- =============================================================================

create table if not exists client_roadmap (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid not null references clients(id) on delete cascade,
  phase      text not null,
  status     text not null default 'Not started',
  note       text,
  updated_at timestamptz not null default now(),
  unique (client_id, phase)
);

alter table client_roadmap enable row level security;

-- Client sees only their own roadmap; staff see all.
create policy client_roadmap_read on client_roadmap for select
  using (exists (select 1 from clients c
                 where c.id = client_roadmap.client_id
                   and (c.user_id = auth.uid() or is_staff())));

-- Staff (any active staffer — AM, VA, admin) create/update roadmap rows.
create policy client_roadmap_staff_write on client_roadmap for all
  using (is_staff()) with check (is_staff());
