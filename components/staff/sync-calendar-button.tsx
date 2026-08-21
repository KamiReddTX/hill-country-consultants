"use client";
import { useState, useTransition } from "react";
import { syncCalendarNow } from "@/app/staff/actions";

/** Manually pull recent Google Calendar bookings and flag any that need staff. */
export function SyncCalendarButton() {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState("");
  return (
    <span className="flex items-center gap-2">
      <button type="button" disabled={pending}
        onClick={() => start(async () => {
          setMsg("");
          const r = await syncCalendarNow();
          if (r?.error) setMsg(r.error);
          else if (r?.disabled) setMsg("Calendar sync isn't configured yet.");
          else setMsg(`Synced — ${r?.flagged || 0} flagged, ${r?.found || 0} checked.`);
        })}
        className="border border-line-warm bg-white px-3 py-1.5 text-[13px] font-medium text-forest disabled:opacity-50">
        {pending ? "Syncing…" : "Sync calendar now"}
      </button>
      {msg && <span className="text-[12px] prose-muted">{msg}</span>}
    </span>
  );
}
