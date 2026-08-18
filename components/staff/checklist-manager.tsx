"use client";
import { useState, useTransition } from "react";
import { addChecklistItem, addChecklistItemsBulk, toggleChecklistItem, deleteChecklistItem, deleteChecklistSection } from "@/app/staff/actions";

type Item = { id: string; section: string | null; label: string; done: boolean; position: number };

/** Staff editor for a client's freeform checklist. Items group by section;
 *  the whole list can be pasted at once (one item per line, "## X" = section). */
export function ChecklistManager({ clientId, items }: { clientId: string; items: Item[] }) {
  const [pending, start] = useTransition();
  const [label, setLabel] = useState("");
  const [section, setSection] = useState("");
  const [bulk, setBulk] = useState("");
  const [showBulk, setShowBulk] = useState(false);
  const [msg, setMsg] = useState("");
  const field = "min-h-touch border border-line-warm bg-white px-2 text-[13px]";

  // Group by section, preserving first-seen order.
  const groups: { section: string | null; items: Item[] }[] = [];
  const idx = new Map<string, number>();
  for (const it of items) {
    const key = it.section || "";
    if (!idx.has(key)) { idx.set(key, groups.length); groups.push({ section: it.section, items: [] }); }
    groups[idx.get(key)!].items.push(it);
  }
  const done = items.filter((i) => i.done).length;
  const pct = items.length ? Math.round((done / items.length) * 100) : 0;

  return (
    <div className="flex flex-col gap-4">
      {items.length > 0 && (
        <div>
          <div className="flex justify-between text-[12px] prose-muted"><span>{done} of {items.length} done</span><span>{pct}%</span></div>
          <div className="mt-1 h-1.5 w-full bg-line-soft"><div className="h-1.5 bg-gold" style={{ width: `${pct}%` }} /></div>
        </div>
      )}

      {groups.map((g, gi) => (
        <div key={gi}>
          {g.section && (
            <div className="flex items-center justify-between">
              <p className="text-[12px] font-semibold uppercase tracking-wide text-forest">{g.section}</p>
              <button type="button" disabled={pending} onClick={() => start(async () => { await deleteChecklistSection(clientId, g.section || ""); })} className="text-[11px] text-ink-faint underline hover:text-red-700">Delete section</button>
            </div>
          )}
          <ul className="mt-1 flex flex-col gap-1">
            {g.items.map((it) => (
              <li key={it.id} className="flex items-start gap-2 text-[14px]">
                <input type="checkbox" checked={it.done} disabled={pending} onChange={() => start(async () => { await toggleChecklistItem(it.id, !it.done); })} className="mt-1 shrink-0" />
                <span className={`flex-1 ${it.done ? "text-ink-faint line-through" : "text-charcoal"}`}>{it.label}</span>
                <button type="button" disabled={pending} onClick={() => start(async () => { await deleteChecklistItem(it.id); })} className="shrink-0 text-[12px] text-ink-faint hover:text-red-700">✕</button>
              </li>
            ))}
          </ul>
        </div>
      ))}
      {items.length === 0 && <p className="text-[13px] prose-muted">No checklist yet. Add items below, or paste a whole list at once.</p>}

      {/* Add a single item */}
      <div className="flex flex-wrap items-end gap-2 border-t border-line-soft pt-3">
        <label className="flex flex-col gap-1 text-[11px] text-ink-faint">Section (optional)<input value={section} onChange={(e) => setSection(e.target.value)} placeholder="e.g. Day 1" className={`${field} w-32`} /></label>
        <label className="flex flex-col gap-1 text-[11px] text-ink-faint">Item<input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="What to do" className={`${field} w-64`} /></label>
        <button type="button" disabled={pending || !label.trim()} onClick={() => start(async () => { setMsg(""); const r = await addChecklistItem(clientId, label, section); if (r?.error) setMsg(r.error); else setLabel(""); })} className="btn-gold text-[12px] disabled:opacity-50">Add</button>
        <button type="button" onClick={() => setShowBulk((s) => !s)} className="text-[12px] link-underline">{showBulk ? "Hide bulk paste" : "Bulk paste"}</button>
        {msg && <span className="text-[12px] text-red-700">{msg}</span>}
      </div>

      {showBulk && (
        <div className="flex flex-col gap-2">
          <textarea value={bulk} onChange={(e) => setBulk(e.target.value)} rows={6}
            placeholder={"Paste one item per line.\nStart a section with a heading line:\n## Day 1 — Head & Accounts\nWrite her why in one sentence\nName the three things she's afraid of"}
            className="border border-line-warm bg-white p-2 text-[13px]" />
          <button type="button" disabled={pending || !bulk.trim()} onClick={() => start(async () => { setMsg(""); const r = await addChecklistItemsBulk(clientId, bulk); if (r?.error) setMsg(r.error); else { setBulk(""); setShowBulk(false); } })} className="btn-gold self-start text-[12px] disabled:opacity-50">Add all</button>
        </div>
      )}
    </div>
  );
}
