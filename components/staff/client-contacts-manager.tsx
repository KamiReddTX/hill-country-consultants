"use client";
import { useState, useTransition } from "react";
import { addClientContact, deleteClientContact, setClientSuspended } from "@/app/staff/actions";

type Contact = { id: string; name: string | null; email: string | null; phone: string | null; title: string | null };

/** Admin/BM: manage a client's extra contacts and suspend/reactivate the account. */
export function ClientContactsManager({ clientId, contacts, suspended, reason }: {
  clientId: string; contacts: Contact[]; suspended: boolean; reason: string;
}) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState("");
  const [rsn, setRsn] = useState(reason || "Non-payment");
  const field = "min-h-touch border border-line-warm bg-white px-2 text-[13px]";
  const addId = `addc-${clientId}`;
  return (
    <div className="flex flex-col gap-4">
      {/* Suspension */}
      <div className="flex flex-wrap items-center gap-2">
        <span className={`text-[13px] font-semibold ${suspended ? "text-red-700" : "text-forest"}`}>
          {suspended ? `Suspended${reason ? ` · ${reason}` : ""}` : "Account active"}
        </span>
        {suspended ? (
          <button type="button" disabled={pending} onClick={() => start(async () => { await setClientSuspended(clientId, false); })} className="btn-gold text-[12px] disabled:opacity-50">Reactivate</button>
        ) : (
          <>
            <input value={rsn} onChange={(e) => setRsn(e.target.value)} className={field} placeholder="Reason" />
            <button type="button" disabled={pending} onClick={() => start(async () => { await setClientSuspended(clientId, true, rsn); })} className="border border-red-700 px-2.5 py-1 text-[12px] font-semibold text-red-700 disabled:opacity-50">Suspend account</button>
          </>
        )}
      </div>

      {/* Contacts */}
      <div>
        <p className="mb-1 text-[12px] font-semibold text-forest">Additional contacts (all get client emails)</p>
        {contacts.length > 0 && (
          <ul className="mb-2 flex flex-col gap-1">
            {contacts.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 border-t border-line-soft pt-1 text-[13px]">
                <span className="text-charcoal">{c.name || "—"}{c.title ? ` · ${c.title}` : ""}{c.email ? <span className="text-forest"> · {c.email}</span> : null}{c.phone ? <span className="text-ink-faint"> · {c.phone}</span> : null}</span>
                <button type="button" disabled={pending} onClick={() => start(async () => { await deleteClientContact(c.id); })} className="text-[12px] text-red-700 underline">Delete</button>
              </li>
            ))}
          </ul>
        )}
        <form id={addId} className="flex flex-wrap items-end gap-2 border-t border-line-soft pt-2"
          action={(fd) => start(async () => { setMsg(""); fd.set("clientId", clientId); const r = await addClientContact(fd); if (r?.error) setMsg(r.error); else { (document.getElementById(addId) as HTMLFormElement)?.reset(); setMsg("Added"); } })}>
          <input name="name" placeholder="Name" className={field} />
          <input name="email" type="email" placeholder="Email" className={field} />
          <input name="phone" placeholder="Phone" className={field} />
          <input name="title" placeholder="Title / role" className={field} />
          <button disabled={pending} className="btn-gold text-[12px] disabled:opacity-50">Add contact</button>
          {msg && <span className="text-[12px] text-forest">{msg}</span>}
        </form>
      </div>
    </div>
  );
}
