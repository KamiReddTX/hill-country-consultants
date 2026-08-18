"use client";
import { useState, useTransition } from "react";
import { requestPhotoShoot } from "@/app/portal/actions";

/** Client CTA: logs a photo-shoot request (task + AM email), then opens the
 *  photographer's calendar. If no link is configured yet, it still logs the
 *  request and tells the client their AM will follow up. */
export function PhotoShootButton({ url }: { url: string }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState("");
  return (
    <div className="flex flex-col gap-2">
      <button type="button" disabled={pending}
        onClick={() => start(async () => {
          setMsg("");
          const r = await requestPhotoShoot();
          if (r?.error) { setMsg(r.error); return; }
          setMsg(url ? "Request sent — opening the photographer's calendar. Your account manager will confirm and handle billing." : "Request sent — your account manager will send you the scheduling link and confirm.");
          if (url) window.open(url, "_blank", "noopener,noreferrer");
        })}
        className="btn-gold self-start text-[15px] disabled:opacity-50">
        {pending ? "One moment…" : "Schedule a marketing photo shoot"}
      </button>
      {msg && <span className="text-[13px] text-forest">{msg}</span>}
    </div>
  );
}
