"use client";
import { useState, type FormEvent } from "react";

/** Plan CTA: capture a prospect's interest, tag it to the plan, and email them
 *  the free strategy-session booking link (also shown here on success). */
export function PlanInterest({ plan }: { plan: string }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [bookingUrl, setBookingUrl] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(""); setBusy(true);
    try {
      const res = await fetch("/api/plan-interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, plan }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) setBookingUrl(data.bookingUrl || "");
      else setError(data.error === "invalid_email" ? "Enter a valid email." : "Couldn't send it — try again.");
    } catch { setError("Couldn't send it — try again."); }
    finally { setBusy(false); }
  }

  if (bookingUrl !== null) {
    return (
      <div className="self-start">
        <p className="text-[14px] text-forest">Check your email for your booking link — or book right now:</p>
        {bookingUrl && (
          <a href={bookingUrl} target="_blank" rel="noopener noreferrer" className="btn-gold mt-2 inline-block px-5 text-[14px]">
            Book your free session
          </a>
        )}
      </div>
    );
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn-gold self-start px-5 text-[14px]">
        I&apos;m interested
      </button>
    );
  }

  const field = "min-h-touch w-full border border-line-warm bg-white px-3 text-[14px] outline-none focus:border-forest";
  return (
    <form onSubmit={submit} className="flex flex-col gap-2 self-stretch">
      <input required type="email" placeholder="Your email" value={email} onChange={(e) => setEmail(e.target.value)} className={field} />
      <input placeholder="Your name (optional)" value={name} onChange={(e) => setName(e.target.value)} className={field} />
      {error && <p className="text-[13px] text-red-700">{error}</p>}
      <button disabled={busy} className="btn-gold self-start px-5 text-[14px] disabled:opacity-50">
        {busy ? "Sending…" : "Send me the booking link"}
      </button>
    </form>
  );
}
