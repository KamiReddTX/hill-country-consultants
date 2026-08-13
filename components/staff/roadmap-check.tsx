"use client";

import { useTransition } from "react";
import { setRoadmapDone } from "@/app/staff/actions";

/** Admin checkbox for the client's 30-day roadmap onboarding step. */
export function RoadmapCheck({ clientId, done }: { clientId: string; done: boolean }) {
  const [pending, start] = useTransition();
  return (
    <label className="flex items-center gap-2 text-[13px] prose-muted">
      <input
        type="checkbox"
        defaultChecked={done}
        disabled={pending}
        onChange={(e) => start(() => setRoadmapDone(clientId, e.target.checked).then(() => {}))}
        className="h-4 w-4 accent-forest"
      />
      {pending ? "Saving…" : done ? "Done" : "Mark done"}
    </label>
  );
}
