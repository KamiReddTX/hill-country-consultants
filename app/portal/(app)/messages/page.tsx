import { redirect } from "next/navigation";
import { getPortalClient, getPortalData } from "@/lib/portal";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { MessageForm } from "@/components/portal/message-form";

export default async function MessagesPage() {
  const client = await getPortalClient();
  if (!client) redirect("/portal/login");
  const { notes } = await getPortalData(client);
  const thread = [...notes].reverse(); // getPortalData returns newest-first; show oldest-first

  // Attachments for this thread.
  const { data: nfiles } = await createClient().from("note_files").select("*").eq("client_id", client.id);
  const filesByNote = new Map<string, any[]>();
  (nfiles ?? []).forEach((f: any) => { const a = filesByNote.get(f.note_id) || []; a.push(f); filesByNote.set(f.note_id, a); });

  // Resolve the assigned VA/AM contact card.
  let owner: { name: string; email: string } | null = null;
  if (client.assigned_to && /^[0-9a-f-]{36}$/i.test(client.assigned_to)) {
    const { data: s } = await createServiceClient().from("staff").select("name,email,role").eq("id", client.assigned_to).maybeSingle();
    if (s) owner = { name: (s as any).name || "Your account lead", email: (s as any).email };
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-fraunces text-[32px] font-normal text-forest">Messages</h1>
        <span className="rule-gold mb-4 mt-2" />
      </div>

      {/* Assigned VA/AM contact */}
      <div className="border border-line-warm bg-white p-4">
        <p className="kicker mb-1">Your account team</p>
        {owner ? (
          <p className="text-[15px] text-charcoal">
            <span className="font-medium">{owner.name}</span>
            {owner.email && <> · <a className="link-underline" href={`mailto:${owner.email}`}>{owner.email}</a></>}
          </p>
        ) : (
          <p className="text-[15px] prose-muted">Your account lead is being assigned — you can still send a message below.</p>
        )}
      </div>

      {/* Recorded conversation */}
      <div>
        {thread.length === 0 ? (
          <p className="border border-dashed border-line-warm bg-white p-6 text-[15px] prose-muted">No messages yet. Send the first one below.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {thread.map((n: any) => {
              const staff = n.sender === "staff";
              return (
                <li key={n.id} className={`flex ${staff ? "justify-start" : "justify-end"}`}>
                  <div className={`max-w-[80%] border p-3 ${staff ? "border-line-warm bg-white" : "border-forest/30 bg-forest/5"}`}>
                    <p className="text-[12px] font-semibold text-forest">{staff ? (n.author_name || "Your account team") : "You"}</p>
                    {n.body && <p className="mt-1 whitespace-pre-wrap text-[15px] prose-soft">{n.body}</p>}
                    {(filesByNote.get(n.id) || []).map((f: any) => (
                      <a key={f.id} href={`/api/message-file/${f.id}`} target="_blank" rel="noreferrer" className="mt-1 block text-[13px] text-forest underline underline-offset-2 hover:text-gold">📎 {f.name}</a>
                    ))}
                    <p className="mt-1 text-[11px] text-ink-faint">{new Date(n.created_at).toLocaleString()}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <MessageForm />
    </div>
  );
}
