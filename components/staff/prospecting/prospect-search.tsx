"use client";
import { useEffect, useState, useCallback } from "react";
import { ruleForState, FEDERAL_BASELINE } from "@/content/prospecting-compliance";

type Contact = {
  id: string; first_name: string | null; last_name: string | null; title: string | null; seniority: string | null;
  do_not_contact: boolean; has_email: boolean; has_phone_direct: boolean; has_phone_mobile: boolean;
};
type Row = {
  id: string; legal_name: string; dba_name: string | null; domain: string | null;
  industry: string | null; naics_code: string | null; city: string | null; state: string | null;
  county: string | null; zip: string | null; employee_est: number | null; revenue_est: number | null;
  years_in_business: number | null; location_type: string | null; formation_date: string | null;
  icp_score: number | null; status: string; contact_count: number; has_email: boolean; has_phone: boolean;
  contacts: Contact[];
};

const field = "min-h-touch w-full border border-line-warm bg-white px-3 text-[14px] outline-none focus:border-forest";
const label = "flex flex-col gap-1 text-[12px] text-ink-faint";
const usd = (n: number | null) => (n == null ? "—" : "$" + n.toLocaleString("en-US"));

export function ProspectSearch({ canReveal = false }: { canReveal?: boolean }) {
  const [f, setF] = useState<Record<string, any>>({});
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [revealed, setRevealed] = useState<Record<string, string>>({});
  const [revealing, setRevealing] = useState<string>("");

  const reveal = async (contactId: string, field: "email" | "phone_direct" | "phone_mobile") => {
    const key = `${contactId}:${field}`;
    setRevealing(key); setMsg("");
    try {
      const r = await fetch("/api/prospect/reveal", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contact_id: contactId, field }) });
      const j = await r.json().catch(() => ({}));
      if (r.ok && j.value) {
        setRevealed((s) => ({ ...s, [key]: j.value }));
        setMsg(j.cache ? "Served from cache · 0 credits." : `Revealed · ${j.remaining ?? ""} credits left.`);
      } else setMsg(j.message || "Reveal failed.");
    } finally { setRevealing(""); }
  };

  const set = (k: string, v: any) => setF((s) => ({ ...s, [k]: v }));

  const buildFilters = useCallback(() => {
    const out: Record<string, any> = {};
    const s = (k: string) => { const v = (f[k] ?? "").toString().trim(); if (v) out[k] = v; };
    const n = (k: string) => { const v = f[k]; if (v !== "" && v != null && isFinite(Number(v))) out[k] = Number(v); };
    s("q"); s("city"); s("industry"); s("naics"); s("formedAfter"); s("formedBefore");
    if ((f.state ?? "").trim()) out.state = [String(f.state).trim()];
    if ((f.county ?? "").trim()) out.county = [String(f.county).trim()];
    if ((f.zip ?? "").trim()) out.zip = [String(f.zip).trim()];
    if (f.locationType === "HQ" || f.locationType === "branch") out.locationType = f.locationType;
    n("yearsMin"); n("yearsMax"); n("employeeMin"); n("employeeMax"); n("revenueMin"); n("revenueMax");
    return out;
  }, [f]);

  const run = useCallback(async (toPage = 1) => {
    setLoading(true); setErr(""); setMsg("");
    try {
      const r = await fetch("/api/prospect/search", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filters: buildFilters(), page: toPage, pageSize }),
      });
      const j = await r.json();
      if (!r.ok) { setErr(j?.message || j?.error || "Search failed."); setRows([]); setTotal(0); return; }
      setRows(j.rows || []); setTotal(j.total || 0); setPage(toPage); setSel(new Set());
    } catch { setErr("Search failed."); }
    finally { setLoading(false); }
  }, [buildFilters, pageSize]);

  useEffect(() => { run(1); /* initial load */ }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const saveSearch = async () => {
    const name = window.prompt("Name this search:", "New prospects"); if (!name) return;
    const r = await fetch("/api/prospect/save-search", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, filters: buildFilters(), result_count: total }),
    });
    setMsg(r.ok ? "Search saved." : "Couldn't save the search.");
  };

  const addToList = async () => {
    const ids = sel.size ? [...sel] : rows.map((r) => r.id);
    if (ids.length === 0) return;
    const name = window.prompt(`Add ${ids.length} compan${ids.length === 1 ? "y" : "ies"} to a new list named:`, "My prospects");
    if (!name) return;
    const r = await fetch("/api/prospect/list", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, account_ids: ids }),
    });
    const j = await r.json().catch(() => ({}));
    setMsg(r.ok ? `Added ${j.added} to “${name}”.` : "Couldn't add to a list.");
  };

  const promote = async () => {
    const ids = sel.size ? [...sel] : rows.map((r) => r.id);
    if (ids.length === 0) return;
    if (!window.confirm(`Promote ${ids.length} compan${ids.length === 1 ? "y" : "ies"} into your pipeline as new leads?`)) return;
    const r = await fetch("/api/prospect/promote", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ account_ids: ids }),
    });
    const j = await r.json().catch(() => ({}));
    setMsg(r.ok ? `Promoted ${j.inserted} to Pipeline${j.skipped ? ` · ${j.skipped} already there` : ""}.` : "Couldn't promote to leads.");
  };

  const toggle = (id: string) => setSel((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const pages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      {/* Filter rail */}
      <aside className="w-full shrink-0 lg:w-[280px]">
        <div className="flex flex-col gap-3 border border-line-warm bg-white p-4">
          <p className="text-[13px] font-semibold uppercase tracking-wide text-forest">Filters</p>
          <label className={label}>Company name contains<input className={field} value={f.q ?? ""} onChange={(e) => set("q", e.target.value)} /></label>
          <div className="grid grid-cols-2 gap-2">
            <label className={label}>State<input className={field} value={f.state ?? ""} onChange={(e) => set("state", e.target.value)} placeholder="e.g. TX" /></label>
            <label className={label}>City<input className={field} value={f.city ?? ""} onChange={(e) => set("city", e.target.value)} /></label>
            <label className={label}>County<input className={field} value={f.county ?? ""} onChange={(e) => set("county", e.target.value)} /></label>
            <label className={label}>ZIP<input className={field} value={f.zip ?? ""} onChange={(e) => set("zip", e.target.value)} /></label>
          </div>
          <label className={label}>Location type
            <select className={field} value={f.locationType ?? ""} onChange={(e) => set("locationType", e.target.value)}>
              <option value="">Any</option><option value="HQ">HQ</option><option value="branch">Branch</option>
            </select>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className={label}>Years in business ≥<input type="number" className={field} value={f.yearsMin ?? ""} onChange={(e) => set("yearsMin", e.target.value)} /></label>
            <label className={label}>≤<input type="number" className={field} value={f.yearsMax ?? ""} onChange={(e) => set("yearsMax", e.target.value)} /></label>
          </div>
          <label className={label}>Industry / NAICS keyword<input className={field} value={f.industry ?? ""} onChange={(e) => set("industry", e.target.value)} placeholder="e.g. construction" /></label>
          <label className={label}>NAICS starts with<input className={field} value={f.naics ?? ""} onChange={(e) => set("naics", e.target.value)} placeholder="e.g. 23" /></label>
          <div className="grid grid-cols-2 gap-2">
            <label className={label}>Employees ≥<input type="number" className={field} value={f.employeeMin ?? ""} onChange={(e) => set("employeeMin", e.target.value)} /></label>
            <label className={label}>≤<input type="number" className={field} value={f.employeeMax ?? ""} onChange={(e) => set("employeeMax", e.target.value)} /></label>
            <label className={label}>Revenue ≥<input type="number" className={field} value={f.revenueMin ?? ""} onChange={(e) => set("revenueMin", e.target.value)} /></label>
            <label className={label}>≤<input type="number" className={field} value={f.revenueMax ?? ""} onChange={(e) => set("revenueMax", e.target.value)} /></label>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className={label}>Formed after<input type="date" className={field} value={f.formedAfter ?? ""} onChange={(e) => set("formedAfter", e.target.value)} /></label>
            <label className={label}>Formed before<input type="date" className={field} value={f.formedBefore ?? ""} onChange={(e) => set("formedBefore", e.target.value)} /></label>
          </div>
          <div className="flex flex-col gap-1 border-t border-line-soft pt-2 text-[12px] text-ink-faint">
            <label className="flex items-center gap-2 opacity-50"><input type="checkbox" disabled /> Has email</label>
            <label className="flex items-center gap-2 opacity-50"><input type="checkbox" disabled /> Has phone</label>
            <span className="text-[11px]">Contact filters activate once a contact vendor is connected.</span>
          </div>
          <button onClick={() => run(1)} disabled={loading} className="btn-gold text-[14px] disabled:opacity-50">{loading ? "Searching…" : "Search"}</button>
          <button onClick={() => { setF({}); }} className="text-[12px] text-forest underline">Reset filters</button>
        </div>
      </aside>

      {/* Results */}
      <section className="min-w-0 flex-1">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[15px] text-charcoal"><span className="font-semibold text-forest">{total.toLocaleString()}</span> companies{sel.size ? ` · ${sel.size} selected` : ""}</p>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={saveSearch} className="border border-forest px-3 py-1.5 text-[13px] font-medium text-forest">Save search</button>
            <button onClick={addToList} disabled={rows.length === 0} className="border border-forest px-3 py-1.5 text-[13px] font-medium text-forest disabled:opacity-50">Add {sel.size ? "selected" : "page"} to list</button>
            <button onClick={promote} disabled={rows.length === 0} className="btn-gold text-[13px] disabled:opacity-50">Promote {sel.size ? "selected" : "page"} to Leads</button>
          </div>
        </div>
        {err && <p className="mb-2 border border-red-200 bg-red-50 p-2 text-[13px] text-red-700">{err}</p>}
        {msg && <p className="mb-2 text-[13px] text-forest">{msg}</p>}

        {(() => {
          const rule = ruleForState(f.state);
          const tone = rule?.risk === "high" ? "border-red-300 bg-red-50" : rule?.risk === "elevated" ? "border-gold bg-cream" : "border-line-warm bg-white";
          return (
            <div className={`mb-3 border ${tone} p-3 text-[12.5px] prose-soft`}>
              <p className="font-semibold text-forest">
                Compliance {rule ? `· ${rule.name}` : ""}
                {rule?.risk === "high" && <span className="ml-2 rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white">HIGH RISK</span>}
              </p>
              {rule ? (
                <>
                  <p className="mt-1">{rule.summary}</p>
                  <p className="mt-1 text-[11.5px] text-ink-faint">
                    Calling hours (called party&apos;s local time): {rule.callingHours}
                    {rule.stateDnc ? " · has a state Do-Not-Call list" : ""}{rule.registration ? " · telemarketer registration generally required" : ""}
                  </p>
                </>
              ) : (
                <p className="mt-1">{FEDERAL_BASELINE}</p>
              )}
              <p className="mt-1 text-[11px] text-ink-faint">General information, not legal advice. Confirm with counsel before a campaign — especially Florida.</p>
            </div>
          );
        })()}

        <div className="overflow-x-auto border border-line-warm">
          <table className="w-full min-w-[720px] border-collapse bg-white text-left text-[13.5px]">
            <thead>
              <tr className="border-b border-line-soft bg-cream text-ink-faint">
                <th className="p-2 w-8"></th>
                <th className="p-2 font-medium">Company</th>
                <th className="p-2 font-medium">Location</th>
                <th className="p-2 font-medium">Size</th>
                <th className="p-2 font-medium">Industry</th>
                <th className="p-2 font-medium">Yrs</th>
                <th className="p-2 font-medium">Formed</th>
                <th className="p-2 font-medium">Contact</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-line-soft/60 align-top">
                  <td className="p-2"><input type="checkbox" checked={sel.has(r.id)} onChange={() => toggle(r.id)} /></td>
                  <td className="p-2">
                    <span className="font-medium text-charcoal">{r.legal_name}</span>
                    {r.dba_name && <span className="block text-[12px] prose-muted">dba {r.dba_name}</span>}
                    {r.domain && <span className="block text-[12px] text-forest">{r.domain}</span>}
                  </td>
                  <td className="p-2 prose-soft">{[r.city, r.state].filter(Boolean).join(", ")}{r.zip ? ` ${r.zip}` : ""}{r.location_type ? <span className="block text-[11px] text-ink-faint">{r.location_type}</span> : null}</td>
                  <td className="p-2 prose-soft">{r.employee_est ? `${r.employee_est} emp` : "—"}<span className="block text-[11px] text-ink-faint">{usd(r.revenue_est)}</span></td>
                  <td className="p-2 prose-soft">{r.industry || (r.naics_code ? `NAICS ${r.naics_code}` : "—")}</td>
                  <td className="p-2 prose-soft">{r.years_in_business ?? "—"}</td>
                  <td className="p-2 prose-soft">{r.formation_date || "—"}</td>
                  <td className="p-2">
                    {r.contacts.length === 0 ? <span className="text-[11px] text-ink-faint">No contacts</span> : (
                      <div className="flex flex-col gap-1.5">
                        {r.contacts.map((c) => (
                          <div key={c.id}>
                            <span className="text-[12px] text-charcoal">{[c.first_name, c.last_name].filter(Boolean).join(" ") || "Contact"}{c.title ? ` · ${c.title}` : ""}</span>
                            {c.do_not_contact ? <span className="ml-1 rounded bg-red-100 px-1 text-[10px] text-red-700">DNC</span> : (
                              <div className="mt-0.5 flex flex-wrap gap-1">
                                {(["email", "phone_direct", "phone_mobile"] as const).map((fld) => {
                                  const key = `${c.id}:${fld}`; const val = revealed[key];
                                  const label = fld === "email" ? "email" : fld === "phone_direct" ? "direct" : "mobile";
                                  if (val) return <span key={fld} className="rounded bg-cream px-1.5 py-0.5 font-mono text-[11px] text-forest">{val}</span>;
                                  if (!canReveal) return <span key={fld} className="text-[11px] text-ink-faint">{label} •••</span>;
                                  return <button key={fld} disabled={revealing === key} onClick={() => reveal(c.id, fld)} className="border border-gold px-1.5 py-0.5 text-[11px] text-charcoal hover:bg-cream disabled:opacity-50">{revealing === key ? "…" : `Reveal ${label}`}</button>;
                                })}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {loading && rows.length === 0 && (
                <tr><td colSpan={8} className="p-6 text-center text-[14px] prose-muted">Searching…</td></tr>
              )}
              {rows.length === 0 && !loading && (
                <tr><td colSpan={8} className="p-6 text-center text-[14px] prose-muted">No companies match these filters. Adjust the filters on the left, or run an ingest from Admin to add companies.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {pages > 1 && (
          <div className="mt-3 flex items-center justify-center gap-3 text-[13px]">
            <button disabled={page <= 1 || loading} onClick={() => run(page - 1)} className="border border-line-warm px-3 py-1 disabled:opacity-40">← Prev</button>
            <span className="prose-muted">Page {page} of {pages}</span>
            <button disabled={page >= pages || loading} onClick={() => run(page + 1)} className="border border-line-warm px-3 py-1 disabled:opacity-40">Next →</button>
          </div>
        )}
      </section>
    </div>
  );
}
