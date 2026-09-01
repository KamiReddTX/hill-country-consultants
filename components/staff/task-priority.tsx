"use client";
import { useTransition } from "react";
import { setTaskPriority } from "@/app/staff/actions";

const LEVELS = ["Low", "Normal", "High", "Urgent"];

/** Inline priority picker for a task. Owner/team/admin only (server-enforced). */
export function TaskPriority({ taskId, current }: { taskId: string; current: string | null }) {
  const [pending, start] = useTransition();
  return (
    <select
      defaultValue={current || "Normal"}
      disabled={pending}
      title="Priority"
      onChange={(e) => start(() => setTaskPriority(taskId, e.target.value).then(() => {}))}
      className="min-h-touch border border-line-warm bg-white px-2 py-1 text-[12px] outline-none focus:border-forest"
    >
      {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
    </select>
  );
}
