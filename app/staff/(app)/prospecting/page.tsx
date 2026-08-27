import { redirect } from "next/navigation";
import { getStaffMember, isSalesOrAdmin, isAdmin } from "@/lib/staff";
import { createClient } from "@/lib/supabase/server";
import { ProspectSearch } from "@/components/staff/prospecting/prospect-search";
import { ProspectSubnav } from "@/components/staff/prospecting/subnav";

export const dynamic = "force-dynamic";

export default async function ProspectingPage() {
  const me = await getStaffMember();
  if (!me) redirect("/staff/login");
  if (!isSalesOrAdmin(me)) return <p className="text-[15px] prose-muted">Prospecting is for sales and admins.</p>;

  const { data: perms } = await createClient()
    .from("role_permissions").select("can_reveal")
    .in("role_title", [me.role, ...((me.roles as string[] | null) || [])].filter(Boolean));
  const canReveal = (perms || []).some((p: any) => p.can_reveal);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-fraunces text-[32px] font-normal text-forest">Prospecting</h1>
        <span className="rule-gold mt-2 block" />
      </div>
      <ProspectSubnav isAdmin={isAdmin(me)} />
      <ProspectSearch canReveal={canReveal} />
    </div>
  );
}
