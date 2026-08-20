"use client";
import { useState, useTransition } from "react";
import { setClientRenewalDate } from "@/app/staff/actions";

/** Set or clear a client's manual renewal-date override. Empty = fall back to
 *  the auto date (retained_since + 12 months). */
export function RenewalDateInput({ clientId, current, autoHint }: { clientId: string; current: string | null; autoHint: string | null }) {
  const [val, setVal] = useState(current || "");
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);
  return (
    <span className="flex items-center gap-1">
      <input
        type="date" value={val}
        onChange={(e) => { setVal(e.target.value); setSaved(false); }}
        onBlur={() => start(async () => { await setClientRenewalDate(clientId, val); setSaved(true); })}
        className="min-h-touch border border-line-warm bg-white px-2 text-[12px]"
      />
      {pending ? <span className="text-[11px] text-ink-faint">…</span> : saved ? <span className="text-[11px] text-forest">✓</span> : null}
      {!val && autoHint && <span className="text-[11px] text-ink-faint">auto: {autoHint}</span>}
    </span>
  );
}
