"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateLeadStage, markLeadWon } from "@/app/staff/actions";

const STAGES = ["New lead", "Contacted", "Qualified", "Proposal", "Closed won", "Closed lost"];

export function LeadActions({ leadId, stage, hasEmail }: { leadId: string; stage: string; hasEmail: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <select defaultValue={stage} disabled={pending || done}
        onChange={(e) => start(() => updateLeadStage(leadId, e.target.value).then(() => {}))}
        className="min-h-touch border border-line-warm bg-white px-2 text-[13px]">
        {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      <button disabled={pending || !hasEmail || done} title={hasEmail ? "" : "Add an email to the lead first"}
        onClick={() => start(async () => {
          setError("");
          const r = await markLeadWon(leadId);
          if (r?.error) { setError(r.error); return; }
          // Winning can move the lead to another section, which would remount this
          // component and lose an inline message — so jump straight to the new
          // client's file (it auto-opens and highlights). That's the confirmation.
          setDone(true);
          router.push(r?.clientId ? `/staff/clients#c-${r.clientId}` : "/staff/clients");
        })}
        className="btn-outline px-3 text-[13px] disabled:opacity-40">
        {pending ? "Creating client…" : done ? "Client created ✓" : "Mark won → create client"}
      </button>
      {error && <p className="w-full text-[12px] text-red-700">{error}</p>}
    </div>
  );
}
