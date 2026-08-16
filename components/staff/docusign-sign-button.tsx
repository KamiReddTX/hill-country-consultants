"use client";
import { useState, useTransition } from "react";
import { startDocusignSigning } from "@/app/staff/actions";

/** Employee: open DocuSign embedded signing for a document. */
export function DocusignSignButton({ docId }: { docId: string }) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState("");
  return (
    <span className="flex items-center gap-2">
      <button type="button" disabled={pending}
        onClick={() => start(async () => { setErr(""); const r = await startDocusignSigning(docId); if (r?.error) setErr(r.error); else if (r?.url) window.location.href = r.url; })}
        className="border border-forest px-2.5 py-1 text-[12px] font-semibold text-forest hover:bg-cream/60 disabled:opacity-50">
        {pending ? "Opening…" : "Sign with DocuSign"}
      </button>
      {err && <span className="text-[12px] text-red-700">{err}</span>}
    </span>
  );
}
