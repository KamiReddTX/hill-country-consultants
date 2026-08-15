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
