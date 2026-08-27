"use client";
import { useState } from "react";

type Role = { role_title: string; can_search: boolean; can_reveal: boolean; can_export: boolean; can_admin: boolean; monthly_credit_default: number };
type Staff = { id: string; name: string; role: string; credits: number | null };

const field = "min-h-touch border border-line-warm bg-white px-2 text-[13px] outline-none focus:border-forest";

export function ProspectAdmin({ roles, staff, period, suppression }: { roles: Role[]; staff: Staff[]; period: string; suppression: { phones: number; emails: number } }) {
  const [rp, setRp] = useState(roles);
  const [st, setSt] = useState(staff);
  const [msg, setMsg] = useState("");
  const [supPhone, setSupPhone] = useState(""); const [supPhoneReason, setSupPhoneReason] = useState("internal_dnc");
  const [supEmail, setSupEmail] = useState(""); const [supEmailReason, setSupEmailReason] = useState("unsubscribed");
  const [counts, setCounts] = useState(suppression);

  const post = (b: any) => fetch("/api/prospect/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) });

  const saveRole = async (r: Role) => {
    const res = await post({ action: "role_perm", ...r });
    setMsg(res.ok ? `Saved ${r.role_title}.` : `Couldn't save ${r.role_title}.`);
  };
  const setRoleField = (i: number, k: keyof Role, v: any) => setRp((s) => s.map((r, j) => j === i ? { ...r, [k]: v } : r));

  const saveCredits = async (s: Staff) => {
    const res = await post({ action: "set_credits", staff_id: s.id, period_month: period, credits: s.credits ?? 0 });
    setMsg(res.ok ? `Set credits for ${s.name}.` : "Couldn't set credits.");
  };
  const setStaffCredits = (i: number, v: any) => setSt((s) => s.map((r, j) => j === i ? { ...r, credits: v === "" ? null : Number(v) } : r));

  const uploadPhones = async () => {
    const res = await post({ action: "suppress_phone", text: supPhone, reason: supPhoneReason });
    const j = await res.json().catch(() => ({}));
    if (res.ok) { setCounts((c) => ({ ...c, phones: c.phones + (j.added || 0) })); setSupPhone(""); setMsg(`Added ${j.added} phone(s) to suppression.`); }
    else setMsg("Phone suppression upload failed.");
  };
  const uploadEmails = async () => {
    const res = await post({ action: "suppress_email", text: supEmail, reason: supEmailReason });
    const j = await res.json().catch(() => ({}));
    if (res.ok) { setCounts((c) => ({ ...c, emails: c.emails + (j.added || 0) })); setSupEmail(""); setMsg(`Added ${j.added} email(s)/domain(s) to suppression.`); }
    else setMsg("Email suppression upload failed.");
  };

  const [ingSource, setIngSource] = useState("CO_SOS");
  const [ingLimit, setIngLimit] = useState(500);
  const [ingBusy, setIngBusy] = useState(false);
  const runIngest = async () => {
    setIngBusy(true); setMsg("Running ingest…");
    try {
      const r = await fetch("/api/prospect/ingest", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ source: ingSource, limit: ingLimit }) });
      const j = await r.json().catch(() => ({}));
      if (r.ok && j.ok) setMsg(`Ingest ${ingSource}: fetched ${j.fetched}, inserted ${j.inserted} new (${j.duplicates} already present).`);
      else if (j.halted) setMsg(`Ingest halted: ${j.message}`);
      else setMsg(`Ingest failed: ${j.detail || j.error || "error"}.`);
    } finally { setIngBusy(false); }
  };

  return (
    <div className="flex flex-col gap-6">
      {msg && <p className="text-[13px] text-forest">{msg}</p>}

      <section className="border border-line-warm bg-white p-4">
        <p className="text-[13px] font-semibold text-forest">Data ingest</p>
        <p className="mt-1 text-[12px] prose-muted">Pull the newest company records from a state open-data source into the base layer (companies only — no contact data). Free states run without a vendor. Paid sources (national file, your GA/TX/AL/LA/FL/NV territory) plug into the same job once licensed.</p>
        <div className="mt-2 flex flex-wrap items-end gap-2">
          <label className="flex flex-col gap-1 text-[12px] text-ink-faint">Source
            <select value={ingSource} onChange={(e) => setIngSource(e.target.value)} className={field}>
              <option value="CO_SOS">Colorado SOS (free)</option>
              <option value="CT_SOS">Connecticut Registry (free)</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-[12px] text-ink-faint">Records (max 1000)
            <input type="number" value={ingLimit} min={1} max={1000} onChange={(e) => setIngLimit(Math.min(1000, Math.max(1, Number(e.target.value) || 1)))} className={`${field} w-28`} />
          </label>
          <button onClick={runIngest} disabled={ingBusy} className="btn-gold text-[13px] disabled:opacity-50">{ingBusy ? "Running…" : "Run ingest"}</button>
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-forest">Role permissions</h2>
        <div className="overflow-x-auto border border-line-warm">
          <table className="w-full min-w-[640px] border-collapse bg-white text-left text-[13px]">
            <thead><tr className="border-b border-line-soft bg-cream text-ink-faint"><th className="p-2 font-medium">Role</th><th className="p-2">Search</th><th className="p-2">Reveal</th><th className="p-2">Export</th><th className="p-2">Admin</th><th className="p-2">Credits/mo</th><th className="p-2"></th></tr></thead>
            <tbody>{rp.map((r, i) => (
              <tr key={r.role_title} className="border-b border-line-soft/60">
                <td className="p-2 font-medium text-charcoal">{r.role_title}</td>
                {(["can_search", "can_reveal", "can_export", "can_admin"] as const).map((k) => (
                  <td key={k} className="p-2"><input type="checkbox" checked={r[k]} onChange={(e) => setRoleField(i, k, e.target.checked)} /></td>
                ))}
                <td className="p-2"><input type="number" value={r.monthly_credit_default} onChange={(e) => setRoleField(i, "monthly_credit_default", Number(e.target.value))} className={`${field} w-20`} /></td>
                <td className="p-2"><button onClick={() => saveRole(r)} className="border border-forest px-2 py-1 text-[12px] font-medium text-forest">Save</button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-forest">Credit allowances · {period.slice(0, 7)}</h2>
        <p className="mb-2 text-[12px] prose-muted">Blank = uses the role default. Set a number to override this month.</p>
        <div className="overflow-x-auto border border-line-warm">
          <table className="w-full min-w-[420px] border-collapse bg-white text-left text-[13px]">
            <thead><tr className="border-b border-line-soft bg-cream text-ink-faint"><th className="p-2 font-medium">Staff</th><th className="p-2 font-medium">Role</th><th className="p-2 font-medium">Credits</th><th className="p-2"></th></tr></thead>
            <tbody>{st.map((s, i) => (
              <tr key={s.id} className="border-b border-line-soft/60">
                <td className="p-2">{s.name}</td><td className="p-2 prose-muted">{s.role}</td>
                <td className="p-2"><input type="number" value={s.credits ?? ""} placeholder="default" onChange={(e) => setStaffCredits(i, e.target.value)} className={`${field} w-24`} /></td>
                <td className="p-2"><button onClick={() => saveCredits(s)} className="border border-forest px-2 py-1 text-[12px] font-medium text-forest">Set</button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="border border-line-warm bg-white p-4">
          <p className="text-[13px] font-semibold text-forest">Phone suppression <span className="prose-muted">· {counts.phones} on file</span></p>
          <p className="mt-1 text-[12px] prose-muted">Paste numbers (any format), one per line or comma-separated. Scrubbed inside the reveal path before any number is returned.</p>
          <textarea value={supPhone} onChange={(e) => setSupPhone(e.target.value)} rows={4} className="mt-2 w-full border border-line-warm p-2 text-[13px]" placeholder="(555) 123-4567&#10;5551234568" />
          <div className="mt-2 flex items-center gap-2">
            <select value={supPhoneReason} onChange={(e) => setSupPhoneReason(e.target.value)} className={field}>
              {["national_dnc", "internal_dnc", "state_dnc", "wireless", "litigator"].map((x) => <option key={x} value={x}>{x}</option>)}
            </select>
            <button onClick={uploadPhones} className="btn-gold text-[13px]">Upload</button>
          </div>
        </div>
        <div className="border border-line-warm bg-white p-4">
          <p className="text-[13px] font-semibold text-forest">Email suppression <span className="prose-muted">· {counts.emails} on file</span></p>
          <p className="mt-1 text-[12px] prose-muted">Paste emails or whole domains (e.g. acme.com), one per line. Emails and domains are both honored.</p>
          <textarea value={supEmail} onChange={(e) => setSupEmail(e.target.value)} rows={4} className="mt-2 w-full border border-line-warm p-2 text-[13px]" placeholder="jane@acme.com&#10;competitor.com" />
          <div className="mt-2 flex items-center gap-2">
            <select value={supEmailReason} onChange={(e) => setSupEmailReason(e.target.value)} className={field}>
              {["unsubscribed", "complained", "bounced", "client", "competitor"].map((x) => <option key={x} value={x}>{x}</option>)}
            </select>
            <button onClick={uploadEmails} className="btn-gold text-[13px]">Upload</button>
          </div>
        </div>
      </section>
    </div>
  );
}
