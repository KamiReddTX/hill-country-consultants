"use client";
import { useTransition } from "react";
import { forceClockOut } from "@/app/staff/actions";
export function ForceClockOutButton({ punchId, startedAt }: { punchId: string; startedAt: string }) {
  const [pending, start] = useTransition();
  return (
    <button disabled={pending} onClick={() => start(() => forceClockOut(punchId, startedAt).then(() => {}))}
      className="min-h-touch border border-line-warm px-3 text-[13px] text-red-700">Force clock-out</button>
  );
}
