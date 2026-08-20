import { redirect } from "next/navigation";
import { getStaffMember, isPrivileged, getClients } from "@/lib/staff";
import { createServiceClient } from "@/lib/supabase/server";
import { money } from "@/lib/portal";
import { daysUntil } from "@/lib/health";
import { docusignConfigured } from "@/lib/docusign";
import { ContractForm } from "@/components/staff/contract-form";
import { ContractActions } from "@/components/staff/contract-actions";

export const dynamic = "force-dynamic";

const fmtDay = (iso: string | null) =>
  iso ? new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

/** Contracts & SOWs — a firm-wide registry with e-signature via DocuSign.
 *  Admin / Business Manager. */
export default async function ContractsPage() {
  const me = await getStaffMember();
  if (!me) redirect("/staff/login");
  if (!isPrivileged(me)) redirect("/staff");

  const admin = createServiceClient();
  const [clients, { data: contracts }] = await Promise.all([
    getClients(),
    admin.from("contracts").select("*").order("created_at", { ascending: false }),
  ]);
  const label = new Map(clients.map((c) => [c.id, c.business || c.contact || c.email]));
  const clientOpts = clients.map((c) => ({ id: c.id, label: c.business || c.contact || c.email }));
  const rows = contracts ?? [];

  const count = (s: string) => rows.filter((r: any) => r.status === s).length;
  const expiring = rows
    .filter((r: any) => r.status === "signed" && r.end_date)
    .map((r: any) => ({ r, d: daysUntil(r.end_date) as number }))
    .filter((x) => x.d != null && x.d <= 60 && x.d >= -30)
    .sort((a, b) => a.d - b.d);

  const Stat = ({ label, value }: { label: string; value: string }) => (
    <div className="border border-line-warm bg-white p-3"><p className="text-[11px] uppercase tracking-wide text-ink-faint">{label}</p><p className="mt-1 font-fraunces text-[24px] text-forest">{value}</p></div>
  );
  const statusChip = (s: string) => {
    const map: Record<string, string> = { draft: "text-ink-faint", sent: "text-amber-700", signed: "text-forest", void: "text-ink-faint line-through" };
    return <span className={`text-[11px] font-semibold uppercase tracking-wide ${map[s] || ""}`}>{s}</span>;
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-fraunces text-[32px] font-normal text-forest">Contracts &amp; SOWs</h1>
        <span className="rule-gold mb-2 mt-2" />
        <p className="max-w-[56em] text-[13px] prose-muted">
          Track every client agreement in one place. Add a contract, attach its PDF, and send it for signature — signatures run through
          your DocuSign connection{docusignConfigured() ? "" : " (not configured yet — you can still track status manually)"}. Mark a
          contract signed if it was executed elsewhere, and watch the expiring list so renewals don&rsquo;t slip. Admin / Business Manager.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Drafts" value={String(count("draft"))} />
        <Stat label="Out for signature" value={String(count("sent"))} />
        <Stat label="Signed" value={String(count("signed"))} />
        <Stat label="Expiring ≤ 60 days" value={String(expiring.length)} />
      </div>

      <section className="border border-line-warm bg-white p-4">
        <p className="mb-1 text-[13px] font-semibold text-forest">Add a contract</p>
        <p className="mb-3 text-[12px] prose-muted">Attach the PDF now or later. Add the signer&rsquo;s email to enable &ldquo;Send for signature.&rdquo;</p>
        <ContractForm clients={clientOpts} />
      </section>

      {expiring.length > 0 && (
        <section>
          <h2 className="mb-2 font-fraunces text-[20px] font-medium text-forest">Expiring soon</h2>
          <div className="overflow-x-auto border border-line-warm">
            <table className="w-full min-w-[560px] border-collapse bg-white text-left text-[14px]">
              <thead><tr className="border-b border-line-soft text-ink-faint"><th className="p-3 font-medium">Client</th><th className="p-3 font-medium">Contract</th><th className="p-3 font-medium">Ends</th><th className="p-3 font-medium">In</th></tr></thead>
              <tbody>
                {expiring.map(({ r, d }) => (
                  <tr key={r.id} className="border-b border-line-soft/60">
                    <td className="p-3 font-medium text-charcoal">{label.get(r.client_id) || "—"}</td>
                    <td className="p-3 prose-soft">{r.kind} · {r.title}</td>
                    <td className="p-3 prose-muted">{fmtDay(r.end_date)}</td>
                    <td className={`p-3 tabular-nums ${d < 0 ? "text-red-700" : d <= 30 ? "text-amber-700" : "text-charcoal"}`}>{d < 0 ? `${-d}d ago` : `${d}d`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="flex flex-col gap-2">
        <p className="text-[13px] font-semibold text-forest">All contracts</p>
        <div className="overflow-x-auto border border-line-warm">
          <table className="w-full min-w-[900px] border-collapse bg-white text-left text-[13px]">
            <thead>
              <tr className="border-b border-line-soft text-ink-faint">
                <th className="p-3 font-medium">Client</th><th className="p-3 font-medium">Contract</th><th className="p-3 font-medium">Value</th>
                <th className="p-3 font-medium">Term</th><th className="p-3 font-medium">Signer</th><th className="p-3 font-medium">Status</th><th className="p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r: any) => (
                <tr key={r.id} className="border-b border-line-soft/60 align-top">
                  <td className="p-3 font-medium text-charcoal">{label.get(r.client_id) || "—"}</td>
                  <td className="p-3"><span className="text-charcoal">{r.title}</span><span className="block text-[11px] text-ink-faint">{r.kind}{r.file_path ? " · PDF" : " · no PDF"}</span></td>
                  <td className="p-3 tabular-nums">{r.amount_cents ? money(r.amount_cents) : "—"}</td>
                  <td className="p-3 prose-muted">{fmtDay(r.start_date)}{r.end_date ? ` – ${fmtDay(r.end_date)}` : ""}</td>
                  <td className="p-3 prose-muted">{r.signer_email || "—"}</td>
                  <td className="p-3">{statusChip(r.status)}{r.signed_at ? <span className="block text-[11px] text-ink-faint">{fmtDay(r.signed_at.slice(0, 10))}</span> : null}</td>
                  <td className="p-3"><ContractActions id={r.id} status={r.status} hasFile={!!r.file_path} hasSigner={!!r.signer_email} envelopeSent={!!r.docusign_envelope_id} /></td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={7} className="p-3 prose-muted">No contracts yet. Add one above.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
