import { redirect } from "next/navigation";
import { getStaffMember, getClients } from "@/lib/staff";
import { createClient } from "@/lib/supabase/server";
import { ChecklistManager } from "@/components/staff/checklist-manager";

/** Per-client checklists. Every staffer sees the clients they can reach (RLS
 *  scopes it) and can build/check off a freeform checklist — e.g. a branding
 *  client's launch cycle. The client sees their own progress in their portal. */
export default async function ChecklistsPage() {
  const me = await getStaffMember();
  if (!me) redirect("/staff/login");

  const clients = await getClients(); // RLS-scoped to reachable clients
  const db = createClient();
  const { data: items } = await db.from("client_checklist_items").select("*").order("position", { ascending: true });
  const byClient = new Map<string, any[]>();
  (items ?? []).forEach((it: any) => { const a = byClient.get(it.client_id) || []; a.push(it); byClient.set(it.client_id, a); });

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-fraunces text-[32px] font-normal text-forest">Checklists</h1>
        <span className="rule-gold mb-2 mt-2" />
        <p className="max-w-[52em] text-[13px] prose-muted">Build a task checklist for any client and check items off as you go — ideal for keeping branding clients on their launch cycle. Group items with sections, or paste a whole list at once with Bulk paste. Your client sees their progress in their own portal.</p>
      </div>

      {clients.length === 0 ? <p className="text-[15px] prose-muted">No clients assigned to you yet.</p> : (
        <div className="flex flex-col gap-2">
          {clients.map((c) => {
            const its = byClient.get(c.id) || [];
            const label = c.business || c.contact || c.email;
            const done = its.filter((i: any) => i.done).length;
            return (
              <details key={c.id} className="border border-line-warm bg-white">
                <summary className="min-h-touch cursor-pointer list-none px-4 py-3">
                  <span className="flex flex-wrap items-center gap-x-3">
                    <span className="text-[15px] font-medium text-charcoal">{label}</span>
                    <span className="text-[12px] prose-muted">{its.length ? `${done}/${its.length} done` : "no checklist yet"}</span>
                  </span>
                </summary>
                <div className="border-t border-line-soft p-4"><ChecklistManager clientId={c.id} items={its as any} /></div>
              </details>
            );
          })}
        </div>
      )}
    </div>
  );
}
