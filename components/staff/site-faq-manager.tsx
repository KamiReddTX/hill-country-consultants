"use client";
import { useState, useTransition } from "react";
import { addSiteFaq, updateSiteFaq, deleteSiteFaq } from "@/app/staff/actions";

type Faq = { id: string; question: string; answer: string; sort: number; active: boolean };

/** Admin: manage the marketing FAQ list. */
export function SiteFaqManager({ faqs }: { faqs: Faq[] }) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState("");
  const field = "min-h-touch w-full border border-line-warm px-3 text-[14px] outline-none focus:border-forest";
  return (
    <div className="flex flex-col gap-4">
      <section className="border border-line-warm bg-white p-4">
        <p className="mb-2 text-[13px] font-semibold text-forest">Add a question</p>
        <form className="grid gap-2"
          action={(fd) => start(async () => { setErr(""); const r = await addSiteFaq(fd); if (r?.error) setErr(r.error); })}>
          <input name="question" required placeholder="Question" className={field} />
          <textarea name="answer" required placeholder="Answer" className={`${field} min-h-[70px] py-2`} />
          <div className="flex items-center gap-2">
            <input name="sort" type="number" defaultValue={0} className={`${field} max-w-[90px]`} title="Sort order" />
            <button disabled={pending} className="btn-gold text-[13px] disabled:opacity-50">Add</button>
          </div>
        </form>
      </section>

      {faqs.length === 0 ? (
        <p className="text-[13px] prose-muted">No custom FAQ entries yet — the site shows the built-in list until you add some here.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {faqs.map((f) => (
            <li key={f.id} className="border border-line-warm bg-white p-4">
              <form className="grid gap-2"
                action={(fd) => start(async () => { setErr(""); fd.set("id", f.id); const r = await updateSiteFaq(fd); if (r?.error) setErr(r.error); })}>
                <input name="question" defaultValue={f.question} className={field} />
                <textarea name="answer" defaultValue={f.answer} className={`${field} min-h-[70px] py-2`} />
                <div className="flex flex-wrap items-center gap-3">
                  <input name="sort" type="number" defaultValue={f.sort} className={`${field} max-w-[90px]`} title="Sort order" />
                  <label className="flex items-center gap-1.5 text-[12px] text-charcoal"><input type="checkbox" name="active" defaultChecked={f.active} /> Visible</label>
                  <button disabled={pending} className="min-h-touch border border-line-warm px-3 text-[13px] text-forest disabled:opacity-50">Save</button>
                  <button type="button" disabled={pending} className="min-h-touch border border-line-warm px-3 text-[13px] text-red-700 disabled:opacity-50"
                    onClick={() => start(() => deleteSiteFaq(f.id).then(() => {}))}>Delete</button>
                </div>
              </form>
            </li>
          ))}
        </ul>
      )}
      {err && <p className="text-[12px] text-red-700">{err}</p>}
    </div>
  );
}
