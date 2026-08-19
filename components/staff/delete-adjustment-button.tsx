"use client";
import { useTransition } from "react";
import { deleteAllotmentAdjustment } from "@/app/staff/actions";

/** Undo one allotment adjustment entry. */
export function DeleteAdjustmentButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <button type="button" disabled={pending} onClick={() => start(() => deleteAllotmentAdjustment(id).then(() => {}))} className="text-[11px] text-red-700 underline disabled:opacity-50">
      {pending ? "…" : "remove"}
    </button>
  );
}
