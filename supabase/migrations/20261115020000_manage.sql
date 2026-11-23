-- DBW News — the management workspace (manage.html).
--
-- Who may do what, enforced here and not in the browser:
--   · staff (role 'admin' or 'editor') manage issues, covers, page scans and
--     archive articles
--   · only an admin changes a reader's level or the staff list
--   · the public reads issues and covers; page scans stay site-levels-only

-- ---------------------------------------------------------------------------
-- Staff
-- ---------------------------------------------------------------------------
create table public.staff (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  role       text not null check (role in ('admin', 'editor')),
  added_at   timestamptz not null default now(),
  added_by   uuid references auth.users (id) on delete set null
);
alter table public.staff enable row level security;
revoke all on public.staff from anon, authenticated;
-- No direct access at all: everything goes through the functions below.

create or replace function public.staff_role(uid uuid)
returns text language sql stable security definer set search_path = '' as $$
  select role from public.staff where user_id = uid
$$;

create or replace function public.is_staff(uid uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.staff where user_id = uid)
$$;

create or replace function public.is_admin(uid uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.staff where user_id = uid and role = 'admin')
$$;

-- "What am I?" for the workspace to decide what to show.
create or replace function public.my_staff_role()
returns text language sql stable security definer set search_path = '' as $$
  select public.staff_role(auth.uid())
$$;

revoke execute on function public.staff_role(uuid), public.is_staff(uuid), public.is_admin(uuid) from public, anon;
grant execute on function public.staff_role(uuid), public.is_staff(uuid), public.is_admin(uuid) to authenticated;
revoke execute on function public.my_staff_role() from public, anon;
grant execute on function public.my_staff_role() to authenticated;

-- Staff can see page scans of every issue, whatever their own level.
create policy "Staff read the printed pages"
  on storage.objects for select to authenticated
  using (bucket_id = 'issue-pages' and public.is_staff((select auth.uid())));

-- ---------------------------------------------------------------------------
-- The issue calendar, moved out of the code
-- ---------------------------------------------------------------------------
create table public.issues (
  ym          text primary key check (ym ~ '^\d{4}-(0[1-9]|1[0-2])$'),
  no          integer check (no > 0),
  title       text not null default '',
  featured    text not null default '',
  edition     text not null default '',
  blurb       text not null default '',
  cover_path  text not null default '',   -- 'assets/covers/…' on the site, or a path in the covers bucket
  updated_at  timestamptz not null default now(),
  updated_by  uuid references auth.users (id) on delete set null
);
alter table public.issues enable row level security;

create policy "Anyone reads the calendar" on public.issues
  for select to anon, authenticated using (true);
create policy "Staff add issues" on public.issues
  for insert to authenticated with check (public.is_staff((select auth.uid())));
create policy "Staff edit issues" on public.issues
  for update to authenticated using (public.is_staff((select auth.uid()))) with check (public.is_staff((select auth.uid())));
create policy "Staff remove issues" on public.issues
  for delete to authenticated using (public.is_staff((select auth.uid())));

grant select on public.issues to anon, authenticated;
grant insert, update, delete on public.issues to authenticated;

create trigger issues_touch before update on public.issues
  for each row execute function public.touch_updated_at();

-- The calendar as it stood in the code on the day this ran.
insert into public.issues (ym, no, title, featured, edition, blurb, cover_path) values
  ('2025-01', 1, 'Turning Purpose to Profit', 'June Marie Outlaw', 'Premier Edition', '', 'assets/covers/2025-01.jpg'),
  ('2025-02', 2, 'I See My Baby Inc.', 'Alicia Hurtt', '', '', 'assets/covers/2025-02.jpg'),
  ('2025-03', 3, 'WorxK Solutions', 'Dr. Kristy Taylor', 'Women''s History Month Edition', '', 'assets/covers/2025-03.jpg'),
  ('2025-04', 4, 'Publishing Conscious Dreams', 'Daniella Blechner', '', '', 'assets/covers/2025-04.jpg'),
  ('2025-05', 5, 'A Mother''s Legacy of Leadership and Love', 'Dr. Nikki & Briana Harris', 'Mother''s Day Edition', '', 'assets/covers/2025-05.jpg'),
  ('2025-06', 6, 'The Architect of Fortitude: The Unbreakable Spirit', 'Kami Redd', 'Premier Edition (6 Month Birthday)', '', 'assets/covers/2025-06.jpg'),
  ('2025-07', 7, 'Reclaiming the Fourth: The Unfinished Promise of Freedom', '', '4th of July Edition', '', 'assets/covers/2025-07.jpg'),
  ('2027-01', 8, 'The Power of Her: Then. Now. Next.', '', 'The Relaunch Issue', 'From Georgia’s Historic Election to America’s Political Future.', 'assets/covers/2027-01.jpg'),
  ('2027-05', null, 'Should We Re-Segregate Our Children?', '', '', 'Six institutions: the classroom, the squad car, the exam room, the caseworker’s office, the newsroom, and the first job and first campus.', '')
on conflict (ym) do nothing;

-- ---------------------------------------------------------------------------
-- Archive articles: staff write
-- ---------------------------------------------------------------------------
create policy "Staff add articles" on public.archive_articles
  for insert to authenticated with check (public.is_staff((select auth.uid())));
create policy "Staff edit articles" on public.archive_articles
  for update to authenticated using (public.is_staff((select auth.uid()))) with check (public.is_staff((select auth.uid())));
create policy "Staff remove articles" on public.archive_articles
  for delete to authenticated using (public.is_staff((select auth.uid())));
grant insert, update, delete on public.archive_articles to authenticated;

-- ---------------------------------------------------------------------------
-- Covers (public) and page scans (staff upload)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('covers', 'covers', true)
on conflict (id) do nothing;

create policy "Staff upload covers" on storage.objects
  for insert to authenticated with check (bucket_id = 'covers' and public.is_staff((select auth.uid())));
create policy "Staff replace covers" on storage.objects
  for update to authenticated using (bucket_id = 'covers' and public.is_staff((select auth.uid())));
create policy "Staff remove covers" on storage.objects
  for delete to authenticated using (bucket_id = 'covers' and public.is_staff((select auth.uid())));

create policy "Staff upload pages" on storage.objects
  for insert to authenticated with check (bucket_id = 'issue-pages' and public.is_staff((select auth.uid())));
create policy "Staff replace pages" on storage.objects
  for update to authenticated using (bucket_id = 'issue-pages' and public.is_staff((select auth.uid())));
create policy "Staff remove pages" on storage.objects
  for delete to authenticated using (bucket_id = 'issue-pages' and public.is_staff((select auth.uid())));

-- ---------------------------------------------------------------------------
-- Members: admins only, through functions that check first
-- ---------------------------------------------------------------------------
create or replace function public.admin_list_members(search text default '')
returns table (
  id uuid, email text, display_name text, tier public.member_tier,
  term_ends timestamptz, paused boolean, cancelled boolean, created_at timestamptz
)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Only an administrator can list members' using errcode = '42501';
  end if;
  return query
    select p.id, u.email::text, p.display_name, p.tier, p.term_ends, p.paused, p.cancelled, p.created_at
    from public.profiles p join auth.users u on u.id = p.id
    where coalesce(search, '') = ''
       or u.email ilike '%' || search || '%'
       or p.display_name ilike '%' || search || '%'
    order by p.created_at desc
    limit 200;
end $$;

create or replace function public.admin_set_membership(
  target uuid, new_tier public.member_tier, new_term_ends timestamptz,
  new_paused boolean default false, new_cancelled boolean default false
)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Only an administrator can change a level' using errcode = '42501';
  end if;
  update public.profiles
     set tier = new_tier, term_ends = new_term_ends, paused = new_paused, cancelled = new_cancelled
   where id = target;
  if not found then raise exception 'No such member'; end if;
end $$;

create or replace function public.admin_list_staff()
returns table (user_id uuid, email text, display_name text, role text, added_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Only an administrator can see the staff list' using errcode = '42501';
  end if;
  return query
    select s.user_id, u.email::text, coalesce(p.display_name, ''), s.role, s.added_at
    from public.staff s join auth.users u on u.id = s.user_id
    left join public.profiles p on p.id = s.user_id
    order by s.added_at;
end $$;

-- Staff are added by the email of an account that already exists, so the
-- person signs up on the site first and keeps her own password.
create or replace function public.admin_add_staff(staff_email text, staff_role text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  uid uuid;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Only an administrator can add staff' using errcode = '42501';
  end if;
  if staff_role not in ('admin', 'editor') then raise exception 'Unknown role'; end if;
  select id into uid from auth.users where lower(email) = lower(trim(staff_email));
  if uid is null then
    raise exception 'No account uses that email yet. Ask her to create one on the site first.';
  end if;
  insert into public.staff (user_id, role, added_by) values (uid, staff_role, auth.uid())
  on conflict (user_id) do update set role = excluded.role;
end $$;

create or replace function public.admin_remove_staff(target uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Only an administrator can remove staff' using errcode = '42501';
  end if;
  if target = auth.uid() then
    raise exception 'You cannot remove yourself. Ask another administrator.';
  end if;
  delete from public.staff where user_id = target;
end $$;

revoke execute on function public.admin_list_members(text), public.admin_set_membership(uuid, public.member_tier, timestamptz, boolean, boolean),
  public.admin_list_staff(), public.admin_add_staff(text, text), public.admin_remove_staff(uuid) from public, anon;
grant execute on function public.admin_list_members(text), public.admin_set_membership(uuid, public.member_tier, timestamptz, boolean, boolean),
  public.admin_list_staff(), public.admin_add_staff(text, text), public.admin_remove_staff(uuid) to authenticated;
