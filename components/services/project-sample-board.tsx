const COLS = [
  { name: "In progress", items: ["Permit set — mark-ups", "Vendor quotes — HVAC"] },
  { name: "In review", items: ["Capability statement v2"] },
  { name: "Delivered", items: ["Kickoff & 30-day roadmap", "Site plan — submittal 1"] },
];
const PHASES = [
  { t: "Plan", w: "100%" }, { t: "Build", w: "60%" }, { t: "Review", w: "25%" }, { t: "Close", w: "0%" },
];

/** Illustrative, static sample of the shared project board + timeline a client
 *  gets — shown on the Project Management page so prospects can picture it. */
export function ProjectSampleBoard() {
  return (
    <div className="border border-line-warm bg-white p-5">
      <p className="kicker mb-3">Sample project board</p>
      <div className="grid gap-4 md:grid-cols-3">
        {COLS.map((c) => (
          <div key={c.name} className="border border-line-soft bg-cream/40">
            <div className="border-b border-line-soft px-3 py-2 text-[12px] font-semibold uppercase tracking-wide text-forest">{c.name}</div>
            <ul className="flex flex-col gap-2 p-3">
              {c.items.map((i) => <li key={i} className="border border-line-soft bg-white p-2 text-[13px] text-charcoal">{i}</li>)}
            </ul>
          </div>
        ))}
      </div>
      <p className="kicker mb-2 mt-6">Sample timeline</p>
      <div className="flex flex-col gap-2">
        {PHASES.map((p) => (
          <div key={p.t} className="flex items-center gap-3">
            <span className="w-16 text-[12px] text-ink-faint">{p.t}</span>
            <div className="h-2 flex-1 bg-line-soft"><div className="h-2 bg-gold" style={{ width: p.w }} /></div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-[12px] prose-muted">Illustrative sample — your real board and timeline live in your client portal.</p>
    </div>
  );
}
