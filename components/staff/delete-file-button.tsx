"use client";
import { useState, useTransition } from "react";
import { deleteClientFile } from "@/app/staff/actions";

/** Staff: remove a file from a client's shared space (one-tap confirm). */
export function DeleteFileButton({ fileId }: { fileId: string }) {
  const [pending, start] = useTransition();
  const [armed, setArmed] = useState(false);
  const [msg, setMsg] = useState("");
  if (!armed) return <button type="button" onClick={() => setArmed(true)} className="text-[12px] text-red-700 underline">Delete</button>;
  return (
    <span className="flex items-center gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => start(async () => { setMsg(""); const r = await deleteClientFile(fileId); if (r?.error) setMsg(r.error); })}
        className="text-[12px] font-semibold text-red-700 disabled:opacity-50"
      >
        {pending ? "…" : "Confirm"}
      </button>
      <button type="button" onClick={() => setArmed(false)} className="text-[12px] prose-muted underline">Cancel</button>
      {msg && <span className="text-[12px] text-red-700">{msg}</span>}
    </span>
  );
}
