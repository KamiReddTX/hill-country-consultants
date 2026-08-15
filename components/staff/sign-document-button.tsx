"use client";
import { useState, useTransition } from "react";
import { signStaffDocument } from "@/app/staff/actions";

/** Employee: review + e-sign a document that requires a signature. */
export function SignDocumentButton({ docId }: { docId: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [pending, start] = useTransition();
  const [err, setErr] = useState("");
  if (!open) return <button type="button" onClick={() => setOpen(true)} className="border border-forest bg-forest px-2.5 py-1 text-[12px] font-semibold text-white">Review &amp; sign</button>;
  return (
    <span className="flex flex-wrap items-center gap-2">
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Type your full legal name" className="min-h-touch border border-line-warm bg-white px-2 text-[13px]" />
      <button type="button" disabled={pending || !name.trim()}
        onClick={() => start(async () => { setErr(""); const r = await signStaffDocument(docId, name); if (r?.error) setErr(r.error); })}
        className="btn-gold text-[12px] disabled:opacity-50">{pending ? "Signing…" : "Sign"}</button>
      <button type="button" onClick={() => setOpen(false)} className="text-[12px] prose-muted underline">Cancel</button>
      {err && <span className="text-[12px] text-red-700">{err}</span>}
    </span>
  );
}
