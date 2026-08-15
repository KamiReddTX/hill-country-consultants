-- Hill Country Consultants — shared client Files space
-- =============================================================================
-- A private shared drive per client. VA/AM and admin upload files for the
-- client; the client can open/download anything uploaded to their space. Only
-- the owning client, their VA/AM, and admins can see it (RLS + private bucket).
--
-- SAFE TO RUN ONCE ON PRODUCTION: additive. SQL Editor -> New query -> Run.
-- =============================================================================

create table if not exists client_files (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid not null references clients(id) on delete cascade,
  name        text not null,
  path        text not null,
  size        bigint,
  uploaded_by text,
  created_at  timestamptz not null default now()
);
alter table client_files enable row level security;

create policy client_files_read on client_files for select
  using (exists (select 1 from clients c where c.id = client_files.client_id
                 and (c.user_id = auth.uid() or is_staff())));
create policy client_files_staff_write on client_files for all
  using (is_staff()) with check (is_staff());

insert into storage.buckets (id, name, public) values ('client-files','client-files', false)
  on conflict (id) do nothing;
