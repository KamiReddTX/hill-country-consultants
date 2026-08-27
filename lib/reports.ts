import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { JobApplicationRow } from "@/lib/database.types";

export interface ReportInput {
  clientName: string;
  business?: string | null;
  periodStart: string;
  periodEnd: string;
  workLog: { worked_on: string; service: string | null; task: string | null; performed_by: string | null; hours: number }[];
  deliverables: { name: string; status: string | null; delivered_on: string | null }[];
}

/** Build a one- (or few-) page branded weekly report PDF with pdf-lib. */
export async function buildWeeklyReportPdf(input: ReportInput): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const forest = rgb(0.137, 0.294, 0.204);
  const ink = rgb(0.13, 0.14, 0.12);
  const muted = rgb(0.42, 0.4, 0.32);

  const margin = 50;
  let page = doc.addPage([595, 842]);
  let y = 792;

  const clip = (s: string, n = 96) => (s.length > n ? s.slice(0, n - 1) + "…" : s);
  const line = (s: string, o: { size?: number; f?: typeof font; color?: ReturnType<typeof rgb>; indent?: number; gap?: number } = {}) => {
    const size = o.size || 11;
    const step = (o.gap ?? size + 5);
    if (y - step < 46) { page = doc.addPage([595, 842]); y = 792; }
    page.drawText(clip(s), { x: margin + (o.indent || 0), y, size, font: o.f || font, color: o.color || ink });
    y -= step;
  };
  const space = (n = 6) => { y -= n; };

  line("HILL COUNTRY CONSULTANTS", { size: 10, f: bold, color: forest });
  line("Weekly Report", { size: 20, f: bold, color: forest });
  space(2);
  line(String(input.business || input.clientName), { size: 12, f: bold });
  line(`Period: ${input.periodStart} to ${input.periodEnd}`, { size: 11, color: muted });
  space(8);

  const total = input.workLog.reduce((s, w) => s + Number(w.hours || 0), 0);
  line(`Total hours this period: ${total.toFixed(1)}`, { size: 12, f: bold, color: forest });
  space(6);

  const byService: Record<string, number> = {};
  input.workLog.forEach((w) => { const k = w.service || "General"; byService[k] = (byService[k] || 0) + Number(w.hours || 0); });
  const svc = Object.entries(byService).sort((a, b) => b[1] - a[1]);
  if (svc.length) {
    line("Hours by service", { size: 12, f: bold });
    svc.forEach(([s, h]) => line(`• ${s} — ${h.toFixed(1)}h`, { size: 11, indent: 8 }));
    space(6);
  }

  line("Work performed", { size: 12, f: bold });
  if (input.workLog.length === 0) line("No approved hours logged in this period.", { size: 11, indent: 8, color: muted });
  input.workLog.forEach((w) =>
    line(`• ${w.worked_on} · ${w.service || "General"} · ${w.task || "—"} · ${Number(w.hours).toFixed(1)}h${w.performed_by ? " · " + w.performed_by : ""}`, { size: 10, indent: 8 }),
  );
  space(6);

  if (input.deliverables.length) {
    line("Deliverables", { size: 12, f: bold });
    input.deliverables.forEach((d) => line(`• ${d.name}${d.status ? " · " + d.status : ""}${d.delivered_on ? " · " + d.delivered_on : ""}`, { size: 10, indent: 8 }));
  }

  page.drawText("Hill Country Consultants · info@hillcountryconsultants.com · 470-478-1590", {
    x: margin, y: 34, size: 8, font, color: muted,
  });

  return doc.save();
}

export interface ExecSnapshot {
  generatedOn: string;
  monthLabel: string;
  mrr: number; arr: number; avgPerClient: number;
  activeClients: number; totalClients: number; arOutstanding: number;
  revenueMonth: number; expenses: number; net: number;
  byTier: { tier: string; clients: number; mrr: number }[];
  trend: { month: string; billed: number; collected: number }[];
}

/** One-page branded executive snapshot PDF (money values in cents). */
export async function buildExecReportPdf(s: ExecSnapshot): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const forest = rgb(0.137, 0.294, 0.204);
  const ink = rgb(0.13, 0.14, 0.12);
  const muted = rgb(0.42, 0.4, 0.32);
  const gold = rgb(0.76, 0.635, 0.29);
  const usd = (c: number) => "$" + (Number(c || 0) / 100).toLocaleString("en-US", { maximumFractionDigits: 0 });

  const margin = 50;
  const page = doc.addPage([595, 842]);
  let y = 792;
  const text = (str: string, x: number, size: number, f = font, color = ink) => page.drawText(str, { x, y, size, font: f, color });

  text("HILL COUNTRY CONSULTANTS", margin, 10, bold, forest); y -= 22;
  text("Executive Report", margin, 20, bold, forest); y -= 18;
  text(`Generated ${s.generatedOn} · Month: ${s.monthLabel}`, margin, 10, font, muted); y -= 24;

  // KPI grid (2 rows × 4)
  const kpis: [string, string][] = [
    ["Contracted MRR", usd(s.mrr)],
    ["ARR (run rate)", usd(s.arr)],
    ["Avg / client", usd(s.avgPerClient)],
    ["Active clients", String(s.activeClients)],
    ["AR outstanding", usd(s.arOutstanding)],
    [`Revenue · ${s.monthLabel}`, usd(s.revenueMonth)],
    ["Expenses", usd(s.expenses)],
    ["Net profit", usd(s.net)],
  ];
  const colW = (595 - margin * 2) / 4;
  kpis.forEach((k, i) => {
    const col = i % 4, row = Math.floor(i / 4);
    const x = margin + col * colW;
    const yy = y - row * 46;
    page.drawText(k[0], { x, y: yy, size: 8, font, color: muted });
    page.drawText(k[1], { x, y: yy - 16, size: 15, font: bold, color: k[0] === "Net profit" && s.net < 0 ? rgb(0.7, 0.1, 0.1) : forest });
  });
  y -= 46 * 2 + 16;

  // MRR by tier
  text("MRR by tier", margin, 12, bold, forest); y -= 18;
  s.byTier.forEach((t) => { text(`${t.tier}  —  ${t.clients} client(s)  —  ${usd(t.mrr)}`, margin + 8, 11); y -= 16; });
  y -= 10;

  // Billed vs collected, last 6 months — simple bars
  text("Billed recurring — last 6 months", margin, 12, bold, forest); y -= 20;
  const maxV = Math.max(1, ...s.trend.map((t) => t.billed));
  const barMax = 360;
  s.trend.forEach((t) => {
    const w = Math.round((t.billed / maxV) * barMax);
    const cw = Math.round((t.collected / maxV) * barMax);
    page.drawText(t.month, { x: margin, y, size: 9, font, color: muted });
    page.drawRectangle({ x: margin + 44, y: y - 1, width: Math.max(1, w), height: 9, color: gold, opacity: 0.5 });
    page.drawRectangle({ x: margin + 44, y: y - 1, width: Math.max(1, cw), height: 9, color: forest });
    page.drawText(usd(t.billed), { x: margin + 44 + barMax + 8, y, size: 8, font, color: ink });
    y -= 16;
  });

  page.drawText("Gold = billed · Forest = collected", { x: margin, y: y - 6, size: 8, font, color: muted });
  page.drawText("Hill Country Consultants · Confidential · info@hillcountryconsultants.com", { x: margin, y: 34, size: 8, font, color: muted });

  return doc.save();
}

// ─────────────────────────── Employment application packet
/** Build a full, print-ready employment-application packet PDF from a
 *  job_applications row. Multi-page, branded, wraps long text. Used by the
 *  hiring pipeline's "Download full application" action. */
export async function buildApplicationPdf(a: JobApplicationRow): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const forest = rgb(0.137, 0.294, 0.204);
  const ink = rgb(0.13, 0.14, 0.12);
  const muted = rgb(0.42, 0.4, 0.32);
  const margin = 50;
  const width = 595;
  const maxW = width - margin * 2;
  let page = doc.addPage([width, 842]);
  let y = 792;

  const newPageIf = (need: number) => { if (y - need < 50) { page = doc.addPage([width, 842]); y = 792; } };
  // Word-wrap a string to the content width at a given size/font.
  const wrap = (s: string, size: number, f = font) => {
    const words = String(s).replace(/\r/g, "").split(/\n/).flatMap((ln) => {
      const out: string[] = []; let cur = "";
      for (const w of ln.split(/\s+/)) {
        const t = cur ? cur + " " + w : w;
        if (f.widthOfTextAtSize(t, size) > maxW && cur) { out.push(cur); cur = w; } else cur = t;
      }
      out.push(cur); return out;
    });
    return words;
  };
  const text = (s: string, o: { size?: number; f?: typeof font; color?: ReturnType<typeof rgb>; indent?: number; gap?: number } = {}) => {
    const size = o.size || 10.5;
    for (const ln of wrap(s, size, o.f || font)) {
      newPageIf(size + 4);
      page.drawText(ln, { x: margin + (o.indent || 0), y, size, font: o.f || font, color: o.color || ink });
      y -= size + (o.gap ?? 4);
    }
  };
  const space = (n = 6) => { y -= n; };
  const heading = (s: string) => { space(6); newPageIf(24); page.drawText(s.toUpperCase(), { x: margin, y, size: 11, font: bold, color: forest }); y -= 6; page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 0.75, color: forest }); y -= 12; };
  const kv = (k: string, v: unknown) => { const val = v === true ? "Yes" : v === false ? "No" : v == null || v === "" ? "—" : String(v); text(`${k}: ${val}`, { size: 10.5 }); };
  const yn = (v: boolean | null) => (v === true ? "Yes" : v === false ? "No" : "—");

  // Header
  page.drawText("HILL COUNTRY CONSULTANTS", { x: margin, y, size: 10, font: bold, color: forest }); y -= 16;
  page.drawText("Employment Application", { x: margin, y, size: 20, font: bold, color: forest }); y -= 24;
  page.drawText(String(a.name || ""), { x: margin, y, size: 13, font: bold, color: ink }); y -= 16;
  if (a.position) { page.drawText(String(a.position), { x: margin, y, size: 11, font, color: forest }); y -= 14; }
  page.drawText(`Received ${new Date(a.created_at).toLocaleString("en-US")}   ·   Status: ${a.status || "new"}${a.rating ? `   ·   Rating: ${a.rating}/5` : ""}`, { x: margin, y, size: 9, font, color: muted }); y -= 10;

  heading("Contact");
  kv("Email", a.email); kv("Phone", a.phone);
  kv("Address", [a.address, a.city_state_zip].filter(Boolean).join(", ") || a.location);

  heading("Position & availability");
  kv("Position", a.position); kv("Employment type", a.employment_type);
  kv("Earliest start", a.available_start); kv("Hours/week", a.hours_available);
  kv("Days/times", a.days_available); kv("Desired pay", a.desired_pay);

  heading("Work authorization");
  kv("18 or older", a.over_18); kv("Authorized to work in the U.S.", a.work_authorized); kv("Requires sponsorship", a.sponsorship_required);

  const edu = (a.education || []) as any[];
  if (edu.length) {
    heading("Education");
    edu.forEach((e) => { text(`• ${[e.degree, e.field].filter(Boolean).join(", ") || "—"}`, { size: 10.5, f: bold, indent: 2 }); text(`${[e.school, e.location].filter(Boolean).join(" · ")}${e.completed ? "  ·  " + e.completed : ""}`, { size: 10, indent: 12, color: muted }); space(2); });
  }

  const jobs = (a.employment_history || []) as any[];
  if (jobs.length) {
    heading("Employment history");
    jobs.forEach((j) => {
      text(`• ${j.title || "—"}${j.employer ? " — " + j.employer : ""}`, { size: 10.5, f: bold, indent: 2 });
      const meta = [[j.start, j.end].filter(Boolean).join("–"), j.location].filter(Boolean).join("  ·  ");
      if (meta) text(meta, { size: 10, indent: 12, color: muted });
      if (j.duties) text(j.duties, { size: 10, indent: 12 });
      if (j.reason_leaving) text(`Reason for leaving: ${j.reason_leaving}`, { size: 10, indent: 12, color: muted });
      text(`May contact employer: ${j.may_contact === false ? "No" : "Yes"}`, { size: 9.5, indent: 12, color: muted });
      space(3);
    });
  }

  const refs = (a.refs || []) as any[];
  if (refs.length) {
    heading("References");
    refs.forEach((r) => { text(`• ${r.name || "—"}${r.relationship ? " (" + r.relationship + ")" : ""}`, { size: 10.5, indent: 2 }); text([r.company, r.phone, r.email].filter(Boolean).join("  ·  ") || "—", { size: 10, indent: 12, color: muted }); space(2); });
  }

  heading("Skills, certifications & experience");
  if (a.skills) { text("Skills / software:", { size: 10.5, f: bold }); text(a.skills, { size: 10.5, indent: 6 }); }
  if (a.certifications) { text("Certifications & licenses:", { size: 10.5, f: bold }); text(a.certifications, { size: 10.5, indent: 6 }); }
  if (a.portfolio_url) kv("Portfolio / links", a.portfolio_url);
  if (a.referral) kv("Heard about us", a.referral);
  if (a.experience) { space(2); text("Relevant experience:", { size: 10.5, f: bold }); text(a.experience, { size: 10.5, indent: 6 }); }
  if (a.why) { space(2); text("Why Hill Country Consultants:", { size: 10.5, f: bold }); text(a.why, { size: 10.5, indent: 6 }); }

  heading("Equipment & security attestations");
  kv("Meets equipment baseline", a.attest_equipment); kv("Meets security baseline", a.attest_security);
  kv("U.S.-based & authorized", a.attest_us_based); kv("Consents to background check", a.attest_background);
  kv("Willing to sign confidentiality/NDA", a.attest_confidential);

  heading("Voluntary self-identification (confidential — not used in hiring)");
  kv("Gender", a.eeo_gender); kv("Race / ethnicity", a.eeo_race);
  kv("Protected veteran status", a.eeo_veteran); kv("Disability status", a.eeo_disability);

  heading("Certification");
  text(`Certified true & complete: ${yn(a.certified)}`, { size: 10.5 });
  kv("Signature (typed)", a.signature);
  kv("Signed", a.signed_at ? new Date(a.signed_at).toLocaleDateString("en-US") : null);

  if (a.review_notes) { heading("Reviewer notes (internal)"); text(a.review_notes, { size: 10.5 }); }

  space(10);
  newPageIf(20);
  page.drawText("Hill Country Consultants · Confidential · info@hillcountryconsultants.com", { x: margin, y: 34, size: 8, font, color: muted });
  return doc.save();
}
