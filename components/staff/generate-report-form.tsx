"use client";
import { useState, useTransition } from "react";
import { generateWeeklyReport } from "@/app/staff/actions";

/** Admin: generate & publish this week's PDF report for a chosen client. */
export function GenerateReportForm({ clients }: { clients: { id: string; label: string }[] }) {
  const [id, setId] = useState(clients[0]?.id || "");
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState("");
  return (
    <div className="flex flex-wrap items-end gap-3">
      <select value={id} onChange={(e) => setId(e.target.value)} className="min-h-touch min-w-[220px] border border-line-warm bg-white px-3 text-[14px]">
        {clients.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
      </select>
      <button
        type="button"
        disabled={pending || !id}
        onClick={() => start(async () => { setMsg(""); const r = await generateWeeklyReport(id); setMsg(r?.error ? r.error : "Report published to the client"); })}
        className="btn-gold text-[14px] disabled:opacity-50"
      >
        {pending ? "Generating…" : "Generate this week's report"}
      </button>
      {msg && <span className="text-[13px] text-forest">{msg}</span>}
    </div>
  );
}
