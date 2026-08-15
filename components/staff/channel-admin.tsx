"use client";
import { useState, useTransition } from "react";
import { updateChannel, setChannelPosters } from "@/app/staff/actions";

type Mate = { id: string; name: string | null; email: string };
type Ch = { id: string; name: string; description: string | null; post_policy: string | null; archived: boolean };

/** Admin/BM: edit a channel and choose who may post in it. */
export function ChannelAdmin({ channel, mates, posters }: { channel: Ch; mates: Mate[]; posters: string[] }) {
  const [open, setOpen] = useState(false);
  const [policy, setPolicy] = useState(channel.post_policy || "all");
  const [chosen, setChosen] = useState<string[]>(posters);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState("");
  const field = "min-h-touch border border-line-warm bg-white px-2 text-[14px]";
  const toggle = (id: string) => setChosen((c) => c.includes(id) ? c.filter((x) => x !== id) : [...c, id]);

  if (!open) return <button type="button" onClick={() => setOpen(true)} className="text-[12px] link-underline">Manage channel</button>;
  return (
    <div className="mb-4 flex flex-col gap-3 border border-line-warm bg-cream/30 p-4">
      <form className="flex flex-col gap-2"
        action={(fd) => start(async () => { setMsg(""); fd.set("id", channel.id); fd.set("post_policy", policy); const r = await updateChannel(fd); setMsg(r?.error || "Saved"); })}>
        <div className="flex flex-wrap gap-2">
          <input name="name" defaultValue={channel.name} className={`${field} flex-1`} />
          <input name="description" defaultValue={channel.description || ""} placeholder="Description" className={`${field} flex-1`} />
        </div>
        <label className="flex flex-col gap-1 text-[12px] text-ink-faint">Who can post
          <select value={policy} onChange={(e) => setPolicy(e.target.value)} className={field}>
            <option value="all">Everyone on staff</option>
            <option value="restricted">Only chosen members (admins/BMs always can)</option>
          </select>
        </label>
        <div className="flex items-center gap-2">
          <button disabled={pending} className="btn-gold text-[12px] disabled:opacity-50">Save settings</button>
          <button type="button" disabled={pending} onClick={() => start(async () => { const fd = new FormData(); fd.set("id", channel.id); fd.set("archived", String(!channel.archived)); await updateChannel(fd); })} className="text-[12px] text-red-700 underline">{channel.archived ? "Unarchive" : "Archive"}</button>
          {msg && <span className="text-[12px] text-forest">{msg}</span>}
        </div>
      </form>

      {policy === "restricted" && (
        <div className="border-t border-line-soft pt-2">
          <p className="mb-1 text-[12px] font-medium text-forest">Allowed posters</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {mates.map((m) => (
              <label key={m.id} className="flex items-center gap-1 text-[13px] text-charcoal">
                <input type="checkbox" checked={chosen.includes(m.id)} onChange={() => toggle(m.id)} /> {m.name || m.email}
              </label>
            ))}
          </div>
          <button type="button" disabled={pending} onClick={() => start(async () => { setMsg(""); const r = await setChannelPosters(channel.id, chosen); setMsg(r?.error || "Posters saved"); })} className="btn-gold mt-2 text-[12px] disabled:opacity-50">Save posters</button>
        </div>
      )}
      <button type="button" onClick={() => setOpen(false)} className="self-start text-[12px] prose-muted underline">Close</button>
    </div>
  );
}
