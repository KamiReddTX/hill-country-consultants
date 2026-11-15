-- DBW News — accounts, membership levels and the issue archive.
--
-- What this enforces on the server, so the browser is never trusted with it:
--   · a reader's level lives on her profile and she cannot change it herself;
--     only the service role (a payment webhook, or staff in the dashboard) can
--   · the printed pages of an issue are readable only by levels that carry the
--     site: online, everything, VIP and business. Print alone does not.
--   · a cancelled subscription keeps its access until the term ends, then
--     reads as a free account
--   · archive listings (titles, dates, sections) are public; nobody but the
--     service role writes them

-- ---------------------------------------------------------------------------
-- Levels
-- ---------------------------------------------------------------------------
create type public.member_tier as enum (
  'free',        -- Free account
  'online',      -- Online subscription   $5/mo or $50/yr
  'print',       -- Print subscription    $12/mo or $120/yr  (no site)
  'everything',  -- Print and online      $15/mo or $150/yr
  'vip',         -- VIP membership        $250/yr
  'business'     -- Business Member       $350/yr
);

create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  tier         public.member_tier not null default 'free',
  paused       boolean not null default false,
  cancelled    boolean not null default false,
  term_ends    timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Readers see their own profile"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "Readers update their own profile"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- The row policy above lets her update her own row; these grants limit WHICH
-- columns. She can rename herself. She cannot give herself a level.
revoke insert, update, delete on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (display_name) on public.profiles to authenticated;

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- Every new sign-up gets a free profile.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', ''));
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- The level that actually applies today. Mirrors effective() in account.js;
-- this one is the one that counts.
create or replace function public.effective_tier(uid uuid)
returns public.member_tier
language sql stable security definer set search_path = '' as $$
  select case
    when p.id is null then 'free'::public.member_tier
    when p.paused then p.tier
    when p.cancelled and p.term_ends is not null and p.term_ends < now()
      then 'free'::public.member_tier
    else p.tier
  end
  from (select 1) one
  left join public.profiles p on p.id = uid
$$;

create or replace function public.has_site_access(uid uuid)
returns boolean
language sql stable security definer set search_path = '' as $$
  select uid is not null
     and public.effective_tier(uid) in ('online', 'everything', 'vip', 'business')
$$;

revoke execute on function public.effective_tier(uuid) from public, anon;
grant execute on function public.effective_tier(uuid) to authenticated;
revoke execute on function public.has_site_access(uuid) from public, anon;
grant execute on function public.has_site_access(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- The archive: work brought over from the old site
-- ---------------------------------------------------------------------------
-- Listing data only. An article's body belongs to its own page and its own
-- paywall rule, not to the archive index.
create table public.archive_articles (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  published_on  date,                 -- null = undated; listed outside the issues
  byline        text not null default '',
  section       text not null default '',
  issue_ym      text check (issue_ym ~ '^\d{4}-\d{2}$'),  -- e.g. '2025-03'
  url           text,                 -- the story's page on dbw-news.com
  source_file   text unique,          -- dedupe key from the import (PDF / export filename)
  created_at    timestamptz not null default now()
);

create index archive_articles_issue_idx on public.archive_articles (issue_ym);

alter table public.archive_articles enable row level security;

create policy "Anyone can list the archive"
  on public.archive_articles for select
  to anon, authenticated
  using (true);

revoke insert, update, delete on public.archive_articles from anon, authenticated;
grant select on public.archive_articles to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Printed pages: one private bucket, one folder per issue
-- ---------------------------------------------------------------------------
-- Upload page scans as  issue-pages/2025-03/001.jpg, 002.jpg, ...
-- Zero-padded so they list in page order.
insert into storage.buckets (id, name, public)
values ('issue-pages', 'issue-pages', false)
on conflict (id) do nothing;

create policy "Site levels read the printed pages"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'issue-pages'
    and public.has_site_access((select auth.uid()))
  );
