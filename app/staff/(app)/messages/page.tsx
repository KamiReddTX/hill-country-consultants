import { redirect } from "next/navigation";
import { getStaffMember, getClients, isAdmin } from "@/lib/staff";
import { createClient } from "@/lib/supabase/server";
import { StaffReplyForm } from "@/components/staff/staff-reply-form";

export default async function StaffMessagesPage() {
  const me = await getStaffMember();
  if (!me) redirect("/staff/login");
  const clients = await getClients();
  const admin = isAdmin(me);
  const mine = admin ? clients : clients.filter((c) => c.assigned_to === me.id);
  const ids = mine.map((c) => c.id);

  const db = createClient();
  const { data: notes } = ids.length
    ? await db.from("client_notes").select("*").in("client_id", ids).order("created_at", { ascending: true })
    : { data: [] as any[] };

  const byClient = new Map<string, any[]>();
  (notes ?? []).forEach((n: any) => { const a = byClient.get(n.client_id) || []; a.push(n); byClient.set(n.client_id, a); });

  const threads = mine
    .map((c) => ({ c, msgs: byClient.get(c.id) || [] }))
    .filter((t) => t.msgs.length > 0)
    .sort((a, b) => new Date(b.msgs[b.msgs.length - 1].created_at).getTime() - new Date(a.msgs[a.msgs.length - 1].created_at).getTime());

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-fraunces text-[32px] font-normal text-forest">Messages</h1>
        <span className="rule-gold mb-4 mt-2" />
        <p className="max-w-[48em] prose-soft">Conversations with {admin ? "all clients" : "the clients you own"}. Replying posts to their portal and emails them that a response is waiting.</p>
      </div>

      {threads.length === 0 ? (
        <p className="border border-dashed border-line-warm bg-white p-6 text-[15px] prose-muted">No client messages yet.</p>
      ) : (
        <ul className="flex flex-col gap-5">
          {threads.map(({ c, msgs }) => (
            <li key={c.id} className="border border-line-warm bg-white p-5">
              <p className="font-fraunces text-[18px] text-forest">{c.business || c.contact || c.email}</p>
              <p className="mb-3 text-[12px] prose-muted">{c.contact || ""}{c.email ? ` · ${c.email}` : ""}</p>
              <ul className="flex flex-col gap-2">
                {msgs.map((n: any) => {
                  const staff = n.sender === "staff";
                  return (
                    <li key={n.id} className={`flex ${staff ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] border p-3 ${staff ? "border-forest/30 bg-forest/5" : "border-line-warm bg-cream"}`}>
                        <p className="text-[12px] font-semibold text-forest">{staff ? (n.author_name || "You / team") : (c.contact || "Client")}</p>
                        <p className="mt-1 whitespace-pre-wrap text-[15px] prose-soft">{n.body}</p>
                        <p className="mt-1 text-[11px] text-ink-faint">{new Date(n.created_at).toLocaleString()}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
              <StaffReplyForm clientId={c.id} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
