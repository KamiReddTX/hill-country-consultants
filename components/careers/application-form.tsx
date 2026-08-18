"use client";
import { useState, useTransition } from "react";

const POSITIONS = [
  "Virtual Assistant", "Administrative Support", "Account Manager", "Sales / Account Manager",
  "Graphic Designer", "Marketing Specialist", "Publishing / Editorial", "Podcast / Media Editor",
  "Web / App Developer", "Construction Submittals Specialist", "Grants / Nonprofit Specialist",
  "Event Coordinator", "Agriculture & Land Services", "Bookkeeping / Admin Finance", "Other / General",
];
const TYPES = ["Full-time", "Part-time", "Contract / 1099", "Flexible"];

const field = "min-h-touch w-full border border-line-warm bg-white px-3 text-[15px] outline-none focus:border-forest";
const labelCls = "flex flex-col gap-1 text-[13px] text-ink-faint";

/** Public employment application. Posts multipart form data (incl. an optional
 *  résumé) to /api/apply. Shows an email fallback if the save doesn't confirm. */
export function ApplicationForm() {
  const [pending, start] = useTransition();
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");

  return done ? (
    <div className="border border-forest bg-white p-6">
      <p className="font-fraunces text-[22px] text-forest">Application received.</p>
      <p className="mt-2 max-w-[46em] text-[15px] prose-soft">Thank you for your interest in Hill Country Consultants. Our team reviews every application and will reach out by email if there&apos;s a fit. You&apos;ll hear from us at the address you provided.</p>
    </div>
  ) : (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget as HTMLFormElement);
        start(async () => {
          setErr("");
          try {
            const r = await fetch("/api/apply", { method: "POST", body: fd });
            const j = await r.json().catch(() => ({}));
            if (j?.persisted) { setDone(true); return; }
            setErr(j?.error === "invalid_email" ? "Please enter a valid email address." : "We couldn't submit that. Please email your résumé to info@hillcountryconsultants.com.");
          } catch {
            setErr("We couldn't submit that. Please email your résumé to info@hillcountryconsultants.com.");
          }
        });
      }}
    >
      {/* Honeypot */}
      <input type="text" name="hp_field_x" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

      <div className="grid gap-4 md:grid-cols-2">
        <label className={labelCls}>Full name *<input name="name" required className={field} /></label>
        <label className={labelCls}>Email *<input name="email" type="email" required className={field} /></label>
        <label className={labelCls}>Phone<input name="phone" className={field} /></label>
        <label className={labelCls}>Location (city, state)<input name="location" className={field} /></label>
        <label className={labelCls}>Position you&apos;re applying for
          <select name="position" defaultValue="" className={field}>
            <option value="" disabled>Select a role…</option>
            {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </label>
        <label className={labelCls}>Employment type
          <select name="employment_type" defaultValue="" className={field}>
            <option value="" disabled>Select…</option>
            {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label className={labelCls}>Availability / earliest start<input name="availability" placeholder="e.g. 20 hrs/wk, start Oct 1" className={field} /></label>
        <label className={labelCls}>Desired pay (optional)<input name="desired_pay" placeholder="e.g. $22/hr or negotiable" className={field} /></label>
      </div>

      <label className={labelCls}>Relevant experience<textarea name="experience" rows={4} placeholder="Roles, tools, industries, and what you'd bring to the team." className={`${field} py-2`} /></label>
      <label className={labelCls}>Key skills / software<textarea name="skills" rows={2} placeholder="e.g. Google Workspace, Microsoft 365, Canva, Adobe, QuickBooks, HubSpot, WordPress…" className={`${field} py-2`} /></label>
      <div className="grid gap-4 md:grid-cols-2">
        <label className={labelCls}>Portfolio / LinkedIn / website<input name="portfolio_url" placeholder="https://…" className={field} /></label>
        <label className={labelCls}>How did you hear about us?<input name="referral" className={field} /></label>
      </div>
      <label className={labelCls}>Why Hill Country Consultants?<textarea name="why" rows={3} className={`${field} py-2`} /></label>
      <label className={labelCls}>Résumé (PDF or Word, optional — max 8MB)<input name="resume" type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="text-[14px]" /></label>

      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" disabled={pending} className="btn-gold text-[15px] disabled:opacity-50">{pending ? "Submitting…" : "Submit application"}</button>
        {err && <span className="text-[13px] text-red-700">{err}</span>}
      </div>
      <p className="text-[12px] prose-muted">By submitting, you consent to Hill Country Consultants storing this information to evaluate your application.</p>
    </form>
  );
}
