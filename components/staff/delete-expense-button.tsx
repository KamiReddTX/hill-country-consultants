"use client";
import { useTransition } from "react";
import { deleteExpense } from "@/app/staff/actions";

export function DeleteExpenseButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <button type="button" disabled={pending} onClick={() => start(() => deleteExpense(id).then(() => {}))} className="text-[11px] text-red-700 underline disabled:opacity-50">
      {pending ? "…" : "delete"}
    </button>
  );
}
