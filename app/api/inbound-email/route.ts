import { NextResponse, type NextRequest } from "next/server";
import crypto from "crypto";
import { createServiceClient } from "@/lib/supabase/server";
import { sendStaffMessageAlert, sendClientMessageAlert } from "@/lib/email";

export const runtime = "nodejs";

const API = "https://api.resend.com";
const emailOf = (s: string) => (String(s || "").match(/<([^>]+)>/)?.[1] || String(s || "")).trim().toLowerCase();
const safeName = (n: string) => String(n || "file").replace(/[^\w.\-]+/g, "_").slice(0, 120);

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

/** Strip quoted history / signatures from a plain-text reply (best effort). */
function cleanReply(text: string): string {
  if (!text) return "";
  let out = text;
  const cutters = [
    /\r?\nOn .+wrote:[\s\S]*$/,
    /\r?\n-----Original Message-----[\s\S]*$/i,
    /\r?\n________________________________[\s\S]*$/,
    /\r?\n>[\s\S]*$/,
    /\r?\nFrom: .+[\s\S]*$/,
  ];
  for (const c of cutters) out = out.replace(c, "");
  return out.trim();
}

const stripHtml = (html: string) => String(html || "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();

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
  let bodyText = "";
  try {
    const r = await fetch(`${API}/emails/receiving/${emailId}`, { headers: { Authorization: `Bearer ${key}` } });
    const em = await r.json();
    bodyText = cleanReply(em.text || stripHtml(em.html) || "");
  } catch (e) { console.warn("[inbound] fetch body", e); }

  let sender: "client" | "staff" = "client";
  let authorName: string | null = (client as any).contact || null;
  if (from && from !== String((client as any).email || "").toLowerCase()) {
    const { data: staff } = await admin.from("staff").select("id,name,email").ilike("email", from).maybeSingle();
    if (staff) { sender = "staff"; authorName = (staff as any).name || (staff as any).email; }
  }

  const { data: note, error } = await admin.from("client_notes")
    .insert({ client_id: clientId, body: bodyText || "(sent an attachment)", sender, author_name: authorName })
    .select("id").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 200 });
  const noteId = (note as any).id;

  let attached = 0;
  try {
    const ar = await fetch(`${API}/emails/receiving/${emailId}/attachments`, { headers: { Authorization: `Bearer ${key}` } });
    const al = await ar.json();
    for (const a of (al?.data || []).slice(0, 10)) {
      if (!a.download_url) continue;
      const fr = await fetch(a.download_url);
      const buf = Buffer.from(await fr.arrayBuffer());
      const path = `messages/${clientId}/${Date.now()}-${safeName(a.filename)}`;
      const up = await admin.storage.from("client-files").upload(path, buf, { contentType: a.content_type || "application/octet-stream" });
      if (!up.error) {
        await admin.from("note_files").insert({ note_id: noteId, client_id: clientId, name: String(a.filename || "file").slice(0, 200), path, size: a.size, uploaded_by: authorName || sender });
        attached++;
      }
    }
  } catch (e) { console.warn("[inbound] attachments", e); }

  const site = process.env.NEXT_PUBLIC_SITE_URL || "";
  const inbound = process.env.INBOUND_EMAIL_DOMAIN;
  const replyTo = inbound ? `reply+${(client as any).reply_token}@${inbound}` : undefined;
  const preview = bodyText || (attached ? `Sent ${attached} file${attached > 1 ? "s" : ""}.` : "");
  try {
    if (sender === "client") {
      const aid = (client as any).assigned_to;
      if (aid && /^[0-9a-f-]{36}$/i.test(aid)) {
        const { data: s } = await admin.from("staff").select("email").eq("id", aid).maybeSingle();
        const to = (s as any)?.email;
        if (to) await sendStaffMessageAlert({ to, clientName: (client as any).business || (client as any).contact || "Your client", portalUrl: site ? `${site}/staff/messages` : "", replyTo, message: preview });
      }
    } else {
      if ((client as any).email) await sendClientMessageAlert({ to: (client as any).email, from: authorName || "Your account team", portalUrl: site ? `${site}/portal/messages` : "", replyTo, message: preview });
    }
  } catch (e) { console.warn("[inbound] forward", e); }

  return NextResponse.json({ ok: true, sender, attached }, { status: 200 });
}
