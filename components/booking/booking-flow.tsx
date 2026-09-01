"use client";

import { useMemo, useState, type ChangeEvent } from "react";
import { track } from "@vercel/analytics";
import Link from "next/link";
import {
  BOOK_ITEMS, QUOTE_ITEMS, bookItemById, quoteItemById, usd,
} from "@/content/pricing";
import { publicServiceSlug } from "@/content/services";
import { classBySlug } from "@/content/classes";
import { INDUSTRIES } from "@/content/industries";
import { InquiryForm } from "@/components/inquiry-form";

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

// ── Business-hours calendar (Eastern). Wed & Sun closed; Sat by appointment. ──
const SLOTS_STD = ["9:00 AM", "10:00 AM", "11:00 AM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM"];
const SLOTS_LATE = ["11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM", "6:00 PM"];
const SLOTS_SAT = ["10:00 AM", "11:00 AM", "12:00 PM"];
const slotsForDow = (dow: number) => (dow === 6 ? SLOTS_SAT : dow === 2 || dow === 4 ? SLOTS_LATE : SLOTS_STD);
const slotNoteForDow = (dow: number) =>
  dow === 6
    ? "Saturday is by preapproved appointment — we confirm before it is booked."
    : dow === 2 || dow === 4
    ? "Tuesday and Thursday we open and close two hours later."
    : "All times Eastern.";

const GROUPS = Array.from(new Set(BOOK_ITEMS.map((b) => b.group)));

// Format integer cents as USD. Cents are shown only when the amount isn't a whole
// dollar, so whole-dollar totals read exactly as before ($650, not $650.00) while a
// an odd-cent total (e.g. attendee math) reads correctly ($62.50 — matching the Stripe charge).
const usdCents = (cents: number) =>
  "$" +
  (cents / 100).toLocaleString("en-US", {
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });

export function BookingFlow({
  initialAdd, initialQuotes, initialClass, initialIndustry,
}: {
  initialAdd: string; initialQuotes: string; initialClass: string; initialIndustry?: string;
}) {
  const [cart, setCart] = useState<Cart>(() => seedCart(initialAdd));
  const [quotes, setQuotes] = useState<Quotes>(() => seedQuotes(initialQuotes));
  const [mode, setMode] = useState<"pay" | "call">("pay");
  const [step, setStep] = useState<Step>("select");
  const [catFilter, setCatFilter] = useState<string | null>(null);
  // An `industry` param pre-selects the industry *filter* — it highlights the
  // recommended services but never adds anything to the cart (nothing is added
  // until the customer sets a quantity).
  const [industryFilter, setIndustryFilter] = useState<{ cart: string[]; quotes: string[]; name: string } | null>(() => {
    const ind = initialIndustry ? INDUSTRIES.find((i) => i.slug === initialIndustry) : undefined;
    return ind ? { cart: ind.cart, quotes: ind.quotes, name: ind.name } : null;
  });
  const [quoteConsent, setQuoteConsent] = useState(false);
  const [attendees, setAttendees] = useState(20);
  // Training logistics captured before payment (class bookings only).
  const [trainingFormat, setTrainingFormat] = useState<"" | "virtual" | "onsite">("");
  const [onsite, setOnsite] = useState({ city: "", state: "", venue: "" });
  const [form, setForm] = useState({ name: "", business: "", email: "", phone: "", startDate: "", notes: "", repCode: "" });
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [doneRef, setDoneRef] = useState("");

  const selectedClass = initialClass ? classBySlug(initialClass) : undefined;

  // calendar state — for a class, open on the month that contains the first
  // eligible date (today + 30 days) rather than a month with no bookable dates.
  const [calOffset, setCalOffset] = useState(() => {
    if (!initialClass) return 0;
    const t = new Date();
    const min = new Date(t); min.setDate(t.getDate() + 30);
    return (min.getFullYear() - t.getFullYear()) * 12 + (min.getMonth() - t.getMonth());
  });
  const [pickedDate, setPickedDate] = useState("");
  const [pickedIso, setPickedIso] = useState(""); // machine YYYY-MM-DD for the same pick — bookings.start_date is a date column
  const [pickedDow, setPickedDow] = useState<number | null>(null);
  const [slot, setSlot] = useState("");

  const chosen = useMemo(
    () => BOOK_ITEMS.filter((it) => cart[it.id]).map((it) => ({ ...it, qty: cart[it.id] })),
    [cart],
  );
  const chosenQuotes = useMemo(() => QUOTE_ITEMS.filter((q) => quotes[q.id]), [quotes]);
  const fixedTotal = useMemo(() => chosen.reduce((s, it) => s + it.qty * it.price, 0), [chosen]);
  // Classes cover up to 20 attendees; each additional attendee is $250.
  const extraAttendees = selectedClass ? Math.max(0, attendees - 20) : 0;
  const extraCents = extraAttendees * 25000;
  const dueNowCents = fixedTotal * 100 + extraCents;
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

  // Set the exact quantity from the editable number field.
  const setQty = (id: string, val: number) =>
    setCart((c) => { const nc = { ...c }; const n = Math.max(0, Math.floor(val || 0)); if (n <= 0) delete nc[id]; else nc[id] = n; return nc; });
  const clearAll = () => { setCart({}); setQuotes({}); };

  // Industry / category shortcuts FILTER the visible services — they never add to the cart.
  const showIndustry = (ind: { cart: string[]; quotes: string[]; name: string }) => {
    setIndustryFilter({ cart: ind.cart, quotes: ind.quotes, name: ind.name });
    setCatFilter(null);
    if (typeof document !== "undefined") document.getElementById("service-list")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Which fixed-rate + quote items to show, given the active filter.
  const visibleGroups = industryFilter ? [] : (catFilter ? [catFilter] : GROUPS);
  const industryFixed = industryFilter ? BOOK_ITEMS.filter((b) => industryFilter.cart.includes(b.id)) : [];
  const visibleQuotes = industryFilter ? QUOTE_ITEMS.filter((q) => industryFilter.quotes.includes(q.id)) : QUOTE_ITEMS;

  const row = (it: (typeof BOOK_ITEMS)[number]) => (
    <li key={it.id} className="flex items-center justify-between gap-3 py-3">
      <div className="min-w-0">
        <p className="text-[15.5px] text-charcoal">{it.name}</p>
        <p className="text-[13px] prose-muted">{usd(it.price)} · {it.unit}</p>
        <Link href={`/services/${publicServiceSlug(it.svc)}`} className="text-[12px] link-underline" target="_blank">See service details →</Link>
      </div>
      <div className="flex items-center gap-2">
        <button aria-label="Remove one" className="h-9 w-9 border border-line-warm bg-white text-[18px] leading-none" onClick={() => step2(it.id, -1)}>−</button>
        <input aria-label="Quantity" type="number" min={0} value={cart[it.id] || 0} onChange={(e) => setQty(it.id, Number(e.target.value))}
          className="h-9 w-14 border border-line-warm bg-white text-center text-[15px] tabular-nums outline-none focus:border-forest" />
        <button aria-label="Add one" className="h-9 w-9 border border-line-warm bg-white text-[18px] leading-none" onClick={() => step2(it.id, 1)}>+</button>
      </div>
    </li>
  );

  const calendar = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    // Classes book no sooner than 30 days out and no later than 90 days out.
    const isClass = !!selectedClass;
    const minD = new Date(today); minD.setDate(today.getDate() + 30);
    const maxD = new Date(today); maxD.setDate(today.getDate() + 90);
    const first = new Date(today.getFullYear(), today.getMonth() + calOffset, 1);
    const start = new Date(first);
    start.setDate(first.getDate() - ((first.getDay() + 6) % 7));
    const days: { key: string; label: string; iso: string; date: string; open: boolean; appt: boolean; picked: boolean; dow: number }[] = [];
    for (let w = 0; w < 6; w++) {
      for (let d = 0; d < 6; d++) {
        const cur = new Date(start);
        cur.setDate(start.getDate() + w * 7 + d);
        const dow = cur.getDay();
        const inMonth = cur.getMonth() === first.getMonth();
        const iso = cur.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
        const date = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}-${String(cur.getDate()).padStart(2, "0")}`;
        // Training runs weekdays including Wednesday; only Sunday is closed, and
        // Saturday is available by preapproved appointment (flagged, not blocked).
        const closed = dow === 0;
        const disabled = !inMonth || cur < today || closed || (isClass && (cur < minD || cur > maxD));
        days.push({ key: `${w}-${d}`, label: inMonth ? String(cur.getDate()) : "", iso, date, open: !disabled, appt: dow === 6 && !disabled, picked: pickedDate === iso, dow });
      }
    }
    return { label: first.toLocaleDateString("en-US", { month: "long", year: "numeric" }), days };
  }, [calOffset, pickedDate, selectedClass]);

  async function submit() {
    setError("");
    // For a class the start date is the picked class date (ISO, since start_date is
    // a date column) — no separate field is shown.
    const startDate = needsDate ? pickedIso : form.startDate;
    if (!form.name || !form.business || !form.email || !form.phone) {
      setError("Please complete contact name, business, email and phone."); return;
    }
    if (!needsDate && !form.startDate) { setError("Please choose a requested start date."); return; }
    if (needsDate && (!pickedDate || !slot)) { setError("Please choose a class date and time."); return; }
    if (needsDate && attendees < 20) { setError("Classes are for a minimum of 20 attendees."); return; }
    if (needsDate && !trainingFormat) { setError("Please choose a training format — virtual or on-site."); return; }
    if (needsDate && trainingFormat === "onsite" && (!onsite.city || !onsite.state || !onsite.venue)) { setError("Please add the city, state, and venue for on-site training."); return; }
    // Rush is a surcharge added on top of a submittal package — it can't be bought on its own.
    if (cart["rush"] && !cart["sub-pkg"] && !cart["sub-week"]) { setError("Rush is a surcharge added on top of a submittal package. Add a submittal package or weekly service to apply rush."); return; }
    // The all-sales-are-final consent applies only to a paid booking; a free quote
    // request carries no obligation, so it isn't gated on it.
    if (canPay && !consent) { setError("Please accept the Terms of Service and Refund & Cancellation Policy to continue."); return; }
    if (chosenQuotes.length > 0 && !quoteConsent) { setError("Please acknowledge that quoted items are an estimate, not a final cost."); return; }

    // For a class, capture the format + on-site location alongside the notes so it
    // rides through to the booking record and the confirmation.
    const logistics = needsDate
      ? `Format: ${trainingFormat === "onsite" ? `On-site — ${onsite.venue}, ${onsite.city}, ${onsite.state}` : "Virtual (live online)"}`
      : "";
    const contact = logistics
      ? { ...form, notes: [form.notes, logistics].filter(Boolean).join(" | ") }
      : form;
    const payload = {
      items: chosen.map((c) => ({ id: c.id, name: c.name, qty: c.qty, svc: c.svc, price: c.price })),
      quotes: chosenQuotes.map((q) => ({ id: q.id, name: q.name, from: q.from })),
      payMode: "full", dueNowCents,
      contact, startDate,
      className: selectedClass ? `${selectedClass.no} — ${selectedClass.name}` : "",
      classDate: pickedDate, classSlot: slot, attendees,
      trainingFormat, onsite,
      consent, // affirmative acceptance of Terms + Refund policy (server-verified)
      consentAt: new Date().toISOString(),
      repCode: form.repCode,
    };

    if (!canPay) {
      // Quote-only request — no charge. Persist a lead first; only confirm once the
      // server reports it stored, otherwise show the email/phone fallback so the
      // request is never silently dropped.
      try {
        setBusy(true);
        const res = await fetch("/api/quote", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (res.ok && data.persisted) {
          track("quote_requested");
          // Show the SAME reference the server stored on the lead, so staff can
          // look the request up by it (was a throwaway client-side number).
          setDoneRef(data.ref || "HCC-Q-" + Math.floor(100000 + Math.random() * 899999));
          setStep("done");
          return;
        }
        setError("We couldn't record your quote request just now. Please email info@hillcountryconsultants.com or call 470-478-1590 and we'll take it from there.");
      } catch {
        setError("Something went wrong sending your quote request. Please email info@hillcountryconsultants.com or call 470-478-1590 and we'll take it from there.");
      } finally {
        setBusy(false);
      }
      return;
    }

    try {
      setBusy(true);
      const res = await fetch("/api/checkout", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.url) { track("checkout_started"); window.location.href = data.url; return; }
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
            payment has been taken. Questions?{" "}
            <a className="link-underline" href="mailto:info@hillcountryconsultants.com">info@hillcountryconsultants.com</a> · 470-478-1590.
          </p>
          <Link href="/services" className="link-underline mt-8 inline-block">← Back to services</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="section-cream min-h-[70vh]">
      <div className="shell py-14">
        {/* ── Mode tabs: pay vs. schedule a call (§8a) ── */}
        <div className="mb-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setMode("pay")}
            className={
              mode === "pay"
                ? "bg-forest px-[22px] py-4 font-inter text-[15px] font-semibold text-white"
                : "border border-line-soft px-[22px] py-4 font-inter text-[15px] font-medium text-charcoal transition-colors hover:border-ink-faint"
            }
          >
            Book &amp; pay for services
          </button>
          <button
            type="button"
            onClick={() => setMode("call")}
            className={
              mode === "call"
                ? "bg-forest px-[22px] py-4 font-inter text-[15px] font-semibold text-white"
                : "border border-line-soft px-[22px] py-4 font-inter text-[15px] font-medium text-charcoal transition-colors hover:border-ink-faint"
            }
          >
            Schedule a call
          </button>
        </div>

        {mode === "call" ? (
          <div className="mx-auto max-w-[720px]">
            <p className="kicker mb-3">Schedule a call</p>
            <h1 className="font-fraunces text-[clamp(28px,4vw,42px)] font-normal text-forest">
              Start with a free 30-minute strategy session.
            </h1>
            <span className="rule-gold mb-6 mt-3" />
            <p className="mb-8 text-[17px] prose-soft">
              Prefer to talk it through before booking anything? We map the work, recommend a
              plan tier or a standalone scope, and put it in writing before anything begins. No
              obligation.
            </p>
            <InquiryForm />
          </div>
        ) : (
        <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr]">
        {/* ── Left: select / pay ── */}
        <div>
          <p className="kicker mb-3">Book &amp; pay</p>
          <h1 className="font-fraunces text-[clamp(28px,4vw,42px)] font-normal text-forest">
            {step === "pay" ? "Checkout" : "Build your booking"}
          </h1>
          <span className="rule-gold mb-8 mt-3" />

          {step === "select" && (
            <>
              {!selectedClass && (
                <p className="mb-6 text-[14px] prose-muted">Select the services you need and set a quantity. Nothing is added to your booking until you set a quantity — so you&apos;re always in control of what you buy.</p>
              )}
              {selectedClass && (
                <div className="mb-8 border border-line-warm bg-white p-6">
                  <p className="kicker mb-2">Class selected</p>
                  <p className="text-[17px] font-medium text-charcoal">{selectedClass.no} — {selectedClass.name}</p>
                  <p className="mt-1 text-[13px] prose-muted">Minimum enrollment 20 · base price covers up to 20 · additional attendees $250 each · booked 30–90 days out.</p>
                  <label className="mt-3 flex flex-col gap-1 text-[13px] font-medium text-ink-faint">Expected number of participants (minimum 20)
                    <input type="number" min={20} value={attendees}
                      onChange={(e) => setAttendees(Math.max(1, Math.floor(Number(e.target.value) || 0)))}
                      className="min-h-touch w-32 border border-line-warm bg-white px-3 text-[16px] outline-none focus:border-forest" />
                  </label>
                  {extraAttendees > 0 && <p className="mt-1 text-[13px] text-forest">+{extraAttendees} over 20 × $250 = {usd(extraAttendees * 250)}</p>}

                  {/* Training format — required before checkout */}
                  <div className="mt-5">
                    <p className="text-[13px] font-medium text-ink-faint">Training format</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {([["virtual", "Virtual (live online)"], ["onsite", "On-site (in person)"]] as const).map(([val, label]) => (
                        <button key={val} type="button" onClick={() => setTrainingFormat(val)}
                          className={`min-h-touch border px-4 text-[14px] ${trainingFormat === val ? "border-forest bg-forest text-white" : "border-line-warm bg-white text-charcoal hover:border-gold"}`}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {trainingFormat === "onsite" && (
                    <div className="mt-4 flex flex-col gap-3 border border-line-warm bg-cream/50 p-4">
                      <div className="grid gap-3 sm:grid-cols-3">
                        <label className="flex flex-col gap-1 text-[12px] font-medium text-ink-faint">City
                          <input value={onsite.city} onChange={(e) => setOnsite((o) => ({ ...o, city: e.target.value }))} className="min-h-touch border border-line-warm bg-white px-3 text-[15px] outline-none focus:border-forest" /></label>
                        <label className="flex flex-col gap-1 text-[12px] font-medium text-ink-faint">State
                          <input value={onsite.state} onChange={(e) => setOnsite((o) => ({ ...o, state: e.target.value }))} className="min-h-touch border border-line-warm bg-white px-3 text-[15px] outline-none focus:border-forest" /></label>
                        <label className="flex flex-col gap-1 text-[12px] font-medium text-ink-faint">Venue / location
                          <input value={onsite.venue} onChange={(e) => setOnsite((o) => ({ ...o, venue: e.target.value }))} className="min-h-touch border border-line-warm bg-white px-3 text-[15px] outline-none focus:border-forest" /></label>
                      </div>
                      <p className="text-[13px] prose-muted">The base training price does not include travel. Travel, lodging, transportation, and other applicable on-site expenses are quoted separately after we confirm the location.</p>
                    </div>
                  )}
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
                        onClick={() => { setPickedDate(d.iso); setPickedIso(d.date); setPickedDow(d.dow); setSlot(""); }}
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
                  <p className="mt-2 text-[12px] prose-muted">
                    Available dates are selectable; faded dates are unavailable (outside the 30–90 day window, or Sunday). A “·” marks Saturday — available by preapproved appointment, which we confirm before it&apos;s booked.
                  </p>
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

              {/* During a class booking, hide the general marketplace so the class stays the focus. */}
              {!selectedClass && (<>
              <div id="service-list" className="mb-6">
                <p className="kicker mb-3">Filter by industry</p>
                <div className="flex flex-wrap gap-2">
                  {INDUSTRIES.map((ind) => (
                    <button key={ind.slug} type="button" onClick={() => showIndustry(ind)}
                      className={`min-h-touch border px-4 text-[13.5px] ${industryFilter?.name === ind.name ? "border-forest bg-forest text-white" : "border-line-warm bg-white text-charcoal hover:border-gold"}`}>
                      {ind.name}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-[12px] prose-muted">Filtering only narrows the list — nothing is added to your booking until you set a quantity.</p>
              </div>

              <div className="mb-6">
                <p className="kicker mb-2">Filter by category</p>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => { setCatFilter(null); setIndustryFilter(null); }}
                    className={`min-h-touch border px-3 text-[13px] ${!catFilter && !industryFilter ? "border-forest bg-forest text-white" : "border-line-warm bg-white text-charcoal hover:border-gold"}`}>All</button>
                  {GROUPS.map((g) => (
                    <button key={g} type="button" onClick={() => { setCatFilter(g); setIndustryFilter(null); }}
                      className={`min-h-touch border px-3 text-[13px] ${catFilter === g ? "border-forest bg-forest text-white" : "border-line-warm bg-white text-charcoal hover:border-gold"}`}>{g}</button>
                  ))}
                </div>
                {(catFilter || industryFilter) && (
                  <button type="button" onClick={() => { setCatFilter(null); setIndustryFilter(null); }} className="mt-3 text-[13px] link-underline">Show all services</button>
                )}
              </div>

              <h2 className="mb-4 font-fraunces text-[20px] font-medium text-forest">Fixed-rate services</h2>
              {industryFilter && (
                <div className="mb-6">
                  <p className="kicker mb-2">Suggested for {industryFilter.name}</p>
                  {industryFixed.length === 0
                    ? <p className="text-[14px] prose-muted">No fixed-rate services for this industry — see the quote requests below.</p>
                    : <ul className="divide-y divide-line-soft border-y border-line-soft">{industryFixed.map(row)}</ul>}
                </div>
              )}
              {visibleGroups.map((group) => (
                <div key={group} className="mb-6">
                  <p className="kicker mb-2">{group}</p>
                  <ul className="divide-y divide-line-soft border-y border-line-soft">
                    {BOOK_ITEMS.filter((b) => b.group === group).map(row)}
                  </ul>
                </div>
              ))}

              <h2 className="mb-2 mt-8 font-fraunces text-[20px] font-medium text-forest">Scoped work — request a written quote</h2>
              <p className="mb-4 text-[14px] prose-muted">Quote requests are free and create no obligation. We price them in writing before anything begins.</p>
              <div className="flex flex-wrap gap-2">
                {visibleQuotes.map((q) => (
                  <button key={q.id} onClick={() => toggleQuote(q.id)}
                    className={`min-h-touch border px-3 py-2 text-left text-[13.5px] ${quotes[q.id] ? "border-forest bg-forest text-white" : "border-line-warm bg-white hover:border-gold"}`}>
                    {q.name} <span className={quotes[q.id] ? "text-gold-onForest" : "text-ink-faint"}>· {q.from}</span>
                  </button>
                ))}
              </div>
              </>)}
            </>
          )}

          {step === "pay" && (
            <div className="flex flex-col gap-5">
              {canPay && (
                <div className="border border-line-warm bg-white p-4">
                  <div className="flex justify-between text-[15px]"><span className="prose-muted">Total due today</span><span className="font-fraunces text-[20px] text-charcoal tabular-nums">{usd(fixedTotal)}</span></div>
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
                {needsDate ? (
                  <label className="flex flex-col gap-1.5">
                    <span className="text-[13px] font-medium text-ink-faint">Class date</span>
                    <div className="min-h-touch flex w-full items-center border border-line-warm bg-cream px-4 py-3 text-[16px] text-charcoal">
                      {pickedDate ? `${pickedDate}${slot ? ` · ${slot}` : ""}` : "Choose your class date and time on the previous step."}
                    </div>
                  </label>
                ) : (
                  <label className="flex flex-col gap-1.5">
                    <span className="text-[13px] font-medium text-ink-faint">Requested start date</span>
                    <input required type="date" className="min-h-touch w-full border border-line-warm bg-white px-4 py-3 text-[16px] outline-none focus:border-forest" value={form.startDate} onChange={setField("startDate")} />
                  </label>
                )}
              </div>
              <label className="flex flex-col gap-1.5">
                <span className="text-[13px] font-medium text-ink-faint">Project notes (optional)</span>
                <textarea rows={3} className="w-full border border-line-warm bg-white px-4 py-3 text-[16px] outline-none focus:border-forest" value={form.notes} onChange={setField("notes")} />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-[13px] font-medium text-ink-faint">Referral or employee code (optional)</span>
                <input type="text" className="min-h-touch w-full border border-line-warm bg-white px-4 py-3 text-[16px] outline-none focus:border-forest" value={form.repCode} onChange={setField("repCode")} />
              </label>
              {canPay ? (
                <label className="flex items-start gap-3 border border-line-warm bg-white p-4">
                  <input type="checkbox" className="mt-1 h-5 w-5 shrink-0" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
                  <span className="text-[14.5px] prose-soft">
                    I have read and accept the{" "}
                    <Link href="/terms" className="link-underline" target="_blank">Terms of Service</Link> and the{" "}
                    <Link href="/refund-policy" className="link-underline" target="_blank">Refund &amp; Cancellation Policy</Link>.
                    I understand all sales are final.
                  </span>
                </label>
              ) : (
                <p className="border border-line-warm bg-white p-4 text-[14.5px] prose-soft">
                  Quote requests are free and create no obligation. We price scoped work in writing before anything begins — no payment is taken now.
                </p>
              )}
              {chosenQuotes.length > 0 && (
                <label className="flex items-start gap-3 border border-line-warm bg-white p-4">
                  <input type="checkbox" className="mt-1 h-5 w-5 shrink-0" checked={quoteConsent} onChange={(e) => setQuoteConsent(e.target.checked)} />
                  <span className="text-[14.5px] prose-soft">I understand this is <strong>not my final cost</strong>. My cost may increase after my 30-minute consultation regarding the items I requested a quote for.</span>
                </label>
              )}
              {error && <p className="text-[14px] text-red-700">{error}</p>}
              <div className="flex flex-wrap gap-3">
                <button disabled={busy} onClick={submit} className="btn-gold">
                  {busy ? (canPay ? "Starting checkout…" : "Submitting…") : canPay ? `Pay ${usdCents(dueNowCents)}` : "Submit quote request"}
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
            {extraCents > 0 && (
              <div className="mb-2 flex justify-between gap-3 text-[14.5px]">
                <span className="min-w-0 text-charcoal">Additional attendees × {extraAttendees}</span>
                <span className="tabular-nums prose-muted">{usd(extraAttendees * 250)}</span>
              </div>
            )}
            {canPay && (
              <div className="border-t border-line-soft pt-3">
                <div className="flex justify-between text-[15px]"><span className="prose-muted">Payable today</span><span className="font-fraunces text-[22px] text-charcoal tabular-nums">{usdCents(dueNowCents)}</span></div>
              </div>
            )}
            {step === "select" && hasSelection && (
              <button onClick={() => { setStep("pay"); setError(""); }} className="btn-gold mt-5 w-full">
                {canPay ? "Continue to payment" : "Continue to quote request"}
              </button>
            )}
            {hasSelection && (
              <button onClick={clearAll} className="mt-3 w-full text-[13px] link-underline">Clear selections</button>
            )}
            <p className="mt-4 text-[12.5px] prose-soft"><strong className="text-charcoal">All sales are final — no refunds.</strong> By paying, you accept the <Link href="/refund-policy" className="link-underline" target="_blank">Refund &amp; Cancellation Policy</Link> and <Link href="/terms" className="link-underline" target="_blank">Terms</Link> above. Scoped work is quoted in writing before it begins.</p>
            <p className="mt-2 text-[12.5px] prose-muted">After you book, a receipt and secure client-portal access arrive by email, and your account goes into review — we acknowledge it the same business day and confirm scope and next steps within two business days.</p>
          </div>
        </aside>
        </div>
        )}
      </div>
    </section>
  );
}
