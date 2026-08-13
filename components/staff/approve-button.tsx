"use client";
import { useTransition } from "react";
import { approveTimesheet } from "@/app/staff/actions";
export function ApproveButton({ staffId, periodStart, periodEnd, approved }: { staffId: string; periodStart: string; periodEnd: string; approved: boolean }) {
  const [pending, start] = useTransition();
  if (approved) return <span className="text-[12px] font-semibold text-forest">Approved</span>;
  return (
    <button disabled={pending} onClick={() => start(() => approveTimesheet(staffId, periodStart, periodEnd).then(() => {}))}
      className="min-h-touch border border-forest px-3 text-[13px] text-forest">{pending ? "…" : "Approve"}</button>
  );
}
