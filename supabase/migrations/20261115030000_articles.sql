-- DBW News — full articles, and the paywall rule enforced by the database.
--
-- The rule, from the design decisions:
--   · letters and anything the editor marks free: open to everyone
--   · a story more than a year old: open to any signed-in account
--     (signed-out visitors still get the first two paragraphs)
--   · otherwise: subscribers whose level carries the site
-- Everyone else receives the opening paragraphs only. The full text never
-- leaves the database for a reader who may not have it.

alter table public.archive_articles
  add column slug             text unique check (slug ~ '^[a-z0-9][a-z0-9-]{0,200}$'),
  add column excerpt          text not null default '',
  add column cover_url        text not null default '',
  add column categories       text[] not null default '{}',
  add column tags             text[] not null default '{}',
  add column minutes_to_read  integer,
  add column video_url        text not null default '',
  add column original_path    text not null default '',   -- e.g. /post/<slug> on the old Wix site
  add column free             boolean not null default false,
  add column updated_at       timestamptz not null default now();

create trigger archive_articles_touch before update on public.archive_articles
  for each row execute function public.touch_updated_at();

-- The text itself, kept apart so no listing query can ever carry it.
create table public.article_bodies (
  article_id   uuid primary key references public.archive_articles (id) on delete cascade,
  body_html    text not null default '',
  preview_html text not null default ''     -- the opening paragraphs everyone may see
);
alter table public.article_bodies enable row level security;

create policy "Staff read bodies" on public.article_bodies
  for select to authenticated using (public.is_staff((select auth.uid())));
create policy "Staff add bodies" on public.article_bodies
  for insert to authenticated with check (public.is_staff((select auth.uid())));
create policy "Staff edit bodies" on public.article_bodies
  for update to authenticated using (public.is_staff((select auth.uid()))) with check (public.is_staff((select auth.uid())));
create policy "Staff remove bodies" on public.article_bodies
  for delete to authenticated using (public.is_staff((select auth.uid())));
revoke all on public.article_bodies from anon;
grant select, insert, update, delete on public.article_bodies to authenticated;

-- One story, with as much of it as this reader may have.
create or replace function public.read_article(p_slug text)
returns table (
  id uuid, slug text, title text, published_on date, byline text, section text,
  issue_ym text, excerpt text, cover_url text, tags text[], minutes_to_read integer,
  video_url text, free boolean, body_html text, preview_html text, locked boolean, unlock text
)
language plpgsql stable security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  a public.archive_articles;
  b public.article_bodies;
  aged boolean;
  open boolean;
begin
  select * into a from public.archive_articles x where x.slug = p_slug;
  if not found then return; end if;
  select * into b from public.article_bodies y where y.article_id = a.id;

  aged := a.published_on is null or a.published_on < (now() - interval '1 year')::date;
  open := a.free
       or public.is_staff(uid)
       or (uid is not null and public.has_site_access(uid))
       or (uid is not null and aged);

  return query select
    a.id, a.slug, a.title, a.published_on, a.byline, a.section, a.issue_ym, a.excerpt,
    a.cover_url, a.tags, a.minutes_to_read, a.video_url, a.free,
    case when open then coalesce(b.body_html, '') else null end,
    coalesce(b.preview_html, ''),
    not open,
    -- What would open it, so the page asks for the right thing.
    case when open then null when uid is null then 'account' else 'subscription' end;
end $$;

revoke execute on function public.read_article(text) from public;
grant execute on function public.read_article(text) to anon, authenticated;
