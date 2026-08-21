"use client";

import { useState, useTransition } from "react";
import { markKickoffScheduled } from "@/app/portal/actions";

/** Kickoff step controls: book on the Google appointment page, then self-mark it
 *  scheduled. Once done, the button becomes a reschedule link. */
export function KickoffStep({ url, done }: { url: string; done: boolean }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  if (done) {
    return (
      <div className="mt-3 flex flex-col gap-1">
        <span className="text-[13px] font-semibold text-forest">✓ Kickoff call scheduled</span>
        <span className="text-[12px] prose-muted">
          Need to change the time? Use the reschedule link in your Google confirmation email, or{" "}
          <a href="/portal/messages" className="link-underline">message your team</a>. To book a different slot,{" "}
          <a href={url} target="_blank" rel="noopener noreferrer" className="link-underline">open the scheduler</a>.
        </span>
      </div>
    );
  }
  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
      <a href={url} target="_blank" rel="noopener noreferrer" className="btn-gold text-[14px]">Schedule your kickoff call</a>
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
      {error && <span className="text-[13px] text-red-700">{error}</span>}
    </div>
  );
}
