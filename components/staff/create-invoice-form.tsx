"use client";
import { useState, useTransition } from "react";
import { createInvoice } from "@/app/staff/actions";

/** Raise a one-off overage or project invoice for a client. */
export function CreateInvoiceForm({ clients }: { clients: { id: string; label: string }[] }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState("");
  return (
    <form
      action={(fd) => start(async () => { setMsg(""); const r = await createInvoice(fd); setMsg(r?.error ? r.error : "Invoice drafted"); if (!r?.error) (document.getElementById("ci-form") as HTMLFormElement)?.reset(); })}
      id="ci-form"
      className="flex flex-wrap items-end gap-2"
    >
      <label className="flex flex-col gap-0.5 text-[11px] text-ink-faint">Client
        <select name="clientId" required className="min-h-touch min-w-[200px] border border-line-warm bg-white px-2 text-[13px]">
          <option value="">Choose…</option>
          {clients.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
      </label>
      <label className="flex flex-col gap-0.5 text-[11px] text-ink-faint">Kind
        <select name="kind" className="min-h-touch border border-line-warm bg-white px-2 text-[13px]">
          <option value="project">Project</option>
          <option value="overage">Overage</option>
        </select>
      </label>
      <label className="flex flex-col gap-0.5 text-[11px] text-ink-faint">Amount ($)
        <input name="amount" type="number" step="0.01" min="0" required className="min-h-touch w-28 border border-line-warm bg-white px-2 text-[13px]" />
      </label>
      <label className="flex flex-col gap-0.5 text-[11px] text-ink-faint">Description
        <input name="description" type="text" placeholder="e.g. Extra submittal week — Oct" className="min-h-touch w-64 border border-line-warm bg-white px-2 text-[13px]" />
      </label>
      <label className="flex flex-col gap-0.5 text-[11px] text-ink-faint">Stripe link (optional)
        <input name="payUrl" type="url" placeholder="https://…" className="min-h-touch w-56 border border-line-warm bg-white px-2 text-[13px]" />
      </label>
      <button type="submit" disabled={pending} className="btn-gold text-[13px] disabled:opacity-50">{pending ? "Saving…" : "Draft invoice"}</button>
      {msg && <span className="text-[12px] text-forest">{msg}</span>}
    </form>
  );
}
