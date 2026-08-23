"use client";
import { useState, useTransition } from "react";
import { saveSiteContent } from "@/app/staff/actions";

type TextField = { key: string; label: string; area?: boolean; placeholder?: string };
type Group = { title: string; note?: string; fields: TextField[] };

/** Admin editor for site copy. Text fields submit as `sc:<key>`; the banner
 *  toggle submits as `scbool:banner.active` with a hidden key marker. */
export function SiteContentEditor({ groups, values, boolKeys, bannerActive }: {
  groups: Group[]; values: Record<string, string>; boolKeys: string[]; bannerActive: boolean;
}) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const field = "min-h-touch w-full border border-line-warm px-3 text-[14px] outline-none focus:border-forest";
  return (
    <form
      className="flex flex-col gap-6"
      action={(fd) => start(async () => {
        setMsg(""); setErr("");
        fd.set("scbool_keys", boolKeys.join(","));
        const r = await saveSiteContent(fd);
        if (r?.error) setErr(r.error); else setMsg("Saved — changes are live.");
      })}
    >
      {groups.map((g) => (
        <section key={g.title} className="border border-line-warm bg-white p-4">
          <p className="text-[13px] font-semibold text-forest">{g.title}</p>
          {g.note && <p className="mt-0.5 mb-2 text-[12px] prose-muted">{g.note}</p>}
          {g.title === "Announcement banner" && (
            <label className="mb-2 flex items-center gap-2 text-[13px] text-charcoal">
              <input type="checkbox" name="scbool:banner.active" defaultChecked={bannerActive} /> Show the banner across the site
            </label>
          )}
          <div className="grid gap-3">
            {g.fields.map((f) => (
              <label key={f.key} className="flex flex-col gap-1 text-[12px] text-ink-faint">
                {f.label}
                {f.area
                  ? <textarea name={`sc:${f.key}`} defaultValue={values[f.key] || ""} placeholder={f.placeholder} className={`${field} min-h-[80px] py-2`} />
                  : <input name={`sc:${f.key}`} defaultValue={values[f.key] || ""} placeholder={f.placeholder} className={field} />}
              </label>
            ))}
          </div>
        </section>
      ))}
      <div className="flex items-center gap-3">
        <button disabled={pending} className="btn-gold text-[14px] disabled:opacity-50">{pending ? "Saving…" : "Save changes"}</button>
        {msg && <span className="text-[13px] text-forest">{msg}</span>}
        {err && <span className="text-[13px] text-red-700">{err}</span>}
      </div>
    </form>
  );
}
