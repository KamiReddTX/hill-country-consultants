-- Launch hardening — 2026-09-01
-- Consolidated, canonical definitions for the fixes shipped in the pre-launch
-- gap pass. This file is the source of truth; where it redefines an object that
-- also appears in an older file (e.g. create_client_after_payment), THIS wins.
--
-- Contents:
--   1. Stripe webhook idempotency (stripe_events + claim_stripe_event)
--   2. create_client_after_payment — single canonical definition (seeds tasks
--      "In progress", now also records the Stripe payment intent on the booking)
--   3. Class 4-hour buffer enforced at booking-write time (slot_to_min + trigger)
--   4. can_access_client — unassigned clients are visible to all active staff
--      (the shared "Unassigned queue"), matching the staff-dashboard copy

begin;

-- 1. IDEMPOTENCY -------------------------------------------------------------
-- One row per processed Stripe event. claim_stripe_event() inserts atomically;
-- the first caller for an event.id wins, every retry/duplicate loses. This is
-- race-safe where the old "select a booking by payment_intent" check was not
-- (the RPC created the booking with a NULL payment_intent, so that check could
-- never see an in-flight duplicate).
create table if not exists stripe_events (
  id          text primary key,
  received_at timestamptz not null default now()
);
alter table stripe_events enable row level security;

create or replace function claim_stripe_event(p_id text) returns boolean
  language plpgsql security definer set search_path = public, pg_temp as $$
begin
  insert into stripe_events (id) values (p_id);
  return true;
exception when unique_violation then
  return false;
end $$;
revoke execute on function claim_stripe_event(text) from public, anon, authenticated;

-- 2. CANONICAL PROVISIONING RPC ---------------------------------------------
-- Supersedes the copies in schema.sql / setup-all.sql / security-fixes.sql
-- (which seeded "In progress") and tasks-workflow.sql (which seeded
-- "Requested"). Canonical behavior: purchased services land in "In progress"
-- (paid, staff-created) so they surface in the staff delivery queue. Adds an
-- optional payment-intent arg so the booking row carries it from creation —
-- defense in depth with the partial unique index bookings_stripe_pi_unique.
create or replace function create_client_after_payment(
  p_email text, p_business text, p_contact text, p_phone text,
  p_ref text, p_items jsonb, p_quotes jsonb, p_paid_cents int,
  p_start date, p_rep_code text default '', p_payment_intent text default null
) returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare v_client uuid;
begin
  insert into clients (email, business, contact, phone, rep_code)
  values (lower(p_email), p_business, p_contact, p_phone, p_rep_code)
  on conflict (email) do update
    set business = coalesce(excluded.business, clients.business),
        contact  = coalesce(excluded.contact,  clients.contact),
        phone    = coalesce(excluded.phone,    clients.phone)
  returning id into v_client;

  insert into bookings (client_id, ref, items, quotes, paid_cents, start_date, stripe_payment_intent)
  values (v_client, p_ref, p_items, p_quotes, p_paid_cents, p_start, p_payment_intent);

  insert into client_tasks (client_id, title, service, due_date, paid, booking_ref, created_by, column_name)
  select v_client, i->>'name', i->>'svc', p_start, true, p_ref, 'staff', 'In progress'
  from jsonb_array_elements(p_items) i;

  return v_client;
end $$;
revoke execute on function
  create_client_after_payment(text,text,text,text,text,jsonb,jsonb,int,date,text,text)
  from public, anon, authenticated;

-- 3. CLASS BUFFER (enforced at the data layer) ------------------------------
-- "10:00 AM" -> minutes since midnight (null if unparseable). Mirrors the TS
-- slotToMin used at checkout.
create or replace function slot_to_min(s text) returns int
  language plpgsql immutable as $$
declare m text[]; h int;
begin
  m := regexp_match(s, '(\d{1,2}):(\d{2})\s*(AM|PM)', 'i');
  if m is null then return null; end if;
  h := (m[1]::int) % 12;
  if m[3] ~* 'pm' then h := h + 12; end if;
  return h * 60 + m[2]::int;
end $$;

-- Reject a class booking within 4 hours of another class on the same day.
-- Fires on INSERT and UPDATE because the webhook sets class fields via a
-- follow-up UPDATE (the RPC inserts the booking with class_name NULL). This is
-- the authoritative guard — even two racing checkouts cannot double-book a slot.
create or replace function bookings_class_buffer_guard() returns trigger
  language plpgsql security definer set search_path = public, pg_temp as $$
declare v_new int; v_clash int;
begin
  if new.class_name is null or new.class_slot is null or new.start_date is null then
    return new;
  end if;
  v_new := slot_to_min(new.class_slot);
  if v_new is null then return new; end if;
  select count(*) into v_clash from bookings b
   where b.id <> new.id
     and b.class_name is not null
     and b.start_date = new.start_date
     and slot_to_min(b.class_slot) is not null
     and abs(slot_to_min(b.class_slot) - v_new) < 240;
  if v_clash > 0 then
    raise exception 'class_buffer_violation: another class is booked within 4 hours on %', new.start_date
      using errcode = 'check_violation';
  end if;
  return new;
end $$;

drop trigger if exists trg_bookings_class_buffer on bookings;
create trigger trg_bookings_class_buffer
  before insert or update on bookings
  for each row execute function bookings_class_buffer_guard();

-- 4. UNASSIGNED-CLIENT VISIBILITY -------------------------------------------
-- The staff dashboard says the Unassigned queue is "visible to everyone until
-- an admin assigns an owner." Make that true: an unassigned client (no owner,
-- no team assignments) is visible to any active staff member so anyone can pick
-- it up. Once assigned, normal owner/team/privileged scoping applies.
create or replace function can_access_client(cid uuid) returns boolean
  language sql stable security definer set search_path = public, pg_temp as $$
  select
    is_privileged()
    or exists (select 1 from clients c where c.id = cid and c.user_id = auth.uid())
    or exists (
      select 1 from staff s
      where s.user_id = auth.uid() and s.active
        and s.id::text = (select assigned_to from clients c2 where c2.id = cid)
    )
    or exists (
      select 1 from client_assignments a
      join staff s on s.id = a.staff_id
      where a.client_id = cid and s.user_id = auth.uid() and s.active
    )
    or (
      -- Unassigned shared pool: any active staffer can see it.
      exists (select 1 from staff s where s.user_id = auth.uid() and s.active)
      and (select assigned_to from clients c3 where c3.id = cid) is null
      and not exists (select 1 from client_assignments a2 where a2.client_id = cid)
    );
$$;

commit;
