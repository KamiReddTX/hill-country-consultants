"use client";
import { useState, useTransition } from "react";
import { updateInvoice } from "@/app/staff/actions";

/** Row controls for one invoice: advance status, attach a Stripe pay link,
 *  mark paid (manual or Stripe), or void. Admin / Business Manager only. */
export function InvoiceControls({ id, status, payUrl }: { id: string; status: string; payUrl: string | null }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState("");
  const [url, setUrl] = useState(payUrl || "");
  const run = (patch: Parameters<typeof updateInvoice>[1]) =>
    start(async () => { setMsg(""); const r = await updateInvoice(id, patch); if (r?.error) setMsg(r.error); });

  if (status === "void") return <span className="text-[12px] text-ink-faint">Voided</span>;
  if (status === "paid")
    return (
      <span className="flex items-center gap-2">
        <span className="text-[12px] font-semibold text-forest">Paid</span>
        <button type="button" disabled={pending} onClick={() => run({ status: "sent" })} className="text-[11px] prose-muted underline">Undo</button>
      </span>
    );

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-1.5">
        {status === "draft" && (
          <button type="button" disabled={pending} onClick={() => run({ status: "sent" })} className="border border-forest px-2 py-0.5 text-[12px] text-forest disabled:opacity-50">Mark sent</button>
        )}
        <button type="button" disabled={pending} onClick={() => run({ status: "paid", paidMethod: "stripe" })} className="btn-gold px-2 py-0.5 text-[12px] disabled:opacity-50">Paid (Stripe)</button>
        <button type="button" disabled={pending} onClick={() => run({ status: "paid", paidMethod: "manual" })} className="border border-line-warm px-2 py-0.5 text-[12px] disabled:opacity-50">Paid (manual)</button>
        <button type="button" disabled={pending} onClick={() => run({ status: "void" })} className="text-[11px] text-red-700 underline">Void</button>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Stripe payment link URL" className="min-h-touch w-64 border border-line-warm bg-white px-2 text-[12px]" />
        <button type="button" disabled={pending} onClick={() => run({ payUrl: url })} className="border border-line-warm px-2 py-0.5 text-[12px] disabled:opacity-50">Save link</button>
        {payUrl && <a href={payUrl} target="_blank" rel="noreferrer" className="text-[12px] link-underline">Open</a>}
      </div>
      {msg && <span className="text-[12px] text-red-700">{msg}</span>}
    </div>
  );
}
