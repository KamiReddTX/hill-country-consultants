"use client";
import { useState, useTransition } from "react";
import { deleteEmployee } from "@/app/staff/actions";

/** Admin/BM: permanently delete an employee (typed confirm). */
export function DeleteEmployeeButton({ staffId, label }: { staffId: string; label: string }) {
  const [armed, setArmed] = useState(false);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState("");
  if (!armed) return <button type="button" onClick={() => setArmed(true)} className="text-[12px] text-red-700 underline underline-offset-2">Delete</button>;
  return (
    <span className="flex flex-wrap items-center gap-2">
      <span className="text-[12px] text-red-700">Delete {label}?</span>
      <button type="button" disabled={pending}
        onClick={() => start(async () => { setMsg(""); const r = await deleteEmployee(staffId); if (r?.error) setMsg(r.error); })}
        className="border border-red-700 px-2 py-0.5 text-[12px] font-semibold text-red-700 disabled:opacity-50">{pending ? "…" : "Yes"}</button>
      <button type="button" onClick={() => setArmed(false)} className="text-[12px] prose-muted underline">Cancel</button>
      {msg && <span className="text-[12px] text-red-700">{msg}</span>}
    </span>
  );
}
