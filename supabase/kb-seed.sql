-- Hill Country Consultants — Knowledge base seed (Team playbook)
-- =============================================================================
-- Publishes the staff playbook into the portal Knowledge base so every employee
-- can read it in-app. Idempotent: each article inserts only if its title isn't
-- already present, so re-running is safe. Edit articles in-app after seeding.
-- Bodies are plain text (the KB renders whitespace as-is).
--
-- Run in the Supabase SQL Editor.
-- =============================================================================

insert into kb_articles (title, category, body, tags)
select 'Roles & access — who sees and does what', 'Team playbook', $body$Roles are assigned in Directory → Roles; an employee can hold several at once.

- Administrator: everything — Finance, Vendors, Audit log, Payroll, plus all manager and staff surfaces. Final approval on money, clients, hires, policy.
- Business Manager: Directory, Billing & AR, Renewals, Contracts, Capacity, Clients, Daily/Delivery/Reports, Sales console. Not the Admin-only Finance/Vendors/Audit/Payroll.
- Sales Manager: full Directory (roster + hiring pipeline + staff management) and the Sales console.
- Account manager / Sales staff: sales tabs, Clients, Daily, Delivery, Reports for their accounts.
- Delivery specialists (VA, Submittals, Docs, Design, Media, Grants): their client work, Knowledge base, Messages, My profile, Timesheet if hourly.
- Every employee: Dashboard, Knowledge base, Messages, My profile (Time off + IT/Security acknowledgment).

A staffer sees a client only if they are privileged, own it, or are on its team. Clients see only their own data.$body$, array['roles','access','permissions']
where not exists (select 1 from kb_articles where title = 'Roles & access — who sees and does what');

insert into kb_articles (title, category, body, tags)
select 'Hiring pipeline — application to employee', 'Team playbook', $body$Applications from the public Careers page land in Directory → Hiring pipeline as cards, grouped by stage: New → Reviewing → Interview → Offer → Hired / Declined.

On each card: rate 1–5, add reviewer notes, move stage (New/Reviewing/Offer), Set up interview (emails the applicant the scheduling link), Decline (emails a courteous note; résumé kept 6 months), or Hire → create employee (creates the staff profile pre-filled, sends welcome/set-password email — pick the role first).

Access: Administrator, Business Manager, Sales Manager.

To post a new role, add it to the Careers content; it appears with its own application form automatically.$body$, array['hiring','careers','applicants']
where not exists (select 1 from kb_articles where title = 'Hiring pipeline — application to employee');

insert into kb_articles (title, category, body, tags)
select 'Client onboarding — the first 30 days', 'Team playbook', $body$When a client signs (paid booking) or is added by hand, a standard onboarding checklist is auto-seeded (Kickoff, Access & credentials, First deliverables, Ongoing cadence). It shows in the client portal and the staff Checklists tab immediately.

The client gets a welcome email outlining the 30-day sequence, plus automated day-3 and day-14 check-ins (once each; active only when CRON_SECRET is configured).

Staff Onboarding tab (per client): kickoff call, 30-day roadmap, credentials collected, first tasks. The client's roadmap lives in their portal; set each phase's status from the Onboarding tab.

Every account: daily work log, Friday weekly report, shared task board kept current.$body$, array['onboarding','clients','checklist']
where not exists (select 1 from kb_articles where title = 'Client onboarding — the first 30 days');

insert into kb_articles (title, category, body, tags)
select 'Time off (PTO) — requesting and approving', 'Team playbook', $body$Employees: My profile → Time off. Submit a request (PTO / Sick / Unpaid, start/end date, optional note). Track status there; cancel while still pending.

Managers (Admin / Business Manager): the Capacity page shows a "Time-off requests awaiting your decision" panel with Approve / Deny.

Approved time off in the current week reduces that person's effective weekly target — the Capacity table's "Off this wk" column adjusts utilization and headroom automatically.$body$, array['pto','time off','capacity']
where not exists (select 1 from kb_articles where title = 'Time off (PTO) — requesting and approving');

insert into kb_articles (title, category, body, tags)
select 'Billing & AR — invoices, plans, collections', 'Team playbook', $body$Set a client's plan (Foundation / Momentum / Enterprise) on the client hub — it drives MRR and their monthly allotment.

Plan invoices: draft the month's from Billing & AR (one per plan client per month); move draft → sent → paid, or void. One-off invoices cover overage or project work. Per-client allotment tracks automatically with manual adjustments available.

Finance (Admin): MRR/ARR, MRR by tier, billed-recurring trend, AR outstanding, active clients, expenses vs budget, net profit, and CSV exports (clients, invoices/AR, expenses).

Chase overdue invoices early; the five-business-day grace period applies.$body$, array['billing','invoices','finance']
where not exists (select 1 from kb_articles where title = 'Billing & AR — invoices, plans, collections');

insert into kb_articles (title, category, body, tags)
select 'Capacity & utilization', 'Team playbook', $body$Two reads per person: Logged this week (actual work-log hours vs their weekly target) and Committed VA/wk (the recurring VA-hour allotment of the accounts they own or sit on).

Utilization turns amber at 85%, red at 100%+. Approved time off lowers the effective target for the week. Set each person's weekly target inline. Admin / Business Manager.$body$, array['capacity','utilization']
where not exists (select 1 from kb_articles where title = 'Capacity & utilization');

insert into kb_articles (title, category, body, tags)
select 'Admin runbook — recurring tasks & config', 'Team playbook', $body$Monthly: draft plan invoices; review Finance (MRR, expenses vs budget, net profit); log expenses.
Weekly: confirm Friday reports went out; review Capacity for overload; work the hiring pipeline.
As needed: approve/deny time off; approve proposals/exceptions; review contracts; assign onboarding docs.

Employee documents / NDA: upload reusable docs in Directory → Internal document library, then assign to employees or a whole role to e-sign (DocuSign). The IT/Security acknowledgment is self-served on each profile; Directory shows who has signed.

Audit log (Admin) records create/update/delete/sign actions.

Vercel config: NEXT_PUBLIC_SITE_URL (canonical URL); CRON_SECRET (enables the day-3/day-14 onboarding drip); Stripe keys + webhook secret; Resend EMAIL_FROM; Supabase URL + service key; DocuSign creds.

Migrations live in supabase/*.sql, run by hand in the Supabase SQL Editor. Before go-live, run verify-rls-access.sql and confirm every client-scoped table reads "scoped."$body$, array['admin','runbook','config']
where not exists (select 1 from kb_articles where title = 'Admin runbook — recurring tasks & config');
