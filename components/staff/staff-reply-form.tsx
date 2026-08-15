"use client";
import { useRef, useState, useTransition } from "react";
import { staffReplyMessage } from "@/app/staff/actions";

/** Staff replies to a client's message; the client is emailed that it's waiting. */
export function StaffReplyForm({ clientId }: { clientId: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);
  return (
    <div className="mt-3 flex flex-col gap-2 border-t border-line-soft pt-3">
      <textarea
        ref={ref}
        rows={2}
        placeholder="Message this client… (start a new thread or reply)"
        className="w-full border border-line-warm px-3 py-2 text-[15px] outline-none focus:border-forest"
      />
      {error && <p className="text-[13px] text-red-700">{error}</p>}
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            setError("");
            const body = ref.current?.value || "";
            const r = await staffReplyMessage(clientId, body);
            if (r?.error) setError(r.error);
            else if (ref.current) ref.current.value = "";
          })
        }
        className="btn-gold self-start px-5 text-[14px] disabled:opacity-50"
      >
        {pending ? "Sending…" : "Send message & email client"}
      </button>
    </div>
  );
}
