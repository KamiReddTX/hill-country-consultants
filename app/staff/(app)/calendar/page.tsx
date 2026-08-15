import { redirect } from "next/navigation";
import Link from "next/link";
import { getStaffMember, getClients } from "@/lib/staff";
import { createClient } from "@/lib/supabase/server";
import { SITE } from "@/content/site";
import { CalendarAddEvent } from "@/components/staff/calendar-add-event";
import { DeleteEventButton } from "@/components/staff/delete-event-button";

type Item =
  | { type: "event"; label: string; time: string | null; note: string | null; id: string }
  | { type: "clientevent"; label: string; time: string | null; sub: string }
  | { type: "task"; label: string; sub: string }
  | { type: "review"; label: string; sub: string };

export default async function StaffCalendarPage({ searchParams }: { searchParams?: { m?: string } }) {
  const me = await getStaffMember();
  if (!me) redirect("/staff/login");

  // ── Which month are we viewing? (?m=YYYY-MM, default = current) ──
  const now = new Date();
  let year = now.getUTCFullYear();
  let month = now.getUTCMonth(); // 0-based
  const mp = searchParams?.m;
  if (mp && /^\d{4}-\d{2}$/.test(mp)) { year = Number(mp.slice(0, 4)); month = Number(mp.slice(5, 7)) - 1; }
  const two = (n: number) => String(n).padStart(2, "0");
  const monthStr = `${year}-${two(month + 1)}`;
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const startWeekday = new Date(Date.UTC(year, month, 1)).getUTCDay(); // 0=Sun
  const monthStart = `${monthStr}-01`;
  const monthEnd = `${monthStr}-${two(daysInMonth)}`;
  const prevM = month === 0 ? `${year - 1}-12` : `${year}-${two(month)}`;
  const nextM = month === 11 ? `${year + 1}-01` : `${year}-${two(month + 2)}`;
  const monthLabel = new Date(Date.UTC(year, month, 1)).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
  const todayStr = now.toISOString().slice(0, 10);

  // ── Data: my calendar events + work items across my clients ──
  const clients = await getClients();
  const byId = new Map(clients.map((c) => [c.id, c]));
  const cname = (cid: string) => byId.get(cid)?.business || byId.get(cid)?.contact || byId.get(cid)?.email || "Client";
  const ids = clients.map((c) => c.id);
  const db = createClient();

  const [{ data: events }, { data: cEvents }, { data: tasks }, { data: roster }] = await Promise.all([
    db.from("staff_events").select("*").eq("staff_id", me.id).gte("event_date", monthStart).lte("event_date", monthEnd),
    ids.length ? db.from("client_events").select("*").in("client_id", ids).gte("event_date", monthStart).lte("event_date", monthEnd) : Promise.resolve({ data: [] as any[] }),
    ids.length ? db.from("client_tasks").select("client_id,title,due_date,column_name").in("client_id", ids) : Promise.resolve({ data: [] as any[] }),
    db.rpc("staff_roster"),
  ]);

  const cells = new Map<string, Item[]>();
  const push = (date: string, it: Item) => { const a = cells.get(date) || []; a.push(it); cells.set(date, a); };

  (events ?? []).forEach((e: any) => push(e.event_date, { type: "event", label: e.title, time: e.event_time, note: e.note, id: e.id }));
  (cEvents ?? []).forEach((e: any) => push(e.event_date, { type: "clientevent", label: e.title, time: e.event_time, sub: cname(e.client_id) }));
  (tasks ?? []).forEach((t: any) => {
    if (t.due_date && t.column_name !== "Delivered" && t.due_date >= monthStart && t.due_date <= monthEnd)
      push(t.due_date, { type: "task", label: t.title, sub: cname(t.client_id) });
  });
  clients.forEach((c: any) => {
    if (c.roadmap_at) {
      const d = new Date(c.roadmap_at); d.setUTCDate(d.getUTCDate() + 30);
      const ds = d.toISOString().slice(0, 10);
      if (ds >= monthStart && ds <= monthEnd) push(ds, { type: "review", label: "30-day review", sub: c.business || c.contact || c.email });
    }
  });

  const mates = ((roster ?? []) as any[]).filter((r) => r.id !== me.id).map((r) => ({ id: r.id, name: r.name, email: r.email }));
  const clientOpts = clients.map((c: any) => ({ id: c.id, label: c.business || c.contact || c.email }));

  // Build the grid cells (leading blanks + days), padded to full weeks.
  const grid: (number | null)[] = [];
  for (let i = 0; i < startWeekday; i++) grid.push(null);
  for (let d = 1; d <= daysInMonth; d++) grid.push(d);
  while (grid.length % 7 !== 0) grid.push(null);

  const dow = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const chip = (it: Item, i: number) => {
    if (it.type === "event")
      return (
        <div key={i} className="flex items-start justify-between gap-1 bg-forest px-1.5 py-0.5 text-[11px] leading-tight text-white" title={it.note || undefined}>
          <span className="truncate">{it.time ? `${it.time} ` : ""}{it.label}</span>
          <DeleteEventButton id={it.id} />
        </div>
      );
    if (it.type === "clientevent")
      return <div key={i} className="truncate bg-orange-100 px-1.5 py-0.5 text-[11px] leading-tight text-orange-900" title={`Client event · ${it.sub}`}>◆ {it.time ? `${it.time} ` : ""}{it.label}</div>;
    if (it.type === "task")
      return <div key={i} className="truncate bg-gold/25 px-1.5 py-0.5 text-[11px] leading-tight text-charcoal" title={`Task due · ${it.sub}`}>▸ {it.label}</div>;
    return <div key={i} className="truncate bg-blue-100 px-1.5 py-0.5 text-[11px] leading-tight text-blue-900" title={it.sub}>● {it.label}</div>;
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-fraunces text-[32px] font-normal text-forest">Calendar</h1>
        <span className="rule-gold mb-4 mt-2" />
        <p className="max-w-[48em] prose-soft">Your working calendar. Mark due dates, schedule events for yourself, or drop an event onto a teammate&apos;s calendar. Task due dates and 30-day reviews for your clients show up automatically.</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link href={`/staff/calendar?m=${prevM}`} className="btn-outline px-3 py-1.5 text-[13px]">← Prev</Link>
          <span className="min-w-[9rem] text-center font-fraunces text-[20px] text-forest">{monthLabel}</span>
          <Link href={`/staff/calendar?m=${nextM}`} className="btn-outline px-3 py-1.5 text-[13px]">Next →</Link>
          <Link href="/staff/calendar" className="ml-1 text-[12px] link-underline">Today</Link>
        </div>
        <CalendarAddEvent mates={mates} clients={clientOpts} defaultDate={monthStart} />
      </div>

      <div className="flex flex-wrap items-center gap-4 text-[12px] prose-muted">
        <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 bg-forest" /> Your events</span>
        <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 bg-orange-200" /> Client events</span>
        <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 bg-gold/40" /> Task due</span>
        <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 bg-blue-200" /> 30-day review</span>
      </div>

      <div className="overflow-x-auto border border-line-warm">
        <div className="grid min-w-[720px] grid-cols-7 bg-line-soft text-[11px] font-medium uppercase tracking-wide text-ink-faint">
          {dow.map((d) => <div key={d} className="bg-cream/40 px-2 py-1.5">{d}</div>)}
        </div>
        <div className="grid min-w-[720px] grid-cols-7">
          {grid.map((d, i) => {
            const date = d ? `${monthStr}-${two(d)}` : null;
            const items = date ? cells.get(date) || [] : [];
            const isToday = date === todayStr;
            return (
              <div key={i} className={`min-h-[104px] border-b border-r border-line-soft/70 p-1 ${d ? "bg-white" : "bg-cream/20"}`}>
                {d && (
                  <div className="mb-1 flex items-center justify-between">
                    <span className={`inline-flex h-5 w-5 items-center justify-center text-[12px] ${isToday ? "rounded-full bg-forest font-semibold text-white" : "text-ink-faint"}`}>{d}</span>
                  </div>
                )}
                <div className="flex flex-col gap-0.5">{items.map(chip)}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Booking links live at the bottom — for clients who can't self-book. */}
      <section className="border-t border-line-soft pt-5">
        <h2 className="mb-1 font-fraunces text-[18px] font-medium text-forest">Book on our shared calendar</h2>
        <p className="mb-3 max-w-[46em] text-[13px] prose-muted">These schedule time on Hill Country&apos;s shared Google calendar. Use them to book a kickoff, review, or strategy session <em>on behalf of a client who can&apos;t book it themselves</em> — they don&apos;t affect your working calendar above.</p>
        <div className="flex flex-wrap gap-3">
          <a href={SITE.kickoffUrl} target="_blank" rel="noreferrer" className="btn-outline text-[13px]">Book a kickoff call</a>
          <a href={SITE.reviewUrl} target="_blank" rel="noreferrer" className="btn-outline text-[13px]">Book a 30-day review</a>
          <a href={SITE.consultUrl} target="_blank" rel="noreferrer" className="btn-outline text-[13px]">Book a strategy session</a>
        </div>
      </section>
    </div>
  );
}
