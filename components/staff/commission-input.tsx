"use client";
import { useState, useTransition } from "react";
import { setStaffCommission } from "@/app/staff/actions";

/** Admin/BM: edit a rep's commission rate (percent). */
export function CommissionInput({ staffId, current }: { staffId: string; current: number }) {
  const [val, setVal] = useState(String(current ?? 0));
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);
  return (
    <span className="flex items-center gap-1">
      <input
        type="number" min={0} max={100} step={0.5} value={val}
        onChange={(e) => { setVal(e.target.value); setSaved(false); }}
        className="min-h-touch w-16 border border-line-warm bg-white px-2 text-[13px] outline-none focus:border-forest"
      />
      <span className="text-[12px] text-ink-faint">%</span>
      <button
        type="button" disabled={pending}
        onClick={() => start(async () => { const r = await setStaffCommission(staffId, Number(val)); if (!r?.error) setSaved(true); })}
        className="text-[12px] text-forest underline disabled:opacity-50"
      >
        {pending ? "…" : saved ? "Saved" : "Save"}
      </button>
    </span>
  );
}
