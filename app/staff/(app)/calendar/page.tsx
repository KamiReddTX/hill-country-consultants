import { redirect } from "next/navigation";
import { getStaffMember, getClients } from "@/lib/staff";
import { createClient } from "@/lib/supabase/server";
import { SITE } from "@/content/site";

type Ev = { date: string; kind: string; label: string; client: string };

export default async function StaffCalendarPage() {
  const me = await getStaffMember();
  if (!me) redirect("/staff/login");
  const clients = await getClients();
  const byId = new Map(clients.map((c) => [c.id, c]));
  const name = (cid: string) => byId.get(cid)?.business || byId.get(cid)?.contact || byId.get(cid)?.email || "Client";
  const ids = clients.map((c) => c.id);

  const db = createClient();
  const { data: tasks } = ids.length
    ? await db.from("client_tasks").select("client_id,title,due_date,column_name").in("client_id", ids)
    : { data: [] as any[] };

  const events: Ev[] = [];
  (tasks ?? []).forEach((t: any) => {
    if (t.due_date && t.column_name !== "Delivered") events.push({ date: t.due_date, kind: "Task due", label: t.title, client: name(t.client_id) });
  });
  clients.forEach((c: any) => {
    if (c.roadmap_at) {
      const d = new Date(c.roadmap_at); d.setDate(d.getDate() + 30);
      events.push({ date: d.toISOString().slice(0, 10), kind: "30-day review", label: "30-day review due", client: c.business || c.contact || c.email });
    }
  });

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = events.filter((e) => e.date >= today).sort((a, b) => a.date.localeCompare(b.date));
  const overdue = events.filter((e) => e.date < today).sort((a, b) => b.date.localeCompare(a.date));

  const row = (e: Ev, i: number) => (
    <li key={i} className="flex flex-wrap items-center justify-between gap-3 border-b border-line-soft/60 py-3">
      <div><p className="text-[15px] text-charcoal">{e.label} <span className="text-[12px] text-ink-faint">· {e.client}</span></p>
        <p className="text-[12px] prose-muted">{e.kind}</p></div>
      <span className="text-[13px] tabular-nums text-forest">{new Date(e.date + "T00:00:00").toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</span>
    </li>
  );

  return (
    <div className="flex flex-col gap-8">
      <div><h1 className="font-fraunces text-[32px] font-normal text-forest">Calendar</h1><span className="rule-gold mb-4 mt-2" /><p className="max-w-[48em] prose-soft">Your upcoming schedule across the clients you&apos;re on — task due dates and 30-day reviews. Book kickoffs and reviews with the links below.</p></div>

      <div className="flex flex-wrap gap-3">
        <a href={SITE.kickoffUrl} target="_blank" rel="noreferrer" className="btn-gold text-[13px]">Book a kickoff call</a>
        <a href={SITE.reviewUrl} target="_blank" rel="noreferrer" className="btn-outline text-[13px]">Book a 30-day review</a>
      </div>

      <section>
        <h2 className="mb-2 font-fraunces text-[20px] font-medium text-forest">Upcoming</h2>
        {upcoming.length === 0 ? <p className="text-[15px] prose-muted">Nothing scheduled.</p> : <ul className="border-t border-line-soft">{upcoming.map(row)}</ul>}
      </section>

      {overdue.length > 0 && (
        <section>
          <h2 className="mb-2 font-fraunces text-[20px] font-medium text-forest">Past due</h2>
          <ul className="border-t border-line-soft">{overdue.map(row)}</ul>
        </section>
      )}
    </div>
  );
}
