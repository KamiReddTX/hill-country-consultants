-- Hill Country Consultants — Preferred Vendors: services list + logo bucket
-- =============================================================================
-- Adds a multi-value `services` list to each vendor and a PUBLIC storage bucket
-- for vendor logos (so they render on the marketing site). Run after
-- preferred-vendors.sql. Idempotent.
-- =============================================================================

alter table preferred_vendors add column if not exists services text[] not null default '{}';

-- Public bucket for vendor logos (world-readable by URL; uploads via service role).
insert into storage.buckets (id, name, public)
values ('vendor-logos', 'vendor-logos', true)
on conflict (id) do nothing;
