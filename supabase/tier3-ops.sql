-- Hill Country Consultants — Tier 3: contracts, capacity, vendors, audit log, KB
-- =============================================================================
-- Adds:
--   1) contracts               — client agreements/SOWs with e-sign status
--   2) staff.weekly_capacity_hours — capacity target per staffer
--   3) vendors + expenses.vendor_id — vendor / 1099 tracking
--   4) audit_log               — who-changed-what trail
--   5) kb_articles             — internal knowledge base
--
-- Reuses is_admin() and is_biller() from earlier migrations. SAFE: additive +
-- idempotent. Run once in Supabase → SQL Editor → Run.
-- =============================================================================

-- 1) Contracts & SOWs -----------------------------------------------------------
create table if not exists contracts (
  id            uuid primary key default gen_random_uuid(),
  client_id     uuid not null references clients(id) on delete cascade,
  kind          text not null default 'SOW',     -- 'MSA' | 'SOW' | 'NDA' | 'Order' | 'Other'
  title         text not null,
  amount_cents  integer,
  start_date    date,
  end_date      date,
  status        text not null default 'draft',    -- 'draft' | 'sent' | 'signed' | 'void'
  file_path     text,                             -- in the client-files bucket
  signer_email  text,
  signer_name   text,
  docusign_envelope_id text,
  created_by    text,
  created_at    timestamptz not null default now(),
  sent_at       timestamptz,
  signed_at     timestamptz
);
create index if not exists contracts_client_idx on contracts (client_id);
alter table contracts enable row level security;
drop policy if exists contracts_priv on contracts;
create policy contracts_priv on contracts for all using (is_biller()) with check (is_biller());

-- 2) Capacity target per staffer ------------------------------------------------
alter table staff add column if not exists weekly_capacity_hours numeric not null default 40;

-- 3) Vendors & 1099 -------------------------------------------------------------
create table if not exists vendors (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       text,
  ein_last4   text,
  is_1099     boolean not null default false,
  notes       text,
  created_by  text,
  created_at  timestamptz not null default now()
);
alter table vendors enable row level security;
drop policy if exists vendors_admin on vendors;
create policy vendors_admin on vendors for all using (is_admin()) with check (is_admin());
-- Link an expense to a vendor (optional).
alter table expenses add column if not exists vendor_id uuid references vendors(id) on delete set null;

-- 4) Audit log ------------------------------------------------------------------
create table if not exists audit_log (
  id          uuid primary key default gen_random_uuid(),
  actor_email text,
  action      text not null,        -- 'create' | 'update' | 'delete' | ...
  entity      text not null,        -- 'invoice' | 'client' | 'contract' | ...
  entity_id   text,
  summary     text,
  created_at  timestamptz not null default now()
);
create index if not exists audit_log_created_idx on audit_log (created_at desc);
create index if not exists audit_log_entity_idx on audit_log (entity, entity_id);
alter table audit_log enable row level security;
drop policy if exists audit_log_admin on audit_log;
create policy audit_log_admin on audit_log for select using (is_admin());
-- Inserts happen server-side with the service role (bypasses RLS); no insert policy needed.

-- 5) Knowledge base -------------------------------------------------------------
create table if not exists kb_articles (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  category    text not null default 'General',
  body        text not null default '',
  tags        text[] not null default '{}',
  created_by  text,
  updated_by  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists kb_articles_cat_idx on kb_articles (category);
alter table kb_articles enable row level security;
drop policy if exists kb_read on kb_articles;
drop policy if exists kb_write on kb_articles;
create policy kb_read  on kb_articles for select using (is_staff());
create policy kb_write on kb_articles for all using (is_biller()) with check (is_biller());
