"use client";

import { useState, useTransition } from "react";
import { markKickoffScheduled } from "@/app/portal/actions";

/** Kickoff step controls: book on the Google appointment page, then self-mark it
 *  scheduled. Once done, the button becomes a reschedule link. */
export function KickoffStep({ url, done }: { url: string; done: boolean }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
      <a href={url} target="_blank" rel="noopener noreferrer" className="btn-gold text-[14px]">
        {done ? "View or reschedule call" : "Schedule your kickoff call"}
      </a>
      {!done && (
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setError("");
            start(async () => {
              const r = await markKickoffScheduled();
              if (r?.error) setError("Couldn't save — please try again.");
            });
          }}
          className="text-[13px] font-medium text-forest underline underline-offset-2 hover:text-gold disabled:opacity-50"
        >
          {pending ? "Saving…" : "I've booked it — mark scheduled"}
        </button>
      )}
      {error && <span className="text-[13px] text-red-700">{error}</span>}
    </div>
  );
}
