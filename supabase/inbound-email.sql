-- Hill Country Consultants — inbound email (email replies -> message thread)
-- =============================================================================
-- Gives every client a stable reply_token. Outbound message emails use a
-- Reply-To of  reply+<token>@<your receiving subdomain>  so that when either
-- side replies, Resend forwards it to our webhook, which posts it into the
-- client_notes thread and forwards it on to the other party.
--
-- Run anytime. Idempotent. SQL Editor -> Run.
-- =============================================================================

alter table clients add column if not exists reply_token text;

-- Backfill existing clients with a random token (no pgcrypto needed).
update clients
  set reply_token = substr(md5(random()::text || clock_timestamp()::text || id::text), 1, 16)
  where reply_token is null;

-- New clients get one automatically.
alter table clients
  alter column reply_token set default substr(md5(random()::text || clock_timestamp()::text || gen_random_uuid()::text), 1, 16);

create unique index if not exists clients_reply_token_idx on clients (reply_token);
