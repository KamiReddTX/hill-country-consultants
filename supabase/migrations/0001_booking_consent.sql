-- Additive migration — run AFTER schema.sql. Keeps schema.sql itself unchanged.
-- Stores the dispute evidence required for "all sales final": the consent
-- timestamp, the payer's IP, and an itemised snapshot of what was purchased.
alter table bookings
  add column if not exists consent_at   timestamptz,
  add column if not exists consent_ip   text,
  add column if not exists consent_terms boolean default false,
  add column if not exists scope_snapshot jsonb;

comment on column bookings.scope_snapshot is
  'Itemised scope shown at checkout — evidence for chargeback defense.';
