"use client";
import { useTransition } from "react";
import { setClientPlan } from "@/app/staff/actions";

/** Admin/BM: set (or clear) a client's retainer tier. Drives allotments + billing. */
export function PlanSelect({ clientId, current }: { clientId: string; current: string | null }) {
  const [pending, start] = useTransition();
  return (
    <select
      defaultValue={current || ""}
      disabled={pending}
      onChange={(e) => start(() => setClientPlan(clientId, e.target.value).then(() => {}))}
      className="min-h-touch w-full border border-line-warm bg-white px-2 text-[13px] outline-none focus:border-forest"
    >
      <option value="">No plan (à la carte)</option>
      <option value="Foundation">Foundation</option>
      <option value="Momentum">Momentum</option>
      <option value="Enterprise">Enterprise</option>
    </select>
  );
}
