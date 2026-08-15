"use client";
import { useState, useTransition } from "react";
import { sendPasswordReset } from "@/app/staff/actions";

/** Admin: email a client or employee a password-reset link for their portal. */
export function PasswordResetForm() {
  const [email, setEmail] = useState("");
  const [portal, setPortal] = useState<"client" | "staff">("client");
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState("");
  return (
    <div className="flex flex-wrap items-end gap-3">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="person@email.com"
        className="min-h-touch min-w-[240px] border border-line-warm bg-white px-3 text-[14px]"
      />
      <select
        value={portal}
        onChange={(e) => setPortal(e.target.value as "client" | "staff")}
        className="min-h-touch border border-line-warm bg-white px-3 text-[14px]"
      >
        <option value="client">Client portal</option>
        <option value="staff">Employee portal</option>
      </select>
      <button
        type="button"
        disabled={pending || !email}
        onClick={() =>
          start(async () => {
            setMsg("");
            const r = await sendPasswordReset(email, portal);
            setMsg(r?.error ? r.error : "Reset email sent");
          })
        }
        className="btn-gold text-[14px] disabled:opacity-50"
      >
        {pending ? "Sending…" : "Send reset email"}
      </button>
      {msg && <span className="text-[13px] text-forest">{msg}</span>}
    </div>
  );
}
