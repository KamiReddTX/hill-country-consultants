"use client";
import { useState, useTransition } from "react";
import { addExpense } from "@/app/staff/actions";
import { EXPENSE_CATEGORIES } from "@/content/expenses";

/** Log a business expense. Administrator only (page is admin-gated). */
export function ExpenseForm({ defaultDate }: { defaultDate: string }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState("");
  return (
    <form
      id="expense-form"
      action={(fd) => start(async () => { setMsg(""); const r = await addExpense(fd); setMsg(r?.error ? r.error : "Expense recorded"); if (!r?.error) (document.getElementById("expense-form") as HTMLFormElement)?.reset(); })}
      className="flex flex-wrap items-end gap-2"
    >
      <label className="flex flex-col gap-0.5 text-[11px] text-ink-faint">Date
        <input name="incurred_on" type="date" defaultValue={defaultDate} className="min-h-touch border border-line-warm bg-white px-2 text-[13px]" />
      </label>
      <label className="flex flex-col gap-0.5 text-[11px] text-ink-faint">Category
        <select name="category" className="min-h-touch border border-line-warm bg-white px-2 text-[13px]">
          {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </label>
      <label className="flex flex-col gap-0.5 text-[11px] text-ink-faint">Amount ($)
        <input name="amount" type="number" step="0.01" min="0" required className="min-h-touch w-28 border border-line-warm bg-white px-2 text-[13px]" />
      </label>
      <label className="flex flex-col gap-0.5 text-[11px] text-ink-faint">Vendor
        <input name="vendor" type="text" placeholder="e.g. Adobe" className="min-h-touch w-40 border border-line-warm bg-white px-2 text-[13px]" />
      </label>
      <label className="flex flex-col gap-0.5 text-[11px] text-ink-faint">Note
        <input name="description" type="text" placeholder="optional" className="min-h-touch w-48 border border-line-warm bg-white px-2 text-[13px]" />
      </label>
      <button type="submit" disabled={pending} className="btn-gold text-[13px] disabled:opacity-50">{pending ? "Saving…" : "Add expense"}</button>
      {msg && <span className="text-[12px] text-forest">{msg}</span>}
    </form>
  );
}
