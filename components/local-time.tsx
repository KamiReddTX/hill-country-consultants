"use client";
import { useEffect, useState } from "react";

type Mode = "datetime" | "date" | "time";

const opts = (mode: Mode): Intl.DateTimeFormatOptions =>
  mode === "date" ? { month: "short", day: "numeric", year: "numeric" }
  : mode === "time" ? { hour: "numeric", minute: "2-digit" }
  : { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" };

const fmt = (iso: string, mode: Mode, tz?: string) => {
  try { return new Date(iso).toLocaleString(undefined, { ...opts(mode), ...(tz ? { timeZone: tz } : {}) }); }
  catch { return ""; }
};

/** Renders a timestamp in the viewer's own timezone. Server render (and first
 *  client paint) use Central so there's no hydration mismatch and no blank
 *  flash; on mount it re-formats to the browser's local timezone. */
export function LocalTime({ iso, mode = "datetime" }: { iso: string; mode?: Mode }) {
  const [s, setS] = useState(() => fmt(iso, mode, "America/Chicago"));
  useEffect(() => { setS(fmt(iso, mode)); }, [iso, mode]);
  return <span suppressHydrationWarning>{s}</span>;
}
