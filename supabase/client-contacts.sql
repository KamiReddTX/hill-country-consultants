-- Hill Country Consultants — additional client contacts + account suspension
-- =============================================================================
-- 1. client_contacts: extra people/emails on a client account. Admins/BMs manage
--    them; the account team can see them. Client emails go to every address on
--    file (primary + these).
-- 2. clients.suspended: suspend an account (e.g. non-payment). Suspended clients
--    are blocked from the portal until reactivated.
--
-- Run anytime. Idempotent. SQL Editor -> Run.
-- =============================================================================

create table if not exists client_contacts (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid not null references clients(id) on delete cascade,
  name       text,
  email      text,
  phone      text,
  title      text,
  created_at timestamptz not null default now()
);
create index if not exists client_contacts_idx on client_contacts (client_id);
alter table client_contacts enable row level security;
-- Anyone who can reach the client can see the contacts; only admins/BMs edit.
create policy client_contacts_read  on client_contacts for select using (can_access_client(client_id));
create policy client_contacts_write on client_contacts for all using (is_privileged()) with check (is_privileged());

-- Account suspension (non-payment, etc.)
alter table clients add column if not exists suspended        boolean not null default false;
alter table clients add column if not exists suspended_reason text;
alter table clients add column if not exists suspended_at     timestamptz;
