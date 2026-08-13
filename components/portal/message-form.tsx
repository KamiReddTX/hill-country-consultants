"use client";
import { useState, useTransition } from "react";
import { addMessage } from "@/app/portal/actions";

export function MessageForm() {
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  return (
    <form
      className="flex flex-col gap-3 border border-line-warm bg-white p-5"
      action={(fd) => start(async () => { setError(""); const r = await addMessage(fd); if (r?.error) setError(r.error); else (document.getElementById("msg-form") as HTMLFormElement)?.reset(); })}
      id="msg-form"
    >
      <textarea name="body" rows={3} required placeholder="Message your account lead…" className="w-full border border-line-warm px-3 py-2 text-[15px] outline-none focus:border-forest" />
      {error && <p className="text-[13px] text-red-700">{error}</p>}
      <button disabled={pending} className="btn-gold self-start px-5 text-[14px]">{pending ? "Sending…" : "Send message"}</button>
    </form>
  );
}
