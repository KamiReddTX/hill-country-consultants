-- Hill Country Consultants — internal messaging
-- =============================================================================
-- Three new channels of communication, on top of the existing client threads
-- (client_notes, which are retained per client and already visible to admins and
-- to whichever VA/AM currently owns the client — so history survives VA changes):
--
--   1. direct_messages     — 1:1 DMs between employees. Admins/BMs can read all
--                            (company oversight); otherwise only the two parties.
--   2. channels / channel_messages — shared topic channels, readable by all staff.
--   3. client_staff_notes  — private staff-only notes attached to a client (the
--                            team discusses the account; the client NEVER sees it).
--
-- Run anytime. Idempotent. SQL Editor -> Run.
-- =============================================================================

-- Current user's staff id (null if not staff). Used by DM policies.
create or replace function my_staff_id() returns uuid
  language sql stable security definer set search_path = public, pg_temp as $$
  select id from staff where user_id = auth.uid() and active limit 1;
$$;

-- ── 1. Direct messages (employee ↔ employee) ────────────────────────────────
create table if not exists direct_messages (
  id           uuid primary key default gen_random_uuid(),
  sender_id    uuid not null references staff(id) on delete cascade,
  recipient_id uuid not null references staff(id) on delete cascade,
  body         text not null,
  read_at      timestamptz,
  created_at   timestamptz not null default now()
);
create index if not exists dm_pair_idx on direct_messages (sender_id, recipient_id, created_at);
create index if not exists dm_recipient_idx on direct_messages (recipient_id, created_at);
alter table direct_messages enable row level security;

-- Read: the two parties, or a privileged staffer (oversight). Employees should
-- know these DMs are company records, not private.
create policy dm_read on direct_messages for select using (
  is_privileged() or sender_id = my_staff_id() or recipient_id = my_staff_id()
);
create policy dm_send on direct_messages for insert with check (
  sender_id = my_staff_id() and is_staff()
);
-- Mark-as-read: recipient may update their own received messages; priv may too.
create policy dm_update on direct_messages for update using (
  is_privileged() or recipient_id = my_staff_id()
);

-- ── 2. Channels + channel messages (shared topic chat) ──────────────────────
create table if not exists channels (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  archived    boolean not null default false,
  created_by  uuid,
  created_at  timestamptz not null default now()
);
alter table channels enable row level security;
create policy channels_read   on channels for select using (is_staff());
create policy channels_insert on channels for insert with check (is_staff());
create policy channels_modify on channels for update using (is_privileged() or created_by = my_staff_id());
create policy channels_delete on channels for delete using (is_privileged());

create table if not exists channel_messages (
  id          uuid primary key default gen_random_uuid(),
  channel_id  uuid not null references channels(id) on delete cascade,
  author_id   uuid not null references staff(id) on delete cascade,
  author_name text,
  body        text not null,
  created_at  timestamptz not null default now()
);
create index if not exists chanmsg_idx on channel_messages (channel_id, created_at);
alter table channel_messages enable row level security;
create policy chanmsg_read on channel_messages for select using (is_staff());
create policy chanmsg_send on channel_messages for insert with check (is_staff() and author_id = my_staff_id());

-- Seed a company-wide channel so the tab isn't empty.
insert into channels (name, description)
  select 'general', 'Company-wide chat' where not exists (select 1 from channels);

-- ── 3. Per-client staff-only notes (client never sees these) ─────────────────
create table if not exists client_staff_notes (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid not null references clients(id) on delete cascade,
  author_id   uuid references staff(id) on delete set null,
  author_name text,
  body        text not null,
  created_at  timestamptz not null default now()
);
create index if not exists csn_idx on client_staff_notes (client_id, created_at);
alter table client_staff_notes enable row level security;
-- Staff who can reach the client (privileged, owner, or team) — is_staff() gate
-- excludes the client themselves even though can_access_client() would allow them.
create policy csn_read on client_staff_notes for select using (is_staff() and can_access_client(client_id));
create policy csn_write on client_staff_notes for insert with check (is_staff() and can_access_client(client_id));
