"use client";
import { useTransition } from "react";
import { assignClient } from "@/app/staff/actions";
import { ROLE_OPTIONS } from "@/content/roles";

export function AssignSelect({ clientId, current }: { clientId: string; current: string }) {
  const [pending, start] = useTransition();
  return (
    <select
      defaultValue={current || ""}
      disabled={pending}
      onChange={(e) => start(() => assignClient(clientId, e.target.value).then(() => {}))}
      className="min-h-touch w-full border border-line-warm bg-white px-3 text-[14px] outline-none focus:border-forest"
    >
      <option value="">Unassigned</option>
      {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
    </select>
  );
}
