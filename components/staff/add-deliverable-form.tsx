"use client";
import { useState, useTransition } from "react";
import { addDeliverable } from "@/app/staff/actions";

const SERVICES = [
  "Virtual Assistant & Admin", "Project Management & Coordination", "Construction Submittals",
  "Compliance & Documentation", "Marketing & Graphics", "Brand Systems", "Publishing & Editorial",
  "Music, Media & Podcast", "App, Web & PWA", "Corporate Training", "Systems & Automation",
  "Event Planning", "Agriculture & Land", "Grants & Nonprofit",
];
const STATUSES = ["Delivered", "In review", "Draft"];

export function AddDeliverableForm({ clients }: { clients: { id: string; label: string }[] }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const field = "min-h-touch border border-line-warm px-3 text-[15px] outline-none focus:border-forest";
  return (
    <form id="deliverable-form" className="grid gap-3 border border-line-warm bg-white p-5 sm:grid-cols-2"
      action={(fd) => start(async () => {
        setError(""); setDone(false);
        const r = await addDeliverable(fd);
        if (r?.error) setError(r.error); else { setDone(true); (document.getElementById("deliverable-form") as HTMLFormElement)?.reset(); }
      })}>
      <select name="client_id" required defaultValue="" className={field}>
        <option value="" disabled>Client…</option>
        {clients.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
      </select>
      <select name="service" defaultValue="" className={field}>
        <option value="">Service line…</option>
        {SERVICES.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      <input name="name" required placeholder="Deliverable name" className={`${field} sm:col-span-2`} />
      <input name="file_url" type="url" placeholder="Shared-drive link (optional)" className={`${field} sm:col-span-2`} />
      <select name="status" defaultValue="Delivered" className={field}>
        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      <input name="delivered_on" type="date" className={field} />
      {error && <p className="text-[13px] text-red-700 sm:col-span-2">{error}</p>}
      {done && <p className="text-[13px] text-forest sm:col-span-2">Recorded — it appears in the client's Files.</p>}
      <button disabled={pending} className="btn-gold self-start px-5 sm:col-span-2">{pending ? "Saving…" : "Add deliverable"}</button>
    </form>
  );
}
