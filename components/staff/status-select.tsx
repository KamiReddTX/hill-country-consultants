"use client";
import { useTransition } from "react";
import { setClientStatus } from "@/app/staff/actions";
const STATUSES = ["In review", "Active", "Paused", "Offboarded"];
export function StatusSelect({ clientId, current }: { clientId: string; current: string }) {
  const [pending, start] = useTransition();
  return (
    <select defaultValue={current} disabled={pending}
      onChange={(e) => start(() => setClientStatus(clientId, e.target.value).then(() => {}))}
      className="min-h-touch w-full border border-line-warm bg-white px-2 text-[13px]">
      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
    </select>
  );
}
