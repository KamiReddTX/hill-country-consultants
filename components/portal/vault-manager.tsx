"use client";
import { useState, useTransition } from "react";
import { addVaultEntry, setResync, deleteVaultEntry } from "@/app/portal/actions";
import type { VaultRow } from "@/lib/database.types";

export function VaultManager({ rows }: { rows: VaultRow[] }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const field = "min-h-touch border border-line-warm px-3 text-[15px] outline-none focus:border-forest";

  return (
    <div className="flex flex-col gap-6">
      {rows.length === 0 && (
        <p className="border border-dashed border-line-warm bg-white p-6 text-[15px] prose-muted">
          No accounts registered yet. Add the tools we'll need access to — we collect the actual logins securely
          through the shared password manager, never here.
        </p>
      )}

      {rows.length > 0 && (
        <ul className="divide-y divide-line-soft border-y border-line-soft">
          {rows.map((v) => (
            <li key={v.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
              <div className="min-w-0">
                <p className="text-[15.5px] font-medium text-charcoal">{v.name}</p>
                <p className="text-[13px] prose-muted">
                  {v.username ? `${v.username} · ` : ""}{v.url || "no URL"}{v.purpose ? ` · ${v.purpose}` : ""}
                </p>
                <p className="text-[12px] text-ink-faint">Updated {new Date(v.updated_at).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[12px] font-semibold ${v.needs_resync ? "text-red-700" : "text-forest"}`}>
                  {v.needs_resync ? "Needs re-sync" : "In sync"}
                </span>
                <button className="min-h-touch border border-line-warm px-3 text-[13px]"
                  onClick={() => start(() => setResync(v.id, !v.needs_resync).then(() => {}))}>
                  {v.needs_resync ? "Mark synced" : "Flag re-sync"}
                </button>
                <button className="min-h-touch border border-line-warm px-3 text-[13px] text-red-700"
                  onClick={() => start(() => deleteVaultEntry(v.id).then(() => {}))}>Remove</button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form
        className="grid gap-3 border border-line-warm bg-white p-5 sm:grid-cols-2"
        action={(fd) => start(async () => { setError(""); const r = await addVaultEntry(fd); if (r?.error) setError(r.error); else (document.getElementById("vault-form") as HTMLFormElement)?.reset(); })}
        id="vault-form"
      >
        <p className="sm:col-span-2 text-[13px] font-semibold text-forest">Register an account (no passwords — ever)</p>
        <input name="name" required placeholder="Account name (e.g. Google Workspace)" className={field} />
        <input name="username" placeholder="Username / email on the account" className={field} />
        <input name="url" placeholder="Login URL" className={field} />
        <input name="purpose" placeholder="What it's for" className={field} />
        {error && <p className="sm:col-span-2 text-[13px] text-red-700">{error}</p>}
        <button disabled={pending} className="btn-gold self-start px-5 text-[14px] sm:col-span-2">{pending ? "Saving…" : "Add entry"}</button>
      </form>
    </div>
  );
}
