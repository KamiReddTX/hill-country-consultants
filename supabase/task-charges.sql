-- Hill Country Consultants — per-task charges (Phase 2)
-- =============================================================================
-- When an AM/VA decides a task needs an extra charge, they set an amount and
-- send a payment link. charge_status: 'none' -> 'sent' -> 'paid'. On payment the
-- Stripe webhook flips the task to 'paid' and moves it into "In progress".
--
-- SAFE TO RUN ONCE ON PRODUCTION: additive. SQL Editor -> New query -> Run.
-- =============================================================================

alter table client_tasks add column if not exists charge_cents  int;
alter table client_tasks add column if not exists charge_status text not null default 'none';
