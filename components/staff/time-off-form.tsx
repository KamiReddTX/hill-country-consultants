"use client";
import { useRef, useState, useTransition } from "react";
import { requestTimeOff } from "@/app/staff/actions";

/** Employee time-off request form. */
export function TimeOffForm() {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      className="flex flex-col gap-3 border border-line-warm bg-white p-4"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        start(async () => {
          setMsg("");
          const r = await requestTimeOff(fd);
          if (r?.error) setMsg(r.error);
          else { setMsg("Request submitted ✓"); formRef.current?.reset(); }
        });
      }}
    >
      <div className="flex flex-wrap gap-3">
        <label className="flex flex-col gap-1 text-[12px] prose-muted">Type
          <select name="kind" className="min-h-touch border border-line-warm bg-white px-2 text-[14px] text-charcoal">
            <option value="PTO">PTO</option><option value="Sick">Sick</option><option value="Unpaid">Unpaid</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[12px] prose-muted">Start
          <input type="date" name="start_date" required className="min-h-touch border border-line-warm bg-white px-2 text-[14px]" />
        </label>
        <label className="flex flex-col gap-1 text-[12px] prose-muted">End
          <input type="date" name="end_date" className="min-h-touch border border-line-warm bg-white px-2 text-[14px]" />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-[12px] prose-muted">Note (optional)
        <input name="note" placeholder="Anything your manager should know" className="min-h-touch border border-line-warm bg-white px-2 text-[14px]" />
      </label>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className="btn-gold text-[14px] disabled:opacity-50">{pending ? "Submitting…" : "Request time off"}</button>
        {msg && <span className="text-[13px] text-forest">{msg}</span>}
      </div>
    </form>
  );
}
