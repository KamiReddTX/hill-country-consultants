"use client";
import { useTransition } from "react";
import { acceptTask, submitTaskToClient } from "@/app/staff/actions";

/** AM/VA action on a client task: accept a request into the queue, or submit
 *  finished work to the client for review. */
export function TaskWorkflowButton({ taskId, kind }: { taskId: string; kind: "accept" | "submit" }) {
  const [pending, start] = useTransition();
  const label = kind === "accept" ? "Accept & assign" : "Submit to client";
  const run = () => start(() => (kind === "accept" ? acceptTask(taskId) : submitTaskToClient(taskId)).then(() => {}));
  return (
    <button type="button" disabled={pending} onClick={run} className="btn-gold text-[12px] disabled:opacity-50">
      {pending ? "Saving…" : label}
    </button>
  );
}
