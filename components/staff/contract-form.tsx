"use client";
import { useState, useTransition } from "react";
import { addContract } from "@/app/staff/actions";

const KINDS = ["SOW", "MSA", "NDA", "Order", "Other"];

/** Create a contract/SOW for a client, optionally attaching a PDF. */
export function ContractForm({ clients }: { clients: { id: string; label: string }[] }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState("");
  return (
    <form
      id="contract-form"
      action={(fd) => start(async () => { setMsg(""); const r = await addContract(fd); setMsg(r?.error ? r.error : "Contract added"); if (!r?.error) (document.getElementById("contract-form") as HTMLFormElement)?.reset(); })}
      className="flex flex-wrap items-end gap-2"
    >
      <label className="flex flex-col gap-0.5 text-[11px] text-ink-faint">Client
        <select name="clientId" required className="min-h-touch min-w-[180px] border border-line-warm bg-white px-2 text-[13px]">
          <option value="">Choose…</option>
          {clients.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
      </label>
      <label className="flex flex-col gap-0.5 text-[11px] text-ink-faint">Type
        <select name="kind" className="min-h-touch border border-line-warm bg-white px-2 text-[13px]">
          {KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
        </select>
      </label>
      <label className="flex flex-col gap-0.5 text-[11px] text-ink-faint">Title
        <input name="title" required placeholder="e.g. Q4 marketing SOW" className="min-h-touch w-56 border border-line-warm bg-white px-2 text-[13px]" />
      </label>
      <label className="flex flex-col gap-0.5 text-[11px] text-ink-faint">Value ($)
        <input name="amount" type="number" step="0.01" min="0" className="min-h-touch w-28 border border-line-warm bg-white px-2 text-[13px]" />
      </label>
      <label className="flex flex-col gap-0.5 text-[11px] text-ink-faint">Start
        <input name="startDate" type="date" className="min-h-touch border border-line-warm bg-white px-2 text-[13px]" />
      </label>
      <label className="flex flex-col gap-0.5 text-[11px] text-ink-faint">End
        <input name="endDate" type="date" className="min-h-touch border border-line-warm bg-white px-2 text-[13px]" />
      </label>
      <label className="flex flex-col gap-0.5 text-[11px] text-ink-faint">Signer email
        <input name="signerEmail" type="email" placeholder="client@…" className="min-h-touch w-48 border border-line-warm bg-white px-2 text-[13px]" />
      </label>
      <label className="flex flex-col gap-0.5 text-[11px] text-ink-faint">Signer name
        <input name="signerName" placeholder="optional" className="min-h-touch w-40 border border-line-warm bg-white px-2 text-[13px]" />
      </label>
      <label className="flex flex-col gap-0.5 text-[11px] text-ink-faint">PDF
        <input name="file" type="file" accept="application/pdf" className="text-[12px]" />
      </label>
      <button type="submit" disabled={pending} className="btn-gold text-[13px] disabled:opacity-50">{pending ? "Saving…" : "Add contract"}</button>
      {msg && <span className="text-[12px] text-forest">{msg}</span>}
    </form>
  );
}
