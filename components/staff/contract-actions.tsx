"use client";
import { useState, useTransition } from "react";
import {
  sendContractForSignature, checkContractSignature, setContractStatus,
  deleteContract, contractFileUrl, uploadContractFile,
} from "@/app/staff/actions";

/** Per-contract controls: send via DocuSign, check status, mark signed / void,
 *  view or attach the PDF, delete. */
export function ContractActions({ id, status, hasFile, hasSigner, envelopeSent }: {
  id: string; status: string; hasFile: boolean; hasSigner: boolean; envelopeSent: boolean;
}) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState("");
  const run = (fn: () => Promise<{ error?: string; ok?: boolean }>, okMsg = "") =>
    start(async () => { setMsg(""); const r = await fn(); setMsg(r?.error ? r.error : okMsg); });

  const view = () => start(async () => {
    setMsg("");
    const r = await contractFileUrl(id);
    if (r?.error) setMsg(r.error);
    else if (r.url) window.open(r.url, "_blank", "noopener");
  });

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-1.5">
        {status !== "signed" && status !== "void" && (
          <button type="button" disabled={pending || !hasFile || !hasSigner} title={!hasFile ? "Attach a PDF first" : !hasSigner ? "Add a signer email first" : ""}
            onClick={() => run(() => sendContractForSignature(id), "Sent for signature")}
            className="btn-gold px-2 py-0.5 text-[12px] disabled:opacity-40">
            {status === "sent" ? "Resend" : "Send for signature"}
          </button>
        )}
        {envelopeSent && status !== "signed" && (
          <button type="button" disabled={pending} onClick={() => run(() => checkContractSignature(id), "Status checked")}
            className="border border-forest px-2 py-0.5 text-[12px] text-forest disabled:opacity-40">Check status</button>
        )}
        {status !== "signed" && (
          <button type="button" disabled={pending} onClick={() => run(() => setContractStatus(id, "signed"), "Marked signed")}
            className="border border-line-warm px-2 py-0.5 text-[12px] disabled:opacity-40">Mark signed</button>
        )}
        {status !== "void" && (
          <button type="button" disabled={pending} onClick={() => run(() => setContractStatus(id, "void"), "Voided")}
            className="text-[11px] text-red-700 underline disabled:opacity-40">Void</button>
        )}
        {hasFile && <button type="button" disabled={pending} onClick={view} className="text-[12px] link-underline">View PDF</button>}
        <button type="button" disabled={pending} onClick={() => { if (confirm("Delete this contract?")) run(() => deleteContract(id)); }} className="text-[11px] text-red-700 underline disabled:opacity-40">Delete</button>
      </div>
      {!hasFile && (
        <form action={(fd) => start(async () => { setMsg(""); fd.set("id", id); const r = await uploadContractFile(fd); setMsg(r?.error ? r.error : "PDF attached"); })} className="flex items-center gap-1.5">
          <input name="file" type="file" accept="application/pdf" className="text-[11px]" />
          <button type="submit" disabled={pending} className="border border-line-warm px-2 py-0.5 text-[12px] disabled:opacity-40">Attach PDF</button>
        </form>
      )}
      {msg && <span className="text-[12px] text-forest">{msg}</span>}
    </div>
  );
}
