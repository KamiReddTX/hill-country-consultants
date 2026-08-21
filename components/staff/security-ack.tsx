"use client";
import { useState, useTransition } from "react";
import { acknowledgeSecurity } from "@/app/staff/actions";
import { ACK_TITLE, ACK_CLAUSES } from "@/content/acknowledgments";

/** The IT / security / confidentiality acknowledgment. Shows the full terms and,
 *  if not yet signed for the current version, a check + typed-signature form. */
export function SecurityAck({ signed }: { signed: { at: string; name: string | null } | null }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState("");
  const [checked, setChecked] = useState(false);
  const [name, setName] = useState("");
  const [done, setDone] = useState<null | { at: string; name: string | null }>(signed);

  const dateStr = (iso: string) => new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  return (
    <section className={`border p-5 ${done ? "border-line-warm bg-white" : "border-2 border-gold bg-cream/40"}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-fraunces text-[20px] font-medium text-forest">{ACK_TITLE}</h2>
        {done
          ? <span className="text-[12px] font-semibold text-forest">✓ Signed {dateStr(done.at)}{done.name ? ` · ${done.name}` : ""}</span>
          : <span className="text-[12px] font-semibold text-gold-hover">Signature required</span>}
      </div>
      <span className="rule-gold mb-3 mt-2 block" />

      <ul className="flex flex-col gap-2 text-[14px] leading-relaxed prose-soft">
        {ACK_CLAUSES.map((c) => (
          <li key={c.heading}><strong className="text-charcoal">{c.heading}.</strong> {c.text}</li>
        ))}
      </ul>

      {done ? (
        <p className="mt-4 text-[13px] prose-muted">You acknowledged these terms on {dateStr(done.at)}. Keep your setup in line with them; if the policy is updated you&apos;ll be asked to acknowledge the new version.</p>
      ) : (
        <form
          className="mt-4 flex flex-col gap-3 border-t border-line-soft pt-4"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(); fd.set("agreedName", name);
            start(async () => { setMsg(""); const r = await acknowledgeSecurity(fd); if (r?.error) setMsg(r.error); else setDone({ at: new Date().toISOString(), name }); });
          }}
        >
          <label className="flex items-start gap-2 text-[14px] text-charcoal">
            <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} className="mt-1" />
            <span>I have read and I agree to the terms above, and my setup meets them.</span>
          </label>
          <label className="flex flex-col gap-1 text-[13px] prose-muted">
            Type your full name to sign
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full legal name" className="min-h-touch max-w-[22em] border border-line-warm bg-white px-3 text-[15px] text-charcoal" />
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" disabled={pending || !checked || name.trim().length < 2} className="btn-gold text-[14px] disabled:opacity-50">{pending ? "Signing…" : "I agree & sign"}</button>
            {msg && <span className="text-[13px] text-red-700">{msg}</span>}
          </div>
        </form>
      )}
    </section>
  );
}
