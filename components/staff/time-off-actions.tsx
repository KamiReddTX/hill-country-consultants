"use client";
import { useTransition } from "react";
import { cancelTimeOff, decideTimeOff } from "@/app/staff/actions";

/** Employee: cancel a pending request. */
export function CancelTimeOff({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <button type="button" disabled={pending} onClick={() => start(() => cancelTimeOff(id).then(() => {}))}
      className="text-[12px] text-red-700 underline disabled:opacity-50">{pending ? "Cancelling…" : "Cancel"}</button>
  );
}

/** Manager: approve or deny a request. */
export function TimeOffDecision({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <span className="flex items-center gap-2">
      <button type="button" disabled={pending} onClick={() => start(() => decideTimeOff(id, "approved").then(() => {}))}
        className="border border-forest px-2 py-1 text-[12px] font-medium text-forest disabled:opacity-50">Approve</button>
      <button type="button" disabled={pending} onClick={() => start(() => decideTimeOff(id, "denied").then(() => {}))}
        className="border border-red-700 px-2 py-1 text-[12px] font-medium text-red-700 disabled:opacity-50">Deny</button>
    </span>
  );
}
