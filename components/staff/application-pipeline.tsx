"use client";
import { useState, useTransition } from "react";
import { setApplicationStage, setApplicationRating, setApplicationNotes } from "@/app/staff/actions";
import { HireApplicant } from "@/components/staff/hire-applicant";
import { ApplicationDecision } from "@/components/staff/application-decision";
import { LocalTime } from "@/components/local-time";

type App = {
  id: string; name: string; email: string; phone: string | null; location: string | null;
  position: string | null; employment_type: string | null; availability: string | null;
  desired_pay: string | null; referral: string | null; portfolio_url: string | null;
  skills: string | null; experience: string | null; why: string | null;
  resume_path: string | null; credentials_path: string | null;
  status: string; rating: number | null; review_notes: string | null; created_at: string;
};

const STAGES: { key: string; label: string }[] = [
  { key: "new", label: "New" },
  { key: "reviewing", label: "Reviewing" },
  { key: "interview", label: "Interview" },
  { key: "offer", label: "Offer" },
  { key: "hired", label: "Hired" },
  { key: "declined", label: "Declined" },
];
const MANUAL = ["new", "reviewing", "offer"];

function Stars({ value, onSet }: { value: number; onSet: (n: number) => void }) {
  return (
    <span className="inline-flex items-center gap-0.5" title="Rate 1–5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onClick={() => onSet(n === value ? 0 : n)}
          className={`text-[15px] leading-none ${n <= value ? "text-gold" : "text-line-warm"}`} aria-label={`${n} star`}>★</button>
      ))}
    </span>
  );
}

function Card({ a, roleOptions }: { a: App; roleOptions: readonly string[] }) {
  const [pending, start] = useTransition();
  const [rating, setRating] = useState(a.rating || 0);
  const [notes, setNotes] = useState(a.review_notes || "");
  const [notesMsg, setNotesMsg] = useState("");

  const rate = (n: number) => { setRating(n); start(() => setApplicationRating(a.id, n)); };
  const move = (stage: string) => start(() => setApplicationStage(a.id, stage));

  return (
    <details className="border border-line-warm bg-white">
      <summary className="min-h-touch cursor-pointer list-none px-3 py-2">
        <span className="flex flex-col gap-1">
          <span className="flex items-center justify-between gap-2">
            <span className="text-[14px] font-medium text-charcoal">{a.name}</span>
            <Stars value={rating} onSet={rate} />
          </span>
          {a.position && <span className="text-[12px] text-forest">{a.position}</span>}
          <span className="text-[11px] prose-muted"><LocalTime iso={a.created_at} mode="date" /></span>
        </span>
      </summary>
      <div className="flex flex-col gap-3 border-t border-line-soft p-3 text-[13px]">
        <div className="grid gap-x-4 gap-y-0.5">
          <p><span className="text-ink-faint">Email:</span> <a href={`mailto:${a.email}`} className="link-underline break-all">{a.email}</a></p>
          {a.phone && <p><span className="text-ink-faint">Phone:</span> {a.phone}</p>}
          {a.location && <p><span className="text-ink-faint">Location:</span> {a.location}</p>}
          {a.desired_pay && <p><span className="text-ink-faint">Desired pay:</span> {a.desired_pay}</p>}
          {a.availability && <p><span className="text-ink-faint">Availability:</span> {a.availability}</p>}
          {a.experience && <p className="whitespace-pre-wrap"><span className="text-ink-faint">Experience:</span> {a.experience}</p>}
          {a.why && <p className="whitespace-pre-wrap"><span className="text-ink-faint">Why HCC:</span> {a.why}</p>}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {a.resume_path ? <a href={`/api/application-file/${a.id}`} className="btn-gold text-[12px]">Résumé</a> : <span className="text-[11px] prose-muted">No résumé</span>}
          {a.credentials_path && <a href={`/api/application-file/${a.id}?kind=credentials`} className="border border-line-warm px-2 py-1 text-[12px] text-forest">Credentials</a>}
        </div>

        <label className="flex items-center gap-2 text-[12px] prose-muted">
          Move to
          <select value={MANUAL.includes(a.status) ? a.status : ""} disabled={pending}
            onChange={(e) => e.target.value && move(e.target.value)}
            className="min-h-touch border border-line-warm bg-white px-2 text-[13px] text-charcoal">
            {!MANUAL.includes(a.status) && <option value="">{STAGES.find((s) => s.key === a.status)?.label || a.status}</option>}
            <option value="new">New</option>
            <option value="reviewing">Reviewing</option>
            <option value="offer">Offer</option>
          </select>
          <span className="text-[11px]">(use buttons below for interview / decline / hire)</span>
        </label>

        <div>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Reviewer notes…"
            className="w-full border border-line-warm bg-white p-2 text-[13px]" />
          <div className="mt-1 flex items-center gap-2">
            <button type="button" disabled={pending}
              onClick={() => start(async () => { setNotesMsg(""); const r = await setApplicationNotes(a.id, notes); setNotesMsg(r?.error ? r.error : "Saved"); })}
              className="border border-forest px-2 py-1 text-[12px] font-medium text-forest disabled:opacity-50">Save notes</button>
            {notesMsg && <span className="text-[12px] text-forest">{notesMsg}</span>}
          </div>
        </div>

        {a.status === "hired" ? (
          <span className="text-[12px] font-semibold text-forest">✓ Hired — employee profile created</span>
        ) : (
          <div className="flex flex-col gap-2 border-t border-line-soft pt-2">
            <HireApplicant applicationId={a.id} roleOptions={roleOptions} suggested={a.position || undefined} />
            <ApplicationDecision applicationId={a.id} />
          </div>
        )}
      </div>
    </details>
  );
}

/** Kanban-style hiring pipeline: applications grouped into stage columns. */
export function ApplicationPipeline({ applications, roleOptions }: { applications: App[]; roleOptions: readonly string[] }) {
  if (applications.length === 0) return <p className="text-[15px] prose-muted">No applications yet.</p>;
  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {STAGES.map((s) => {
        const items = applications.filter((a) => (a.status || "new") === s.key);
        return (
          <div key={s.key} className="flex w-[280px] shrink-0 flex-col gap-2">
            <div className="flex items-center justify-between border-b-2 border-gold pb-1">
              <span className="text-[13px] font-semibold text-forest">{s.label}</span>
              <span className="text-[12px] prose-muted">{items.length}</span>
            </div>
            {items.map((a) => <Card key={a.id} a={a} roleOptions={roleOptions} />)}
            {items.length === 0 && <p className="px-1 text-[12px] text-ink-faint">—</p>}
          </div>
        );
      })}
    </div>
  );
}
