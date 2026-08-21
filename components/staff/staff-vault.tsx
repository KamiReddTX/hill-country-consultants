"use client";
import { useState, useTransition } from "react";
import { sendVaultInviteEmail, addClientVaultEntry, setClientVaultResync, deleteClientVaultEntry } from "@/app/staff/actions";
import type { VaultRow } from "@/lib/database.types";

/** Staff: send the vault invite + maintain the account register for one client. */
export function StaffVault({ clientId, rows }: { clientId: string; rows: VaultRow[] }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [shareLink, setShareLink] = useState("");
  const [managerName, setManagerName] = useState("");
  const field = "min-h-touch border border-line-warm px-3 text-[14px] outline-none focus:border-forest";
  const formId = `vault-${clientId}`;
  return (
    <div className="mt-3 flex flex-col gap-3 border-t border-line-soft pt-3">
      <div className="flex flex-col gap-2">
        <p className="text-[12px] prose-muted">Passwords are shared inside your password manager. Paste the client&apos;s accept link from that tool (optional) so the email leads with the real share instead of the portal.</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <input value={managerName} onChange={(e) => setManagerName(e.target.value)} placeholder="Password manager (e.g. 1Password, Bitwarden)" className={field} />
          <input value={shareLink} onChange={(e) => setShareLink(e.target.value)} placeholder="Accept link from the manager (https://…) — optional" className={field} />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={pending}
            onClick={() => start(async () => { setMsg(""); setErr(""); const r = await sendVaultInviteEmail(clientId, shareLink, managerName); if (r?.error) { setErr(r.error); } else { setMsg("Invite emailed to the client"); setShareLink(""); } })}
            className="btn-gold text-[13px] disabled:opacity-50"
          >
            Send vault invite
          </button>
          {msg && <span className="text-[12px] text-forest">{msg}</span>}
          {err && <span className="text-[12px] text-red-700">{err}</span>}
        </div>
      </div>

      {rows.length > 0 && (
        <ul className="divide-y divide-line-soft border-y border-line-soft">
          {rows.map((v) => (
            <li key={v.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="text-[15px] font-medium text-charcoal">{v.name}</p>
                <p className="text-[13px] prose-muted">{v.username ? `${v.username} · ` : ""}{v.url || "no URL"}{v.purpose ? ` · ${v.purpose}` : ""}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[12px] font-semibold ${v.needs_resync ? "text-red-700" : "text-forest"}`}>{v.needs_resync ? "Needs re-sync" : "In sync"}</span>
                <button className="min-h-touch border border-line-warm px-3 text-[12px]" disabled={pending}
                  onClick={() => start(() => setClientVaultResync(v.id, !v.needs_resync).then(() => {}))}>{v.needs_resync ? "Mark synced" : "Flag re-sync"}</button>
                <button className="min-h-touch border border-line-warm px-3 text-[12px] text-red-700" disabled={pending}
                  onClick={() => start(() => deleteClientVaultEntry(v.id).then(() => {}))}>Remove</button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form
        id={formId}
        className="grid gap-2 sm:grid-cols-2"
        action={(fd) => start(async () => { setErr(""); fd.set("clientId", clientId); const r = await addClientVaultEntry(fd); if (r?.error) setErr(r.error); else (document.getElementById(formId) as HTMLFormElement)?.reset(); })}
      >
        <p className="sm:col-span-2 text-[12px] font-semibold text-forest">Register an account we hold (no passwords — ever)</p>
        <input name="name" required placeholder="Account name (e.g. Google Workspace)" className={field} />
        <input name="username" placeholder="Username / email on the account" className={field} />
        <input name="url" placeholder="Login URL" className={field} />
        <input name="purpose" placeholder="What it's for" className={field} />
        <button disabled={pending} className="btn-gold self-start px-5 text-[13px] sm:col-span-2">{pending ? "Saving…" : "Add account"}</button>
      </form>
    </div>
  );
}
