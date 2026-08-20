"use client";
import { useState, useTransition } from "react";
import { setStaffCapacity } from "@/app/staff/actions";

/** Inline editor for a staffer's weekly capacity target (hours). */
export function CapacityEditor({ staffId, current }: { staffId: string; current: number }) {
  const [val, setVal] = useState(String(current ?? 40));
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);
  return (
    <span className="flex items-center gap-1">
      <input
        type="number" step="1" min="0" max="168" value={val}
        onChange={(e) => { setVal(e.target.value); setSaved(false); }}
        onBlur={() => start(async () => { await setStaffCapacity(staffId, Number(val || 0)); setSaved(true); })}
        className="min-h-touch w-16 border border-line-warm bg-white px-2 text-[13px]"
      />
      <span className="text-[11px] text-ink-faint">h/wk</span>
      {pending ? <span className="text-[11px] text-ink-faint">…</span> : saved ? <span className="text-[11px] text-forest">✓</span> : null}
    </span>
  );
}
