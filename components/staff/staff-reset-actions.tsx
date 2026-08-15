"use client";
import { useState, useTransition } from "react";
import { approveStaffReset, denyStaffReset } from "@/app/staff/actions";

/** Admin: approve (sends the recovery email) or deny an employee reset request. */
export function StaffResetActions({ id }: { id: string }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState("");
  return (
    <span className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => start(async () => { setMsg(""); const r = await approveStaffReset(id); if (r?.error) setMsg(r.error); })}
        className="btn-gold text-[12px] disabled:opacity-50"
      >
        {pending ? "…" : "Approve & send"}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => start(async () => { setMsg(""); const r = await denyStaffReset(id); if (r?.error) setMsg(r.error); })}
        className="border border-line-warm px-2 py-1 text-[12px] prose-muted disabled:opacity-50"
      >
        Deny
      </button>
      {msg && <span className="text-[12px] text-red-700">{msg}</span>}
    </span>
  );
}
