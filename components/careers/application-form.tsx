"use client";
import { useState, useTransition } from "react";

const POSITIONS = [
  "Business Manager — Eastern",
  "Business Manager — Pacific",
  "Accounts Manager",
  "Engagement Specialist",
  "Creative Specialist",
  "Other / General",
];
const TYPES = ["Full-time", "Part-time", "Contract / 1099", "Flexible"];
const EEO_GENDER = ["Female", "Male", "Non-binary", "Prefer not to say"];
const EEO_RACE = [
  "Hispanic or Latino", "White", "Black or African American",
  "Native Hawaiian or Other Pacific Islander", "Asian",
  "American Indian or Alaska Native", "Two or More Races", "Prefer not to say",
];
const EEO_VETERAN = ["Not a protected veteran", "I am one or more of the protected veteran classes", "Prefer not to answer"];
const EEO_DISABILITY = ["Yes", "No", "Prefer not to answer"];

const field = "min-h-touch w-full border border-line-warm bg-white px-3 text-[15px] outline-none focus:border-forest";
const area = "w-full border border-line-warm bg-white px-3 py-2 text-[15px] outline-none focus:border-forest";
const labelCls = "flex flex-col gap-1 text-[13px] text-ink-faint";
const legend = "font-fraunces text-[19px] text-forest";
const sectionCls = "flex flex-col gap-4 border-t border-line-soft pt-6";
const sub = "text-[13px] prose-muted -mt-2";

type Edu = { school: string; degree: string; field: string; location: string; completed: string };
type Job = { employer: string; title: string; location: string; start: string; end: string; duties: string; reason_leaving: string; may_contact: boolean };
type Ref = { name: string; relationship: string; company: string; phone: string; email: string };

const emptyEdu = (): Edu => ({ school: "", degree: "", field: "", location: "", completed: "" });
const emptyJob = (): Job => ({ employer: "", title: "", location: "", start: "", end: "", duties: "", reason_leaving: "", may_contact: true });
const emptyRef = (): Ref => ({ name: "", relationship: "", company: "", phone: "", email: "" });

const YesNo = ({ name, label }: { name: string; label: string }) => (
  <fieldset className="flex flex-wrap items-center justify-between gap-2 border border-line-warm bg-white px-3 py-2">
    <span className="text-[14px] text-charcoal">{label}</span>
    <span className="flex gap-4 text-[14px]">
      <label className="flex items-center gap-1.5"><input type="radio" name={name} value="yes" /> Yes</label>
      <label className="flex items-center gap-1.5"><input type="radio" name={name} value="no" /> No</label>
    </span>
  </fieldset>
);

/** Public in-depth employment application. Posts multipart form data (all fields,
 *  multi-entry sections serialized as JSON, plus optional résumé + credentials)
 *  to /api/apply. Shows an email fallback if the save doesn't confirm. Pass
 *  `role` from a job posting to pre-fill and lock the position. */
export function ApplicationForm({ role }: { role?: string } = {}) {
  const [pending, start] = useTransition();
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");

  const [edu, setEdu] = useState<Edu[]>([emptyEdu()]);
  const [jobs, setJobs] = useState<Job[]>([emptyJob(), emptyJob()]);
  const [refs, setRefs] = useState<Ref[]>([emptyRef(), emptyRef()]);
  const [zone, setZone] = useState("");

  const needsMac = /creative/i.test(role || "");
  const isBM = /business manager/i.test(role || "");
  const isCreative = /creative/i.test(role || "");
  const isSalaried = /business manager|accounts manager/i.test(role || "");
  // Employment type is defined by the role, so we derive it rather than ask.
  const derivedType = /business manager|accounts manager/i.test(role || "") ? "Full-time"
    : /engagement|creative/i.test(role || "") ? "Contract / 1099" : "";
  // The signature question from each posting, asked in the application itself.
  const rolePrompt =
    /engagement/i.test(role || "") ? "Tell us about a time you had to explain something complicated to someone who didn't want to hear it. Then summarize the sales experience and client-facing work you'd bring."
    : /creative/i.test(role || "") ? "Tell us about a project where the client asked for something you thought was wrong — what you did, and how it ended. Then summarize your design, web/app, and video work."
    : /accounts manager/i.test(role || "") ? "Tell us about someone you coached who got measurably better — what they were doing wrong, what you changed, and how you knew it worked. Then describe your own sales results and any experience training clients."
    : isBM ? "Tell us about a system or process you built from nothing — what was broken before, what you put in place, how you got it approved, and how you knew it worked."
    : "Roles, tools, industries, and what you'd bring to the team.";
  const positionValue = isBM ? (zone ? `${role} — ${zone}` : role || "") : (role || "");

  if (done)
    return (
      <div className="border border-forest bg-white p-6">
        <p className="font-fraunces text-[22px] text-forest">Application received.</p>
        <p className="mt-2 max-w-[46em] text-[15px] prose-soft">Thank you for applying to Hill Country Consultants. We review every application and will be in touch by email at the address you provided — you can expect to hear from us within about two weeks if there&apos;s a fit. If you attached a résumé or portfolio file, it was received with your application.</p>
      </div>
    );

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        const el = e.currentTarget as HTMLFormElement;
        const fd = new FormData(el);
        // Serialize multi-entry sections as JSON (drop fully-empty rows).
        fd.set("education", JSON.stringify(edu.filter((r) => r.school || r.degree || r.field)));
        fd.set("employment_history", JSON.stringify(jobs.filter((r) => r.employer || r.title)));
        fd.set("refs", JSON.stringify(refs.filter((r) => r.name || r.phone || r.email)));
        // Creative / Business Manager roles: fold the discrete work-sample links into one stored field.
        const wsLabels: Record<string, string> | null = isCreative
          ? { cs_site1: "Site 1", cs_site2: "Site 2", cs_video: "Video/motion", cs_appbuild: "App/build" }
          : isBM
          ? { bm_design: "Design sample", bm_built: "Built/coded sample" }
          : null;
        if (wsLabels) {
          const parts = Object.keys(wsLabels)
            .map((k) => { const v = (fd.get(k) || "").toString().trim(); return v ? `${wsLabels[k]}: ${v}` : ""; })
            .filter(Boolean);
          if (parts.length) fd.set("work_samples", parts.join(" | "));
        }
        start(async () => {
          setErr("");
          try {
            const r = await fetch("/api/apply", { method: "POST", body: fd });
            const j = await r.json().catch(() => ({}));
            if (j?.persisted) { setDone(true); window.scrollTo({ top: 0, behavior: "smooth" }); return; }
            setErr(
              j?.error === "invalid_email" ? "Please enter a valid email address."
              : j?.error === "certify_required" ? "Please read and check the certification box, and type your name to sign."
              : "We couldn't submit that. Please email your résumé to info@hillcountryconsultants.com.",
            );
          } catch {
            setErr("We couldn't submit that. Please email your résumé to info@hillcountryconsultants.com.");
          }
        });
      }}
    >
      {/* Honeypot */}
      <input type="text" name="hp_field_x" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

      {/* 1 · Personal information */}
      <section className="flex flex-col gap-4">
        <p className={legend}>Personal information</p>
        <div className="grid gap-4 md:grid-cols-2">
          <label className={labelCls}>Full legal name *<input name="name" required className={field} /></label>
          <label className={labelCls}>Email *<input name="email" type="email" required className={field} /></label>
          <label className={labelCls}>Phone<input name="phone" className={field} /></label>
          <label className={labelCls}>Street address<input name="address" className={field} /></label>
          <label className={labelCls}>City, State ZIP<input name="city_state_zip" className={field} /></label>
          <label className={labelCls}>Location (if different)<input name="location" placeholder="City, State" className={field} /></label>
        </div>
      </section>

      {/* 2 · Position & availability */}
      <section className={sectionCls}>
        <p className={legend}>Position &amp; availability</p>
        <div className="grid gap-4 md:grid-cols-2">
          {role ? (
            <label className={labelCls}>Position you&apos;re applying for
              <input value={positionValue} readOnly className={`${field} bg-cream/50`} />
              <input type="hidden" name="position" value={positionValue} />
            </label>
          ) : (
            <label className={labelCls}>Position you&apos;re applying for
              <select name="position" defaultValue="" className={field}>
                <option value="" disabled>Select a role…</option>
                {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </label>
          )}
          {isBM && (
            <label className={labelCls}>Coverage zone *
              <select required value={zone} onChange={(e) => setZone(e.target.value)} className={field}>
                <option value="" disabled>Select Eastern or Pacific…</option>
                <option value="Eastern">Eastern</option>
                <option value="Pacific">Pacific</option>
              </select>
            </label>
          )}
          {role ? (
            // The role defines the employment type — recorded, not asked.
            <input type="hidden" name="employment_type" value={derivedType} />
          ) : (
            <label className={labelCls}>Employment type
              <select name="employment_type" defaultValue="" className={field}>
                <option value="" disabled>Select…</option>
                {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
          )}
          <label className={labelCls}>Earliest start date<input name="available_start" placeholder="e.g. Oct 1 or ASAP" className={field} /></label>
          {/* Desired pay: compensation is published for each role, so only ask on the general application. */}
          {role
            ? <label className={labelCls}>Expected compensation (only if different from the posted rate)<input name="desired_pay" placeholder="Leave blank to accept the posted rate" className={field} /></label>
            : <label className={labelCls}>Desired pay (optional)<input name="desired_pay" placeholder="e.g. $22/hr or negotiable" className={field} /></label>}
          {/* Hours/days availability is only relevant to the part-time contract roles. */}
          {!isSalaried && <label className={labelCls}>Hours available / week<input name="hours_available" placeholder="e.g. 20 hrs/wk" className={field} /></label>}
          {!isSalaried && <label className={labelCls}>Days / times available<input name="days_available" placeholder="e.g. Mon–Fri, some evenings" className={field} /></label>}
        </div>
      </section>

      {/* 3 · Work authorization */}
      <section className={sectionCls}>
        <p className={legend}>Work authorization</p>
        <div className="grid gap-3 md:grid-cols-3">
          <YesNo name="over_18" label="Are you 18 or older?" />
          <YesNo name="work_authorized" label="Authorized to work in the U.S.?" />
          <YesNo name="sponsorship_required" label="Will you require sponsorship?" />
        </div>
        <p className={sub}>These roles are open to applicants based in and authorized to work in the United States.</p>
      </section>

      {/* 4 · Education */}
      <section className={sectionCls}>
        <div className="flex items-center justify-between">
          <p className={legend}>Education</p>
          <button type="button" onClick={() => setEdu((a) => [...a, emptyEdu()])} className="text-[13px] font-medium text-forest underline">+ Add school</button>
        </div>
        {edu.map((row, i) => (
          <div key={i} className="grid gap-3 border border-line-soft p-3 md:grid-cols-2">
            <label className={labelCls}>School / institution<input value={row.school} onChange={(e) => setEdu((a) => a.map((r, j) => j === i ? { ...r, school: e.target.value } : r))} className={field} /></label>
            <label className={labelCls}>Degree / diploma<input value={row.degree} onChange={(e) => setEdu((a) => a.map((r, j) => j === i ? { ...r, degree: e.target.value } : r))} placeholder="e.g. B.A., certificate, HS diploma" className={field} /></label>
            <label className={labelCls}>Field of study<input value={row.field} onChange={(e) => setEdu((a) => a.map((r, j) => j === i ? { ...r, field: e.target.value } : r))} className={field} /></label>
            <label className={labelCls}>Location<input value={row.location} onChange={(e) => setEdu((a) => a.map((r, j) => j === i ? { ...r, location: e.target.value } : r))} className={field} /></label>
            <label className={labelCls}>Completed (year) / status<input value={row.completed} onChange={(e) => setEdu((a) => a.map((r, j) => j === i ? { ...r, completed: e.target.value } : r))} placeholder="e.g. 2019, or in progress" className={field} /></label>
            {edu.length > 1 && <button type="button" onClick={() => setEdu((a) => a.filter((_, j) => j !== i))} className="self-end text-[12px] text-red-700 underline">Remove</button>}
          </div>
        ))}
      </section>

      {/* 5 · Employment history */}
      <section className={sectionCls}>
        <div className="flex items-center justify-between">
          <p className={legend}>Employment history</p>
          <button type="button" onClick={() => setJobs((a) => [...a, emptyJob()])} className="text-[13px] font-medium text-forest underline">+ Add position</button>
        </div>
        <p className={sub}>Most recent first.</p>
        {jobs.map((row, i) => (
          <div key={i} className="grid gap-3 border border-line-soft p-3 md:grid-cols-2">
            <label className={labelCls}>Employer<input value={row.employer} onChange={(e) => setJobs((a) => a.map((r, j) => j === i ? { ...r, employer: e.target.value } : r))} className={field} /></label>
            <label className={labelCls}>Job title<input value={row.title} onChange={(e) => setJobs((a) => a.map((r, j) => j === i ? { ...r, title: e.target.value } : r))} className={field} /></label>
            <label className={labelCls}>Location<input value={row.location} onChange={(e) => setJobs((a) => a.map((r, j) => j === i ? { ...r, location: e.target.value } : r))} className={field} /></label>
            <div className="grid grid-cols-2 gap-3">
              <label className={labelCls}>From<input value={row.start} onChange={(e) => setJobs((a) => a.map((r, j) => j === i ? { ...r, start: e.target.value } : r))} placeholder="MM/YYYY" className={field} /></label>
              <label className={labelCls}>To<input value={row.end} onChange={(e) => setJobs((a) => a.map((r, j) => j === i ? { ...r, end: e.target.value } : r))} placeholder="MM/YYYY or present" className={field} /></label>
            </div>
            <label className={`${labelCls} md:col-span-2`}>Duties &amp; responsibilities<textarea rows={2} value={row.duties} onChange={(e) => setJobs((a) => a.map((r, j) => j === i ? { ...r, duties: e.target.value } : r))} className={area} /></label>
            <label className={labelCls}>Reason for leaving<input value={row.reason_leaving} onChange={(e) => setJobs((a) => a.map((r, j) => j === i ? { ...r, reason_leaving: e.target.value } : r))} className={field} /></label>
            <label className="flex items-center gap-2 self-end text-[13px] text-charcoal">
              <input type="checkbox" checked={row.may_contact} onChange={(e) => setJobs((a) => a.map((r, j) => j === i ? { ...r, may_contact: e.target.checked } : r))} />
              May we contact this employer?
            </label>
            {jobs.length > 1 && <button type="button" onClick={() => setJobs((a) => a.filter((_, j) => j !== i))} className="self-start text-[12px] text-red-700 underline md:col-span-2">Remove</button>}
          </div>
        ))}
      </section>

      {/* 6 · References */}
      <section className={sectionCls}>
        <div className="flex items-center justify-between">
          <p className={legend}>Professional references</p>
          <button type="button" onClick={() => setRefs((a) => [...a, emptyRef()])} className="text-[13px] font-medium text-forest underline">+ Add reference</button>
        </div>
        <p className={sub}>Optional at this stage — you&apos;re welcome to add them now, or we&apos;ll request them later if your application moves forward.</p>
        {refs.map((row, i) => (
          <div key={i} className="grid gap-3 border border-line-soft p-3 md:grid-cols-2">
            <label className={labelCls}>Name<input value={row.name} onChange={(e) => setRefs((a) => a.map((r, j) => j === i ? { ...r, name: e.target.value } : r))} className={field} /></label>
            <label className={labelCls}>Relationship<input value={row.relationship} onChange={(e) => setRefs((a) => a.map((r, j) => j === i ? { ...r, relationship: e.target.value } : r))} placeholder="e.g. former manager" className={field} /></label>
            <label className={labelCls}>Company<input value={row.company} onChange={(e) => setRefs((a) => a.map((r, j) => j === i ? { ...r, company: e.target.value } : r))} className={field} /></label>
            <label className={labelCls}>Phone<input value={row.phone} onChange={(e) => setRefs((a) => a.map((r, j) => j === i ? { ...r, phone: e.target.value } : r))} className={field} /></label>
            <label className={labelCls}>Email<input value={row.email} onChange={(e) => setRefs((a) => a.map((r, j) => j === i ? { ...r, email: e.target.value } : r))} className={field} /></label>
            {refs.length > 1 && <button type="button" onClick={() => setRefs((a) => a.filter((_, j) => j !== i))} className="self-end text-[12px] text-red-700 underline">Remove</button>}
          </div>
        ))}
      </section>

      {/* 7 · Skills, software & certifications */}
      <section className={sectionCls}>
        <p className={legend}>Skills, software &amp; certifications</p>
        <label className={labelCls}>Key skills / software<textarea name="skills" rows={2} placeholder="e.g. Google Workspace, Microsoft 365, Canva, Adobe, QuickBooks, HubSpot, WordPress, HTML/CSS/JS…" className={area} /></label>
        <label className={labelCls}>Certifications &amp; licenses<textarea name="certifications" rows={2} placeholder="e.g. Notary, PMP, industry certifications…" className={area} /></label>
        <div className="grid gap-4 md:grid-cols-2">
          <label className={labelCls}>Portfolio / LinkedIn / website{isCreative ? " *" : ""}<input name="portfolio_url" required={isCreative} placeholder="https://…" className={field} /></label>
          <label className={labelCls}>How did you hear about us?<input name="referral" className={field} /></label>
        </div>
        {isCreative && (
          <div className="flex flex-col gap-3 border border-line-soft p-3">
            <p className="text-[13px] font-medium text-forest">Work samples (required for this role)</p>
            <p className={sub}>Two sites you&apos;ve built (note the platform), one piece of video or motion work, and something you&apos;ve built that runs as an app.</p>
            <div className="grid gap-3 md:grid-cols-2">
              <label className={labelCls}>Site 1 (URL + platform) *<input name="cs_site1" required placeholder="https://… — e.g. WordPress" className={field} /></label>
              <label className={labelCls}>Site 2 (URL + platform) *<input name="cs_site2" required placeholder="https://… — e.g. Shopify" className={field} /></label>
              <label className={labelCls}>Video / motion work (URL) *<input name="cs_video" required placeholder="https://…" className={field} /></label>
              <label className={labelCls}>App / build you&apos;ve made (URL) *<input name="cs_appbuild" required placeholder="https://… (or note in your answer)" className={field} /></label>
            </div>
          </div>
        )}
        {isBM && (
          <div className="flex flex-col gap-3 border border-line-soft p-3">
            <p className="text-[13px] font-medium text-forest">Work samples (required for this role)</p>
            <p className={sub}>The posting asks for something you designed and something you built or coded — paste a URL for each (or note where we can find it).</p>
            <div className="grid gap-3 md:grid-cols-2">
              <label className={labelCls}>Design sample (URL) *<input name="bm_design" required placeholder="https://…" className={field} /></label>
              <label className={labelCls}>Built / coded sample (URL) *<input name="bm_built" required placeholder="https://…" className={field} /></label>
            </div>
          </div>
        )}
        <label className={labelCls}>{role ? "Your answer to the question in this posting *" : "Relevant experience"}<textarea name="experience" rows={5} required={!!role} placeholder={rolePrompt} className={area} /></label>
        <label className={labelCls}>Why Hill Country Consultants?<textarea name="why" rows={3} className={area} /></label>
      </section>

      {/* 8 · Equipment & security attestations */}
      <section className={sectionCls}>
        <p className={legend}>Equipment &amp; security</p>
        <p className={sub}>Because we handle client data, every role meets the same baseline. Check each item you can meet.</p>
        <label className="flex items-start gap-2 text-[14px] text-charcoal"><input type="checkbox" name="attest_equipment" className="mt-1" /> I can provide {needsMac ? "both a Windows laptop and a Mac laptop" : "a Windows computer"} with a dual-monitor setup, a wired Ethernet connection, and a smartphone and/or tablet.</label>
        <label className="flex items-start gap-2 text-[14px] text-charcoal"><input type="checkbox" name="attest_security" className="mt-1" /> I maintain a secured home network, two-factor authentication on work accounts, current antivirus, and an updated, encrypted operating system.</label>
        <label className="flex items-start gap-2 text-[14px] text-charcoal"><input type="checkbox" name="attest_us_based" className="mt-1" /> I am based in and legally authorized to work in the United States.</label>
        <label className="flex items-start gap-2 text-[14px] text-charcoal"><input type="checkbox" name="attest_background" className="mt-1" /> I consent to a background check as part of the hiring process.</label>
        <label className="flex items-start gap-2 text-[14px] text-charcoal"><input type="checkbox" name="attest_confidential" className="mt-1" /> I am willing to sign a confidentiality / NDA agreement.</label>
      </section>

      {/* 9 · Résumé + credentials */}
      <section className={sectionCls}>
        <p className={legend}>Attachments</p>
        <div className="grid gap-4 md:grid-cols-2">
          <label className={labelCls}>Résumé (PDF or Word — max 8MB){role ? " *" : " · optional"}<input name="resume" type="file" required={!!role} accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="text-[14px]" /></label>
          <label className={labelCls}>Credentials / portfolio file (optional — PDF or image, max 8MB)<input name="credentials" type="file" accept=".pdf,.doc,.docx,image/*,application/pdf" className="text-[14px]" /></label>
        </div>
      </section>

      {/* 10 · Voluntary EEO self-identification */}
      <section className={sectionCls}>
        <p className={legend}>Voluntary self-identification</p>
        <p className={sub}>Submitting this is entirely voluntary and confidential. It is <strong>not</strong> used to make any hiring decision and will not subject you to adverse treatment. Declining to answer will not affect your application.</p>
        <div className="grid gap-4 md:grid-cols-2">
          <label className={labelCls}>Gender
            <select name="eeo_gender" defaultValue="" className={field}><option value="">Prefer not to say</option>{EEO_GENDER.map((o) => <option key={o} value={o}>{o}</option>)}</select>
          </label>
          <label className={labelCls}>Race / ethnicity
            <select name="eeo_race" defaultValue="" className={field}><option value="">Prefer not to say</option>{EEO_RACE.map((o) => <option key={o} value={o}>{o}</option>)}</select>
          </label>
          <label className={labelCls}>Protected veteran status
            <select name="eeo_veteran" defaultValue="" className={field}><option value="">Prefer not to answer</option>{EEO_VETERAN.map((o) => <option key={o} value={o}>{o}</option>)}</select>
          </label>
          <label className={labelCls}>Disability status
            <select name="eeo_disability" defaultValue="" className={field}><option value="">Prefer not to answer</option>{EEO_DISABILITY.map((o) => <option key={o} value={o}>{o}</option>)}</select>
          </label>
        </div>
      </section>

      {/* 11 · Certification & signature */}
      <section className={sectionCls}>
        <p className={legend}>Certification &amp; signature</p>
        <p className="max-w-[52em] text-[13px] prose-soft">I certify that the information I have provided is true and complete to the best of my knowledge. I understand that any false statement, omission, or misrepresentation may result in denial or termination of employment. I authorize Hill Country Consultants to verify the information provided, including contacting my references and previous employers, and to conduct a background check. I understand that if I am hired as an employee, employment is on an at-will basis and may be ended by either party at any time; and that if I am engaged as an independent contractor, the engagement is governed by the terms of the contract rather than at-will employment.</p>
        <label className="flex items-start gap-2 text-[14px] text-charcoal"><input type="checkbox" name="certified" className="mt-1" /> I have read and agree to the certification above. *</label>
        <div className="grid gap-4 md:grid-cols-2">
          <label className={labelCls}>Type your full name to sign *<input name="signature" className={field} /></label>
          <label className={labelCls}>Date<input name="signed_date" type="date" className={field} defaultValue={new Date().toISOString().slice(0, 10)} /></label>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-4 border-t border-line-soft pt-6">
        <button type="submit" disabled={pending} className="btn-gold text-[15px] disabled:opacity-50">{pending ? "Submitting…" : "Submit application"}</button>
        {err && <span className="text-[13px] text-red-700">{err}</span>}
      </div>
      <p className="text-[12px] prose-muted">By submitting, you consent to Hill Country Consultants storing this information — including your résumé, portfolio, references, education, employment history, background-check consent, and any voluntary demographic answers — to evaluate your application. See our <a href="/privacy" className="underline">Privacy Policy</a> for how applicant information is handled.</p>
    </form>
  );
}
