"use client";
import { useState, useTransition } from "react";
import { logWork } from "@/app/staff/actions";

const SERVICES = [
  "Virtual Assistant & Admin", "Project Management & Coordination", "Construction Submittals",
  "Compliance & Documentation", "Marketing & Graphics", "Brand Systems", "Publishing & Editorial",
  "Music, Media & Podcast", "App, Web & PWA", "Corporate Training", "Systems & Automation",
  "Event Planning", "Agriculture & Land", "Grants & Nonprofit",
];

export function LogWorkForm({ clients }: { clients: { id: string; label: string }[] }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const field = "min-h-touch border border-line-warm px-3 text-[15px] outline-none focus:border-forest";
  return (
    <form id="log-work-form" className="grid gap-3 border border-line-warm bg-white p-5 sm:grid-cols-2"
      action={(fd) => start(async () => {
        setError(""); setDone(false);
        const r = await logWork(fd);
        if (r?.error) setError(r.error); else { setDone(true); (document.getElementById("log-work-form") as HTMLFormElement)?.reset(); }
      })}>
      <select name="client_id" required defaultValue="" className={field}>
        <option value="" disabled>Client…</option>
        {clients.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
      </select>
      <select name="service" defaultValue="" className={field}>
        <option value="">Service line…</option>
        {SERVICES.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      <input name="task" placeholder="What you worked on" className={`${field} sm:col-span-2`} />
      <input name="worked_on" type="date" className={field} />
      <input name="hours" type="number" step="0.25" min="0" required placeholder="Hours" className={field} />
      {error && <p className="text-[13px] text-red-700 sm:col-span-2">{error}</p>}
      {done && <p className="text-[13px] text-forest sm:col-span-2">Logged — it appears on the client's work log.</p>}
      <button disabled={pending} className="btn-gold self-start px-5 sm:col-span-2">{pending ? "Logging…" : "Log work"}</button>
    </form>
  );
}
