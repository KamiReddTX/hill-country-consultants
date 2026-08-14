"use client";
import { useState, useTransition } from "react";
import { addTaskRequest } from "@/app/portal/actions";

export function TaskRequestForm() {
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  return (
    <form
      id="task-form"
      className="flex flex-col gap-3 border border-line-warm bg-white p-5"
      action={(fd) =>
        start(async () => {
          setError("");
          setDone(false);
          const r = await addTaskRequest(fd);
          if (r?.error) setError(r.error);
          else {
            setDone(true);
            (document.getElementById("task-form") as HTMLFormElement)?.reset();
          }
        })
      }
    >
      <p className="font-fraunces text-[20px] font-medium text-forest">Tasks</p>

      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] font-medium text-ink-faint">Describe exactly what you need us to do, in full detail</span>
        <textarea
          name="details"
          required
          rows={4}
          placeholder="What's the task, the goal, and any context or examples we should know…"
          className="w-full border border-line-warm px-3 py-2 text-[15px] outline-none focus:border-forest"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] font-medium text-ink-faint">Upload any documents needed for the task <span className="font-normal text-ink-faint">(optional · up to ~15MB total)</span></span>
        <input
          name="files"
          type="file"
          multiple
          className="text-[14px] file:mr-3 file:border file:border-line-warm file:bg-cream file:px-3 file:py-1.5 file:text-[13px] file:text-forest"
        />
      </label>

      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium text-ink-faint">Date needed by</span>
          <input name="due" type="date" className="min-h-touch border border-line-warm px-3 text-[15px] outline-none focus:border-forest" />
        </label>
        <button disabled={pending} className="btn-gold px-6 text-[14px]">{pending ? "Submitting…" : "Submit task"}</button>
      </div>

      {error && <p className="text-[13px] text-red-700">{error}</p>}
      {done && <p className="text-[13px] text-forest">Submitted — it&apos;s in Requested, and your account lead is notified.</p>}
    </form>
  );
}
