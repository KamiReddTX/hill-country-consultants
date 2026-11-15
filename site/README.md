# DBW News — website

Static HTML/CSS/JS for dbw-news.com, built from the Claude Design handoff in
`../project`. No build step: upload this folder to any static host.

## Pages

| Page | Built from |
| --- | --- |
| `issue-archive.html` | `project/Issue Archive.dc.html` |

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
3. Put the project URL and **publishable (anon)** key in `assets/js/config.js`.
   Never the service-role key.

## Adding an issue's pages

Upload scans to the `issue-pages` bucket as `YYYY-MM/001.jpg`, `002.jpg`, …
(zero-padded, so they sort in page order). The archive's reader shows them
two at a time and works out the page count itself.

## Not built yet

These links point at pages that still need building: `index.html`,
`shop.html`, `sign-in.html` (sign-in and sign-up), `member-profile.html`,
`letters.html` and `issues/YYYY-MM.html` ("What is in it"). Until
`sign-in.html` exists, nobody can create an account from the site.
