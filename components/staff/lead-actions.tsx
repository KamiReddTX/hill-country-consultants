"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { updateLeadStage, markLeadWon } from "@/app/staff/actions";

const STAGES = ["New lead", "Contacted", "Qualified", "Proposal", "Closed won", "Closed lost"];

export function LeadActions({ leadId, stage, hasEmail }: { leadId: string; stage: string; hasEmail: boolean }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const [won, setWon] = useState<{ id?: string; label?: string } | null>(null);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <select defaultValue={stage} disabled={pending || !!won}
        onChange={(e) => start(() => updateLeadStage(leadId, e.target.value).then(() => {}))}
        className="min-h-touch border border-line-warm bg-white px-2 text-[13px]">
        {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      <button disabled={pending || !hasEmail || !!won} title={hasEmail ? "" : "Add an email to the lead first"}
        onClick={() => start(async () => {
          setError("");
          const r = await markLeadWon(leadId);
          if (r?.error) setError(r.error);
          else setWon({ id: r?.clientId, label: r?.clientLabel });
        })}
        className="btn-outline px-3 text-[13px] disabled:opacity-40">Mark won → create client</button>

      {won && (
        <p className="w-full text-[12px] text-forest">
          ✓ Client file created{won.label ? ` for ${won.label}` : ""} (status: In review).{" "}
          <Link href={won.id ? `/staff/clients#c-${won.id}` : "/staff/clients"} className="link-underline font-semibold">
            Open in Clients →
          </Link>
        </p>
      )}
      {error && <p className="w-full text-[12px] text-red-700">{error}</p>}
    </div>
  );
}
