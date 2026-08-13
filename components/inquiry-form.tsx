"use client";

import { useState, type ChangeEvent } from "react";

/**
 * Strategy-session / contact form. Mirrors the prototype's behaviour today
 * (client-side success state). Server delivery via Resend is wired in the email
 * phase — this component will then POST to /api/inquiry. Email + phone are shown
 * prominently so the page is useful immediately.
 */
export function InquiryForm() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "", business: "", email: "", phone: "", industry: "", timeline: "", message: "",
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
      onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }}
    >
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
      </div>
      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] font-medium text-ink-faint">What do you need?</span>
        <textarea rows={4} className={field} value={form.message} onChange={set("message")} />
      </label>
      <button type="submit" className="btn-gold self-start">Request the free session</button>
      <p className="text-[13px] prose-muted">The 30-minute strategy session is free and creates no obligation.</p>
    </form>
  );
}
