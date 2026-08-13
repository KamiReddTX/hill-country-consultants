# Hill Country Consultants

Production build of the public marketing + booking site and the two login-gated
portals (Client and Employee), on **Next.js (App Router) + TypeScript + Tailwind**,
backed by **Supabase** (Postgres, Auth, RLS, Storage), **Stripe** Checkout, and
**Resend** for transactional email.

Brand — do not deviate: forest `#234b34`, cream `#f6f1e6`, gold `#c2a24a`,
charcoal `#20241f`. Headings **Fraunces**, body **Inter**. The firm is **hybrid**;
AI is something sold (training + workflow setup), never how work is delivered.

---

## Build status

| Phase | Scope | State |
|---|---|---|
| 1 | Foundation: brand system, Supabase wiring, typed schema, auth gating, public shell + home | **Done** |
| 2 | All public pages (14 services + details, 6 industries, plans, training + 8 classes, about, FAQ, get-started, 4 legal) + booking/quote flow | **Done** |
| 3 | Stripe Checkout route + webhook + Resend emails | **Built** — needs your Stripe + Resend keys to run |
| 4 | Client portal `/portal` — 8 tabs, RLS-scoped, honest empty states | **Done** |
| 5 | Employee portal `/staff` — role-based tabs + admin layer | **Done** |
| 6 | Seed script (`npm run seed`) | **Done** |

The full app is code-complete. What remains is yours: run the SQL, set env vars,
deploy, add Stripe/Resend keys, connect the domain, and walk the four verification
journeys. Those steps need your accounts — see `SETUP.md`.

**Payments & email endpoints (Phase 3, code complete):**
`POST /api/checkout` creates a Stripe Checkout Session (full or 50% deposit) and
carries the consent timestamp + payer IP + scope snapshot in metadata.
`POST /api/stripe/webhook` (on `checkout.session.completed`) calls
`create_client_after_payment`, writes the consent/dispute evidence onto the
booking, invites the client to sign in, and emails the confirmation with portal
access and the 48-hour review notice. Point the Stripe webhook at
`https://YOUR-DOMAIN/api/stripe/webhook`.

The verbatim content model is already extracted into `content/` (pricing, services
meta, site constants) so Phase 2 pages are assembly, not rewriting.

---

## Getting started (local)

```bash
npm install
cp .env.example .env.local     # then fill in the values (see below)
npm run dev                     # http://localhost:3000
```

`npm run typecheck` runs the TypeScript compiler; `npm run build` produces the
production build Vercel will run.

---

## Environment variables

Set these in `.env.local` for development and in **Vercel → Project → Settings →
Environment Variables** for production. Never expose the service-role key or
Stripe secret to the browser (only `NEXT_PUBLIC_*` reaches the client).

| Variable | Where it comes from | Used by |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Your live URL | metadata, emails, Stripe redirects |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API | browser + server clients |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API | browser + server clients |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API | **server only** — webhook, seed |
| `STRIPE_SECRET_KEY` | Stripe → Developers → API keys | checkout + webhook |
| `STRIPE_WEBHOOK_SECRET` | Stripe → Developers → Webhooks | webhook signature check |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe → Developers → API keys | client redirect to Checkout |
| `RESEND_API_KEY` | Resend → API keys | transactional email |
| `EMAIL_FROM`, `EMAIL_REPLY_TO` | Your verified sender | transactional email |

---

## Supabase setup

Full detail in `supabase/README.md`. Short version:

1. **Run the schema.** Supabase → SQL Editor → paste `supabase/schema.sql` → Run.
   This creates all 11 tables, turns on **row-level security** for every one, and
   installs `create_client_after_payment` (called by the Stripe webhook). Then run
   `supabase/migrations/0001_booking_consent.sql` — an additive migration that adds
   the consent timestamp, payer IP and scope snapshot columns to `bookings` (the
   "all sales final" dispute evidence). `schema.sql` itself stays unchanged.
2. **Enable email auth.** Authentication → Providers → Email (with Confirm email).
   Set Authentication → URL Configuration → Site URL to your domain.
3. **Make yourself admin** (see next section).

RLS is what makes client isolation real: a signed-in client can only ever read
their own rows. The app never relies on front-end filtering alone.

---

## Runbook

### How to add a staff member
1. Supabase → Authentication → Users → **Invite user** (they set their own password).
2. Link them to a `staff` row (SQL Editor), choosing the exact role string:

```sql
insert into staff (user_id, email, name, role, rate, employee_code, hourly)
select id, email, 'Assistant Name', 'Virtual assistant', 22.00, 'HCC-VA-01', true
from auth.users where email = 'assistant@hillcountryconsultants.com';
```

Roles must match exactly: `Virtual assistant`, `Sales / account manager`,
`Submittals specialist`, `Documentation specialist`, `Design specialist`,
`Media / publishing`, `Grants specialist`, `Administrator`.

Once the Admin tab ships (Phase 5), you add staff from the portal instead — it
writes the same `staff` row.

### How to make the first administrator
```sql
insert into staff (user_id, email, name, role, hourly)
select id, email, 'Your Name', 'Administrator', false
from auth.users where email = 'admin@hillcountryconsultants.com';
```

### How to issue a client login
A booking creates the client automatically (Stripe webhook →
`create_client_after_payment`). To grant portal access, invite that same email:
Supabase → Authentication → Users → **Invite** → the client sets a password and
signs in at `/portal`. RLS ties `clients.user_id` to their auth user, so they see
only their own account. (Manual creation for a non-paying client: insert a
`clients` row, then invite the email.)

### How to run payroll
Time is tracked in `punches` (each punch carries its `staff_id`; nobody can clock
out for someone else — only admins can force a clock-out). Pay periods are two
weeks anchored to **2026-01-05**. In the Admin tab (Phase 5): pick the period,
review each employee's shifts (shifts over 4 hours are flagged), **Approve** to
write a `timesheet_approvals` row, then **Print**. Gross = approved hours × the
person's `rate`. Unattributed punches stay out of totals until an admin assigns
them.

---

### Seed test data (optional)

With `SUPABASE_SERVICE_ROLE_KEY` set, `npm run seed` creates one admin, one VA, one
sales rep, and one test client (with a sample booking, task, work-log entry,
deliverable and a pipeline lead so every tab shows data):

| Sign-in | Where | Role |
|---|---|---|
| `admin@hillcountryconsultants.com` | `/staff` | Administrator |
| `va@hillcountryconsultants.com` | `/staff` | Virtual assistant (hourly) |
| `sales@hillcountryconsultants.com` | `/staff` | Sales / account manager |
| `dana@whitfieldmech.com` | `/portal` | Test client |

All are created with a default password printed by the script — **change them
immediately**. The four SQL migrations (`0001`–`0004`) are already bundled into
`supabase/setup-all.sql`, so the single paste in Step 2 covers everything the
portals need (consent columns, client/staff link functions, lead→client convert).

## Deploy to Vercel

1. Push this folder to a Git repo (GitHub/GitLab/Bitbucket).
2. Vercel → **Add New → Project** → import the repo. Framework preset: **Next.js**.
3. Add every environment variable above (Production + Preview).
4. **Deploy.** You get a `*.vercel.app` URL immediately.
5. Point Stripe's webhook at `https://YOUR-DOMAIN/api/stripe/webhook` and set
   Supabase Auth Site URL to your domain (Phase 3 wires these endpoints).

## Connect your custom domain

Do this on Vercel once the project is deployed:

1. **Vercel → Project → Settings → Domains → Add.** Enter your domain, e.g.
   `hillcountryconsultants.com`. Add `www.hillcountryconsultants.com` too — Vercel
   will offer to redirect one to the other (apex → www or www → apex, your call).
2. Vercel shows the DNS records to create. At your **domain registrar** (GoDaddy,
   Namecheap, Cloudflare, Squarespace, wherever the domain lives), add them:
   - **Apex / root** (`hillcountryconsultants.com`): an **A record** →
     `76.76.21.21`.
     *(Or, simplest of all: change the domain's nameservers to the ones Vercel
     lists and let Vercel manage DNS — then you skip the individual records.)*
   - **www**: a **CNAME** → `cname.vercel-dns.com`.
3. Save. DNS propagation is usually minutes, up to 48 hours. Vercel shows
   "Valid Configuration" when it sees the records.
4. **SSL is automatic** — Vercel issues and renews the HTTPS certificate once the
   domain verifies. No action needed.
5. **Update two settings to the new domain** so links and emails are correct:
   - `NEXT_PUBLIC_SITE_URL` in Vercel env → `https://hillcountryconsultants.com`
     (then redeploy).
   - Supabase → Authentication → URL Configuration → **Site URL** → the same, so
     client/staff invite and magic-link emails point at the real site.

> If your domain is on **Cloudflare**: add the same A / CNAME records, and set the
> proxy status to **DNS only** (grey cloud) for the Vercel records while it
> verifies, or use Cloudflare's nameserver method. Turn the proxy back on after.

---

## Verify before launch (you run these — they need your live accounts)

- [ ] Sign in as a client → confirm you see only your own bookings.
- [ ] Sign in as a non-admin employee → confirm no client access codes appear.
- [ ] Take a real test payment → client, booking and tasks all appear.
- [ ] Confirmation email arrives with the portal link.
- [ ] Counsel reviews Terms, Refund & Cancellation, and Privacy.

## Project layout

```
app/
  layout.tsx              root: fonts + metadata
  (marketing)/           public site (header + footer shell)
    layout.tsx  page.tsx  services/ plans/ training/ about/ faq/ get-started/
    book/ policies/ terms/ refund-policy/ privacy/
  portal/login/          client sign-in (portal tabs: Phase 4)
  staff/login/           staff sign-in (staff tabs: Phase 5)
components/               site-header, site-footer, image-slot, coming-soon
content/                  verbatim data — pricing, site (services + legal next)
lib/
  database.types.ts       typed schema (11 tables + functions)
  auth.ts                 getUser / getStaff / getClient / role helpers
  supabase/               client.ts, server.ts, middleware.ts
middleware.ts            gates /portal and /staff, refreshes the session
supabase/schema.sql      run this in Supabase (RLS + post-payment function)
```
