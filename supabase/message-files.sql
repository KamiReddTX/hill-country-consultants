-- Hill Country Consultants — message attachments
-- =============================================================================
-- Files attached to a client message (client_notes). VA/AM and the client can
-- attach; everyone who can_access_client() can see/download. Files live in the
-- existing private "client-files" storage bucket under a messages/ prefix.
--
-- Run anytime. Idempotent. SQL Editor -> Run.
-- =============================================================================

create table if not exists note_files (
  id          uuid primary key default gen_random_uuid(),
  note_id     uuid not null references client_notes(id) on delete cascade,
  client_id   uuid not null references clients(id) on delete cascade,
  name        text not null,
  path        text not null,
  size        bigint,
  uploaded_by text,
  created_at  timestamptz not null default now()
);
create index if not exists note_files_note_idx on note_files (note_id);
create index if not exists note_files_client_idx on note_files (client_id);
alter table note_files enable row level security;

create policy note_files_read  on note_files for select using (can_access_client(client_id));
create policy note_files_write on note_files for insert with check (can_access_client(client_id));
