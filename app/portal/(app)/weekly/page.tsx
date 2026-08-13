import { redirect } from "next/navigation";
import { getPortalClient, getPortalData, deriveWeekly } from "@/lib/portal";

export default async function WeeklyPage() {
  const client = await getPortalClient();
  if (!client) redirect("/portal/login");
  const data = await getPortalData(client);
  const week = deriveWeekly(data);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-fraunces text-[32px] font-normal text-forest">Weekly report</h1>
        <span className="rule-gold mb-4 mt-2" />
      </div>
      {!week ? (
        <p className="border border-dashed border-line-warm bg-white p-6 text-[15px] prose-muted">
          Nothing delivered yet. Your first weekly report arrives the Friday after your start date — what we delivered,
          the hours it took, what is in flight, and what is next.
        </p>
      ) : (
        <>
          <p className="text-[14px] prose-muted">Prepared by your account lead · sent every Friday.</p>
          <div className="flex flex-wrap gap-6">
            <div><p className="kicker">Hours this period</p><p className="font-fraunces text-[28px] text-charcoal tabular-nums">{week.totalHours}</p></div>
            <div><p className="kicker">Delivered</p><p className="font-fraunces text-[28px] text-charcoal tabular-nums">{week.delivered.length}</p></div>
          </div>
          <div>
            <p className="kicker mb-2">Delivered</p>
            {week.delivered.length === 0 ? <p className="text-[14px] prose-muted">Nothing delivered in this period.</p> : (
              <ul className="flex flex-col gap-2">
                {week.delivered.map((d) => (
                  <li key={d.id} className="flex justify-between border-t border-line-soft pt-2 text-[15px]">
                    <span className="prose-soft">{d.name}{d.service ? ` · ${d.service}` : ""}</span>
                    <span className="text-[13px] text-forest">{d.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <p className="kicker mb-2">Hours by service</p>
            <ul className="flex flex-col gap-1">
              {week.byService.map((b) => <li key={b.svc} className="flex justify-between text-[14px]"><span className="prose-soft">{b.svc}</span><span className="tabular-nums prose-muted">{b.hours}h</span></li>)}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
