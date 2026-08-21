# Google Calendar sync — setup & handoff

This makes the portal **automatically notice appointments a client books** (kickoff calls,
strategy sessions, etc.) and flag the owner + managers so the right staff get added to the
invite — instead of the booking only showing up silently on Google Calendar.

It's **read-only** and **safe-by-default**: until the three env vars below are set, the whole
feature no-ops. Nothing breaks if you never turn it on.

---

## 1. Run the migration

In Supabase → SQL Editor, run `supabase/google-calendar.sql`. It creates the
`synced_calendar_events` dedup table (so the same booking never alerts twice) with RLS.
You should see **"Success. No rows returned."**

## 2. Create a Google Cloud service account (one-time, ~10 min)

1. Go to <https://console.cloud.google.com> → create a project (or reuse one), e.g. **HCC Calendar Sync**.
2. **APIs & Services → Library →** search **Google Calendar API →** click **Enable**.
3. **APIs & Services → Credentials → Create credentials → Service account.**
   - Name it `hcc-calendar-sync`. Skip the optional role/grant steps → **Done**.
4. Open the new service account → **Keys → Add key → Create new key → JSON → Create.**
   A `.json` file downloads. Open it — you'll use two values from it:
   - `client_email` (looks like `hcc-calendar-sync@…iam.gserviceaccount.com`)
   - `private_key` (a long `-----BEGIN PRIVATE KEY-----…` block)

## 3. Share the calendar(s) with the service account

For **each** Google Calendar that receives client bookings (your booking calendar, and any
staff calendar you want watched):

1. Google Calendar → hover the calendar → **⋮ → Settings and sharing.**
2. **Share with specific people → Add people →** paste the service account's `client_email`.
3. Permission: **See all event details** (read-only is enough) → **Send.**
4. Still on that settings page, scroll to **Integrate calendar** and copy the **Calendar ID**
   (often your email, or an `…@group.calendar.google.com` string).

## 4. Set the three env vars in Vercel

Vercel → project **hcc-site-1** → **Settings → Environment Variables** (Production).
Add these, then **redeploy**:

| Name | Value |
|---|---|
| `GOOGLE_SA_CLIENT_EMAIL` | the `client_email` from the JSON |
| `GOOGLE_SA_PRIVATE_KEY` | the `private_key` from the JSON — paste it **exactly**, including the `BEGIN/END` lines. If Vercel mangles the line breaks, replace each real newline with the two characters `\n` so it's one line. The code handles both. |
| `GOOGLE_CALENDAR_IDS` | one or more Calendar IDs from step 3, **comma-separated** (e.g. `you@hcc.com,abc123@group.calendar.google.com`) |

> Keep the JSON file private — treat `private_key` like a password. Never commit it.

## 5. How it runs

- **Daily**, the existing cron (`/api/cron/onboarding`) also pulls the last ~2 days of calendar
  changes.
- **On demand**, managers see a **"Sync calendar now"** button on the staff dashboard
  (only visible once the env vars are set) to pull immediately before a call.

When a synced event's attendee email (or the event title) matches a client on file, the owner
and managers get an **appointment alert** email, and if the title looks like a kickoff
(`kickoff` / `onboard` / `strategy`) the client's kickoff date is set automatically — which also
lights up the **"Kickoff calls to set up"** flag on the dashboard.

## Troubleshooting

- **Button says "Calendar sync isn't configured yet."** → one of the three env vars is missing
  or the deploy predates them. Re-check spelling and redeploy.
- **No alerts even though a booking came in.** → confirm the calendar was *shared with the
  service account* (step 3) and its ID is in `GOOGLE_CALENDAR_IDS`. The client's email on the
  invite must match `clients.email` or a `client_contacts.email` on file.
- **Google token error in logs** → the `private_key` newlines are wrong; re-paste using the `\n`
  form described above.
