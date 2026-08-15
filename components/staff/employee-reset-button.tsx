"use client";
import { useState, useTransition } from "react";
import { sendPasswordReset } from "@/app/staff/actions";

/** Admin/BM: email an employee a password-reset link for the staff portal. */
export function EmployeeResetButton({ email }: { email: string }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState("");
  return (
    <span className="flex items-center gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => start(async () => { setMsg(""); const r = await sendPasswordReset(email, "staff"); setMsg(r?.error ? r.error : "Reset sent"); })}
        className="text-[12px] text-forest underline underline-offset-2 disabled:opacity-50"
      >
        {pending ? "Sending…" : "Reset password"}
      </button>
      {msg && <span className={`text-[12px] ${msg === "Reset sent" ? "text-forest" : "text-red-700"}`}>{msg}</span>}
    </span>
  );
}
