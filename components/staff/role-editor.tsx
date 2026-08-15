"use client";
import { useState, useTransition } from "react";
import { setStaffRoles } from "@/app/staff/actions";

/** Admin: edit the full set of roles an employee holds (multi-role). */
export function RoleEditor({ staffId, current, options }: { staffId: string; current: string[]; options: readonly string[] }) {
  const [open, setOpen] = useState(false);
  const [sel, setSel] = useState<string[]>(current.length ? current : []);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState("");

  const toggle = (r: string) => setSel((s) => (s.includes(r) ? s.filter((x) => x !== r) : [...s, r]));

  if (!open) {
    return (
      <span className="flex flex-wrap items-center gap-1">
        <span className="text-[13px] text-charcoal">{current.length ? current.join(", ") : "—"}</span>
        <button type="button" onClick={() => setOpen(true)} className="text-[12px] text-forest underline">Edit</button>
      </span>
    );
  }
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {options.map((r) => (
          <label key={r} className="flex items-center gap-1 text-[12px] text-charcoal">
            <input type="checkbox" checked={sel.includes(r)} onChange={() => toggle(r)} />{r}
          </label>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <button type="button" disabled={pending} onClick={() => start(async () => { setMsg(""); const res = await setStaffRoles(staffId, sel); if (res?.error) setMsg(res.error); else setOpen(false); })}
          className="btn-gold text-[12px] disabled:opacity-50">{pending ? "Saving…" : "Save roles"}</button>
        <button type="button" onClick={() => { setSel(current); setOpen(false); }} className="text-[12px] prose-muted underline">Cancel</button>
        {msg && <span className="text-[12px] text-red-700">{msg}</span>}
      </div>
    </div>
  );
}
