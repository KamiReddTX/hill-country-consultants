import crypto from "node:crypto";
import { createServiceClient } from "@/lib/supabase/server";
import { sendAppointmentAlert } from "@/lib/email";

/**
 * Read-only Google Calendar sync via a service account. Safe-by-default: if the
 * GOOGLE_* env vars aren't set, everything no-ops. Detects appointments a client
 * booked (matched by attendee email) and flags the owner + managers so they can
 * add the right staff to the invite. Dedup via the synced_calendar_events table.
 */

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SCOPE = "https://www.googleapis.com/auth/calendar.readonly";

export function gcalConfigured(): boolean {
  return !!(process.env.GOOGLE_SA_CLIENT_EMAIL && process.env.GOOGLE_SA_PRIVATE_KEY && process.env.GOOGLE_CALENDAR_IDS);
}
function calendarIds(): string[] {
  return (process.env.GOOGLE_CALENDAR_IDS || "").split(",").map((s) => s.trim()).filter(Boolean);
}
const b64url = (input: Buffer | string) =>
  Buffer.from(input).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

async function accessToken(): Promise<string> {
  const email = process.env.GOOGLE_SA_CLIENT_EMAIL!;
  const key = (process.env.GOOGLE_SA_PRIVATE_KEY || "").replace(/\\n/g, "\n");
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = b64url(JSON.stringify({ iss: email, scope: SCOPE, aud: TOKEN_URL, iat: now, exp: now + 3600 }));
  const signer = crypto.createSign("RSA-SHA256");
  signer.update(`${header}.${claim}`);
  signer.end();
  const assertion = `${header}.${claim}.${b64url(signer.sign(key))}`;
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
  });
  const j: any = await res.json();
  if (!j.access_token) throw new Error(`Google token error: ${JSON.stringify(j).slice(0, 200)}`);
  return j.access_token as string;
}

type GEvent = { id: string; summary: string; startAt: string | null; attendees: string[]; calendarId: string };

async function listRecentEvents(days = 3): Promise<GEvent[]> {
  const token = await accessToken();
  const updatedMin = new Date(Date.now() - days * 86400000).toISOString();
  const out: GEvent[] = [];
  for (const cal of calendarIds()) {
    const url = new URL(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(cal)}/events`);
    url.searchParams.set("singleEvents", "true");
    url.searchParams.set("orderBy", "updated");
    url.searchParams.set("updatedMin", updatedMin);
    url.searchParams.set("maxResults", "100");
    url.searchParams.set("showDeleted", "false");
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) { console.warn("[gcal] list", cal, res.status); continue; }
    const j: any = await res.json();
    for (const e of j.items || []) {
      out.push({
        id: e.id, summary: e.summary || "",
        startAt: e.start?.dateTime || e.start?.date || null,
        attendees: (e.attendees || []).map((a: any) => String(a.email || "").toLowerCase()).filter(Boolean),
        calendarId: cal,
      });
    }
  }
  return out;
}

/** Run the sync. Returns a small summary. No-op (and returns disabled) if unset. */
export async function runCalendarSync(days = 3): Promise<{ disabled?: boolean; found: number; flagged: number }> {
  if (!gcalConfigured()) return { disabled: true, found: 0, flagged: 0 };
  const admin = createServiceClient();
  const events = await listRecentEvents(days);
  if (!events.length) return { found: 0, flagged: 0 };

  // Skip events already processed.
  const ids = events.map((e) => e.id);
  const { data: seenRows } = await admin.from("synced_calendar_events").select("event_id").in("event_id", ids);
  const seen = new Set(((seenRows ?? []) as any[]).map((r) => r.event_id));
  const fresh = events.filter((e) => !seen.has(e.id));
  if (!fresh.length) return { found: events.length, flagged: 0 };

  // Build lookups: attendee email → client, and owner email per client.
  const [{ data: clients }, { data: contacts }, { data: staff }] = await Promise.all([
    admin.from("clients").select("id, email, business, contact, assigned_to, kickoff_at, kickoff_confirmed_at"),
    admin.from("client_contacts").select("client_id, email"),
    admin.from("staff").select("id, email"),
  ]);
  const emailToClient = new Map<string, any>();
  for (const c of (clients ?? []) as any[]) if (c.email) emailToClient.set(String(c.email).toLowerCase(), c);
  const clientById = new Map(((clients ?? []) as any[]).map((c) => [c.id, c]));
  for (const ct of (contacts ?? []) as any[]) if (ct.email && clientById.has(ct.client_id)) emailToClient.set(String(ct.email).toLowerCase(), clientById.get(ct.client_id));
  const staffEmail = new Map(((staff ?? []) as any[]).map((s) => [s.id, s.email]));
  const notify = process.env.ADMIN_NOTIFY_EMAIL || "info@hillcountryconsultants.com";
  const site = process.env.NEXT_PUBLIC_SITE_URL || "";

  let flagged = 0;
  for (const e of fresh) {
    // Match by any attendee email; fall back to summary containing a client's email.
    let client: any = null;
    for (const a of e.attendees) { if (emailToClient.has(a)) { client = emailToClient.get(a); break; } }
    if (!client) {
      for (const [em, c] of emailToClient) { if (em && e.summary.toLowerCase().includes(em)) { client = c; break; } }
    }

    await admin.from("synced_calendar_events").insert({
      event_id: e.id, calendar_id: e.calendarId, client_id: client?.id ?? null, summary: e.summary.slice(0, 300), start_at: e.startAt,
    });
    if (!client) continue;

    const isKickoff = /kickoff|onboard|strategy/i.test(e.summary);
    if (isKickoff && !client.kickoff_confirmed_at && !client.kickoff_at) {
      await admin.from("clients").update({ kickoff_at: e.startAt || new Date().toISOString() }).eq("id", client.id);
    }
    const recipients = new Set<string>([notify]);
    const ownerEmail = client.assigned_to ? staffEmail.get(client.assigned_to) : null;
    if (ownerEmail) recipients.add(ownerEmail);
    const whenText = e.startAt ? new Date(e.startAt).toLocaleString("en-US") : "";
    try {
      await sendAppointmentAlert({
        to: [...recipients], clientName: client.business || client.contact || client.email,
        summary: e.summary || "Appointment", whenText, portalUrl: site ? `${site}/staff` : "",
      });
      flagged++;
    } catch (err) { console.warn("[gcal] alert", e.id, err); }
  }
  return { found: events.length, flagged };
}
