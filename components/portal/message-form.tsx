"use client";
import { useRef, useState, useTransition } from "react";
import { addMessage } from "@/app/portal/actions";

export function MessageForm() {
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  return (
    <form
      ref={formRef}
      className="flex flex-col gap-3 border border-line-warm bg-white p-5"
      action={(fd) => start(async () => { setError(""); const r = await addMessage(fd); if (r?.error) setError(r.error); else formRef.current?.reset(); })}
      id="msg-form"
    >
      <textarea name="body" rows={3} placeholder="Message your account lead…" className="w-full border border-line-warm px-3 py-2 text-[15px] outline-none focus:border-forest" />
      <label className="flex items-center gap-2 text-[12px] text-ink-faint">
        Attach files (documents, images):
        <input type="file" name="files" multiple className="text-[12px]" />
      </label>
      {error && <p className="text-[13px] text-red-700">{error}</p>}
      <button type="submit" disabled={pending} className="btn-gold self-start px-5 text-[14px] disabled:opacity-50">{pending ? "Sending…" : "Send message"}</button>
    </form>
  );
}
