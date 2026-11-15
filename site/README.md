# DBW News — website

Static HTML/CSS/JS for dbw-news.com, built from the Claude Design handoff in
`../project`. No build step: upload this folder to any static host.

## Pages

| Page | Built from |
| --- | --- |
| `issue-archive.html` | `project/Issue Archive.dc.html` |
| `sign-in.html` | `project/Sign In.dc.html` |

## Shared files

- `assets/css/dbw.css` — colours, type and components for every page
- `assets/js/config.js` — Supabase keys and every cross-page link (`routes`)
- `assets/js/issues.js` — the issue calendar. **Add one line per new issue.**
- `assets/js/account.js` — who is signed in, and their membership level
- `assets/covers/`, `assets/brand/` — web-sized covers and the DBW News seal

## Connecting Supabase

1. Create a Supabase project for DBW News.
2. Run `../supabase/migrations/20261115000000_issue_archive.sql` (SQL editor,
   or `supabase db push`). It creates:
   - `profiles` — one per account, holding the membership level. Readers can
     change their display name and nothing else; levels are set only with the
     service role (a payment webhook, or staff in the dashboard).
   - `archive_articles` — the imported back catalogue (title, date, byline,
     section, issue month, page link). Public to read.
   - the private `issue-pages` storage bucket — only online, everything, VIP
     and business accounts can read it.
3. Authentication settings (Dashboard → Authentication):
   - **Site URL**: `https://www.dbw-news.com`, and add
     `https://www.dbw-news.com/**` under **Redirect URLs** so the confirmation
     and password-reset links can come back to the site.
   - **Minimum password length**: 10, to match the form.
   - **Confirm email**: on. New readers confirm their address before signing in.
   - **Email templates / SMTP**: set the sender to a dbw-news.com address
     before launch; Supabase's built-in mailer is rate-limited and for testing.
4. Put the project URL and **publishable (anon)** key in `assets/js/config.js`.
   Never the service-role key.

## Adding an issue's pages

Upload scans to the `issue-pages` bucket as `YYYY-MM/001.jpg`, `002.jpg`, …
(zero-padded, so they sort in page order). The archive's reader shows them
two at a time and works out the page count itself.

## How accounts work

- Every new account starts **free**. Choosing a paid plan on the form sends
  her to `checkout.html` (after confirming her email); the checkout and its
  Stripe webhook are what set `profiles.tier`. The form can never grant a level.
- "Keep me signed in" unticked keeps the session for that browser tab only.
- Wrong password and unknown address get the same message, and "forgot your
  password" answers the same way whether or not the address has an account.

## Not built yet

These links point at pages that still need building: `index.html`,
`shop.html`, `checkout.html` (Stripe), `member-profile.html`,
`community.html`, `what-you-get.html`, `policies.html`, `letters.html`,
`newsroom-portal.html` and `issues/YYYY-MM.html` ("What is in it").
