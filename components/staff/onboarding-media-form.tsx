"use client";
import { useRef, useState, useTransition } from "react";
import { setOnboardingMedia } from "@/app/staff/actions";

/** Staff: set the onboarding-call recording link and/or upload a transcript PDF
 *  for a client. Appears on the client's dashboard as a watch/read panel. */
export function OnboardingMediaForm({ clientId, videoUrl, hasTranscript }: { clientId: string; videoUrl?: string | null; hasTranscript?: boolean }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={(fd) => start(async () => {
      setMsg(""); setErr("");
      const r = await setOnboardingMedia(fd);
      if (r?.error) setErr(r.error); else setMsg("Saved — it's on the client's dashboard.");
    })} className="mt-3 flex flex-col gap-2 border-t border-line-soft pt-3">
      <input type="hidden" name="client_id" value={clientId} />
      <label className="text-[12px] font-medium text-forest">Onboarding recording link (Zoom, Loom, YouTube, Vimeo…)
        <input name="video_url" type="url" defaultValue={videoUrl || ""} placeholder="https://…"
          className="mt-1 w-full border border-line-warm bg-white px-2 py-1 text-[13px] outline-none focus:border-forest" />
      </label>
      <label className="text-[12px] font-medium text-forest">Transcript (PDF{hasTranscript ? " — one already uploaded; choose a file to replace" : ""})
        <input name="transcript" type="file" accept="application/pdf" className="mt-1 block w-full text-[12px]" />
      </label>
      <div className="flex items-center gap-2">
        <button type="submit" disabled={pending} className="btn-gold text-[12px] disabled:opacity-50">{pending ? "Saving…" : "Save recording"}</button>
        {msg && <span className="text-[12px] font-medium text-forest">{msg}</span>}
        {err && <span className="text-[12px] text-red-700">{err}</span>}
      </div>
    </form>
  );
}
