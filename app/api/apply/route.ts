import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { sendApplicationAlert } from "@/lib/email";

export const runtime = "nodejs";

/**
 * Public employment-application intake. Accepts multipart form data (fields +
 * an optional résumé file), writes a job_applications row and uploads the résumé
 * via the service role (past RLS), and emails the team. Honeypot + email check +
 * length caps guard against abuse. `persisted` is true only when actually saved.
 */
const cap = (v: unknown, max: number) => (typeof v === "string" ? v.trim() : "").slice(0, max);
const safeName = (n: string) => String(n || "resume").replace(/[^\w.\-]+/g, "_").slice(0, 120);

export async function POST(req: Request) {
  let form: FormData;
  try { form = await req.formData(); } catch { return NextResponse.json({ ok: false, persisted: false }, { status: 400 }); }
  const g = (k: string) => form.get(k);

  // Honeypot — a hidden field real applicants never fill.
  if (cap(g("hp_field_x"), 100)) return NextResponse.json({ ok: true, persisted: false });

  const name = cap(g("name"), 200);
  const email = cap(g("email"), 200);
  const phone = cap(g("phone"), 60);
  const location = cap(g("location"), 200);
  const position = cap(g("position"), 200);
  const employment_type = cap(g("employment_type"), 60);
  const availability = cap(g("availability"), 200);
  const desired_pay = cap(g("desired_pay"), 100);
  const experience = cap(g("experience"), 6000);
  const skills = cap(g("skills"), 2000);
  const portfolio_url = cap(g("portfolio_url"), 400);
  const why = cap(g("why"), 4000);
  const referral = cap(g("referral"), 200);

  if (!name) return NextResponse.json({ ok: false, persisted: false, error: "name_required" }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ ok: false, persisted: false, error: "invalid_email" }, { status: 400 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ ok: true, persisted: false });
  const admin = createClient<Database>(url, key, { auth: { persistSession: false } });

  // File uploads — résumé and credentials, optional, up to ~8MB each. Only
  // document/image types are accepted (extension + MIME allowlist) to keep the
  // public bucket free of executables and other unexpected content.
  const OK_EXT = ["pdf", "doc", "docx", "rtf", "txt", "png", "jpg", "jpeg", "webp", "heic"];
  const OK_MIME = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/rtf", "text/rtf", "text/plain", "image/png", "image/jpeg", "image/webp", "image/heic"];
  const uploadOne = async (fieldKey: string, prefix: string): Promise<string | null> => {
    const f = form.get(fieldKey);
    if (f instanceof File && f.size > 0 && f.size <= 8 * 1024 * 1024) {
      const ext = (f.name.split(".").pop() || "").toLowerCase();
      if (!OK_EXT.includes(ext)) return null;
      if (f.type && !OK_MIME.includes(f.type)) return null;
      try {
        const buf = Buffer.from(await f.arrayBuffer());
        const path = `${prefix}/${Date.now()}-${safeName(f.name)}`;
        const up = await admin.storage.from("applications").upload(path, buf, { contentType: f.type || "application/octet-stream" });
        if (!up.error) return path;
      } catch (e) { console.warn(`[apply] ${fieldKey}`, e); }
    }
    return null;
  };
  const resume_path = await uploadOne("resume", "resumes");
  const credentials_path = await uploadOne("credentials", "credentials");

  try {
    const { error } = await admin.from("job_applications").insert({
      name, email, phone: phone || null, location: location || null, position: position || null,
      employment_type: employment_type || null, availability: availability || null, desired_pay: desired_pay || null,
      experience: experience || null, skills: skills || null, portfolio_url: portfolio_url || null,
      resume_path, credentials_path, why: why || null, referral: referral || null,
    });
    if (error) return NextResponse.json({ ok: false, persisted: false, error: error.message }, { status: 200 });
  } catch {
    return NextResponse.json({ ok: false, persisted: false }, { status: 200 });
  }

  try {
    const site = process.env.NEXT_PUBLIC_SITE_URL || "";
    await sendApplicationAlert({ name, email, phone, position, location, portalUrl: site ? `${site}/staff/directory` : "", hasResume: !!resume_path });
  } catch (e) { console.warn("[apply] alert", e); }

  return NextResponse.json({ ok: true, persisted: true });
}
