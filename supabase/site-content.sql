-- Hill Country Consultants — editable site content (admin CMS, phase 1)
-- =============================================================================
-- Simple key/value overrides for marketing copy + a managed FAQ list. Marketing
-- pages read defaults from code and apply any override found here, so the site
-- never breaks if a key is missing. Admins edit these from /staff/site-content.
--
-- Idempotent. Run in the Supabase SQL Editor.
-- =============================================================================

create table if not exists site_content (
  key        text primary key,
  value      text,
  updated_by uuid references staff(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table if not exists site_faqs (
  id         uuid primary key default gen_random_uuid(),
  question   text not null,
  answer     text not null,
  sort       integer not null default 0,
  active     boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists site_faqs_sort_idx on site_faqs (sort);

alter table site_content enable row level security;
alter table site_faqs    enable row level security;

-- Public site needs to read both; writes go through admin server actions (service role).
drop policy if exists site_content_read on site_content;
create policy site_content_read on site_content for select using (true);

drop policy if exists site_faqs_read on site_faqs;
create policy site_faqs_read on site_faqs for select using (true);
