# DBW News — website

Static HTML/CSS/JS for dbw-news.com, built from the Claude Design handoff in
`../project`. No build step: upload this folder to any static host.

## Pages

| Page | Built from |
| --- | --- |
| `issue-archive.html` | `project/Issue Archive.dc.html` |
| `sign-in.html` | `project/Sign In.dc.html` |
| `index.html` | `project/DBW News Home.dc.html` (preview version: masthead, the issue on the stand, every issue) |
| `member-profile.html` | `project/Member Profile.dc.html` (Subscription and Settings tabs) |
| `manage.html` | Staff workspace (new): issues, covers, page scans from a PDF, archive articles, members' levels, staff |
| `article.html` | `project/Article Template.dc.html`: one story, `article.html?slug=…`, with the paywall card |
| `policies.html` | `project/Policies.dc.html` (v1.1, renamed to Dynamic Black Women Media, Inc.) |

## Shared files

- `assets/css/dbw.css` — colours, type and components for every page
- `assets/js/config.js` — Supabase keys and every cross-page link (`routes`)
- `assets/js/issues.js` — the issue calendar. **Add one line per new issue.**
- `assets/js/account.js` — who is signed in, and their membership level
- `assets/js/page.js` — top bar, routes and Back link for simple pages
- `assets/vendor/supabase-2.119.0.js` — the Supabase library, hosted here and pinned to one version
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

## The staff workspace (`manage.html`)

Run all three migrations first. Then make the first administrator, once:
create an account on the site with your own email, and in the Supabase SQL
editor run

```sql
insert into public.staff (user_id, role)
select id, 'admin' from auth.users where email = 'YOUR-EMAIL';
```

From then on, add and remove staff on the workspace's Staff tab. Editors
manage issues, page scans and articles; administrators also set members'
levels and the staff list. The database enforces both.

The issue calendar now lives in the `issues` table. `assets/js/issues.js`
keeps a copy that the site shows only when the database cannot be reached.

## Adding an issue's pages

Easiest: in the workspace, Page scans → choose the issue → choose the PDF.
It is split into pages in the browser and uploaded. By hand:

Upload scans to the `issue-pages` bucket as `YYYY-MM/001.jpg`, `002.jpg`, …
(zero-padded, so they sort in page order). The archive's reader shows them
two at a time and works out the page count itself.

## Articles

Run the fourth migration (`…030000_articles.sql`). Stories live in
`archive_articles` (listing) and `article_bodies` (the text). Readers get the
text through `read_article(slug)`, which applies the paywall in the database:
free stories to everyone; stories over a year old to any account; newer ones
to site levels; everyone else the first two paragraphs.

Bring the Wix blog over from the workspace: Articles → "Bring articles over
from Wix" → choose the export's `.md` (and `.json`) files. Old addresses
`/post/<slug>` redirect to `article.html?slug=<slug>` (see `_redirects`).
Cover images still load from Wix's image servers; copy them over before the
Wix site is closed.

## How accounts work

- Every new account starts **free**. Choosing a paid plan on the form sends
  her to `checkout.html` (after confirming her email); the checkout and its
  Stripe webhook are what set `profiles.tier`. The form can never grant a level.
- "Keep me signed in" unticked keeps the session for that browser tab only.
- Wrong password and unknown address get the same message, and "forgot your
  password" answers the same way whether or not the address has an account.

## Not built yet

These links point at pages that still need building: `shop.html`,
`checkout.html` (Stripe), `community.html`, `what-you-get.html`,
`letters.html`, `newsroom-portal.html`, `transparency.html`,
`public-documents.html`, `prize-rules.html` and `issues/YYYY-MM.html`
("What is in it"). The account page's Free to Me, Benefits and Saved Reading
tabs come with the features they describe.
