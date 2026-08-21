# Hill Country Consultants — Staff & Ops Playbook

How the internal system works and how to run it, by role and by workflow. This mirrors the articles seeded into the staff portal **Knowledge base** (`supabase/kb-seed.sql`), kept here as the master reference.

---

## Roles & access — who sees and does what

Roles are assigned in **Directory → Roles** (an employee can hold several at once). Access is enforced two ways: what appears in the nav, and a re-check on every sensitive page and action, plus database row-level security. Hiding a tab is never the only guard.

| Role | Gets access to |
|---|---|
| **Administrator** | Everything: Finance, Vendors, Audit log, Payroll, plus all Business-Manager and staff surfaces. Final approval on money, clients, hires, and policy. |
| **Business Manager** | Directory, Billing & AR, Renewals, Contracts, Capacity, Clients, Daily/Delivery/Reports, Sales console — everything except Admin-only Finance/Vendors/Audit/Payroll. |
| **Sales Manager** | Full Directory (roster, hiring pipeline, staff management) + the Sales console + client/delivery surfaces. |
| **Account manager / Sales staff** | Sales tabs, Clients, Daily tasks, Delivery, Reports for their accounts. |
| **Delivery specialists** (VA, Submittals, Docs, Design, Media, Grants) | Dashboard, their client work (Daily/Delivery/Clients/Checklists), Knowledge base, Messages, My profile, Timesheet (if hourly). |
| **Every employee** | Dashboard, Knowledge base, Messages, My profile (with Time off + the IT/Security acknowledgment). |

Per-client visibility: a staffer sees a client if they're privileged, own the client, or are on the client's team (`client_assignments`). Clients only ever see their own data.

---

## Hiring pipeline — application to employee

The public **Careers** page lists open roles (`content/careers.ts`). Each posting has a built-in application form; submissions land in **Directory → Hiring pipeline** as cards, grouped by stage.

**Stages:** New → Reviewing → Interview → Offer → Hired / Declined.

**On each card you can:**
- **Rate** the applicant 1–5 and add **reviewer notes**.
- **Move stage** (New / Reviewing / Offer) with the dropdown.
- **Set up interview** — emails the applicant your Google scheduling link and moves them to Interview.
- **Decline** — emails a courteous note (résumé kept on file 6 months) and moves them to Declined.
- **Hire → create employee** — creates the staff profile pre-filled from the application, marks them hired, and sends a welcome/set-password email. Choose their role first.

Access: Administrator, Business Manager, Sales Manager.

To post a new role: add an entry to `content/careers.ts` (title, type, location, pay, summary, body) and it appears automatically with its own application form.

---

## Client onboarding — the first 30 days

When a client signs (paid booking) **or** is added by hand, the system auto-seeds a standard **onboarding checklist** (Kickoff, Access & credentials, First deliverables, Ongoing cadence). It shows in the client's portal and in the staff **Checklists** tab from minute one.

**The client also receives:**
- A **welcome email** laying out the first-30-days sequence (kickoff this week → access & priorities → weekly Friday reports → 30-day review).
- **Day-3 and Day-14 check-in emails** (automated, once each) — *only active once `CRON_SECRET` is set in Vercel; see the admin runbook.*

**Staff onboarding surface (Onboarding tab):** per client, track kickoff call, 30-day roadmap, credentials collected, and first tasks. The client's **30-day roadmap** lives on their portal (`/portal/roadmap`); staff set each phase's status from the Onboarding tab.

Delivery rhythm on every account: daily work log, Friday weekly report, shared task board kept current.

---

## Time off (PTO) — requesting and approving

**Employees:** on **My profile → Time off**, submit a request (PTO / Sick / Unpaid, start/end date, optional note). Track its status there; cancel while it's still pending.

**Managers (Admin / Business Manager):** on the **Capacity** page, a "Time-off requests awaiting your decision" panel lists pending requests with Approve / Deny.

**Capacity effect:** approved time off in the current week reduces that person's effective weekly target — the Capacity table shows an "Off this wk" column and adjusts utilization/headroom automatically.

---

## Billing & AR — invoices, plans, collections

- **Set a client's plan** (Foundation / Momentum / Enterprise) on the client hub; this drives MRR and their monthly allotment.
- **Plan invoices**: draft the month's plan invoices from **Billing & AR**; one per plan client per month. Move them draft → sent → paid, or void.
- **One-off invoices**: create for overage or project work.
- **Allotment**: per-client monthly usage tracks automatically, with manual adjustments available.
- **Finance (Admin):** MRR/ARR, MRR-by-tier, billed-recurring trend, AR outstanding, active clients, and month-by-month expenses vs. budget and net profit. CSV **exports** for clients, invoices/AR, and expenses.

Collections: chase overdue invoices early; the five-business-day grace period applies.

---

## Capacity & utilization

Two reads per person: **logged this week** (actual work-log hours vs. their weekly target) and **committed VA/wk** (the recurring VA-hour allotment of the accounts they own or sit on). Utilization turns amber at 85%, red at 100%+. Approved time off lowers the effective target for the week. Set each person's weekly target inline. Admin / Business Manager.

---

## Admin runbook — recurring tasks & where things live

**Recurring:**
- **Monthly:** draft plan invoices (Billing & AR); review Finance (MRR, expenses vs. budget, net profit); log expenses.
- **Weekly:** confirm Friday reports went out on every account; review Capacity for overload; work the hiring pipeline.
- **As needed:** approve/deny time off; approve proposals/exceptions; review contracts; assign onboarding docs.

**Employee documents / NDA:** upload reusable docs (NDA, W-9, contracts) in **Directory → Internal document library**, then assign to specific employees or a whole role — each lands on the person's profile to e-sign (DocuSign). The **IT/Security & Confidentiality acknowledgment** is separate and self-served on each profile; Directory shows who has signed.

**Audit log (Admin):** records create/update/delete/sign actions across the system.

**Environment / config (Vercel):**
- `NEXT_PUBLIC_SITE_URL` — canonical site URL (used for links, emails, metadata).
- `CRON_SECRET` — set this to enable the day-3/day-14 onboarding drip (a daily Vercel cron hits `/api/cron/onboarding`). Until set, the drip is safely disabled.
- Stripe keys + `STRIPE_WEBHOOK_SECRET`; Resend `EMAIL_FROM`; Supabase URL + service-role key; DocuSign sandbox credentials.

**Database migrations** live in `supabase/*.sql` and are run by hand in the Supabase SQL Editor. Before go-live, run `supabase/verify-rls-access.sql` and confirm every client-scoped table reads "scoped."

---

*Master reference — keep this in sync with the portal Knowledge base if you edit either.*
