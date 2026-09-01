import { redirect } from "next/navigation";
import { getStaffMember } from "@/lib/staff";
import { createServiceClient } from "@/lib/supabase/server";
import { PriorityBadge, dueMeta } from "@/components/staff/task-urgency";

export const dynamic = "force-dynamic";

const PRI_RANK: Record<string, number> = { Urgent: 0, High: 1, Normal: 2, Low: 3 };

/** The signed-in employee's own work — every task assigned to them, grouped by
 *  urgency and sorted by due date. This is the "what's mine, due when" view that
 *  the client-centric dashboards don't give an individual contributor. */
export default async function MyWorkPage() {
  const me = await getStaffMember();
  if (!me) redirect("/staff/login");
  const db = createServiceClient();
  // Own assigned tasks that aren't delivered yet. Filtered to me — an employee
  // sees their work even on accounts they don't own.
  const { data: rows } = await db
    .from("client_tasks")
    .select("id,title,client_id,column_name,due_date,priority,needs_clarification")
    .eq("assignee_id", me.id)
    .neq("column_name", "Delivered");
  const tasks = rows ?? [];
  const clientIds = Array.from(new Set(tasks.map((t: any) => t.client_id)));
  const { data: clients } = clientIds.length
    ? await db.from("clients").select("id,business,contact").in("id", clientIds)
    : { data: [] as any[] };
  const nameOf = (cid: string) => {
    const c = (clients as any[]).find((x) => x.id === cid);
    return c?.business || c?.contact || "Client";
  };

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const inDays = (d: string | null) => {
    if (!d) return Infinity;
    const dt = new Date(d + "T00:00:00"); return Math.round((dt.getTime() - today.getTime()) / 86400000);
  };
  const sort = (a: any, b: any) =>
    (PRI_RANK[a.priority] ?? 2) - (PRI_RANK[b.priority] ?? 2) || inDays(a.due_date) - inDays(b.due_date);

  const inReview = tasks.filter((t: any) => t.column_name === "In review").sort(sort);
  const openTasks = tasks.filter((t: any) => t.column_name !== "In review");
  const overdue = openTasks.filter((t: any) => t.due_date && inDays(t.due_date) < 0).sort(sort);
  const dueToday = openTasks.filter((t: any) => t.due_date && inDays(t.due_date) === 0).sort(sort);
  const thisWeek = openTasks.filter((t: any) => t.due_date && inDays(t.due_date) > 0 && inDays(t.due_date) <= 7).sort(sort);
  const later = openTasks
    .filter((t: any) => !t.due_date || inDays(t.due_date) > 7)
    .sort(sort);

  const Card = ({ t }: { t: any }) => {
    const due = dueMeta(t.due_date);
    return (
      <li className="flex flex-col gap-1 border border-line-warm bg-white p-3">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[14px] text-charcoal">{t.title}</p>
          <PriorityBadge priority={t.priority} />
        </div>
        <p className="text-[12px] prose-muted">{nameOf(t.client_id)} · {t.column_name}</p>
        <div className="flex items-center gap-2">
          <span className={`text-[12px] ${due.cls}`}>{due.label}</span>
          {t.needs_clarification && <span className="text-[11px] font-semibold text-gold">Changes requested</span>}
        </div>
      </li>
    );
  };

  const Section = ({ title, items, tone }: { title: string; items: any[]; tone?: string }) =>
    items.length === 0 ? null : (
      <section>
        <h2 className={`mb-2 text-[13px] font-semibold uppercase tracking-wide ${tone || "text-forest"}`}>{title} <span className="prose-muted">· {items.length}</span></h2>
        <ul className="flex flex-col gap-2">{items.map((t) => <Card key={t.id} t={t} />)}</ul>
      </section>
    );

  const total = tasks.length;
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-fraunces text-[32px] font-normal text-forest">My work</h1>
        <span className="rule-gold mb-4 mt-2" />
        <p className="max-w-[48em] prose-soft">Everything assigned to you, by urgency. {total === 0 ? "Nothing on your plate right now." : `${total} open item${total === 1 ? "" : "s"}.`}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-4">
        <Stat n={overdue.length} label="Overdue" tone={overdue.length ? "text-red-700" : "text-forest"} />
        <Stat n={dueToday.length} label="Due today" tone="text-forest" />
        <Stat n={thisWeek.length} label="This week" tone="text-forest" />
        <Stat n={inReview.length} label="In review" tone="text-forest" />
      </div>
      <div className="flex flex-col gap-6">
        <Section title="Overdue" items={overdue} tone="text-red-700" />
        <Section title="Due today" items={dueToday} />
        <Section title="This week" items={thisWeek} />
        <Section title="In review (awaiting client)" items={inReview} />
        <Section title="Later / no date" items={later} />
        {total === 0 && <p className="text-[15px] prose-muted">You have no open assigned tasks. Nice.</p>}
      </div>
    </div>
  );
}

function Stat({ n, label, tone }: { n: number; label: string; tone: string }) {
  return (
    <div className="border border-line-warm bg-white p-4">
      <p className={`font-fraunces text-[28px] ${tone}`}>{n}</p>
      <p className="text-[12px] uppercase tracking-wide prose-muted">{label}</p>
    </div>
  );
}
