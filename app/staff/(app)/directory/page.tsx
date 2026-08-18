import { redirect } from "next/navigation";
import { getStaffMember, isPrivileged, getDirectory, rolesOf, usd } from "@/lib/staff";
import { createClient } from "@/lib/supabase/server";
import { ROLE_OPTIONS } from "@/content/roles";
import { AddStaffForm } from "@/components/staff/add-staff-form";
import { RoleEditor } from "@/components/staff/role-editor";
import { SuspendStaffButton } from "@/components/staff/suspend-staff-button";
import { CommissionInput } from "@/components/staff/commission-input";
import { EmployeeResetButton } from "@/components/staff/employee-reset-button";
import { DeleteEmployeeButton } from "@/components/staff/delete-employee-button";
import { StaffDocsManager } from "@/components/staff/staff-docs-manager";
import { DocumentLibrary } from "@/components/staff/document-library";
import { LocalTime } from "@/components/local-time";

export default async function DirectoryPage() {
  const me = await getStaffMember();
  if (!me) redirect("/staff/login");
  if (!isPrivileged(me)) return <p className="text-[15px] prose-muted">The Directory is for administrators and business managers only.</p>;

  const directory = await getDirectory();
  const db = createClient();
  const { data: allDocs } = await db.from("staff_documents").select("*").order("created_at", { ascending: false });
  const { data: templates } = await db.from("document_templates").select("*").order("created_at", { ascending: false });
  const { data: applications } = await db.from("job_applications").select("*").order("created_at", { ascending: false });
  const employeeOpts = directory.filter((s) => s.active !== false).map((s) => ({ id: s.id, label: s.name || s.email }));
  const docsByStaff = new Map<string, any[]>();
  (allDocs ?? []).forEach((d: any) => { const a = docsByStaff.get(d.staff_id) || []; a.push(d); docsByStaff.set(d.staff_id, a); });

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
                  <td className="p-3"><div className="flex flex-col gap-1">
                    {s.id === me.id ? <span className="text-[12px] text-ink-faint">You</span> : <SuspendStaffButton staffId={s.id} active={s.active} />}
                    <EmployeeResetButton email={s.email} />
                    {s.id !== me.id && <DeleteEmployeeButton staffId={s.id} label={s.name || s.email} />}
                  </div></td>
                </tr>
              ))}
              {directory.length === 0 && <tr><td colSpan={9} className="p-3 prose-muted">No employees yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-1 font-fraunces text-[20px] font-medium text-forest">Employment applications</h2>
        <p className="mb-3 text-[13px] prose-muted">People who applied through the public Careers page. Open one for full details; résumés download securely and you can reply by email.</p>
        {(applications ?? []).length === 0 ? <p className="text-[15px] prose-muted">No applications yet.</p> : (
          <div className="flex flex-col gap-2">
            {(applications ?? []).map((a: any) => (
              <details key={a.id} className="border border-line-warm bg-white">
                <summary className="min-h-touch cursor-pointer list-none px-4 py-3">
                  <span className="flex flex-wrap items-center gap-x-3">
                    <span className="text-[15px] font-medium text-charcoal">{a.name}</span>
                    {a.position && <span className="text-[12px] text-forest">{a.position}</span>}
                    {a.employment_type && <span className="text-[11px] uppercase tracking-wide text-ink-faint">{a.employment_type}</span>}
                    <span className="text-[12px] prose-muted">· <LocalTime iso={a.created_at} mode="date" /></span>
                  </span>
                </summary>
                <div className="grid gap-x-8 gap-y-1 border-t border-line-soft p-4 text-[14px] md:grid-cols-2">
                  <p><span className="text-ink-faint">Email:</span> <a href={`mailto:${a.email}`} className="link-underline">{a.email}</a></p>
                  <p><span className="text-ink-faint">Phone:</span> {a.phone || "—"}</p>
                  <p><span className="text-ink-faint">Location:</span> {a.location || "—"}</p>
                  <p><span className="text-ink-faint">Availability:</span> {a.availability || "—"}</p>
                  <p><span className="text-ink-faint">Desired pay:</span> {a.desired_pay || "—"}</p>
                  <p><span className="text-ink-faint">Heard via:</span> {a.referral || "—"}</p>
                  {a.portfolio_url && <p className="md:col-span-2"><span className="text-ink-faint">Portfolio:</span> <a href={a.portfolio_url} target="_blank" rel="noreferrer" className="link-underline break-all">{a.portfolio_url}</a></p>}
                  {a.skills && <p className="md:col-span-2"><span className="text-ink-faint">Skills:</span> {a.skills}</p>}
                  {a.experience && <p className="whitespace-pre-wrap md:col-span-2"><span className="text-ink-faint">Experience:</span> {a.experience}</p>}
                  {a.why && <p className="whitespace-pre-wrap md:col-span-2"><span className="text-ink-faint">Why HCC:</span> {a.why}</p>}
                  <p className="pt-1 md:col-span-2">{a.resume_path ? <a href={`/api/application-file/${a.id}`} className="btn-gold text-[13px]">Download résumé</a> : <span className="text-[12px] prose-muted">No résumé attached.</span>}</p>
                </div>
              </details>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-1 font-fraunces text-[20px] font-medium text-forest">Internal document library</h2>
        <p className="mb-3 text-[13px] prose-muted">Keep reusable paperwork (W-9, NDA, contract&hellip;) here, then assign it to specific employees or to everyone in a role — it lands on each person&apos;s profile to complete and e-sign. Use PDFs so they can be DocuSigned.</p>
        <DocumentLibrary templates={(templates ?? []) as any} roleOptions={ROLE_OPTIONS} employees={employeeOpts} />
      </section>

      <section>
        <h2 className="mb-1 font-fraunces text-[20px] font-medium text-forest">Employment &amp; documents</h2>
        <p className="mb-3 text-[13px] prose-muted">Set each employee&apos;s employment type and start date, and upload their paystubs, contracts, NDAs, and tax forms. Tick &ldquo;requires signature&rdquo; for anything they must e-sign on their profile.</p>
        <div className="flex flex-col gap-2">
          {directory.map((s) => (
            <details key={s.id} className="border border-line-warm bg-white">
              <summary className="min-h-touch cursor-pointer px-4 py-3 text-[15px] font-medium text-charcoal">{s.name || s.email}</summary>
              <div className="border-t border-line-soft p-4">
                <StaffDocsManager staffId={s.id} employmentType={(s as any).employment_type || ""} startDate={(s as any).start_date || ""} docs={docsByStaff.get(s.id) || []} />
              </div>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
