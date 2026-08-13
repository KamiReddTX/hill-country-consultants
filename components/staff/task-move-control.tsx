"use client";
import { useTransition } from "react";
import { moveTaskColumn } from "@/app/staff/actions";
const COLUMNS = ["Requested", "In progress", "In review", "Delivered"];
export function TaskMoveControl({ taskId, current }: { taskId: string; current: string }) {
  const [pending, start] = useTransition();
  return (
    <select defaultValue={current} disabled={pending}
      onChange={(e) => start(() => moveTaskColumn(taskId, e.target.value).then(() => {}))}
      className="min-h-touch border border-line-warm bg-white px-2 text-[13px]">
      {COLUMNS.map((c) => <option key={c} value={c}>{c}</option>)}
    </select>
  );
}
