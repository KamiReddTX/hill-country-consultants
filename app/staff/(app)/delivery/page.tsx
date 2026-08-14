import { redirect } from "next/navigation";
import { getStaffMember, getClients, isAdmin } from "@/lib/staff";
import { createClient } from "@/lib/supabase/server";
import { TaskMoveControl } from "@/components/staff/task-move-control";
import { AddDeliverableForm } from "@/components/staff/add-deliverable-form";
import { ClientRoadmapEditor } from "@/components/staff/client-roadmap-editor";
import { TaskWorkflowButton } from "@/components/staff/task-workflow-button";
import { TaskChargeForm } from "@/components/staff/task-charge-form";

export default async function DeliveryPage() {
  const me = await getStaffMember();
  if (!me) redirect("/staff/login");
  const admin = isAdmin(me);
  const clients = await getClients();
  const byId = new Map(clients.map((c) => [c.id, c]));
  const mineOrOpen = (cid: string) => { const c = byId.get(cid); return !!c && (!c.assigned_to || c.assigned_to === me.role); };
  const workable = clients.filter((c) => !c.assigned_to || c.assigned_to === me.role).map((c) => ({ id: c.id, label: c.business || c.contact || c.email }));
  const db = createClient();
  const [tasks, deliv, roadmap, files] = await Promise.all([
    db.from("client_tasks").select("*").in("column_name", ["Requested", "In progress", "In review"]),
    db.from("client_deliverables").select("*").order("delivered_on", { ascending: false }).limit(40),
    db.from("client_roadmap").select("phase,status,note,client_id"),
    db.from("client_task_files").select("id,task_id,name"),
  ]);
  const roadmapByClient = new Map<string, { phase: string; status: string; note: string | null }[]>();
  (roadmap.data ?? []).forEach((r: any) => {
    const a = roadmapByClient.get(r.client_id) || [];
    a.push({ phase: r.phase, status: r.status, note: r.note });
    roadmapByClient.set(r.client_id, a);
  });
  const filesByTask = new Map<string, { id: string; name: string }[]>();
  (files.data ?? []).forEach((f: any) => {
    const a = filesByTask.get(f.task_id) || [];
    a.push({ id: f.id, name: f.name });
    filesByTask.set(f.task_id, a);
  });
  const mine = (tasks.data ?? []).filter((t) => mineOrOpen(t.client_id));
  const requested = mine.filter((t) => t.column_name === "Requested");
  const queue = mine.filter((t) => t.column_name === "In progress" || t.column_name === "In review");
  const delivered = (deliv.data ?? []).filter((d) => mineOrOpen(d.client_id));
  const name = (cid: string) => byId.get(cid)?.business || byId.get(cid)?.contact || "Client";

  return (
    <div className="flex flex-col gap-8">
      <div><h1 className="font-fraunces text-[32px] font-normal text-forest">Delivery</h1><span className="rule-gold mb-4 mt-2" /><p className="text-[14px] prose-muted">Every deliverable passes a pre-delivery review before it reaches the client.</p></div>
      <section>
        <h2 className="mb-3 font-fraunces text-[20px] font-medium text-forest">New requests — accept &amp; assign</h2>
        <p className="mb-3 text-[14px] prose-muted">Client requests and purchased services land here. Accept to move a task into your queue.</p>
        {requested.length === 0 ? <p className="text-[15px] prose-muted">No new requests.</p> : (
          <ul className="flex flex-col gap-2">{requested.map((t) => {
            const tf = filesByTask.get(t.id) || [];
            return (
              <li key={t.id} className="flex flex-col gap-2 border border-line-warm bg-white p-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-[15px] text-charcoal">{t.title} <span className="text-[12px] text-ink-faint">· {name(t.client_id)}</span>{t.paid ? <span className="ml-2 text-[11px] font-semibold text-forest">Purchased</span> : ""}</p>
                  {t.details && t.details !== t.title && <p className="mt-0.5 text-[13px] prose-soft">{t.details}</p>}
                  <p className="mt-1 text-[12px] prose-muted">{t.due_date ? `needed by ${t.due_date}` : "no date set"}</p>
                  {tf.length > 0 && <ul className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">{tf.map((f) => <li key={f.id}><a href={`/api/task-file/${f.id}`} className="text-[12px] text-forest underline underline-offset-2 hover:text-gold">{f.name}</a></li>)}</ul>}
                </div>
                <div className="flex shrink-0 flex-col items-start gap-2">
                  {t.paid && t.created_by === "staff" ? (
                    admin ? <TaskWorkflowButton taskId={t.id} kind="accept" /> : <span className="text-[12px] prose-muted">Awaiting admin approval</span>
                  ) : (
                    <>
                      <TaskWorkflowButton taskId={t.id} kind="accept" />
                      <TaskChargeForm taskId={t.id} status={t.charge_status} cents={t.charge_cents} />
                    </>
                  )}
                </div>
              </li>
            );
          })}</ul>
        )}
      </section>
      <section>
        <h2 className="mb-3 font-fraunces text-[20px] font-medium text-forest">In progress &amp; in review</h2>
        {queue.length === 0 ? <p className="text-[15px] prose-muted">Nothing in the delivery queue.</p> : (
          <ul className="flex flex-col gap-2">{queue.map((t) => {
            const tf = filesByTask.get(t.id) || [];
            return (
              <li key={t.id} className="flex flex-col gap-2 border border-line-warm bg-white p-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-[15px] text-charcoal">{t.title} <span className="text-[12px] text-ink-faint">· {name(t.client_id)} · {t.column_name}</span></p>
                  {t.needs_clarification && <p className="mt-0.5 text-[12px] font-semibold text-gold">Client asked for changes — call them for clarification.</p>}
                  {tf.length > 0 && <ul className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">{tf.map((f) => <li key={f.id}><a href={`/api/task-file/${f.id}`} className="text-[12px] text-forest underline underline-offset-2 hover:text-gold">{f.name}</a></li>)}</ul>}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {t.column_name === "In progress" && <TaskWorkflowButton taskId={t.id} kind="submit" />}
                  <TaskMoveControl taskId={t.id} current={t.column_name} />
                </div>
              </li>
            );
          })}</ul>
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
