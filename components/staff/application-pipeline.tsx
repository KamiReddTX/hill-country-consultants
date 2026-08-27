"use client";
import { useState, useTransition } from "react";
import { setApplicationStage, setApplicationRating, setApplicationNotes } from "@/app/staff/actions";
import { HireApplicant } from "@/components/staff/hire-applicant";
import { ApplicationDecision } from "@/components/staff/application-decision";
import { LocalTime } from "@/components/local-time";

type EduRow = { school?: string; degree?: string; field?: string; location?: string; completed?: string };
type JobRow = { employer?: string; title?: string; location?: string; start?: string; end?: string; duties?: string; reason_leaving?: string; may_contact?: boolean };
type RefRow = { name?: string; relationship?: string; company?: string; phone?: string; email?: string };

type App = {
  id: string; name: string; email: string; phone: string | null; location: string | null;
  address: string | null; city_state_zip: string | null;
  position: string | null; employment_type: string | null; availability: string | null;
  available_start: string | null; hours_available: string | null; days_available: string | null;
  work_authorized: boolean | null; over_18: boolean | null; sponsorship_required: boolean | null;
  desired_pay: string | null; referral: string | null; portfolio_url: string | null;
  skills: string | null; certifications: string | null; experience: string | null; why: string | null;
  education: EduRow[] | null; employment_history: JobRow[] | null; refs: RefRow[] | null;
  attest_equipment: boolean | null; attest_security: boolean | null; attest_background: boolean | null;
  attest_us_based: boolean | null; attest_confidential: boolean | null;
  eeo_gender: string | null; eeo_race: string | null; eeo_veteran: string | null; eeo_disability: string | null;
  certified: boolean | null; signature: string | null; signed_at: string | null;
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
        {(() => {
          const addr = [a.address, a.city_state_zip].filter(Boolean).join(", ") || a.location;
          const avail = [a.available_start && `start ${a.available_start}`, a.hours_available, a.days_available].filter(Boolean).join(" · ");
          const auth = [a.over_18 != null && `18+: ${a.over_18 ? "Yes" : "No"}`, a.work_authorized != null && `US-auth: ${a.work_authorized ? "Yes" : "No"}`, a.sponsorship_required != null && `sponsorship: ${a.sponsorship_required ? "Yes" : "No"}`].filter(Boolean).join(" · ");
          const edu = a.education || []; const jobs = a.employment_history || []; const refs = a.refs || [];
          const attest = [a.attest_equipment && "equipment", a.attest_security && "security", a.attest_us_based && "US-based", a.attest_background && "background check", a.attest_confidential && "NDA"].filter(Boolean);
          const eeo = [a.eeo_gender, a.eeo_race, a.eeo_veteran, a.eeo_disability].filter(Boolean).join(" · ");
          return (
            <div className="grid gap-x-4 gap-y-0.5">
              <p><span className="text-ink-faint">Email:</span> <a href={`mailto:${a.email}`} className="link-underline break-all">{a.email}</a></p>
              {a.phone && <p><span className="text-ink-faint">Phone:</span> {a.phone}</p>}
              {addr && <p><span className="text-ink-faint">Address:</span> {addr}</p>}
              {a.employment_type && <p><span className="text-ink-faint">Type:</span> {a.employment_type}</p>}
              {a.desired_pay && <p><span className="text-ink-faint">Desired pay:</span> {a.desired_pay}</p>}
              {avail && <p><span className="text-ink-faint">Availability:</span> {avail}</p>}
              {auth && <p><span className="text-ink-faint">Work auth:</span> {auth}</p>}
              {edu.length > 0 && <p><span className="text-ink-faint">Education:</span> {edu.map((e) => [e.degree, e.field].filter(Boolean).join(" ") || e.school).filter(Boolean).join("; ")}</p>}
              {jobs.length > 0 && <p><span className="text-ink-faint">History:</span> {jobs.map((j) => [j.title, j.employer].filter(Boolean).join(" @ ")).filter(Boolean).join("; ")}</p>}
              {refs.length > 0 && <p><span className="text-ink-faint">References:</span> {refs.length} provided</p>}
              {a.skills && <p className="whitespace-pre-wrap"><span className="text-ink-faint">Skills:</span> {a.skills}</p>}
              {a.certifications && <p className="whitespace-pre-wrap"><span className="text-ink-faint">Certs:</span> {a.certifications}</p>}
              {a.portfolio_url && <p><span className="text-ink-faint">Links:</span> <a href={a.portfolio_url} target="_blank" rel="noreferrer" className="link-underline break-all">{a.portfolio_url}</a></p>}
              {a.experience && <p className="whitespace-pre-wrap"><span className="text-ink-faint">Experience:</span> {a.experience}</p>}
              {a.why && <p className="whitespace-pre-wrap"><span className="text-ink-faint">Why HCC:</span> {a.why}</p>}
              {attest.length > 0 && <p><span className="text-ink-faint">Attestations:</span> {attest.join(" · ")}</p>}
              {eeo && <p className="text-ink-faint">Self-ID (voluntary): {eeo}</p>}
              {a.certified && <p><span className="text-ink-faint">Signed:</span> {a.signature}{a.signed_at ? ` · ${new Date(a.signed_at).toLocaleDateString()}` : ""}</p>}
            </div>
          );
        })()}

        <div className="flex flex-wrap items-center gap-2">
          <a href={`/api/application-report/${a.id}`} className="btn-gold text-[12px]">Full application (PDF)</a>
          {a.resume_path && <a href={`/api/application-file/${a.id}`} className="border border-line-warm px-2 py-1 text-[12px] text-forest">Résumé</a>}
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
