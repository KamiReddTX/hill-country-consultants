-- Hill Country Consultants — client-requested service upgrades / add-ons
-- =============================================================================
-- Clients pick an upgrade or add-on from their task board; it routes to the
-- account owner + sales/admin. Not a charge — a request the team follows up on.
--
-- Requires can_access_client() (team-model.sql). Idempotent.
-- =============================================================================

create table if not exists service_upgrade_requests (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid not null references clients(id) on delete cascade,
  upgrade_key text,
  label       text not null,
  note        text,
  status      text not null default 'new',   -- new | contacted | closed
  created_at  timestamptz not null default now(),
  handled_by  uuid references staff(id) on delete set null,
  handled_at  timestamptz
);
create index if not exists sur_status_idx on service_upgrade_requests (status);
create index if not exists sur_client_idx on service_upgrade_requests (client_id);

alter table service_upgrade_requests enable row level security;

-- The owning client and staff-with-access can read; writes go via service role.
drop policy if exists sur_read on service_upgrade_requests;
create policy sur_read on service_upgrade_requests for select
  using (can_access_client(client_id)
         or client_id in (select id from clients where user_id = auth.uid()));
