"use client";
import { useTransition } from "react";
import { assignTask } from "@/app/staff/actions";

/** Owner/team/admin: pick the worker doing a task. */
export function TaskAssignee({ taskId, current, options }: { taskId: string; current: string | null; options: { id: string; label: string }[] }) {
  const [pending, start] = useTransition();
  return (
    <select
      defaultValue={current || ""}
      disabled={pending}
      onChange={(e) => start(() => assignTask(taskId, e.target.value || null).then(() => {}))}
      className="mt-1 w-full border border-line-warm bg-white px-2 py-1 text-[12px] outline-none focus:border-forest"
    >
      <option value="">Unassigned worker</option>
      {options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
    </select>
  );
}
