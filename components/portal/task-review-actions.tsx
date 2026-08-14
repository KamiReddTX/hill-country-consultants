"use client";
import { useTransition } from "react";
import { approveTask, requestChanges } from "@/app/portal/actions";

/** Client controls shown on a task that's "In review": approve it (→ Delivered)
 *  or send it back for changes (→ In progress, flags the VA/AM to call). */
export function TaskReviewActions({ taskId }: { taskId: string }) {
  const [pending, start] = useTransition();
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => start(() => approveTask(taskId).then(() => {}))}
        className="border border-forest bg-forest px-2.5 py-1 text-[12px] font-semibold text-white disabled:opacity-50"
      >
        Approve
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => start(() => requestChanges(taskId).then(() => {}))}
        className="border border-line-warm bg-white px-2.5 py-1 text-[12px] font-semibold text-forest hover:border-gold disabled:opacity-50"
      >
        Needs changes
      </button>
    </div>
  );
}
