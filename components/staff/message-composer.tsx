"use client";
import { useRef, useState, useTransition } from "react";
import { sendDirectMessage, postChannelMessage, addClientStaffNote } from "@/app/staff/actions";

/** One composer for all internal message types (DM, channel post, staff note). */
export function MessageComposer({ kind, targetId, placeholder, cta }: {
  kind: "dm" | "channel" | "note"; targetId: string; placeholder?: string; cta?: string;
}) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);
  const send = () => start(async () => {
    setErr("");
    const body = ref.current?.value || "";
    const r = kind === "dm" ? await sendDirectMessage(targetId, body)
      : kind === "channel" ? await postChannelMessage(targetId, body)
      : await addClientStaffNote(targetId, body);
    if (r?.error) setErr(r.error); else if (ref.current) ref.current.value = "";
  });
  return (
    <div className="mt-3 flex flex-col gap-2">
      <textarea ref={ref} rows={2} placeholder={placeholder || "Write a message…"} className="w-full border border-line-warm px-3 py-2 text-[15px] outline-none focus:border-forest" />
      {err && <p className="text-[13px] text-red-700">{err}</p>}
      <button type="button" disabled={pending} onClick={send} className="btn-gold self-start px-5 text-[14px] disabled:opacity-50">{pending ? "Sending…" : (cta || "Send")}</button>
    </div>
  );
}
