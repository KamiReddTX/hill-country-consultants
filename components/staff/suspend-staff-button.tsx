"use client";
import { useState, useTransition } from "react";
import { setStaffActive } from "@/app/staff/actions";

/** Admin: suspend (block portal access) or reactivate an employee. */
export function SuspendStaffButton({ staffId, active }: { staffId: string; active: boolean }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState("");
  return (
    <span className="flex items-center gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => start(async () => { setMsg(""); const r = await setStaffActive(staffId, !active); if (r?.error) setMsg(r.error); })}
        className={`px-2 py-1 text-[12px] font-semibold disabled:opacity-50 ${active ? "border border-red-700 text-red-700" : "btn-gold"}`}
      >
        {pending ? "…" : active ? "Suspend" : "Reactivate"}
      </button>
      {msg && <span className="text-[12px] text-red-700">{msg}</span>}
    </span>
  );
}
