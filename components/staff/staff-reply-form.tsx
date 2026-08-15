"use client";
import { useRef, useState, useTransition } from "react";
import { staffReplyMessage } from "@/app/staff/actions";

/** Staff messages a client (start a thread or reply), optionally with attachments;
 *  the client is emailed the message and can reply straight from email. */
export function StaffReplyForm({ clientId }: { clientId: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  return (
    <form
      ref={formRef}
      className="mt-3 flex flex-col gap-2 border-t border-line-soft pt-3"
      action={(fd) =>
        start(async () => {
          setError("");
          fd.set("clientId", clientId);
          const r = await staffReplyMessage(fd);
          if (r?.error) setError(r.error);
          else formRef.current?.reset();
        })
      }
    >
      <textarea
        name="body"
        rows={2}
        placeholder="Message this client… (start a new thread or reply)"
        className="w-full border border-line-warm px-3 py-2 text-[15px] outline-none focus:border-forest"
      />
      <label className="flex items-center gap-2 text-[12px] text-ink-faint">
        Attach files (documents, images):
        <input type="file" name="files" multiple className="text-[12px]" />
      </label>
      {error && <p className="text-[13px] text-red-700">{error}</p>}
      <button type="submit" disabled={pending} className="btn-gold self-start px-5 text-[14px] disabled:opacity-50">
        {pending ? "Sending…" : "Send message & email client"}
      </button>
    </form>
  );
}
