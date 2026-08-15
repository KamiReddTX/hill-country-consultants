import { redirect } from "next/navigation";
import { getStaffMember, isPrivileged, getDirectory, rolesOf, usd } from "@/lib/staff";
import { ROLE_OPTIONS } from "@/content/roles";
import { AddStaffForm } from "@/components/staff/add-staff-form";
import { RoleEditor } from "@/components/staff/role-editor";
import { SuspendStaffButton } from "@/components/staff/suspend-staff-button";
import { CommissionInput } from "@/components/staff/commission-input";

export default async function DirectoryPage() {
  const me = await getStaffMember();
  if (!me) redirect("/staff/login");
  if (!isPrivileged(me)) return <p className="text-[15px] prose-muted">The Directory is for administrators and business managers only.</p>;

  const directory = await getDirectory();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-fraunces text-[32px] font-normal text-forest">Employee directory</h1>
        <span className="rule-gold mb-4 mt-2" />
        <p className="max-w-[48em] prose-soft">Add employees and manage their roles and access. An employee can hold several roles at once — check every one that applies. Suspending an employee blocks them from every portal immediately.</p>
      </div>

      <section>
        <h2 className="mb-2 font-fraunces text-[20px] font-medium text-forest">Add an employee</h2>
        <AddStaffForm />
      </section>

      <section>
        <h2 className="mb-3 font-fraunces text-[20px] font-medium text-forest">Directory</h2>
        <div className="overflow-x-auto border border-line-warm">
          <table className="w-full min-w-[820px] border-collapse bg-white text-left text-[14px]">
            <thead><tr className="border-b border-line-soft text-ink-faint"><th className="p-3 font-medium">Name</th><th className="p-3 font-medium">Email</th><th className="p-3 font-medium w-72">Roles</th><th className="p-3 font-medium">Code</th><th className="p-3 font-medium text-right">Rate</th><th className="p-3 font-medium">Commission</th><th className="p-3 font-medium">Hourly</th><th className="p-3 font-medium">Active</th><th className="p-3 font-medium">Manage</th></tr></thead>
            <tbody>
              {directory.map((s) => (
                <tr key={s.id} className="border-b border-line-soft/60 align-top">
                  <td className="p-3 font-medium text-charcoal">{s.name || "—"}</td>
                  <td className="p-3 prose-muted">{s.email}</td>
                  <td className="p-3 prose-soft"><RoleEditor staffId={s.id} current={rolesOf(s)} options={ROLE_OPTIONS} /></td>
                  <td className="p-3 prose-muted">{s.employee_code || "—"}</td>
                  <td className="p-3 text-right tabular-nums">{s.hourly ? usd(Number(s.rate || 0)) : "—"}</td>
                  <td className="p-3"><CommissionInput staffId={s.id} current={Number((s as any).commission_pct || 0)} /></td>
                  <td className="p-3">{s.hourly ? "Yes" : "No"}</td>
                  <td className="p-3">{s.active ? "Yes" : "No"}</td>
                  <td className="p-3">{s.id === me.id ? <span className="text-[12px] text-ink-faint">You</span> : <SuspendStaffButton staffId={s.id} active={s.active} />}</td>
                </tr>
              ))}
              {directory.length === 0 && <tr><td colSpan={9} className="p-3 prose-muted">No employees yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
