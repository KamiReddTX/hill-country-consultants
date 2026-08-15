"use client";
import { useTransition } from "react";
import { assignLeadRep } from "@/app/staff/actions";

/** Sales lead: assign a lead to a sales agent (or leave it as house/website). */
export function LeadRepAssign({ leadId, currentCode, agents }: {
  leadId: string;
  currentCode: string;
  agents: { id: string; code: string; label: string }[];
}) {
  const [pending, start] = useTransition();
  const current = agents.find((a) => a.code && a.code === currentCode)?.id || "";
  return (
    <select
      defaultValue={current}
      disabled={pending}
      onChange={(e) => start(() => assignLeadRep(leadId, e.target.value).then(() => {}))}
      className="min-h-touch w-full border border-line-warm bg-white px-2 text-[13px] outline-none focus:border-forest"
    >
      <option value="">House / website (Kami)</option>
      {agents.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
    </select>
  );
}
