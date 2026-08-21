"use client";
import { useRef, useState, useTransition } from "react";
import { submitFeedback, submitReferral } from "@/app/portal/actions";

/** Satisfaction check-in: 1–5 stars + optional comment. */
export function FeedbackCard() {
  const [pending, start] = useTransition();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [done, setDone] = useState(false);
  const [msg, setMsg] = useState("");

  if (done) return (
    <div className="border border-line-warm bg-white p-5">
      <p className="text-[15px] font-medium text-forest">Thank you — we&rsquo;ve got your feedback.</p>
      <p className="mt-1 text-[13px] prose-muted">It goes straight to your team.</p>
    </div>
  );

  return (
    <div className="border border-line-warm bg-white p-5">
      <p className="mb-1 font-fraunces text-[18px] text-forest">How are we doing?</p>
      <p className="mb-3 text-[13px] prose-muted">A quick rating helps us serve you better.</p>
      <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating 1 to 5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" aria-label={`${n} star`} onClick={() => setRating(n)}
            className={`text-[26px] leading-none ${n <= rating ? "text-gold" : "text-line-warm"}`}>★</button>
        ))}
      </div>
      <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={2} placeholder="Anything you'd like us to know (optional)"
        className="mt-3 w-full border border-line-warm bg-white p-2 text-[14px]" />
      <div className="mt-2 flex items-center gap-3">
        <button type="button" disabled={pending || rating < 1}
          onClick={() => { const fd = new FormData(); fd.set("rating", String(rating)); fd.set("comment", comment); start(async () => { setMsg(""); const r = await submitFeedback(fd); if (r?.error) setMsg(r.error); else setDone(true); }); }}
          className="btn-gold text-[14px] disabled:opacity-50">{pending ? "Sending…" : "Send feedback"}</button>
        {msg && <span className="text-[13px] text-red-700">{msg}</span>}
      </div>
    </div>
  );
}

/** Refer another business — creates a lead for the sales team. */
export function ReferralCard() {
  const [pending, start] = useTransition();
  const [done, setDone] = useState(false);
  const [msg, setMsg] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  if (done) return (
    <div className="border border-line-warm bg-white p-5">
      <p className="text-[15px] font-medium text-forest">Thank you for the referral!</p>
      <p className="mt-1 text-[13px] prose-muted">We&rsquo;ll reach out to them. We appreciate you spreading the word.</p>
    </div>
  );

  return (
    <form ref={formRef} className="border border-line-warm bg-white p-5"
      onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); start(async () => { setMsg(""); const r = await submitReferral(fd); if (r?.error) setMsg(r.error); else setDone(true); }); }}>
      <p className="mb-1 font-fraunces text-[18px] text-forest">Know someone who could use us?</p>
      <p className="mb-3 text-[13px] prose-muted">Refer a business and we&rsquo;ll take great care of them.</p>
      <div className="flex flex-col gap-2">
        <input name="business" placeholder="Business name" className="min-h-touch border border-line-warm bg-white px-3 text-[14px]" />
        <input name="contact" placeholder="Contact name" className="min-h-touch border border-line-warm bg-white px-3 text-[14px]" />
        <input name="email" type="email" placeholder="Email" className="min-h-touch border border-line-warm bg-white px-3 text-[14px]" />
        <input name="phone" placeholder="Phone (optional)" className="min-h-touch border border-line-warm bg-white px-3 text-[14px]" />
      </div>
      <div className="mt-3 flex items-center gap-3">
        <button type="submit" disabled={pending} className="btn-gold text-[14px] disabled:opacity-50">{pending ? "Sending…" : "Send referral"}</button>
        {msg && <span className="text-[13px] text-red-700">{msg}</span>}
      </div>
    </form>
  );
}
