import { redirect } from "next/navigation";
import { getStaffMember, isSalesOrAdmin, isAdmin } from "@/lib/staff";
import { createClient } from "@/lib/supabase/server";
import { ProspectSubnav } from "@/components/staff/prospecting/subnav";
import { ListsView } from "@/components/staff/prospecting/lists-view";

export const dynamic = "force-dynamic";

export default async function ProspectingListsPage() {
  const me = await getStaffMember();
  if (!me) redirect("/staff/login");
  if (!isSalesOrAdmin(me)) return <p className="text-[15px] prose-muted">Prospecting is for sales and admins.</p>;

  const db = createClient();
  const [{ data: lists }, { data: members }, { data: perms }] = await Promise.all([
    db.from("lead_lists").select("id,name,shared_team,created_at").order("created_at", { ascending: false }),
    db.from("lead_list_members").select("list_id,account_id"),
    db.from("role_permissions").select("can_export,role_title").in("role_title", [me.role, ...((me.roles as string[] | null) || [])].filter(Boolean)),
  ]);

  const byList = new Map<string, string[]>();
  (members || []).forEach((m: any) => {
    if (!m.account_id) return;
    const arr = byList.get(m.list_id) || []; arr.push(m.account_id); byList.set(m.list_id, arr);
  });
  const rows = (lists || []).map((l: any) => ({ ...l, accountIds: byList.get(l.id) || [], count: (byList.get(l.id) || []).length }));
  const canExport = (perms || []).some((p: any) => p.can_export);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-fraunces text-[32px] font-normal text-forest">Prospecting</h1>
        <span className="rule-gold mt-2 block" />
      </div>
      <ProspectSubnav isAdmin={isAdmin(me)} />
      <ListsView lists={rows} canExport={canExport} />
    </div>
  );
}
