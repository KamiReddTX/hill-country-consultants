import { redirect } from "next/navigation";
import { getStaffMember, getClients } from "@/lib/staff";
import { createClient } from "@/lib/supabase/server";
import { TaskMoveControl } from "@/components/staff/task-move-control";
import { AddDeliverableForm } from "@/components/staff/add-deliverable-form";
import { ClientRoadmapEditor } from "@/components/staff/client-roadmap-editor";

export default async function DeliveryPage() {
  const me = await getStaffMember();
  if (!me) redirect("/staff/login");
  const clients = await getClients();
  const byId = new Map(clients.map((c) => [c.id, c]));
  const mineOrOpen = (cid: string) => { const c = byId.get(cid); return !!c && (!c.assigned_to || c.assigned_to === me.role); };
  const workable = clients.filter((c) => !c.assigned_to || c.assigned_to === me.role).map((c) => ({ id: c.id, label: c.business || c.contact || c.email }));
  const db = createClient();
  const [tasks, deliv, roadmap] = await Promise.all([
    db.from("client_tasks").select("*").in("column_name", ["In progress", "In review"]),
    db.from("client_deliverables").select("*").order("delivered_on", { ascending: false }).limit(40),
    db.from("client_roadmap").select("phase,status,note,client_id"),
  ]);
  const roadmapByClient = new Map<string, { phase: string; status: string; note: string | null }[]>();
  (roadmap.data ?? []).forEach((r: any) => {
    const a = roadmapByClient.get(r.client_id) || [];
    a.push({ phase: r.phase, status: r.status, note: r.note });
    roadmapByClient.set(r.client_id, a);
  });
  const queue = (tasks.data ?? []).filter((t) => mineOrOpen(t.client_id));
  const delivered = (deliv.data ?? []).filter((d) => mineOrOpen(d.client_id));
  const name = (cid: string) => byId.get(cid)?.business || byId.get(cid)?.contact || "Client";

  return (
    <div className="flex flex-col gap-8">
      <div><h1 className="font-fraunces text-[32px] font-normal text-forest">Delivery</h1><span className="rule-gold mb-4 mt-2" /><p className="text-[14px] prose-muted">Every deliverable passes a pre-delivery review before it reaches the client.</p></div>
      <section>
        <h2 className="mb-3 font-fraunces text-[20px] font-medium text-forest">In progress &amp; in review</h2>
        {queue.length === 0 ? <p className="text-[15px] prose-muted">Nothing in the delivery queue.</p> : (
          <ul className="flex flex-col gap-2">{queue.map((t) => (
            <li key={t.id} className="flex items-center justify-between gap-3 border border-line-warm bg-white p-4"><span className="text-[15px] text-charcoal">{t.title} <span className="text-[12px] text-ink-faint">· {name(t.client_id)}</span></span><TaskMoveControl taskId={t.id} current={t.column_name} /></li>
          ))}</ul>
        )}
      </section>
      <section>
        <h2 className="mb-3 font-fraunces text-[20px] font-medium text-forest">Record a deliverable</h2>
        <p className="mb-3 text-[14px] prose-muted">Logs to the client's Files &amp; deliverables and their weekly report.</p>
        <AddDeliverableForm clients={workable} />
      </section>
      <section>
        <h2 className="mb-3 font-fraunces text-[20px] font-medium text-forest">30-day roadmaps</h2>
        <p className="mb-3 text-[14px] prose-muted">Set each phase&apos;s status and a client-specific note — this is exactly what shows on the client&apos;s Roadmap tab.</p>
        {workable.length === 0 ? <p className="text-[15px] prose-muted">No clients assigned to you yet.</p> : (
          <div className="flex flex-col gap-2">
            {workable.map((c) => (
              <details key={c.id} className="border border-line-warm bg-white">
                <summary className="min-h-touch cursor-pointer px-4 py-3 text-[15px] font-medium text-charcoal">{c.label}</summary>
                <div className="border-t border-line-soft p-4"><ClientRoadmapEditor clientId={c.id} rows={roadmapByClient.get(c.id) || []} /></div>
              </details>
            ))}
          </div>
        )}
      </section>
      <section>
        <h2 className="mb-3 font-fraunces text-[20px] font-medium text-forest">Recently delivered</h2>
        {delivered.length === 0 ? <p className="text-[15px] prose-muted">No deliverables recorded yet.</p> : (
          <ul className="flex flex-col gap-2">{delivered.map((d) => (
            <li key={d.id} className="flex justify-between border-t border-line-soft pt-2 text-[15px]"><span className="prose-soft">{d.name} <span className="text-[12px] text-ink-faint">· {name(d.client_id)}</span></span><span className="text-[12px] text-forest">{d.status}{d.delivered_on ? ` · ${d.delivered_on}` : ""}</span></li>
          ))}</ul>
        )}
      </section>
    </div>
  );
}
