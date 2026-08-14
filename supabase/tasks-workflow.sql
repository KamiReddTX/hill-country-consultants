-- Hill Country Consultants — Task board workflow (Phase 1)
-- =============================================================================
-- Adds the fields + file table + RPCs that power the full task lifecycle:
-- Requested -> In progress -> In review -> Delivered, with client-uploaded
-- documents, client approve / request-changes, and a "call the client" flag.
--
-- Also: purchased services now seed into "Requested" (not "In progress") so an
-- AM/VA accepts & assigns them after the kickoff call.
--
-- SAFE TO RUN ONCE ON PRODUCTION: additive + idempotent. Paste the whole file
-- into Supabase -> SQL Editor -> New query -> Run.
-- =============================================================================

-- ── task fields ─────────────────────────────────────────────────────────────
alter table client_tasks add column if not exists details text;
alter table client_tasks add column if not exists approved_at timestamptz;
alter table client_tasks add column if not exists needs_clarification boolean not null default false;

-- ── uploaded documents for a task ───────────────────────────────────────────
create table if not exists client_task_files (
  id          uuid primary key default gen_random_uuid(),
  task_id     uuid not null references client_tasks(id) on delete cascade,
  client_id   uuid not null references clients(id) on delete cascade,
  name        text not null,
  path        text not null,
  size        int,
  uploaded_by text default 'client',
  created_at  timestamptz not null default now()
);
alter table client_task_files enable row level security;

create policy task_files_read on client_task_files for select
  using (exists (select 1 from clients c where c.id = client_task_files.client_id
                 and (c.user_id = auth.uid() or is_staff())));
create policy task_files_write on client_task_files for all
  using (is_staff() or exists (select 1 from clients c where c.id = client_task_files.client_id and c.user_id = auth.uid()))
  with check (is_staff() or exists (select 1 from clients c where c.id = client_task_files.client_id and c.user_id = auth.uid()));

-- Private bucket for the documents (the app mediates all access via service role).
insert into storage.buckets (id, name, public) values ('task-files', 'task-files', false)
  on conflict (id) do nothing;

-- ── client-safe transitions (clients can't UPDATE client_tasks under RLS) ────
create or replace function client_approve_task(p_task uuid) returns void
  language sql security definer set search_path = public, pg_temp as $$
  update client_tasks set column_name = 'Delivered', approved_at = now(), needs_clarification = false
  where id = p_task
    and client_id in (select id from clients where user_id = auth.uid())
    and column_name = 'In review';
$$;

create or replace function client_request_changes(p_task uuid) returns void
  language sql security definer set search_path = public, pg_temp as $$
  update client_tasks set column_name = 'In progress', needs_clarification = true
  where id = p_task
    and client_id in (select id from clients where user_id = auth.uid())
    and column_name = 'In review';
$$;

revoke execute on function client_approve_task(uuid) from public, anon;
revoke execute on function client_request_changes(uuid) from public, anon;
grant execute on function client_approve_task(uuid) to authenticated;
grant execute on function client_request_changes(uuid) to authenticated;

-- ── purchased services now start in "Requested" ─────────────────────────────
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

  -- Purchased services land in "Requested" (paid), for an AM/VA to accept &
  -- assign after the kickoff call.
  insert into client_tasks (client_id, title, service, due_date, paid, booking_ref, created_by, column_name)
  select v_client, i->>'name', i->>'svc', p_start, true, p_ref, 'staff', 'Requested'
  from jsonb_array_elements(p_items) i;

  return v_client;
end $$;

revoke execute on function create_client_after_payment(
  text, text, text, text, text, jsonb, jsonb, integer, date, text
) from public, anon, authenticated;
