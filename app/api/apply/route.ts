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
  const yn = (k: string) => { const v = cap(g(k), 4); return v === "yes" ? true : v === "no" ? false : null; };
  const chk = (k: string) => g(k) != null; // checkbox present === checked
  // Parse a multi-entry section (JSON array of objects), capping each string field.
  const arr = (k: string, keys: string[], max = 25): Record<string, unknown>[] => {
    try {
      const raw = JSON.parse(cap(g(k), 60000) || "[]");
      if (!Array.isArray(raw)) return [];
      return raw.slice(0, max).map((row: any) => {
        const out: Record<string, unknown> = {};
        for (const key of keys) {
          const val = row?.[key];
          out[key] = typeof val === "boolean" ? val : cap(val, 2000);
        }
        return out;
      });
    } catch { return []; }
  };

  // Honeypot — a hidden field real applicants never fill.
  if (cap(g("hp_field_x"), 100)) return NextResponse.json({ ok: true, persisted: false });

  const name = cap(g("name"), 200);
  const email = cap(g("email"), 200);
  const phone = cap(g("phone"), 60);
  const location = cap(g("location"), 200);
  const address = cap(g("address"), 200);
  const city_state_zip = cap(g("city_state_zip"), 200);
  const position = cap(g("position"), 200);
  const employment_type = cap(g("employment_type"), 60);
  const available_start = cap(g("available_start"), 200);
  const hours_available = cap(g("hours_available"), 120);
  const days_available = cap(g("days_available"), 200);
  const desired_pay = cap(g("desired_pay"), 100);
  const experience = cap(g("experience"), 6000);
  const skills = cap(g("skills"), 2000);
  const certifications = cap(g("certifications"), 2000);
  const portfolio_url = cap(g("portfolio_url"), 400);
  const why = cap(g("why"), 4000);
  const referral = cap(g("referral"), 200);
  const education = arr("education", ["school", "degree", "field", "location", "completed"]);
  const employment_history = arr("employment_history", ["employer", "title", "location", "start", "end", "duties", "reason_leaving", "may_contact"]);
  const refs = arr("refs", ["name", "relationship", "company", "phone", "email"]);
  const eeo_gender = cap(g("eeo_gender"), 60);
  const eeo_race = cap(g("eeo_race"), 80);
  const eeo_veteran = cap(g("eeo_veteran"), 120);
  const eeo_disability = cap(g("eeo_disability"), 40);
  const signature = cap(g("signature"), 200);
  const signed_date = cap(g("signed_date"), 20);
  const certified = chk("certified");

  if (!name) return NextResponse.json({ ok: false, persisted: false, error: "name_required" }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ ok: false, persisted: false, error: "invalid_email" }, { status: 400 });
  if (!certified || !signature) return NextResponse.json({ ok: false, persisted: false, error: "certify_required" }, { status: 400 });
  const signed_at = signed_date ? new Date(signed_date + "T12:00:00Z").toISOString() : new Date().toISOString();

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
      name, email, phone: phone || null, location: location || null,
      address: address || null, city_state_zip: city_state_zip || null,
      position: position || null, employment_type: employment_type || null,
      available_start: available_start || null, hours_available: hours_available || null, days_available: days_available || null,
      work_authorized: yn("work_authorized"), over_18: yn("over_18"), sponsorship_required: yn("sponsorship_required"),
      desired_pay: desired_pay || null, experience: experience || null, skills: skills || null,
      certifications: certifications || null, portfolio_url: portfolio_url || null,
      education, employment_history, refs,
      attest_equipment: chk("attest_equipment"), attest_security: chk("attest_security"),
      attest_background: chk("attest_background"), attest_us_based: chk("attest_us_based"),
      attest_confidential: chk("attest_confidential"),
      eeo_gender: eeo_gender || null, eeo_race: eeo_race || null, eeo_veteran: eeo_veteran || null, eeo_disability: eeo_disability || null,
      certified, signature: signature || null, signed_at,
      resume_path, credentials_path, why: why || null, referral: referral || null,
    } as any);
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
