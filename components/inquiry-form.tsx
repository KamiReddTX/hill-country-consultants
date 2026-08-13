"use client";

import { useState, type ChangeEvent } from "react";

/**
 * Strategy-session / contact form. Posts to /api/inquiry and only confirms once
 * the server reports the lead was actually saved (res.ok && persisted). On any
 * failure it shows an inline error with our email + phone instead of a false
 * confirmation. A hidden honeypot field lets the server silently drop bots.
 * Email + phone are shown prominently so the page is useful immediately.
 */
export function InquiryForm() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(false);
  const [form, setForm] = useState({
    name: "", business: "", email: "", phone: "", industry: "", timeline: "", howHeard: "", referral: "", message: "",
    company_website: "", // honeypot — must stay empty for a real submission
  });
  const set = (k: keyof typeof form) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  if (submitted) {
    return (
      <div className="border border-line-warm bg-white p-8">
        <p className="kicker mb-2">Received</p>
        <h3 className="font-fraunces text-[24px] font-medium text-forest">Thanks — we&apos;ll be in touch.</h3>
        <p className="mt-3 text-[16px] prose-soft">
          We answer within one business day. If it&apos;s urgent, reach us directly at{" "}
          <a className="link-underline" href="mailto:info@hillcountryconsultants.com">info@hillcountryconsultants.com</a> or 470-478-1590.
        </p>
      </div>
    );
  }

  const field = "min-h-touch w-full border border-line-warm bg-white px-4 py-3 text-[16px] text-charcoal outline-none focus:border-forest";
  return (
    <form
      className="flex flex-col gap-4 border border-line-warm bg-white p-6 sm:p-8"
      onSubmit={async (e) => {
        e.preventDefault();
        setError(false);
        setSubmitting(true);
        try {
          const res = await fetch("/api/inquiry", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
          });
          const data = await res.json().catch(() => ({}));
          if (res.ok && data.persisted === true) {
            setSubmitted(true);
            return;
          }
          setError(true);
        } catch {
          setError(true);
        } finally {
          setSubmitting(false);
        }
      }}
    >
      {/* Honeypot: hidden from people; a bot that fills it is dropped server-side. */}
      <div className="sr-only" aria-hidden="true">
        <label htmlFor="company_website">Company website</label>
        <input
          id="company_website"
          name="company_website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={form.company_website}
          onChange={set("company_website")}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium text-ink-faint">Name</span>
          <input required className={field} value={form.name} onChange={set("name")} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium text-ink-faint">Business</span>
          <input required className={field} value={form.business} onChange={set("business")} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium text-ink-faint">Email</span>
          <input required type="email" className={field} value={form.email} onChange={set("email")} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium text-ink-faint">Phone</span>
          <input required type="tel" className={field} value={form.phone} onChange={set("phone")} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium text-ink-faint">Industry</span>
          <input className={field} value={form.industry} onChange={set("industry")} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium text-ink-faint">Timeline</span>
          <input className={field} placeholder="e.g. this month" value={form.timeline} onChange={set("timeline")} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium text-ink-faint">How did you hear about us?</span>
          <input className={field} value={form.howHeard} onChange={set("howHeard")} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium text-ink-faint">Referral or employee code</span>
          <input className={field} value={form.referral} onChange={set("referral")} />
          <span className="text-[12px] prose-muted">If a member of our team referred you, enter their code so they are credited.</span>
        </label>
      </div>
      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] font-medium text-ink-faint">What&apos;s eating the most of your time right now?</span>
        <textarea rows={4} className={field} value={form.message} onChange={set("message")} />
      </label>
      {error && (
        <p role="alert" className="text-[14px] text-red-700">
          We couldn&apos;t submit your request. Please email{" "}
          <a className="link-underline" href="mailto:info@hillcountryconsultants.com">info@hillcountryconsultants.com</a>{" "}
          or call 470-478-1590 and we&apos;ll take it from there.
        </p>
      )}
      <button type="submit" disabled={submitting} className="btn-gold self-start">
        {submitting ? "Sending…" : "Request the free session"}
      </button>
      <p className="text-[13px] prose-muted">The 30-minute strategy session is free and creates no obligation.</p>
    </form>
  );
}
