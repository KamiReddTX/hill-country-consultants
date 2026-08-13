# Hill Country Consultants — Setup Pack

A no-terminal, browser-only path to a live site. Do the steps in order. Every
paste you need is in this repo. Budget ~60–90 minutes the first time.

You'll use five accounts: **GitHub**, **Vercel**, **Supabase**, **Stripe**,
**Resend** (all have free tiers), plus your **domain registrar**. Create any you
don't have as you reach them.

---

## Step 1 — Put the code on GitHub (no git, no terminal)

1. Unzip `hcc-app-source.zip`. You'll get a folder `hcc-app`.
2. Go to **github.com → New repository**. Name it `hill-country-consultants`,
   Private, **don't** add a README. Create.
3. On the empty repo page: **uploading an existing file**. Open the `hcc-app`
   folder, select **everything inside it** (not the folder itself), and drag it
   into the browser. Wait for upload, then **Commit changes**.
   - Tip: if drag-and-drop misses folders, use "choose your files" and select all.

## Step 2 — Supabase (database + logins)

1. **supabase.com → New project.** Name it, set a strong DB password, pick a
   region near Texas (e.g. `us-east-1`). Wait for it to provision (~2 min).
2. **SQL Editor → New query.** Open `supabase/setup-all.sql` from the repo,
   copy **all** of it, paste, **Run**. You should see the tables appear under
   **Table Editor** (staff, clients, bookings, …). This also enables row-level
   security everywhere.
3. **Authentication → Providers → Email**: enable it, and enable **Confirm email**.
4. **Authentication → URL Configuration → Site URL**: set to your live domain
   later (for now `http://localhost:3000` is fine).
5. **Make yourself admin.** Authentication → Users → **Add user** →
   `admin@hillcountryconsultants.com` (set a password). Then SQL Editor → run the
   `-- make yourself the administrator` block at the bottom of `setup-all.sql`.
6. **Copy your keys.** Project Settings → **API**: keep the **Project URL**, the
   **anon public** key, and the **service_role** key for Step 3.

## Step 3 — Deploy on Vercel

1. **vercel.com → Add New → Project → Import** your GitHub repo. Framework:
   **Next.js** (auto-detected).
2. **Environment Variables** — add these (from Step 2; Stripe/Resend come next,
   paste placeholders for now or add after):

   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_SITE_URL` | your Vercel URL (update to your domain later) |
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon public key |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase service_role key |
   | `STRIPE_SECRET_KEY` | from Step 4 |
   | `STRIPE_WEBHOOK_SECRET` | from Step 4 |
   | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | from Step 4 |
   | `RESEND_API_KEY` | from Step 5 |
   | `EMAIL_FROM` | `Hill Country Consultants <info@hillcountryconsultants.com>` |

3. **Deploy.** You get a `*.vercel.app` URL. Open it — the public site is live.

## Step 4 — Stripe (payments)

1. **stripe.com** → keep **Test mode** on for now. Developers → **API keys**:
   copy the **Secret key** → `STRIPE_SECRET_KEY`, and **Publishable key** →
   `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` in Vercel.
2. Developers → **Webhooks → Add endpoint**:
   - URL: `https://YOUR-VERCEL-URL/api/stripe/webhook`
   - Event: **checkout.session.completed**
   - Create, then copy the **Signing secret** → `STRIPE_WEBHOOK_SECRET` in Vercel.
3. In Vercel, **Redeploy** so the new env vars take effect.
4. Test: on your site, book a fixed-rate item, pay with card `4242 4242 4242 4242`,
   any future date / any CVC. The client, booking and tasks should appear in
   Supabase, and a confirmation email should send (after Step 5).

## Step 5 — Resend (email)

1. **resend.com → API Keys → Create.** Copy → `RESEND_API_KEY` in Vercel.
2. **Domains → Add** `hillcountryconsultants.com` and add the DNS records Resend
   shows at your registrar (so email sends from your address, not a sandbox).
3. Redeploy in Vercel.

## Step 6 — Connect your domain

1. **Vercel → Project → Settings → Domains → Add** `hillcountryconsultants.com`
   (and `www`).
2. At your **registrar**, add what Vercel shows:
   - root → **A record** `76.76.21.21`
   - `www` → **CNAME** `cname.vercel-dns.com`
   - (or point the domain's nameservers at Vercel and skip the records)
3. SSL is automatic. Then set `NEXT_PUBLIC_SITE_URL` (Vercel) and Supabase Auth
   **Site URL** to `https://hillcountryconsultants.com`, and **redeploy**.

## Step 7 — Verify

- [ ] Public site loads on your domain.
- [ ] Test payment → client + booking + tasks appear in Supabase.
- [ ] Confirmation email arrives with the portal link.
- [ ] When ready for real charges: flip Stripe to **Live mode**, swap in the
      live keys, and re-add the live webhook.
- [ ] Have counsel review Terms, Refund & Cancellation, and Privacy.

---

**Stuck on any step?** Tell me which number and what you see — I can look at your
screen and walk you through that exact click.
