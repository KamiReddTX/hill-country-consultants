"use client";
import { useState, useTransition } from "react";
import { addClient } from "@/app/staff/actions";

/** Admin/BM: create a client account by hand (and invite them to the portal). */
export function AddClientForm() {
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const field = "min-h-touch border border-line-warm bg-white px-3 text-[14px] outline-none focus:border-forest";
  return (
    <form
      id="add-client-form"
      className="grid gap-2 sm:grid-cols-2"
      action={(fd) => start(async () => {
        setError(""); setDone(false);
        const r = await addClient(fd);
        if (r?.error) setError(r.error);
        else { setDone(true); (document.getElementById("add-client-form") as HTMLFormElement)?.reset(); }
      })}
    >
      <input name="business" placeholder="Business name" className={field} />
      <input name="contact" placeholder="Contact name" className={field} />
      <input name="email" type="email" required placeholder="Client email (required)" className={field} />
      <input name="phone" placeholder="Phone" className={field} />
      <select name="billing_type" defaultValue="standard" className={field}>
        <option value="standard">Standard billing</option>
        <option value="comp">Comp — zeroed account</option>
        <option value="barter">Barter client</option>
      </select>
      <button disabled={pending} className="btn-gold self-start px-5 text-[14px] disabled:opacity-50">{pending ? "Adding…" : "Add client & invite"}</button>
      {error && <p className="sm:col-span-2 text-[13px] text-red-700">{error}</p>}
      {done && <p className="sm:col-span-2 text-[13px] text-forest">Client created — a portal invite is on its way to their email.</p>}
    </form>
  );
}
