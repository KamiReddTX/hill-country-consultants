import { NextResponse, type NextRequest } from "next/server";
import crypto from "crypto";
import { createServiceClient } from "@/lib/supabase/server";
import { sendStaffMessageAlert, sendClientMessageAlert } from "@/lib/email";
import { getClientEmails } from "@/lib/client-contacts";

export const runtime = "nodejs";
export const maxDuration = 60;

const API = "https://api.resend.com";
const emailOf = (s: string) => (String(s || "").match(/<([^>]+)>/)?.[1] || String(s || "")).trim().toLowerCase();
const safeName = (n: string) => String(n || "file").replace(/[^\w.\-]+/g, "_").slice(0, 120);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Verify a Svix-signed Resend webhook (svix-id/timestamp/signature headers). */
function verify(secret: string, id: string, ts: string, sigHeader: string, payload: string): boolean {
  try {
    const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
    const expected = crypto.createHmac("sha256", key).update(`${id}.${ts}.${payload}`).digest("base64");
    const exp = Buffer.from(expected);
    return sigHeader.split(" ").some((part) => {
      const sig = part.split(",")[1];
      if (!sig) return false;
      const got = Buffer.from(sig);
      return got.length === exp.length && crypto.timingSafeEqual(got, exp);
    });
  } catch { return false; }
}

/** Turn reply HTML into readable text: drop quoted history, keep line breaks so
 *  the plain-text quote cutters below can still find "On ... wrote:" markers. */
function htmlToText(html: string): string {
  if (!html) return "";
  let s = String(html);
  s = s.replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<script[\s\S]*?<\/script>/gi, " ");
  // Remove common quoted-reply containers before anything else.
  s = s.replace(/<blockquote[\s\S]*?<\/blockquote>/gi, "\n");
  s = s.replace(/<div[^>]*class="[^"]*(gmail_quote|yahoo_quoted|moz-cite-prefix)[^"]*"[\s\S]*?<\/div>/gi, "\n");
  // Preserve structural breaks as newlines.
  s = s.replace(/<br\s*\/?>/gi, "\n").replace(/<\/(p|div|li|tr|h[1-6])>/gi, "\n");
  s = s.replace(/<[^>]+>/g, " ");
  s = s.replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
  // Collapse runs of spaces/tabs but keep newlines.
  s = s.replace(/[ \t]+/g, " ").replace(/[ \t]*\n[ \t]*/g, "\n").replace(/\n{3,}/g, "\n\n");
  return s.trim();
}

/** Strip quoted history / signatures from a reply (best effort). */
function cleanReply(text: string): string {
  if (!text) return "";
  let out = text.replace(/\r\n/g, "\n");
  const cutters = [
    /\n?On .{0,200}\bwrote:[\s\S]*$/,          // Gmail/Apple: "On <date> <name> wrote:"
    /\n-{3,}\s*Original Message\s*-{3,}[\s\S]*$/i,
    /\n_{5,}[\s\S]*$/,                          // Outlook divider
    /\n>{1,}.*[\s\S]*$/,                        // quoted ">" lines to the end
    /\nFrom: .+[\s\S]*$/,                       // Outlook header block
    /\nSent from my \w+[\s\S]*$/i,              // mobile signature
  ];
  for (const c of cutters) out = out.replace(c, "");
  return out.trim();
}

export async function POST(req: NextRequest) {
  const payload = await req.text();
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  const id = req.headers.get("svix-id") || "";
  const ts = req.headers.get("svix-timestamp") || "";
  const sig = req.headers.get("svix-signature") || "";
  if (!secret || !verify(secret, id, ts, sig, payload)) {
    return NextResponse.json({ error: "bad signature" }, { status: 401 });
  }

  let event: any;
  try { event = JSON.parse(payload); } catch { return NextResponse.json({}, { status: 200 }); }
  if (event?.type !== "email.received") return NextResponse.json({}, { status: 200 });

  const data = event.data || {};
  const emailId: string = data.email_id;
  const from = emailOf(data.from);
  const selfDomain = (process.env.EMAIL_FROM || "").toLowerCase();
  if (from && selfDomain.includes(from)) return NextResponse.json({}, { status: 200 });

  const recipients: string[] = [...(data.to || []), ...(data.cc || []), ...(data.received_for || [])].map(emailOf);
  const tokenMatch = recipients.map((r) => r.match(/^reply\+([a-z0-9]+)@/i)).find(Boolean);
  const token = tokenMatch?.[1];
  if (!token) return NextResponse.json({ ok: true, note: "no reply token" }, { status: 200 });

  const admin = createServiceClient();
  const { data: client } = await admin.from("clients").select("id,email,assigned_to,business,contact,reply_token").eq("reply_token", token).maybeSingle();
  if (!client) return NextResponse.json({ ok: true, note: "no client" }, { status: 200 });
  const clientId = (client as any).id as string;

  const key = process.env.RESEND_API_KEY;
  const auth = { headers: { Authorization: `Bearer ${key}` } };

  // The webhook fires the instant the email lands; the parsed body + attachments
  // can lag a beat behind. Retry the retrieve until the body is present.
  let bodyText = "";
  let retrieveOk = false;
  const bodyTries = 3;
  for (let attempt = 0; attempt < bodyTries; attempt++) {
    try {
      const r = await fetch(`${API}/emails/receiving/${emailId}?html_format=cid`, auth);
      if (r.ok) {
        const em = await r.json();
        const raw = String(em?.text || "").trim() || htmlToText(em?.html || "");
        const cleaned = cleanReply(raw);
        // Never drop the message: if quote-stripping empties a bottom-posted
        // reply, keep the raw text (trimmed) instead of losing it entirely.
        bodyText = (cleaned || raw).slice(0, 8000).trim();
        retrieveOk = true;
        if (bodyText) break;               // got real content — stop retrying
      } else {
        console.warn("[inbound] retrieve status", r.status);
      }
    } catch (e) { console.warn("[inbound] fetch body", e); }
    if (attempt < bodyTries - 1) await sleep(600 * (attempt + 1)); // 0.6s, 1.2s
  }

  let sender: "client" | "staff" = "client";
  let authorName: string | null = (client as any).contact || null;
  if (from && from !== String((client as any).email || "").toLowerCase()) {
    const { data: staff } = await admin.from("staff").select("id,name,email").ilike("email", from).maybeSingle();
    if (staff) { sender = "staff"; authorName = (staff as any).name || (staff as any).email; }
  }

  // Fetch the attachment list (also with retry) so the stored note is honest
  // about what came through, even before downloads finish.
  const expected: number = Array.isArray(data.attachments) ? data.attachments.length : 0;
  let attList: any[] = [];
  if (expected > 0) {
    const attTries = 3;
    for (let attempt = 0; attempt < attTries; attempt++) {
      try {
        const ar = await fetch(`${API}/emails/receiving/${emailId}/attachments`, auth);
        if (ar.ok) {
          const al = await ar.json();
          attList = Array.isArray(al?.data) ? al.data : [];
          if (attList.some((a: any) => a.download_url)) break;
        }
      } catch (e) { console.warn("[inbound] list attachments", e); }
      if (attempt < attTries - 1) await sleep(600 * (attempt + 1));
    }
  }
  const attCount = Math.max(attList.length, expected);

  // Honest placeholder only when there is genuinely no text.
  if (!bodyText) {
    bodyText = attCount > 0
      ? `(sent ${attCount} attachment${attCount > 1 ? "s" : ""})`
      : "(no message text)";
  }

  const { data: note, error } = await admin.from("client_notes")
    .insert({ client_id: clientId, body: bodyText, sender, author_name: authorName })
    .select("id").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 200 });
  const noteId = (note as any).id;

  let attached = 0;
  for (const a of attList.slice(0, 10)) {
    if (!a.download_url) continue;
    try {
      const fr = await fetch(a.download_url);
      if (!fr.ok) { console.warn("[inbound] attachment download", fr.status); continue; }
      const buf = Buffer.from(await fr.arrayBuffer());
      const path = `messages/${clientId}/${Date.now()}-${safeName(a.filename)}`;
      const up = await admin.storage.from("client-files").upload(path, buf, { contentType: a.content_type || "application/octet-stream" });
      if (!up.error) {
        await admin.from("note_files").insert({ note_id: noteId, client_id: clientId, name: String(a.filename || "file").slice(0, 200), path, size: a.size, uploaded_by: authorName || sender });
        attached++;
      } else { console.warn("[inbound] upload", up.error.message); }
    } catch (e) { console.warn("[inbound] attachment", e); }
  }

  const site = process.env.NEXT_PUBLIC_SITE_URL || "";
  const inbound = process.env.INBOUND_EMAIL_DOMAIN;
  const replyTo = inbound ? `reply+${(client as any).reply_token}@${inbound}` : undefined;
  const hasText = retrieveOk && !/^\((sent \d+ attachment|no message text)/.test(bodyText);
  const preview = hasText ? bodyText : (attached ? `Sent ${attached} file${attached > 1 ? "s" : ""}.` : bodyText);
  try {
    if (sender === "client") {
      const aid = (client as any).assigned_to;
      if (aid && /^[0-9a-f-]{36}$/i.test(aid)) {
        const { data: s } = await admin.from("staff").select("email").eq("id", aid).maybeSingle();
        const to = (s as any)?.email;
        if (to) await sendStaffMessageAlert({ to, clientName: (client as any).business || (client as any).contact || "Your client", portalUrl: site ? `${site}/staff/messages` : "", replyTo, message: preview });
      }
    } else {
      const to = await getClientEmails(clientId, (client as any).email);
      if (to.length) await sendClientMessageAlert({ to, from: authorName || "Your account team", portalUrl: site ? `${site}/portal/messages` : "", replyTo, message: preview });
    }
  } catch (e) { console.warn("[inbound] forward", e); }

  return NextResponse.json({ ok: true, sender, attached, hasText }, { status: 200 });
}
