import { redirect } from "next/navigation";
import { getStaffMember, isPrivileged } from "@/lib/staff";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const STATUS_STYLE: Record<string, string> = {
  sent: "text-green-700",
  skipped_no_key: "text-gold",
  error: "text-red-700",
};
const STATUS_LABEL: Record<string, string> = {
  sent: "Sent",
  skipped_no_key: "Skipped — no API key",
  error: "Error",
};

/** Admin/BM audit of every email the system attempted to send. Answers
 *  "did that email actually go?" without needing a mailbox or the Resend dashboard. */
export default async function EmailLogPage() {
  const me = await getStaffMember();
  if (!me) redirect("/staff/login");
  if (!isPrivileged(me)) redirect("/staff");
  const db = createServiceClient();
  const { data: rows } = await db
    .from("email_log")
    .select("id,to_addr,subject,status,provider_id,error,created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  const logs = rows ?? [];
  const counts = logs.reduce((a: Record<string, number>, r: any) => { a[r.status] = (a[r.status] || 0) + 1; return a; }, {});

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-fraunces text-[32px] font-normal text-forest">Email log</h1>
        <span className="rule-gold mb-4 mt-2" />
        <p className="max-w-[52em] prose-soft">Every email the system attempted — confirmations, alerts, onboarding, billing. <strong>Sent</strong> means it was accepted by the provider; <strong>Skipped</strong> means no email API key is configured (nothing left the building); <strong>Error</strong> shows the failure reason.</p>
      </div>
      <div className="flex flex-wrap gap-4">
        <Stat n={counts.sent || 0} label="Sent" tone="text-green-700" />
        <Stat n={counts.skipped_no_key || 0} label="Skipped (no key)" tone="text-gold" />
        <Stat n={counts.error || 0} label="Errors" tone="text-red-700" />
      </div>
      {logs.length === 0 ? (
        <p className="text-[15px] prose-muted">No emails logged yet. Once the app sends one, it appears here.</p>
      ) : (
        <div className="overflow-x-auto border border-line-warm bg-white">
          <table className="w-full min-w-[720px] text-[13px]">
            <thead>
              <tr className="border-b border-line-soft text-left text-[11px] uppercase tracking-wide prose-muted">
                <th className="px-3 py-2">When</th><th className="px-3 py-2">To</th><th className="px-3 py-2">Subject</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Detail</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((r: any) => (
                <tr key={r.id} className="border-b border-line-soft/60 align-top">
                  <td className="whitespace-nowrap px-3 py-2 prose-muted">{new Date(r.created_at).toLocaleString()}</td>
                  <td className="px-3 py-2 text-charcoal">{r.to_addr}</td>
                  <td className="px-3 py-2 prose-soft">{r.subject || "—"}</td>
                  <td className={`whitespace-nowrap px-3 py-2 font-medium ${STATUS_STYLE[r.status] || "text-ink-muted"}`}>{STATUS_LABEL[r.status] || r.status}</td>
                  <td className="px-3 py-2 text-[12px] prose-muted">{r.error || r.provider_id || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Stat({ n, label, tone }: { n: number; label: string; tone: string }) {
  return (
    <div className="border border-line-warm bg-white px-4 py-3">
      <p className={`font-fraunces text-[26px] ${tone}`}>{n}</p>
      <p className="text-[12px] uppercase tracking-wide prose-muted">{label}</p>
    </div>
  );
}
