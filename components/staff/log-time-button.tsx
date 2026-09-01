"use client";
import { useState, useTransition } from "react";
import { logTimeOnTask } from "@/app/staff/actions";

/** One-click time logging from a task card — reveals a small hours input, prefills
 *  the client/service/task from the task itself, and logs it. */
export function LogTimeButton({ taskId }: { taskId: string }) {
  const [open, setOpen] = useState(false);
  const [hours, setHours] = useState("");
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");
  const [pending, start] = useTransition();

  if (done) return <span className="text-[11px] text-forest">Time logged ✓</span>;
  if (!open) return (
    <button type="button" onClick={() => setOpen(true)} className="self-start text-[12px] font-medium text-forest hover:underline">
      + Log time
    </button>
  );
  return (
    <div className="flex items-center gap-1.5">
      <input
        type="number" step="0.25" min="0" autoFocus value={hours}
        onChange={(e) => setHours(e.target.value)} placeholder="hrs"
        className="min-h-touch w-16 border border-line-warm px-2 py-1 text-[12px] outline-none focus:border-forest"
      />
      <button
        type="button" disabled={pending}
        onClick={() => start(async () => {
          setErr("");
          const r = await logTimeOnTask(taskId, Number(hours));
          if (r?.error) setErr(r.error); else setDone(true);
        })}
        className="btn-gold px-2.5 py-1 text-[12px]"
      >{pending ? "…" : "Save"}</button>
      <button type="button" onClick={() => setOpen(false)} className="text-[12px] text-ink-faint hover:text-forest">Cancel</button>
      {err && <span className="text-[11px] text-red-700">{err}</span>}
    </div>
  );
}
