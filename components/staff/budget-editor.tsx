"use client";
import { useState, useTransition } from "react";
import { setCategoryBudget } from "@/app/staff/actions";

/** Inline editor for one category's steady monthly budget (dollars). */
export function BudgetEditor({ category, current }: { category: string; current: number }) {
  const [val, setVal] = useState(current ? String(current) : "");
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);
  return (
    <span className="flex items-center gap-1">
      <span className="text-ink-faint">$</span>
      <input
        type="number" step="1" min="0" value={val}
        onChange={(e) => { setVal(e.target.value); setSaved(false); }}
        onBlur={() => start(async () => { await setCategoryBudget(category, Number(val || 0)); setSaved(true); })}
        placeholder="0"
        className="min-h-touch w-24 border border-line-warm bg-white px-2 text-[13px]"
      />
      {pending ? <span className="text-[11px] text-ink-faint">…</span> : saved ? <span className="text-[11px] text-forest">✓</span> : null}
    </span>
  );
}
