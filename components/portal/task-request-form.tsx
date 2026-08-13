"use client";
import { useState, useTransition } from "react";
import { addTaskRequest } from "@/app/portal/actions";

const SERVICES = [
  "Virtual Assistant & Admin", "Project Management & Coordination", "Construction Submittals",
  "Compliance & Documentation", "Marketing & Graphics", "Brand Systems", "Publishing & Editorial",
  "Music, Media & Podcast", "App, Web & PWA", "Corporate Training", "Systems & Automation",
  "Event Planning", "Agriculture & Land", "Grants & Nonprofit",
];

export function TaskRequestForm() {
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  return (
    <form
      className="grid gap-3 border border-line-warm bg-white p-5 sm:grid-cols-[2fr_1.5fr_1fr_auto]"
      action={(fd) => start(async () => {
        setError(""); setDone(false);
        const r = await addTaskRequest(fd);
        if (r?.error) setError(r.error); else { setDone(true); (document.getElementById("task-form") as HTMLFormElement)?.reset(); }
      })}
      id="task-form"
    >
      <input name="title" required placeholder="What do you need?" className="min-h-touch border border-line-warm px-3 text-[15px] outline-none focus:border-forest" />
      <select name="service" className="min-h-touch border border-line-warm px-3 text-[15px] outline-none focus:border-forest">
        {SERVICES.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      <input name="due" type="date" className="min-h-touch border border-line-warm px-3 text-[15px] outline-none focus:border-forest" />
      <button disabled={pending} className="btn-gold px-5 text-[14px]">{pending ? "Adding…" : "Add request"}</button>
      {error && <p className="text-[13px] text-red-700 sm:col-span-4">{error}</p>}
      {done && <p className="text-[13px] text-forest sm:col-span-4">Added — your account lead sees it the same business day.</p>}
    </form>
  );
}
