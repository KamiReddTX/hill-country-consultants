"use client";
import { useState, useTransition } from "react";
import { reviewDeliverable } from "@/app/portal/actions";

/** Client Approve / Request-changes control for a delivered item. */
export function DeliverableReview({ id, status }: { id: string; status: string | null }) {
  const [pending, start] = useTransition();
  const [armed, setArmed] = useState(false);
  const [note, setNote] = useState("");
  const [done, setDone] = useState<string | null>(status);
  const [msg, setMsg] = useState("");

  if (done === "approved") return <span className="text-[12px] font-semibold text-forest">✓ Approved</span>;
  if (done === "changes_requested") return <span className="text-[12px] font-semibold text-amber-700">Changes requested</span>;

  return (
    <span className="flex flex-wrap items-center gap-2">
      <button type="button" disabled={pending}
        onClick={() => start(async () => { setMsg(""); const r = await reviewDeliverable(id, "approved", ""); if (r?.error) setMsg(r.error); else setDone("approved"); })}
        className="border border-forest px-2 py-1 text-[12px] font-medium text-forest disabled:opacity-50">Approve</button>
      {!armed ? (
        <button type="button" onClick={() => setArmed(true)} className="text-[12px] text-amber-700 underline">Request changes</button>
      ) : (
        <>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="What needs changing?" className="min-h-touch border border-line-warm px-2 text-[13px]" />
          <button type="button" disabled={pending}
            onClick={() => start(async () => { setMsg(""); const r = await reviewDeliverable(id, "changes_requested", note); if (r?.error) setMsg(r.error); else setDone("changes_requested"); })}
            className="border border-amber-700 px-2 py-1 text-[12px] font-medium text-amber-700 disabled:opacity-50">{pending ? "Sending…" : "Send"}</button>
        </>
      )}
      {msg && <span className="text-[12px] text-red-700">{msg}</span>}
    </span>
  );
}
