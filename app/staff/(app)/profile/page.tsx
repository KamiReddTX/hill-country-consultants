import { redirect } from "next/navigation";
import { getStaffMember, usd } from "@/lib/staff";

export default async function ProfilePage() {
  const me = await getStaffMember();
  if (!me) redirect("/staff/login");
  const rows = [
    ["Name", me.name || "—"], ["Email", me.email], ["Role", me.role],
    ["Employee code", me.employee_code || "—"], ["Hourly", me.hourly ? "Yes" : "No"],
    ["Rate", me.hourly ? `${usd(Number(me.rate || 0))}/hr` : "—"],
  ];
  return (
    <div className="flex flex-col gap-6 max-w-lg">
      <div><h1 className="font-fraunces text-[32px] font-normal text-forest">My profile</h1><span className="rule-gold mb-4 mt-2" /></div>
      <dl className="border border-line-warm bg-white">
        {rows.map(([k, v]) => <div key={k} className="flex justify-between border-b border-line-soft/60 px-4 py-3 last:border-0"><dt className="text-[14px] prose-muted">{k}</dt><dd className="text-[15px] font-medium text-charcoal">{v}</dd></div>)}
      </dl>
      <p className="text-[13px] prose-muted">Role, rate and code are managed by an administrator.</p>
    </div>
  );
}
