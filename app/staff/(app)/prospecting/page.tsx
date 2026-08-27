import { redirect } from "next/navigation";
import { getStaffMember, isSalesOrAdmin } from "@/lib/staff";
import { ProspectSearch } from "@/components/staff/prospecting/prospect-search";

export const dynamic = "force-dynamic";

export default async function ProspectingPage() {
  const me = await getStaffMember();
  if (!me) redirect("/staff/login");
  if (!isSalesOrAdmin(me)) return <p className="text-[15px] prose-muted">Prospecting is for sales and admins.</p>;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-fraunces text-[32px] font-normal text-forest">Prospecting</h1>
        <span className="rule-gold mt-2 block" />
        <p className="mt-2 max-w-[54em] text-[14px] prose-muted">
          Filter the national business file, save searches, build lists, and promote qualified companies into your
          pipeline. Search and counts run server-side — contact details are never loaded here. Contact reveal is metered
          and activates once a data vendor is connected.
        </p>
      </div>
      <ProspectSearch />
    </div>
  );
}
