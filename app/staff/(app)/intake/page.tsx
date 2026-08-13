import { redirect } from "next/navigation";
import { getStaffMember, isSalesOrAdmin } from "@/lib/staff";
import { LeadForm } from "@/components/staff/lead-form";

export default async function IntakePage() {
  const me = await getStaffMember();
  if (!me) redirect("/staff/login");
  if (!isSalesOrAdmin(me)) return <p className="text-[15px] prose-muted">Intake is for sales and admins.</p>;
  return (
    <div className="flex flex-col gap-6">
      <div><h1 className="font-fraunces text-[32px] font-normal text-forest">Intake</h1><span className="rule-gold mb-4 mt-2" /><p className="max-w-[48em] text-[15px] prose-soft">New leads require an employee code — it's pre-filled from your profile and stamped on the lead for attribution.</p></div>
      {!me.employee_code && <p className="border-l-2 border-gold bg-white px-4 py-3 text-[14px] text-charcoal">Your profile has no employee code yet. An admin sets this before you can log intake.</p>}
      <LeadForm repCode={me.employee_code || ""} />
    </div>
  );
}
