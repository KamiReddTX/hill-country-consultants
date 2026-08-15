"use client";
import { useTransition } from "react";
import { setClientBilling } from "@/app/staff/actions";

/** Admin/BM: standard billing, comp (zeroed), or barter. */
export function BillingSelect({ clientId, current }: { clientId: string; current: string }) {
  const [pending, start] = useTransition();
  return (
    <select
      defaultValue={current || "standard"}
      disabled={pending}
      onChange={(e) => start(() => setClientBilling(clientId, e.target.value).then(() => {}))}
      className="min-h-touch w-full border border-line-warm bg-white px-2 text-[13px] outline-none focus:border-forest"
    >
      <option value="standard">Standard</option>
      <option value="comp">Comp (zeroed)</option>
      <option value="barter">Barter</option>
    </select>
  );
}
