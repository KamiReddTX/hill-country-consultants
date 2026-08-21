"use client";
import { useState, useTransition } from "react";
import { confirmKickoff } from "@/app/staff/actions";

/** Owner/manager marks a scheduled kickoff handled (staff added to the invite). */
export function KickoffHandledButton({ clientId }: { clientId: string }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState("");
  return (
    <span className="flex items-center gap-2">
      <button type="button" disabled={pending}
        onClick={() => start(async () => { setMsg(""); const r = await confirmKickoff(clientId); if (r?.error) setMsg(r.error); })}
        className="border border-forest px-2 py-1 text-[12px] font-medium text-forest disabled:opacity-50">{pending ? "Saving…" : "Mark handled"}</button>
      {msg && <span className="text-[12px] text-red-700">{msg}</span>}
    </span>
  );
}
