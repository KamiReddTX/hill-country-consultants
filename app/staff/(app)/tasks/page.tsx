import { redirect } from "next/navigation";
import { getStaffMember, getClients, getDirectory, isPrivileged } from "@/lib/staff";
import { createClient } from "@/lib/supabase/server";
import { TaskWorkflowButton } from "@/components/staff/task-workflow-button";
import { TaskChargeForm } from "@/components/staff/task-charge-form";
import { TaskMoveControl } from "@/components/staff/task-move-control";
import { TaskAssignee } from "@/components/staff/task-assignee";

const COLUMNS = ["Requested", "In progress", "In review", "Delivered"];

export default async function StaffTaskBoardPage() {
  const me = await getStaffMember();
  if (!me) redirect("/staff/login");
  const admin = isPrivileged(me);
  const [clients, directory] = await Promise.all([getClients(), getDirectory()]);
  const byId = new Map(clients.map((c) => [c.id, c]));
  const name = (cid: string) => byId.get(cid)?.business || byId.get(cid)?.contact || "Client";
  const assigneeOpts = directory.filter((s) => s.active !== false).map((s) => ({ id: s.id, label: s.name || s.email }));
  const staffName = new Map(directory.map((s) => [s.id, s.name || s.email]));

  const db = createClient();
  const [{ data: tasks }, { data: files }] = await Promise.all([
    db.from("client_tasks").select("*").order("created_at", { ascending: false }),
    db.from("client_task_files").select("id,task_id,name"),
  ]);
  const mine = (tasks ?? []).filter((t: any) => byId.has(t.client_id));
  const filesByTask = new Map<string, { id: string; name: string }[]>();
  (files ?? []).forEach((f: any) => { const a = filesByTask.get(f.task_id) || []; a.push({ id: f.id, name: f.name }); filesByTask.set(f.task_id, a); });

  return (
    <div className="flex flex-col gap-6">
      <div><h1 className="font-fraunces text-[32px] font-normal text-forest">Task board</h1><span className="rule-gold mb-4 mt-2" /><p className="max-w-[48em] prose-soft">Every task for the clients you&apos;re on. Accept new requests, set a charge if one&apos;s needed, assign the worker, and move it through review to delivered.</p></div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {COLUMNS.map((col) => {
          const items = mine.filter((t: any) => (t.column_name || "Requested") === col);
          return (
            <div key={col} className="border border-line-warm bg-white">
              <div className="flex items-center justify-between border-b border-line-soft px-4 py-3">
                <p className="text-[13px] font-semibold uppercase tracking-wide text-forest">{col}</p><span className="text-[12px] prose-muted">{items.length}</span>
              </div>
              <ul className="flex flex-col gap-2 p-3">
                {items.length === 0 && <li className="px-1 py-2 text-[13px] text-ink-faint">Nothing here.</li>}
                {items.map((t: any) => {
                  const tf = filesByTask.get(t.id) || [];
                  return (
                    <li key={t.id} className="border border-line-soft bg-cream/40 p-3">
                      <p className="text-[14px] text-charcoal">{t.title} {t.paid ? <span className="text-[11px] font-semibold text-forest">· Purchased</span> : null}</p>
                      <p className="text-[12px] prose-muted">{name(t.client_id)}{t.due_date ? ` · needed by ${t.due_date}` : ""}</p>
                      {t.details && t.details !== t.title && <p className="mt-0.5 text-[12px] prose-soft">{t.details}</p>}
                      {tf.length > 0 && <ul className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">{tf.map((f) => <li key={f.id}><a href={`/api/task-file/${f.id}`} className="text-[12px] text-forest underline underline-offset-2 hover:text-gold">{f.name}</a></li>)}</ul>}
                      {t.needs_clarification && col === "In progress" && <p className="mt-1 text-[11px] font-semibold text-gold">Client asked for changes — call them.</p>}

                      <div className="mt-2 flex flex-col gap-2">
                        {col === "Requested" && (
                          t.paid && t.created_by === "staff" && !admin
                            ? <span className="text-[12px] prose-muted">Awaiting admin approval</span>
                            : <><TaskWorkflowButton taskId={t.id} kind="accept" />{!(t.paid) && <TaskChargeForm taskId={t.id} status={t.charge_status} cents={t.charge_cents} />}</>
                        )}
                        {col === "In progress" && <TaskWorkflowButton taskId={t.id} kind="submit" />}
                        {(col === "In progress" || col === "In review") && <TaskMoveControl taskId={t.id} current={t.column_name} />}
                        {col === "Delivered" && t.approved_at && <p className="text-[11px] text-forest">Approved {new Date(t.approved_at).toLocaleDateString()}</p>}
                        <div><span className="text-[11px] text-ink-faint">Worker: {t.assignee_id ? staffName.get(t.assignee_id) || "Assigned" : "unassigned"}</span>
                          <TaskAssignee taskId={t.id} current={t.assignee_id} options={assigneeOpts} /></div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
