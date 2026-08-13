import { redirect } from "next/navigation";
import { getStaffMember, getOpenPunch, getMyPunches, periodOf, usd } from "@/lib/staff";
import { ClockWidget } from "@/components/staff/clock-widget";

export default async function ClockPage() {
  const me = await getStaffMember();
  if (!me) redirect("/staff/login");
  if (!me.hourly) return <p className="text-[15px] prose-muted">The time clock is for hourly staff. Your role isn't hourly.</p>;

  const open = await getOpenPunch(me);
  const period = periodOf(0), last = periodOf(1);
  const [thisP, lastP] = await Promise.all([getMyPunches(me, period.startISO, period.endISO), getMyPunches(me, last.startISO, last.endISO)]);
  const sum = (ps: typeof thisP) => ps.reduce((s, p) => s + Number(p.hours || 0), 0);
  const hoursThis = sum(thisP), hoursLast = sum(lastP);

  const table = (rows: typeof thisP) => (
    <div className="overflow-x-auto border border-line-warm">
      <table className="w-full min-w-[560px] border-collapse bg-white text-left text-[14px]">
        <thead><tr className="border-b border-line-soft text-ink-faint"><th className="p-3 font-medium">In</th><th className="p-3 font-medium">Out</th><th className="p-3 font-medium">Note</th><th className="p-3 font-medium text-right">Hours</th></tr></thead>
        <tbody>
          {rows.length === 0 && <tr><td colSpan={4} className="p-3 prose-muted">No shifts.</td></tr>}
          {rows.map((p) => {
            const over = Number(p.hours || 0) > 4;
            return (
              <tr key={p.id} className="border-b border-line-soft/60">
                <td className="p-3 prose-muted">{new Date(p.started_at).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</td>
                <td className="p-3 prose-muted">{p.ended_at ? new Date(p.ended_at).toLocaleString([], { hour: "numeric", minute: "2-digit" }) : "—"}{p.closed_by_admin ? " (admin)" : ""}</td>
                <td className="p-3 prose-soft">{p.note || "—"}</td>
                <td className={`p-3 text-right tabular-nums ${over ? "text-gold-hover font-semibold" : ""}`}>{p.hours != null ? Number(p.hours).toFixed(2) : "open"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="flex flex-col gap-8">
      <div><h1 className="font-fraunces text-[32px] font-normal text-forest">Time clock</h1><span className="rule-gold mb-4 mt-2" /><p className="text-[14px] prose-muted">Two-week periods anchored to Jan 5, 2026 · rate {usd(Number(me.rate || 0))}/hr. Shifts over 4 hours are flagged.</p></div>
      <ClockWidget openStartedAt={open?.started_at ?? null} />
      <section>
        <div className="flex flex-wrap items-end justify-between gap-3"><h2 className="font-fraunces text-[20px] font-medium text-forest">This period · {period.label}</h2>
          <p className="text-[14px] prose-muted">{hoursThis.toFixed(1)}h · gross {usd(hoursThis * Number(me.rate || 0))}</p></div>
        <div className="mt-3">{table(thisP)}</div>
      </section>
      <section>
        <div className="flex flex-wrap items-end justify-between gap-3"><h2 className="font-fraunces text-[20px] font-medium text-forest">Last period · {last.label}</h2>
          <p className="text-[14px] prose-muted">{hoursLast.toFixed(1)}h · gross {usd(hoursLast * Number(me.rate || 0))}</p></div>
        <div className="mt-3">{table(lastP)}</div>
      </section>
    </div>
  );
}
