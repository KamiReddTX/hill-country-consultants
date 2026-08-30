"use client";
import { useState, useTransition } from "react";
import { generateWeeklyReport } from "@/app/staff/actions";

/** Admin: generate & publish this week's Excel (.xlsx) report for a chosen client.
 *  The published file is non-editable; edit the numbers by adjusting the source
 *  (approve/correct the work log & deliverables) and add an optional summary,
 *  then re-generate to re-publish. */
export function GenerateReportForm({ clients }: { clients: { id: string; label: string }[] }) {
  const [id, setId] = useState(clients[0]?.id || "");
  const [summary, setSummary] = useState("");
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState("");
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-end gap-3">
        <select value={id} onChange={(e) => setId(e.target.value)} className="min-h-touch min-w-[220px] border border-line-warm bg-white px-3 text-[14px]">
          {clients.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
        <button
          type="button"
          disabled={pending || !id}
          onClick={() => start(async () => { setMsg(""); const r = await generateWeeklyReport(id, summary); setMsg(r?.error ? r.error : "Excel report published to the client"); })}
          className="btn-gold text-[14px] disabled:opacity-50"
        >
          {pending ? "Generating…" : "Generate & publish (.xlsx)"}
        </button>
        {msg && <span className="text-[13px] text-forest">{msg}</span>}
      </div>
      <textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={2}
        placeholder="Optional summary note (admin) — appears at the top of the report…"
        className="w-full max-w-[48em] border border-line-warm bg-white px-3 py-2 text-[13px] outline-none focus:border-forest" />
    </div>
  );
}
