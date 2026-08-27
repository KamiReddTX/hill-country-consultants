"use client";
import { useState } from "react";

type List = { id: string; name: string | null; shared_team: boolean; created_at: string; count: number; accountIds: string[] };

export function ListsView({ lists, canExport }: { lists: List[]; canExport: boolean }) {
  const [rows, setRows] = useState(lists);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState<string>("");

  const exportCsv = async (l: List) => {
    setBusy(l.id); setMsg("");
    try {
      const r = await fetch("/api/prospect/export", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ list_id: l.id }) });
      if (!r.ok) { const j = await r.json().catch(() => ({})); setMsg(j?.message || "Export failed."); return; }
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = `${(l.name || "list").replace(/[^\w.-]+/g, "_")}.csv`; a.click();
      URL.revokeObjectURL(url);
    } finally { setBusy(""); }
  };

  const promote = async (l: List) => {
    if (l.accountIds.length === 0) return;
    if (!confirm(`Promote all ${l.count} companies in “${l.name}” into your pipeline?`)) return;
    setBusy(l.id); setMsg("");
    const r = await fetch("/api/prospect/promote", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ account_ids: l.accountIds }) });
    const j = await r.json().catch(() => ({}));
    setMsg(r.ok ? `Promoted ${j.inserted} to Pipeline${j.skipped ? ` · ${j.skipped} already there` : ""}.` : "Promote failed.");
    setBusy("");
  };

  const del = async (l: List) => {
    if (!confirm(`Delete list “${l.name}”? This does not delete the companies.`)) return;
    setBusy(l.id);
    const r = await fetch("/api/prospect/list", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ list_id: l.id }) });
    if (r.ok) setRows((s) => s.filter((x) => x.id !== l.id)); else setMsg("Couldn't delete the list.");
    setBusy("");
  };

  if (rows.length === 0) return <p className="border border-dashed border-line-warm bg-white p-6 text-[15px] prose-muted">No lists yet. Build one from the Search tab — filter companies, then “Add to list.”</p>;

  return (
    <div className="flex flex-col gap-3">
      {msg && <p className="text-[13px] text-forest">{msg}</p>}
      {rows.map((l) => (
        <div key={l.id} className="flex flex-wrap items-center justify-between gap-3 border border-line-warm bg-white p-4">
          <div>
            <p className="text-[15px] font-medium text-charcoal">{l.name || "Untitled list"}{l.shared_team && <span className="ml-2 text-[11px] text-forest">· shared</span>}</p>
            <p className="text-[12px] prose-muted">{l.count} compan{l.count === 1 ? "y" : "ies"} · created {new Date(l.created_at).toLocaleDateString()}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {canExport && <button disabled={busy === l.id} onClick={() => exportCsv(l)} className="border border-forest px-3 py-1.5 text-[13px] font-medium text-forest disabled:opacity-50">Export CSV</button>}
            <button disabled={busy === l.id || l.count === 0} onClick={() => promote(l)} className="btn-gold text-[13px] disabled:opacity-50">Promote to Leads</button>
            <button disabled={busy === l.id} onClick={() => del(l)} className="text-[12px] text-red-700 underline disabled:opacity-50">Delete</button>
          </div>
        </div>
      ))}
    </div>
  );
}
