import { redirect } from "next/navigation";
import Link from "next/link";
import { getPortalClient, getPortalData } from "@/lib/portal";
import { createClient } from "@/lib/supabase/server";
import { SITE } from "@/content/site";
import { ClientAddEvent, ClientDeleteEvent } from "@/components/portal/client-add-event";

type Item =
  | { type: "event"; label: string; time: string | null; note: string | null; id: string }
  | { type: "task"; label: string }
  | { type: "review"; label: string };

export default async function PortalCalendarPage({ searchParams }: { searchParams?: { m?: string } }) {
  const client = await getPortalClient();
  if (!client) redirect("/portal/login");

  const now = new Date();
  let year = now.getUTCFullYear();
  let month = now.getUTCMonth();
  const mp = searchParams?.m;
  if (mp && /^\d{4}-\d{2}$/.test(mp)) { year = Number(mp.slice(0, 4)); month = Number(mp.slice(5, 7)) - 1; }
  const two = (n: number) => String(n).padStart(2, "0");
  const monthStr = `${year}-${two(month + 1)}`;
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const startWeekday = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const monthStart = `${monthStr}-01`;
  const monthEnd = `${monthStr}-${two(daysInMonth)}`;
  const prevM = month === 0 ? `${year - 1}-12` : `${year}-${two(month)}`;
  const nextM = month === 11 ? `${year + 1}-01` : `${year}-${two(month + 2)}`;
  const monthLabel = new Date(Date.UTC(year, month, 1)).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
  const todayStr = now.toISOString().slice(0, 10);

  const { tasks } = await getPortalData(client);
  const { data: events } = await createClient().from("client_events").select("*").eq("client_id", client.id).gte("event_date", monthStart).lte("event_date", monthEnd);

  const cells = new Map<string, Item[]>();
  const push = (d: string, it: Item) => { const a = cells.get(d) || []; a.push(it); cells.set(d, a); };
  (events ?? []).forEach((e: any) => push(e.event_date, { type: "event", label: e.title, time: e.event_time, note: e.note, id: e.id }));
  (tasks ?? []).forEach((t: any) => {
    if (t.due_date && (t.column_name || "") !== "Delivered" && t.due_date >= monthStart && t.due_date <= monthEnd)
      push(t.due_date, { type: "task", label: t.title });
  });
  if ((client as any).roadmap_at) {
    const d = new Date((client as any).roadmap_at); d.setUTCDate(d.getUTCDate() + 30);
    const ds = d.toISOString().slice(0, 10);
    if (ds >= monthStart && ds <= monthEnd) push(ds, { type: "review", label: "30-day review" });
  }

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
          <ClientDeleteEvent id={it.id} />
        </div>
      );
    if (it.type === "task")
      return <div key={i} className="truncate bg-gold/25 px-1.5 py-0.5 text-[11px] leading-tight text-charcoal" title="Task due">▸ {it.label}</div>;
    return <div key={i} className="truncate bg-blue-100 px-1.5 py-0.5 text-[11px] leading-tight text-blue-900">● {it.label}</div>;
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-fraunces text-[32px] font-normal text-forest">Calendar</h1>
        <span className="rule-gold mb-4 mt-2" />
        <p className="max-w-[48em] prose-soft">Your schedule with us. Add your own events and reminders — your account team sees them too. Task due dates and your 30-day review show up automatically.</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link href={`/portal/calendar?m=${prevM}`} className="btn-outline px-3 py-1.5 text-[13px]">← Prev</Link>
          <span className="min-w-[9rem] text-center font-fraunces text-[20px] text-forest">{monthLabel}</span>
          <Link href={`/portal/calendar?m=${nextM}`} className="btn-outline px-3 py-1.5 text-[13px]">Next →</Link>
          <Link href="/portal/calendar" className="ml-1 text-[12px] link-underline">Today</Link>
        </div>
        <ClientAddEvent defaultDate={monthStart} />
      </div>

      <div className="flex flex-wrap items-center gap-4 text-[12px] prose-muted">
        <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 bg-forest" /> Your events</span>
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
                {d && <div className="mb-1"><span className={`inline-flex h-5 w-5 items-center justify-center text-[12px] ${isToday ? "rounded-full bg-forest font-semibold text-white" : "text-ink-faint"}`}>{d}</span></div>}
                <div className="flex flex-col gap-0.5">{items.map(chip)}</div>
              </div>
            );
          })}
        </div>
      </div>

      <section className="border-t border-line-soft pt-5">
        <h2 className="mb-1 font-fraunces text-[18px] font-medium text-forest">Book time with your team</h2>
        <p className="mb-3 max-w-[46em] text-[13px] prose-muted">Need a call? Book a kickoff or a 30-day review on our calendar and we&apos;ll confirm.</p>
        <div className="flex flex-wrap gap-3">
          <a href={SITE.kickoffUrl} target="_blank" rel="noreferrer" className="btn-outline text-[13px]">Book a kickoff call</a>
          <a href={SITE.reviewUrl} target="_blank" rel="noreferrer" className="btn-outline text-[13px]">Book a 30-day review</a>
        </div>
      </section>
    </div>
  );
}
