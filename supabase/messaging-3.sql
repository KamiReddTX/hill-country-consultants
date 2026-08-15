-- Hill Country Consultants — channel management & posting permissions
-- =============================================================================
-- Admins/BMs manage channels (create, rename, archive) and decide who may post
-- in each one. Every staffer can still READ every channel; posting can be locked
-- to a chosen set of members.
--
--   channels.post_policy = 'all'        -> any staffer may post
--                        = 'restricted' -> only listed members (+ admins/BMs) post
--   channel_posters                     -> the allowed members when restricted
--
-- Run after messaging.sql. Idempotent. SQL Editor -> Run.
-- =============================================================================

alter table channels add column if not exists post_policy text not null default 'all';

create table if not exists channel_posters (
  channel_id uuid not null references channels(id) on delete cascade,
  staff_id   uuid not null references staff(id) on delete cascade,
  primary key (channel_id, staff_id)
);
alter table channel_posters enable row level security;
create policy channel_posters_read  on channel_posters for select using (is_staff());
create policy channel_posters_write on channel_posters for all using (is_privileged()) with check (is_privileged());

-- Can the current user post in this channel?
create or replace function can_post_channel(cid uuid) returns boolean
  language sql stable security definer set search_path = public, pg_temp as $$
  select
    is_privileged()
    or exists (select 1 from channels c where c.id = cid and coalesce(c.post_policy, 'all') = 'all')
    or exists (select 1 from channel_posters p where p.channel_id = cid and p.staff_id = my_staff_id());
$$;

-- Only admins/BMs create channels now (they manage them).
drop policy if exists channels_insert on channels;
create policy channels_insert on channels for insert with check (is_privileged());

-- Posting respects the channel's policy.
drop policy if exists chanmsg_send on channel_messages;
create policy chanmsg_send on channel_messages for insert with check (
  is_staff() and author_id = my_staff_id() and can_post_channel(channel_id)
);
