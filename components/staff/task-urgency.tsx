/** Presentational helpers for task urgency — shared by My Work, Delivery, and the
 *  Task board so due-dates and priority look the same everywhere. */

const PRI_STYLE: Record<string, string> = {
  Urgent: "bg-red-700 text-white",
  High: "bg-gold text-forest",
  Normal: "bg-cream text-ink-muted",
  Low: "bg-cream text-ink-faint",
};

/** A small colored priority chip. Renders nothing for Normal to reduce noise. */
export function PriorityBadge({ priority }: { priority?: string | null }) {
  const p = priority || "Normal";
  if (p === "Normal") return null;
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${PRI_STYLE[p] || PRI_STYLE.Normal}`}>
      {p}
    </span>
  );
}

/** Due-date label + color class from an ISO date (YYYY-MM-DD). */
export function dueMeta(due: string | null | undefined): { label: string; cls: string } {
  if (!due) return { label: "No date set", cls: "text-ink-faint" };
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const dt = new Date(due + "T00:00:00");
  const days = Math.round((dt.getTime() - today.getTime()) / 86400000);
  if (days < 0) return { label: `Overdue ${-days}d`, cls: "text-red-700 font-semibold" };
  if (days === 0) return { label: "Due today", cls: "text-red-700 font-semibold" };
  if (days === 1) return { label: "Due tomorrow", cls: "text-gold font-semibold" };
  if (days <= 7) return { label: `Due in ${days}d`, cls: "text-gold" };
  return { label: `Due ${due}`, cls: "prose-muted" };
}
