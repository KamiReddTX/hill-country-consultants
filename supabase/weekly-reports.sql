-- Hill Country Consultants — client weekly report PDFs
-- =============================================================================
-- An admin generates a weekly report per client (from approved work-log hours +
-- deliverables). Each is a PDF in a private bucket, listed on the client's Weekly
-- Report tab, newest first, for 30 days.
--
-- SAFE TO RUN ONCE ON PRODUCTION: additive. SQL Editor -> New query -> Run.
-- =============================================================================

create table if not exists client_reports (
  id           uuid primary key default gen_random_uuid(),
  client_id    uuid not null references clients(id) on delete cascade,
  name         text not null,
  path         text not null,
  period_start date,
  period_end   date,
  created_at   timestamptz not null default now()
);
alter table client_reports enable row level security;

create policy client_reports_read on client_reports for select
  using (exists (select 1 from clients c where c.id = client_reports.client_id
                 and (c.user_id = auth.uid() or is_staff())));
create policy client_reports_staff_write on client_reports for all
  using (is_staff()) with check (is_staff());

insert into storage.buckets (id, name, public) values ('client-reports','client-reports', false)
  on conflict (id) do nothing;
