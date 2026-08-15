"use client";
import { useState, useTransition } from "react";
import { addClientTeamMember, removeClientTeamMember } from "@/app/staff/actions";

type Member = { id: string; staffId: string; label: string };

/** Owner/BM/admin: coordinate the specialists on an account (the AM's team). */
export function AccountTeam({ clientId, members, options }: { clientId: string; members: Member[]; options: { id: string; label: string }[] }) {
  const [pick, setPick] = useState("");
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState("");
  const takenStaff = new Set(members.map((m) => m.staffId));
  const addable = options.filter((o) => !takenStaff.has(o.id));

  return (
    <div className="flex flex-col gap-1.5">
      {members.length > 0 ? (
        <ul className="flex flex-wrap gap-1">
          {members.map((m) => (
            <li key={m.id} className="flex items-center gap-1 border border-line-warm bg-cream px-2 py-0.5 text-[12px] text-charcoal">
              {m.label}
              <button type="button" disabled={pending} onClick={() => start(async () => { setMsg(""); const r = await removeClientTeamMember(m.id); if (r?.error) setMsg(r.error); })}
                className="text-red-700" aria-label="Remove">×</button>
            </li>
          ))}
        </ul>
      ) : <span className="text-[12px] text-ink-faint">No team members</span>}
      {addable.length > 0 && (
        <div className="flex items-center gap-2">
          <select value={pick} onChange={(e) => setPick(e.target.value)} className="min-h-touch border border-line-warm bg-white px-2 text-[12px]">
            <option value="">Add specialist…</option>
            {addable.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
          <button type="button" disabled={pending || !pick}
            onClick={() => start(async () => { setMsg(""); const r = await addClientTeamMember(clientId, pick); if (r?.error) setMsg(r.error); else setPick(""); })}
            className="btn-gold text-[12px] disabled:opacity-50">Add</button>
        </div>
      )}
      {msg && <span className="text-[12px] text-red-700">{msg}</span>}
    </div>
  );
}
