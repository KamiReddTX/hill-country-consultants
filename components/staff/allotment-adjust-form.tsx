"use client";
import { useState, useTransition } from "react";
import { addAllotmentAdjustment } from "@/app/staff/actions";
import { ALLOTMENT_LINES } from "@/content/pricing";

/** Record a manual usage adjustment against a client's allotment for a month.
 *  Positive uses allotment (e.g. delivered a submittal); negative credits it back. */
export function AllotmentAdjustForm({ clientId, month }: { clientId: string; month: string }) {
  const [service, setService] = useState(ALLOTMENT_LINES[0].key);
  const [delta, setDelta] = useState("1");
  const [note, setNote] = useState("");
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState("");
  return (
    <form
      action={(fd) => start(async () => {
        setMsg("");
        fd.set("clientId", clientId); fd.set("month", month);
        fd.set("serviceKey", service); fd.set("delta", delta); fd.set("note", note);
        const r = await addAllotmentAdjustment(fd);
        if (r?.error) setMsg(r.error); else { setMsg("Recorded"); setNote(""); setDelta("1"); }
      })}
      className="flex flex-wrap items-end gap-2"
    >
      <label className="flex flex-col gap-0.5 text-[11px] text-ink-faint">Service
        <select value={service} onChange={(e) => setService(e.target.value as typeof service)} className="min-h-touch border border-line-warm bg-white px-2 text-[13px]">
          {ALLOTMENT_LINES.map((l) => <option key={l.key} value={l.key}>{l.label} ({l.unit})</option>)}
        </select>
      </label>
      <label className="flex flex-col gap-0.5 text-[11px] text-ink-faint">Amount
        <input type="number" step="0.5" value={delta} onChange={(e) => setDelta(e.target.value)} className="min-h-touch w-24 border border-line-warm bg-white px-2 text-[13px]" />
      </label>
      <label className="flex flex-col gap-0.5 text-[11px] text-ink-faint">Note (optional)
        <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Q3 filing package" className="min-h-touch w-56 border border-line-warm bg-white px-2 text-[13px]" />
      </label>
      <button type="submit" disabled={pending} className="btn-gold text-[13px] disabled:opacity-50">{pending ? "Saving…" : "Record"}</button>
      {msg && <span className="text-[12px] text-forest">{msg}</span>}
    </form>
  );
}
