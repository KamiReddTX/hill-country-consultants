"use client";
import { useState, useTransition } from "react";
import { generatePlanInvoices } from "@/app/staff/actions";

/** Draft this month's plan invoices for every plan client in one click. */
export function GenerateInvoicesForm({ defaultMonth }: { defaultMonth: string }) {
  const [month, setMonth] = useState(defaultMonth);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState("");
  return (
    <div className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-0.5 text-[11px] text-ink-faint">Billing month
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="min-h-touch border border-line-warm bg-white px-2 text-[14px]" />
      </label>
      <button
        type="button"
        disabled={pending}
        onClick={() => start(async () => { setMsg(""); const r = await generatePlanInvoices(month); setMsg(r?.error ? r.error : `Drafted ${r?.created ?? 0} plan invoice${(r?.created ?? 0) === 1 ? "" : "s"}`); })}
        className="btn-gold text-[14px] disabled:opacity-50"
      >
        {pending ? "Generating…" : "Draft plan invoices"}
      </button>
      {msg && <span className="text-[13px] text-forest">{msg}</span>}
    </div>
  );
}
