import { redirect } from "next/navigation";
import { getPortalClient, getPortalData } from "@/lib/portal";

export default async function WorkLogPage() {
  const client = await getPortalClient();
  if (!client) redirect("/portal/login");
  const { workLog } = await getPortalData(client);
  const total = workLog.reduce((s, w) => s + Number(w.hours || 0), 0);
  const byService: Record<string, number> = {};
  workLog.forEach((w) => { const k = w.service || "General"; byService[k] = (byService[k] || 0) + Number(w.hours || 0); });
  const bars = Object.entries(byService).sort((a, b) => b[1] - a[1]);
  const max = bars.length ? bars[0][1] : 1;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-fraunces text-[32px] font-normal text-forest">Work log</h1>
        <span className="rule-gold mb-4 mt-2" />
        <p className="max-w-[48em] prose-soft">Daily entries with hours by service line, reconciled against your allotment at every review.</p>
      </div>

      {workLog.length === 0 ? (
        <p className="border border-dashed border-line-warm bg-white p-6 text-[15px] prose-muted">
          No hours logged yet. Entries appear here as your team works — the first show up after your start date.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap gap-6">
            <div><p className="kicker">Total hours</p><p className="font-fraunces text-[28px] text-charcoal tabular-nums">{total.toFixed(1)}</p></div>
            <div><p className="kicker">Entries</p><p className="font-fraunces text-[28px] text-charcoal tabular-nums">{workLog.length}</p></div>
            <div><p className="kicker">Days worked</p><p className="font-fraunces text-[28px] text-charcoal tabular-nums">{new Set(workLog.map((w) => w.worked_on)).size}</p></div>
          </div>

          <div>
            <p className="kicker mb-2">By service line</p>
            <div className="flex flex-col gap-2">
              {bars.map(([svc, h]) => (
                <div key={svc} className="flex items-center gap-3">
                  <span className="w-52 shrink-0 text-[14px] prose-soft">{svc}</span>
                  <span className="h-2 bg-gold" style={{ width: `${Math.max(6, Math.round((h / max) * 100))}%` }} />
                  <span className="text-[13px] tabular-nums prose-muted">{h.toFixed(1)}h</span>
                </div>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto border border-line-warm">
            <table className="w-full min-w-[640px] border-collapse bg-white text-left text-[14px]">
              <thead><tr className="border-b border-line-soft text-ink-faint">
                <th className="p-3 font-medium">Date</th><th className="p-3 font-medium">Service</th><th className="p-3 font-medium">Task</th><th className="p-3 font-medium">By</th><th className="p-3 font-medium text-right">Hours</th>
              </tr></thead>
              <tbody>
                {workLog.map((w) => (
                  <tr key={w.id} className="border-b border-line-soft/60">
                    <td className="p-3 prose-muted">{w.worked_on}</td><td className="p-3 prose-soft">{w.service || "—"}</td>
                    <td className="p-3 prose-soft">{w.task || "—"}</td><td className="p-3 prose-muted">{w.performed_by || "—"}</td>
                    <td className="p-3 text-right tabular-nums">{Number(w.hours).toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
