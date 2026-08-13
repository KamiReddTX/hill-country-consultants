"use client";

import { useMemo, useState, type ChangeEvent } from "react";
import Link from "next/link";
import {
  BOOK_ITEMS, QUOTE_ITEMS, bookItemById, quoteItemById, usd,
} from "@/content/pricing";
import { classBySlug } from "@/content/classes";
import { INDUSTRIES } from "@/content/industries";

type Step = "select" | "pay" | "done";
type Cart = Record<string, number>;
type Quotes = Record<string, boolean>;

const seedCart = (add: string): Cart => {
  const c: Cart = {};
  add.split(",").map((s) => s.trim()).filter(Boolean).forEach((id) => {
    if (bookItemById(id)) c[id] = (c[id] || 0) + 1;
  });
  return c;
};
const seedQuotes = (q: string): Quotes => {
  const out: Quotes = {};
  q.split(",").map((s) => s.trim()).filter(Boolean).forEach((id) => {
    if (quoteItemById(id)) out[id] = true;
  });
  return out;
};

// ── Business-hours calendar (Central). Wed & Sun closed; Sat by appointment. ──
const SLOTS_STD = ["9:00 AM", "10:00 AM", "11:00 AM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM"];
const SLOTS_LATE = ["11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM", "6:00 PM"];
const SLOTS_SAT = ["10:00 AM", "11:00 AM", "12:00 PM"];
const slotsForDow = (dow: number) => (dow === 6 ? SLOTS_SAT : dow === 2 || dow === 4 ? SLOTS_LATE : SLOTS_STD);
const slotNoteForDow = (dow: number) =>
  dow === 6
    ? "Saturday is by preapproved appointment — we confirm before it is booked."
    : dow === 2 || dow === 4
    ? "Tuesday and Thursday we open and close two hours later."
    : "All times Central.";

const GROUPS = Array.from(new Set(BOOK_ITEMS.map((b) => b.group)));

export function BookingFlow({
  initialAdd, initialQuotes, initialClass,
}: {
  initialAdd: string; initialQuotes: string; initialClass: string;
}) {
  const [cart, setCart] = useState<Cart>(() => seedCart(initialAdd));
  const [quotes, setQuotes] = useState<Quotes>(() => seedQuotes(initialQuotes));
  const [payMode, setPayMode] = useState<"full" | "deposit">("full");
  const [step, setStep] = useState<Step>("select");
  const [form, setForm] = useState({ name: "", business: "", email: "", phone: "", startDate: "", notes: "" });
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [doneRef, setDoneRef] = useState("");

  const selectedClass = initialClass ? classBySlug(initialClass) : undefined;

  // calendar state
  const [calOffset, setCalOffset] = useState(0);
  const [pickedDate, setPickedDate] = useState("");
  const [pickedDow, setPickedDow] = useState<number | null>(null);
  const [slot, setSlot] = useState("");

  const chosen = useMemo(
    () => BOOK_ITEMS.filter((it) => cart[it.id]).map((it) => ({ ...it, qty: cart[it.id] })),
    [cart],
  );
  const chosenQuotes = useMemo(() => QUOTE_ITEMS.filter((q) => quotes[q.id]), [quotes]);
  const fixedTotal = useMemo(() => chosen.reduce((s, it) => s + it.qty * it.price, 0), [chosen]);
  const dueNow = payMode === "deposit" ? Math.round(fixedTotal / 2) : fixedTotal;
  const canPay = fixedTotal > 0;
  const hasSelection = chosen.length > 0 || chosenQuotes.length > 0;
  const needsDate = !!selectedClass;

  const setField = (k: keyof typeof form) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));
  const step2 = (id: string, delta: number) =>
    setCart((c) => {
      const next = (c[id] || 0) + delta;
      const nc = { ...c };
      if (next <= 0) delete nc[id]; else nc[id] = next;
      return nc;
    });
  const toggleQuote = (id: string) =>
    setQuotes((q) => { const n = { ...q }; if (n[id]) delete n[id]; else n[id] = true; return n; });

  // Industry starting point: preload that industry's services and jump to the summary.
  const applyIndustry = (cartIds: string[], quoteIds: string[]) => {
    setCart((c) => {
      const nc = { ...c };
      cartIds.forEach((id) => { if (bookItemById(id)) nc[id] = (nc[id] || 0) + 1; });
      return nc;
    });
    setQuotes((q) => {
      const nq = { ...q };
      quoteIds.forEach((id) => { if (quoteItemById(id)) nq[id] = true; });
      return nq;
    });
    if (typeof document !== "undefined") {
      document.getElementById("selection-summary")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const calendar = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const first = new Date(today.getFullYear(), today.getMonth() + calOffset, 1);
    const start = new Date(first);
    start.setDate(first.getDate() - ((first.getDay() + 6) % 7));
    const days: { key: string; label: string; iso: string; open: boolean; appt: boolean; picked: boolean; dow: number }[] = [];
    for (let w = 0; w < 6; w++) {
      for (let d = 0; d < 6; d++) {
        const cur = new Date(start);
        cur.setDate(start.getDate() + w * 7 + d);
        const dow = cur.getDay();
        const inMonth = cur.getMonth() === first.getMonth();
        const iso = cur.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
        const closed = dow === 3 || dow === 0;
        const disabled = !inMonth || cur < today || closed;
        days.push({ key: `${w}-${d}`, label: inMonth ? String(cur.getDate()) : "", iso, open: !disabled, appt: dow === 6 && !disabled, picked: pickedDate === iso, dow });
      }
    }
    return { label: first.toLocaleDateString("en-US", { month: "long", year: "numeric" }), days };
  }, [calOffset, pickedDate]);

  async function submit() {
    setError("");
    if (!form.name || !form.business || !form.email || !form.phone || !form.startDate) {
      setError("Please complete contact name, business, email, phone and requested start date."); return;
    }
    if (!consent) { setError("Please accept the Terms of Service and Refund & Cancellation Policy to continue."); return; }
    if (needsDate && (!pickedDate || !slot)) { setError("Please choose a class date and time."); return; }

    const payload = {
      items: chosen.map((c) => ({ id: c.id, name: c.name, qty: c.qty, svc: c.svc, price: c.price })),
      quotes: chosenQuotes.map((q) => ({ id: q.id, name: q.name, from: q.from })),
      payMode, dueNowCents: dueNow * 100,
      contact: form, startDate: form.startDate,
      className: selectedClass ? `${selectedClass.no} — ${selectedClass.name}` : "",
      classDate: pickedDate, classSlot: slot,
      consentAt: new Date().toISOString(),
    };

    if (!canPay) {
      // Quote-only request — no charge. (Server email lands with the email phase.)
      setDoneRef("HCC-" + Math.floor(100000 + Math.random() * 899999));
      setStep("done");
      return;
    }

    try {
      setBusy(true);
      const res = await fetch("/api/checkout", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.url) { window.location.href = data.url; return; }
      setError(data.error || "Payment isn't configured yet. Add your Stripe keys to enable checkout.");
    } catch {
      setError("Something went wrong reaching the payment service. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  // ── Confirmation ──────────────────────────────────────────────
  if (step === "done") {
    return (
      <section className="section-cream min-h-[70vh]">
        <div className="shell max-w-[46em] py-20">
          <p className="kicker mb-3">Request received</p>
          <h1 className="font-fraunces text-[clamp(28px,4vw,42px)] font-normal text-forest">
            Thank you — your quote request is in.
          </h1>
          <span className="rule-gold mb-6 mt-3" />
          <p className="text-[17px] prose-soft">
            Reference <strong className="text-charcoal">{doneRef}</strong>. Scoped work is quoted in
            writing before it begins — we&apos;ll email your written quote within one business day. No
            payment has been taken. Questions? info@hillcountryconsultants.com · 470-478-1590.
          </p>
          <Link href="/services" className="link-underline mt-8 inline-block">← Back to services</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="section-cream min-h-[70vh]">
      <div className="shell grid gap-10 py-14 lg:grid-cols-[1.5fr_1fr]">
        {/* ── Left: select / pay ── */}
        <div>
          <p className="kicker mb-3">Book &amp; pay</p>
          <h1 className="font-fraunces text-[clamp(28px,4vw,42px)] font-normal text-forest">
            {step === "pay" ? "Checkout" : "Build your booking"}
          </h1>
          <span className="rule-gold mb-8 mt-3" />

          {step === "select" && (
            <>
              {selectedClass && (
                <div className="mb-8 border border-line-warm bg-white p-6">
                  <p className="kicker mb-2">Class selected</p>
                  <p className="text-[17px] font-medium text-charcoal">{selectedClass.no} — {selectedClass.name}</p>
                  <p className="mt-3 text-[14px] prose-muted">{slotNoteForDow(pickedDow ?? 1)}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <button className="btn-outline px-3 text-[13px]" onClick={() => setCalOffset((o) => Math.max(0, o - 1))}>← Prev</button>
                    <span className="font-fraunces text-[18px] text-forest">{calendar.label}</span>
                    <button className="btn-outline px-3 text-[13px]" onClick={() => setCalOffset((o) => o + 1)}>Next →</button>
                  </div>
                  <div className="mt-3 grid grid-cols-6 gap-1 text-center">
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                      <span key={d} className="py-1 text-[11px] uppercase tracking-wide text-ink-faint">{d}</span>
                    ))}
                    {calendar.days.map((d) => (
                      <button
                        key={d.key}
                        disabled={!d.open}
                        onClick={() => { setPickedDate(d.iso); setPickedDow(d.dow); setSlot(""); }}
                        className={`min-h-touch border text-[13px] ${
                          d.picked ? "border-forest bg-forest text-white"
                          : d.open ? "border-line-warm bg-cream text-charcoal hover:border-gold"
                          : "cursor-not-allowed border-transparent text-ink-faint/40"
                        }`}
                      >
                        {d.label}{d.appt ? "·" : ""}
                      </button>
                    ))}
                  </div>
                  {pickedDate && pickedDow !== null && (
                    <div className="mt-4">
                      <p className="text-[13px] text-ink-faint">{slotNoteForDow(pickedDow)}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {slotsForDow(pickedDow).map((t) => (
                          <button key={t} onClick={() => setSlot(t)}
                            className={`min-h-touch border px-3 text-[13px] ${slot === t ? "border-forest bg-forest text-white" : "border-line-warm bg-white hover:border-gold"}`}>
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="mb-8">
                <p className="kicker mb-3">Start from your industry</p>
                <div className="flex flex-wrap gap-2">
                  {INDUSTRIES.map((ind) => (
                    <button
                      key={ind.slug}
                      type="button"
                      onClick={() => applyIndustry(ind.cart, ind.quotes)}
                      className="min-h-touch border border-line-warm bg-white px-4 text-[13.5px] text-charcoal hover:border-gold"
                    >
                      {ind.name}
                    </button>
                  ))}
                </div>
              </div>

              <h2 className="mb-4 font-fraunces text-[20px] font-medium text-forest">Fixed-rate services</h2>
              {GROUPS.map((group) => (
                <div key={group} className="mb-6">
                  <p className="kicker mb-2">{group}</p>
                  <ul className="divide-y divide-line-soft border-y border-line-soft">
                    {BOOK_ITEMS.filter((b) => b.group === group).map((it) => (
                      <li key={it.id} className="flex items-center justify-between gap-3 py-3">
                        <div className="min-w-0">
                          <p className="text-[15.5px] text-charcoal">{it.name}</p>
                          <p className="text-[13px] prose-muted">{usd(it.price)} · {it.unit}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button aria-label="Remove one" className="h-9 w-9 border border-line-warm bg-white text-[18px] leading-none" onClick={() => step2(it.id, -1)}>−</button>
                          <span className="w-6 text-center tabular-nums">{cart[it.id] || 0}</span>
                          <button aria-label="Add one" className="h-9 w-9 border border-line-warm bg-white text-[18px] leading-none" onClick={() => step2(it.id, 1)}>+</button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              <h2 className="mb-2 mt-8 font-fraunces text-[20px] font-medium text-forest">Scoped work — request a written quote</h2>
              <p className="mb-4 text-[14px] prose-muted">Quote requests are free and create no obligation. We price them in writing before anything begins.</p>
              <div className="flex flex-wrap gap-2">
                {QUOTE_ITEMS.map((q) => (
                  <button key={q.id} onClick={() => toggleQuote(q.id)}
                    className={`min-h-touch border px-3 py-2 text-left text-[13.5px] ${quotes[q.id] ? "border-forest bg-forest text-white" : "border-line-warm bg-white hover:border-gold"}`}>
                    {q.name} <span className={quotes[q.id] ? "text-gold-onForest" : "text-ink-faint"}>· {q.from}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {step === "pay" && (
            <div className="flex flex-col gap-5">
              {canPay && (
                <div>
                  <p className="kicker mb-2">How would you like to pay?</p>
                  <div className="flex gap-3">
                    <button onClick={() => setPayMode("full")} className={`min-h-touch flex-1 border px-4 ${payMode === "full" ? "border-forest bg-forest text-white" : "border-line-warm bg-white"}`}>Pay in full · {usd(fixedTotal)}</button>
                    <button onClick={() => setPayMode("deposit")} className={`min-h-touch flex-1 border px-4 ${payMode === "deposit" ? "border-forest bg-forest text-white" : "border-line-warm bg-white"}`}>50% deposit · {usd(Math.round(fixedTotal / 2))}</button>
                  </div>
                </div>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                {(["name", "business", "email", "phone"] as const).map((k) => (
                  <label key={k} className="flex flex-col gap-1.5">
                    <span className="text-[13px] font-medium text-ink-faint">
                      {k === "name" ? "Contact name" : k[0].toUpperCase() + k.slice(1)}
                    </span>
                    <input required type={k === "email" ? "email" : k === "phone" ? "tel" : "text"}
                      className="min-h-touch w-full border border-line-warm bg-white px-4 py-3 text-[16px] outline-none focus:border-forest"
                      value={form[k]} onChange={setField(k)} />
                  </label>
                ))}
                <label className="flex flex-col gap-1.5">
                  <span className="text-[13px] font-medium text-ink-faint">Requested start date</span>
                  <input required type="date" className="min-h-touch w-full border border-line-warm bg-white px-4 py-3 text-[16px] outline-none focus:border-forest" value={form.startDate} onChange={setField("startDate")} />
                </label>
              </div>
              <label className="flex flex-col gap-1.5">
                <span className="text-[13px] font-medium text-ink-faint">Project notes (optional)</span>
                <textarea rows={3} className="w-full border border-line-warm bg-white px-4 py-3 text-[16px] outline-none focus:border-forest" value={form.notes} onChange={setField("notes")} />
              </label>
              <label className="flex items-start gap-3 border border-line-warm bg-white p-4">
                <input type="checkbox" className="mt-1 h-5 w-5 shrink-0" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
                <span className="text-[14.5px] prose-soft">
                  I have read and accept the{" "}
                  <Link href="/terms" className="link-underline" target="_blank">Terms of Service</Link> and the{" "}
                  <Link href="/refund-policy" className="link-underline" target="_blank">Refund &amp; Cancellation Policy</Link>.
                  I understand all sales are final.
                </span>
              </label>
              {error && <p className="text-[14px] text-red-700">{error}</p>}
              <div className="flex flex-wrap gap-3">
                <button disabled={busy} onClick={submit} className="btn-gold">
                  {busy ? "Starting checkout…" : canPay ? `Pay ${usd(dueNow)}` : "Submit quote request"}
                </button>
                <button onClick={() => { setStep("select"); setError(""); }} className="btn-outline">← Back</button>
              </div>
              {canPay && <p className="text-[13px] prose-muted">Card payment is handled securely by Stripe. Your receipt and portal access arrive by email.</p>}
            </div>
          )}
        </div>

        {/* ── Right: sticky summary ── */}
        <aside id="selection-summary" className="h-max scroll-mt-24 lg:sticky lg:top-24">
          <div className="border border-line-warm bg-white p-6">
            <p className="kicker mb-3">Your selection</p>
            {!hasSelection && <p className="text-[15px] prose-muted">Nothing added yet. Add a fixed-rate service or pick a quote request to begin.</p>}
            {chosen.length > 0 && (
              <ul className="mb-3 flex flex-col gap-2">
                {chosen.map((c) => (
                  <li key={c.id} className="flex justify-between gap-3 text-[14.5px]">
                    <span className="min-w-0 text-charcoal">{c.name}{c.qty > 1 ? ` × ${c.qty}` : ""}</span>
                    <span className="tabular-nums prose-muted">{usd(c.qty * c.price)}</span>
                  </li>
                ))}
              </ul>
            )}
            {chosenQuotes.length > 0 && (
              <div className="mb-3 border-t border-line-soft pt-3">
                <p className="mb-1 text-[12px] uppercase tracking-wide text-ink-faint">Quote requests</p>
                <ul className="flex flex-col gap-1">
                  {chosenQuotes.map((q) => (
                    <li key={q.id} className="flex justify-between gap-3 text-[13.5px]">
                      <span className="min-w-0 prose-soft">{q.name}</span>
                      <span className="prose-muted">{q.from}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {canPay && (
              <div className="border-t border-line-soft pt-3">
                <div className="flex justify-between text-[15px]"><span className="prose-muted">Payable today</span><span className="font-fraunces text-[22px] text-charcoal tabular-nums">{usd(dueNow)}</span></div>
                {payMode === "deposit" && <p className="mt-1 text-[13px] prose-muted">50% deposit — balance due on delivery.</p>}
              </div>
            )}
            {step === "select" && hasSelection && (
              <button onClick={() => { setStep("pay"); setError(""); }} className="btn-gold mt-5 w-full">
                {canPay ? "Continue to payment" : "Continue to quote request"}
              </button>
            )}
            <p className="mt-4 text-[12.5px] prose-muted">All sales are final. Scoped work is quoted in writing before it begins.</p>
          </div>
        </aside>
      </div>
    </section>
  );
}
