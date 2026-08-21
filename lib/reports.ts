import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

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
