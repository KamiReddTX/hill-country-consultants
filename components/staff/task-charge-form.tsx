"use client";
import { useState, useTransition } from "react";
import { sendTaskPaymentLink } from "@/app/staff/actions";

/** AM/VA: put an extra charge on a task and email the client a payment link.
 *  Used on Requested tasks that fall outside the client's included scope. */
export function TaskChargeForm({ taskId, status, cents }: { taskId: string; status: string; cents: number | null }) {
  const [amount, setAmount] = useState("");
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState("");

  if (status === "paid") return <span className="text-[12px] font-semibold text-forest">Charge paid</span>;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center border border-line-warm bg-white">
        <span className="px-2 text-[13px] text-ink-faint">$</span>
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          inputMode="decimal"
          placeholder="0.00"
          className="w-20 py-1 text-[13px] outline-none"
        />
      </div>
      <button
        type="button"
        disabled={pending || !amount}
        onClick={() =>
          start(async () => {
            setMsg("");
            const r = await sendTaskPaymentLink(taskId, amount);
            setMsg(r?.error ? r.error : "Payment link sent");
          })
        }
        className="border border-forest bg-white px-2.5 py-1 text-[12px] font-semibold text-forest hover:bg-cream disabled:opacity-50"
      >
        {pending ? "Sending…" : status === "sent" ? "Resend link" : "Send payment link"}
      </button>
      {status === "sent" && cents ? <span className="text-[12px] prose-muted">${(cents / 100).toFixed(2)} requested</span> : null}
      {msg && <span className="text-[12px] text-forest">{msg}</span>}
    </div>
  );
}
