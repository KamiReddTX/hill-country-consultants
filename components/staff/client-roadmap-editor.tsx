import { saveRoadmapPhase } from "@/app/staff/actions";
import { ROADMAP_FRAMEWORK, ROADMAP_STATUSES, type RoadmapRow } from "@/lib/portal";

/** Per-client roadmap editor for AM/VA. One small form per phase (status + note),
 *  saved to client_roadmap; the client's Roadmap tab reflects it live. */
export function ClientRoadmapEditor({ clientId, rows }: { clientId: string; rows: RoadmapRow[] }) {
  const byPhase = new Map(rows.map((r) => [r.phase, r]));
  return (
    <div className="flex flex-col gap-2">
      {ROADMAP_FRAMEWORK.map((p) => {
        const row = byPhase.get(p.key);
        return (
          <form
            key={p.key}
            action={saveRoadmapPhase}
            className="grid gap-2 border border-line-soft bg-white p-3 sm:grid-cols-[100px_150px_1fr_auto] sm:items-center"
          >
            <input type="hidden" name="clientId" value={clientId} />
            <input type="hidden" name="phase" value={p.key} />
            <span className="kicker sm:whitespace-nowrap">{p.window}</span>
            <select
              name="status"
              defaultValue={row?.status || "Not started"}
              className="min-h-touch border border-line-warm bg-white px-2 text-[13px]"
            >
              {ROADMAP_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <input
              name="note"
              defaultValue={row?.note || ""}
              placeholder={`${p.t} — client-specific note or date`}
              className="min-h-touch border border-line-warm bg-white px-2 text-[13px]"
            />
            <button className="btn-gold text-[13px]">Save</button>
          </form>
        );
      })}
    </div>
  );
}
