"use client";
import { useState, useTransition } from "react";
import { uploadClientFile } from "@/app/staff/actions";

/** Staff: upload one or more files into a client's shared Files space. */
export function ClientFileUpload({ clientId }: { clientId: string }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState("");
  const formId = `up-${clientId}`;
  return (
    <form
      id={formId}
      className="mt-3 flex flex-wrap items-center gap-3 border-t border-line-soft pt-3"
      action={(fd) => start(async () => {
        setMsg("");
        fd.set("clientId", clientId);
        const r = await uploadClientFile(fd);
        if (r?.error) setMsg(r.error);
        else { setMsg("Uploaded"); (document.getElementById(formId) as HTMLFormElement)?.reset(); }
      })}
    >
      <input type="file" name="files" multiple required className="text-[13px]" />
      <button disabled={pending} className="btn-gold text-[13px] disabled:opacity-50">{pending ? "Uploading…" : "Upload for client"}</button>
      {msg && <span className="text-[12px] text-forest">{msg}</span>}
    </form>
  );
}
