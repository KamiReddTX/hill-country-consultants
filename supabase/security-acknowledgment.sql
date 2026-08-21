-- Hill Country Consultants — IT, Security & Confidentiality Acknowledgment
-- =============================================================================
-- New hires read and e-acknowledge the firm's security + confidentiality terms
-- on their employee profile. Each acknowledgment records a typed signature and
-- timestamp, versioned so a new policy version can require re-acknowledgment.
--
-- Writes happen server-side via the service client after an auth check, so the
-- table only needs a read policy (self + privileged). Idempotent. SQL Editor -> Run.
-- =============================================================================

create table if not exists staff_acknowledgments (
  id          uuid primary key default gen_random_uuid(),
  staff_id    uuid not null references staff(id) on delete cascade,
  kind        text not null default 'it_security',
  version     text not null,
  agreed_name text,
  agreed_at   timestamptz not null default now(),
  unique (staff_id, kind, version)
);

create index if not exists staff_ack_staff_idx on staff_acknowledgments (staff_id);

alter table staff_acknowledgments enable row level security;

-- A staffer can read their own acknowledgments; privileged staff read everyone's.
drop policy if exists staff_ack_read on staff_acknowledgments;
create policy staff_ack_read on staff_acknowledgments for select
  using (
    staff_id in (select id from staff where user_id = auth.uid())
    or is_privileged()
  );

-- Allow a signed-in staffer to insert their own acknowledgment (defense in depth;
-- the server action uses the service role, but this keeps RLS coherent).
drop policy if exists staff_ack_insert on staff_acknowledgments;
create policy staff_ack_insert on staff_acknowledgments for insert
  with check (staff_id in (select id from staff where user_id = auth.uid()));
