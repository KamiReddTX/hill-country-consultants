-- Hill Country Consultants — production security & data-integrity hotfix
-- =============================================================================
-- WHAT THIS DOES (applies fixes C1, C2, MA4, MA7 and the created_by fix to an
-- ALREADY-DEPLOYED database):
--   C1  Revoke public/anon/authenticated EXECUTE on create_client_after_payment
--       so only the service-role key (the Stripe webhook) can create paid
--       bookings. Stops anyone from forging "paid" bookings or overwriting
--       clients by email.
--   C2  Make is_staff() / is_admin() / my_role() SECURITY DEFINER with a pinned
--       search_path, fixing "infinite recursion detected in policy for relation
--       staff" (they are called from the staff RLS policies).
--   MA4 Tighten the leads policy so only Sales / account manager + Administrator
--       can read or write leads (matches isSalesOrAdmin in the app UI).
--   MA7 Add a unique index on bookings(stripe_payment_intent) so a retried or
--       duplicated Stripe webhook cannot create a second paid booking.
--   +   Purchased-service tasks are seeded as created_by 'staff' in "In progress"
--       (not the client default "Requested"/"Your request").
--
-- SAFE TO RUN ONCE ON PRODUCTION: every statement is idempotent and additive.
-- It does NOT create or drop any table and does NOT delete or modify any row.
-- It only replaces functions, swaps one RLS policy, revokes a grant, and adds an
-- index. Paste the whole file into Supabase -> SQL Editor -> New query -> Run.
-- =============================================================================

-- ── C2: helpers become SECURITY DEFINER (breaks the staff-policy recursion) ──
create or replace function is_staff() returns boolean
  language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from staff s where s.user_id = auth.uid() and s.active);
$$;

create or replace function is_admin() returns boolean
  language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from staff s where s.user_id = auth.uid()
                 and s.active and s.role = 'Administrator');
$$;

create or replace function my_role() returns text
  language sql stable security definer set search_path = public, pg_temp as $$
  select role from staff where user_id = auth.uid() limit 1;
$$;

-- ── MA4: leads visible to sales + admin, roles[]-aware (mirrors isSalesOrAdmin) ──
-- The app authorizes off the staff.roles[] array (a staffer can hold several
-- roles) with a scalar staff.role fallback, so the leads policy must do the same.
-- Visible to Administrator, Business Manager, Sales Manager, Account manager, and
-- Sales staff — matching isSalesOrAdmin() in the UI, so the pipeline never renders
-- empty for someone the app let onto the page. (An earlier scalar my_role() version
-- of this policy hid leads from anyone whose access came from the roles[] array.)
create or replace function is_sales() returns boolean
  language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from staff s
    where s.user_id = auth.uid() and s.active
      and (
        s.roles && array['Administrator','Business Manager','Sales Manager','Account manager','Sales staff']::text[]
        or s.role in ('Administrator','Business Manager','Sales Manager','Account manager','Sales staff')
      )
  );
$$;
drop policy if exists leads_staff on leads;
drop policy if exists leads_sales on leads;
create policy leads_sales on leads for all using (is_sales()) with check (is_sales());

-- ── C1 + created_by fix: replace the RPC body, then lock down EXECUTE ────────
-- CREATE OR REPLACE keeps the existing privileges; the REVOKE below then removes
-- public/anon/authenticated, leaving Supabase's direct grant to service_role.
create or replace function create_client_after_payment(
  p_email text, p_business text, p_contact text, p_phone text,
  p_ref text, p_items jsonb, p_quotes jsonb, p_paid_cents int,
  p_start date, p_rep_code text default ''
) returns uuid language plpgsql security definer as $$
declare v_client uuid;
begin
  insert into clients (email, business, contact, phone, rep_code)
  values (lower(p_email), p_business, p_contact, p_phone, p_rep_code)
  on conflict (email) do update
    set business = coalesce(excluded.business, clients.business),
        contact  = coalesce(excluded.contact,  clients.contact),
        phone    = coalesce(excluded.phone,    clients.phone)
  returning id into v_client;

  insert into bookings (client_id, ref, items, quotes, paid_cents, start_date)
  values (v_client, p_ref, p_items, p_quotes, p_paid_cents, p_start);

  -- Purchased services are staff-owned and already in flight, so they land in
  -- "In progress" as created_by 'staff' (not the client's default "Requested"/
  -- "Your request"), which also surfaces them in the staff delivery queue.
  insert into client_tasks (client_id, title, service, due_date, paid, booking_ref, created_by, column_name)
  select v_client, i->>'name', i->>'svc', p_start, true, p_ref, 'staff', 'In progress'
  from jsonb_array_elements(p_items) i;

  return v_client;
end $$;

revoke execute on function create_client_after_payment(
  text, text, text, text, text, jsonb, jsonb, integer, date, text
) from public, anon, authenticated;

-- ── MA7: one booking per Stripe PaymentIntent (webhook idempotency) ──────────
-- NOTE: if this errors on a duplicate key, an earlier non-idempotent webhook
-- already wrote two bookings sharing a stripe_payment_intent; de-duplicate those
-- rows first, then re-run this statement. It creates only an index — no data is
-- touched.
create unique index if not exists bookings_stripe_pi_unique
  on bookings (stripe_payment_intent) where stripe_payment_intent is not null;
