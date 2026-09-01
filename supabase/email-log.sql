-- Audit trail of every email the system attempts to send, so "did it actually
-- send?" is answerable from the database instead of a mailbox or Resend dashboard.
create table if not exists email_log (
  id          uuid primary key default gen_random_uuid(),
  to_addr     text not null,
  subject     text,
  status      text not null,     -- 'sent' | 'skipped_no_key' | 'error'
  provider_id text,              -- Resend message id when sent
  error       text,
  created_at  timestamptz not null default now()
);
create index if not exists email_log_created_idx on email_log (created_at desc);
alter table email_log enable row level security;

-- Admins / business managers can read the log; inserts happen via the service role.
drop policy if exists email_log_read on email_log;
create policy email_log_read on email_log for select using (is_privileged());
