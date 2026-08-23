"use client";
import { useState, useTransition } from "react";
import { requestServiceUpgrade } from "@/app/portal/actions";
import { SERVICE_UPGRADES } from "@/content/pricing";

/** Client-facing upgrades/add-ons on the task board. Selecting one opens a short
 *  note field and routes the request to the account team. */
export function ServiceUpgrades() {
  const [open, setOpen] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [done, setDone] = useState<string | null>(null);
  const [err, setErr] = useState("");

  return (
    <div className="border border-line-warm bg-white p-5">
      <p className="font-fraunces text-[18px] text-forest">Grow with us</p>
      <p className="mt-1 max-w-[52em] text-[13px] prose-soft">Need more than your current plan covers? Tell your team what you&apos;re after — it&apos;s an inquiry, not a charge, and your account lead will follow up to scope it.</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {SERVICE_UPGRADES.map((u) => {
          if (done === u.key) {
            return (
              <div key={u.key} className="border border-forest/40 bg-cream/40 p-3">
                <p className="text-[14px] font-medium text-forest">✓ Request sent</p>
                <p className="mt-1 text-[12px] prose-soft">Your team will reach out about “{u.label}.”</p>
              </div>
            );
          }
          const isOpen = open === u.key;
          return (
            <div key={u.key} className="flex flex-col border border-line-soft p-3">
              <p className="text-[14px] font-medium text-charcoal">{u.label}</p>
              <p className="mt-1 flex-1 text-[12.5px] prose-soft">{u.blurb}</p>
              {isOpen ? (
                <form className="mt-2 flex flex-col gap-2"
                  action={(fd) => start(async () => {
                    setErr(""); fd.set("label", u.label); fd.set("upgrade_key", u.key);
                    const r = await requestServiceUpgrade(fd);
                    if (r?.error) setErr(r.error); else { setDone(u.key); setOpen(null); }
                  })}>
                  <textarea name="note" placeholder="Anything specific? (optional)" className="min-h-[56px] border border-line-warm px-2 py-1.5 text-[13px] outline-none focus:border-forest" />
                  <div className="flex items-center gap-2">
                    <button disabled={pending} className="btn-gold text-[12px] disabled:opacity-50">{pending ? "Sending…" : "Send request"}</button>
                    <button type="button" onClick={() => setOpen(null)} className="text-[12px] prose-muted">Cancel</button>
                  </div>
                </form>
              ) : (
                <button type="button" onClick={() => { setOpen(u.key); setErr(""); }} className="mt-2 self-start min-h-touch border border-line-warm px-3 text-[12px] text-forest">I&apos;m interested</button>
              )}
            </div>
          );
        })}
      </div>
      {err && <p className="mt-2 text-[12px] text-red-700">{err}</p>}
    </div>
  );
}
