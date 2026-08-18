import { redirect } from "next/navigation";
import { getStaffMember, getClients, getStaffOptions } from "@/lib/staff";
import { createClient } from "@/lib/supabase/server";
import { TaskMoveControl } from "@/components/staff/task-move-control";
import { TaskAssignee } from "@/components/staff/task-assignee";
import { LogWorkForm } from "@/components/staff/log-work-form";

const RECURRING = [
  "Clear the request queue — acknowledge every new client request the same business day.",
  "Check the vault re-sync alerts and clear any that are resolved.",
  "Move delivered work to the client's board and file it in the shared drive.",
  "Log today's hours by service line before you clock out.",
];

export default async function DailyPage() {
  const me = await getStaffMember();
  if (!me) redirect("/staff/login");
  const [clients, staffOptions] = await Promise.all([getClients(), getStaffOptions()]);
  // getClients is RLS-scoped, so every client here is one I can reach (owner, team, or privileged).
  const byId = new Map(clients.map((c) => [c.id, c]));
  const mineOrOpen = (cid: string) => byId.has(cid);
  const workable = clients.map((c) => ({ id: c.id, label: c.business || c.contact || c.email }));
  const assigneeOpts = staffOptions;
  const staffName = new Map(staffOptions.map((o) => [o.id, o.label]));

  const db = createClient();
  const [tasks, notes, vault] = await Promise.all([
    db.from("client_tasks").select("*").eq("created_by", "client").eq("column_name", "Requested"),
    db.from("client_notes").select("*").order("created_at", { ascending: false }).limit(30),
    db.from("client_vault").select("*").eq("needs_resync", true),
  ]);
  const requests = (tasks.data ?? []).filter((t) => mineOrOpen(t.client_id));
  const messages = (notes.data ?? []).filter((n) => mineOrOpen(n.client_id));
  const resyncs = (vault.data ?? []).filter((v) => mineOrOpen(v.client_id));
  const info = (cid: string) => { const c = byId.get(cid); return c ? `${c.business || c.contact || c.email}${c.contact ? ` · ${c.contact}` : ""}${c.phone ? ` · ${c.phone}` : ""}` : "Unknown client"; };

  return (
    <div className="flex flex-col gap-10">
      <div><h1 className="font-fraunces text-[32px] font-normal text-forest">Daily tasks</h1><span className="rule-gold mb-4 mt-2" /></div>

      <section>
        <h2 className="mb-3 font-fraunces text-[22px] font-medium text-forest">Client requests</h2>
        {requests.length === 0 ? <p className="text-[15px] prose-muted">No open client requests.</p> : (
          <ul className="flex flex-col gap-2">
            {requests.map((t) => (
              <li key={t.id} className="border border-line-warm bg-white p-4">
                <p className="text-[15px] font-medium text-charcoal">{t.title}</p>
                <p className="text-[13px] prose-muted">{t.service || "—"}{t.due_date ? ` · needed by ${t.due_date}` : ""}</p>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[12px] text-ink-faint">{info(t.client_id)}</p>
                  <TaskMoveControl taskId={t.id} current={t.column_name} />
                </div>
                <div className="mt-1"><span className="text-[11px] text-ink-faint">Worker: {t.assignee_id ? staffName.get(t.assignee_id) || "Assigned" : "unassigned"}</span>
                  <TaskAssignee taskId={t.id} current={t.assignee_id} options={assigneeOpts} /></div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-fraunces text-[22px] font-medium text-forest">Credential re-sync alerts</h2>
        {resyncs.length === 0 ? <p className="text-[15px] prose-muted">Nothing needs re-syncing.</p> : (
          <ul className="flex flex-col gap-2">
            {resyncs.map((v) => <li key={v.id} className="border-l-2 border-gold bg-white px-4 py-3 text-[14px] text-charcoal">{v.name} — {info(v.client_id)}</li>)}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-fraunces text-[22px] font-medium text-forest">Client messages</h2>
        {messages.length === 0 ? <p className="text-[15px] prose-muted">No new messages.</p> : (
          <ul className="flex flex-col gap-2">
            {messages.map((n) => (
              <li key={n.id} className="border border-line-warm bg-white p-4">
                <p className="text-[15px] prose-soft">{n.body}</p>
                <p className="text-[12px] text-ink-faint">{info(n.client_id)} · {new Date(n.created_at).toLocaleString()}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-fraunces text-[22px] font-medium text-forest">Log work</h2>
        <p className="mb-3 text-[15px] prose-muted">Log today's hours by service line — entries appear on the client's work log and weekly report.</p>
        <LogWorkForm clients={workable} />
      </section>

      <section>
        <h2 className="mb-3 font-fraunces text-[22px] font-medium text-forest">Recurring checklist</h2>
        <ul className="flex flex-col gap-2">{RECURRING.map((r, i) => <li key={i} className="border-t border-line-soft pt-2 text-[15px] prose-soft">{r}</li>)}</ul>
      </section>
    </div>
  );
}
