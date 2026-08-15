"use client";
import { useTransition } from "react";
import { assignClient } from "@/app/staff/actions";

/** Owner picker — lists employees; stores the chosen staff id on the client. */
export function AssignSelect({
  clientId,
  current,
  options,
}: {
  clientId: string;
  current: string;
  options: { id: string; label: string }[];
}) {
  const [pending, start] = useTransition();
  return (
    <select
      defaultValue={current || ""}
      disabled={pending}
      onChange={(e) => start(() => assignClient(clientId, e.target.value).then(() => {}))}
      className="min-h-touch w-full border border-line-warm bg-white px-3 text-[14px] outline-none focus:border-forest"
    >
      <option value="">Unassigned</option>
      {options.map((o) => (
        <option key={o.id} value={o.id}>{o.label}</option>
      ))}
    </select>
  );
}
