import { redirect } from "next/navigation";
import Link from "next/link";
import { getStaffMember, getClients, isPrivileged } from "@/lib/staff";
import { createClient } from "@/lib/supabase/server";
import { StaffReplyForm } from "@/components/staff/staff-reply-form";
import { MessageComposer } from "@/components/staff/message-composer";
import { CreateChannelForm } from "@/components/staff/create-channel-form";

function when(s: string) {
  return new Date(s).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export default async function StaffMessagesPage({ searchParams }: {
  searchParams?: { view?: string; with?: string; ch?: string };
}) {
  const me = await getStaffMember();
  if (!me) redirect("/staff/login");
  const admin = isPrivileged(me);
  const view = searchParams?.view || "clients";
  const db = createClient();

  const tab = (id: string, label: string) => (
    <Link href={`/staff/messages?view=${id}`}
      className={`px-3 py-1.5 text-[14px] ${view === id ? "border-b-2 border-forest font-medium text-forest" : "prose-muted hover:text-forest"}`}>{label}</Link>
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-fraunces text-[32px] font-normal text-forest">Messages</h1>
        <span className="rule-gold mb-3 mt-2" />
        <p className="max-w-[48em] prose-soft">Talk with your clients, DM teammates, and post in shared channels. Everything is recorded — client threads stay on the account even if it changes hands.</p>
      </div>

      <nav className="flex flex-wrap gap-1 border-b border-line-soft">
        {tab("clients", "Clients")}
        {tab("dm", "Team DMs")}
        {tab("channels", "Channels")}
        {admin && tab("oversight", "Oversight")}
      </nav>

      {view === "clients" && <ClientsView db={db} admin={admin} />}
      {view === "dm" && <DmView db={db} meId={me.id} withId={searchParams?.with} />}
      {view === "channels" && <ChannelsView db={db} chId={searchParams?.ch} />}
      {view === "oversight" && admin && <OversightView db={db} />}
    </div>
  );
}

// ── Clients: two-way client thread + private staff notes ─────────────────────
async function ClientsView({ db, admin }: { db: any; admin: boolean }) {
  const clients = await getClients();
  const ids = clients.map((c) => c.id);
  const [{ data: notes }, { data: staffNotes }] = await Promise.all([
    ids.length ? db.from("client_notes").select("*").in("client_id", ids).order("created_at", { ascending: true }) : Promise.resolve({ data: [] }),
    ids.length ? db.from("client_staff_notes").select("*").in("client_id", ids).order("created_at", { ascending: true }) : Promise.resolve({ data: [] }),
  ]);
  const byClient = new Map<string, any[]>();
  (notes ?? []).forEach((n: any) => { const a = byClient.get(n.client_id) || []; a.push(n); byClient.set(n.client_id, a); });
  const notesByClient = new Map<string, any[]>();
  (staffNotes ?? []).forEach((n: any) => { const a = notesByClient.get(n.client_id) || []; a.push(n); notesByClient.set(n.client_id, a); });

  if (clients.length === 0) return <p className="text-[15px] prose-muted">No clients assigned to you yet.</p>;

  return (
    <div className="flex flex-col gap-6">
      {admin && <p className="text-[13px] prose-muted">As an admin you can see every client&apos;s full thread — including messages from a previous VA, retained after the account changed hands.</p>}
      {clients.map((c) => {
        const thread = byClient.get(c.id) || [];
        const team = notesByClient.get(c.id) || [];
        const label = c.business || c.contact || c.email;
        return (
          <section key={c.id} className="border border-line-warm bg-white p-5">
            <h2 className="font-fraunces text-[18px] font-medium text-forest">{label}</h2>
            <p className="mb-3 text-[12px] prose-muted">{c.email}</p>
            {thread.length === 0 ? <p className="text-[14px] prose-muted">No messages yet.</p> : (
              <ul className="flex flex-col gap-2">
                {thread.map((n: any) => (
                  <li key={n.id} className={`max-w-[80%] px-3 py-2 text-[14px] ${n.sender === "staff" ? "self-end bg-forest text-white" : "self-start bg-cream/60 text-charcoal"} ${n.sender === "staff" ? "ml-auto" : ""}`}>
                    <p className="mb-0.5 text-[11px] opacity-70">{n.sender === "staff" ? (n.author_name || "Team") : "Client"} · {when(n.created_at)}</p>
                    <p className="whitespace-pre-wrap">{n.body}</p>
                  </li>
                ))}
              </ul>
            )}
            <StaffReplyForm clientId={c.id} />

            <details className="mt-4 border-t border-line-soft pt-3">
              <summary className="cursor-pointer text-[13px] font-medium text-forest">Team notes · client can&apos;t see these ({team.length})</summary>
              <div className="mt-2">
                {team.length > 0 && (
                  <ul className="flex flex-col gap-1">
                    {team.map((n: any) => (
                      <li key={n.id} className="border-l-2 border-gold bg-cream/30 px-3 py-1.5 text-[13px]">
                        <span className="text-[11px] text-ink-faint">{n.author_name || "Team"} · {when(n.created_at)}</span>
                        <p className="whitespace-pre-wrap text-charcoal">{n.body}</p>
                      </li>
                    ))}
                  </ul>
                )}
                <MessageComposer kind="note" targetId={c.id} placeholder="Private note for the team about this account…" cta="Add team note" />
              </div>
            </details>
          </section>
        );
      })}
    </div>
  );
}

// ── Team DMs: pick a teammate, 1:1 thread ────────────────────────────────────
async function DmView({ db, meId, withId }: { db: any; meId: string; withId?: string }) {
  const { data: roster } = await db.rpc("staff_roster");
  const mates = ((roster ?? []) as any[]).filter((r) => r.id !== meId);
  const nameOf = new Map<string, string>((roster ?? []).map((r: any) => [r.id, r.name || r.email]));
  const active = withId && mates.find((m) => m.id === withId);

  let thread: any[] = [];
  if (active) {
    const { data: dms } = await db.from("direct_messages").select("*")
      .or(`and(sender_id.eq.${meId},recipient_id.eq.${withId}),and(sender_id.eq.${withId},recipient_id.eq.${meId})`)
      .order("created_at", { ascending: true });
    thread = dms ?? [];
  }

  return (
    <div className="grid gap-5 md:grid-cols-[220px_1fr]">
      <aside className="flex flex-col gap-1 border border-line-warm bg-white p-2">
        <p className="px-2 py-1 text-[12px] font-semibold uppercase tracking-wide text-ink-faint">Teammates</p>
        {mates.length === 0 && <p className="px-2 text-[13px] prose-muted">No teammates yet.</p>}
        {mates.map((m) => (
          <Link key={m.id} href={`/staff/messages?view=dm&with=${m.id}`}
            className={`px-2 py-1.5 text-[14px] ${withId === m.id ? "bg-cream/70 font-medium text-forest" : "text-charcoal hover:bg-cream/40"}`}>
            {m.name || m.email}
          </Link>
        ))}
      </aside>

      <section className="border border-line-warm bg-white p-5">
        {!active ? <p className="text-[15px] prose-muted">Pick a teammate to start a conversation.</p> : (
          <>
            <h2 className="mb-3 font-fraunces text-[18px] font-medium text-forest">{nameOf.get(withId!)}</h2>
            {thread.length === 0 ? <p className="text-[14px] prose-muted">No messages yet. Say hello.</p> : (
              <ul className="flex flex-col gap-2">
                {thread.map((n: any) => (
                  <li key={n.id} className={`max-w-[80%] px-3 py-2 text-[14px] ${n.sender_id === meId ? "ml-auto bg-forest text-white" : "bg-cream/60 text-charcoal"}`}>
                    <p className="mb-0.5 text-[11px] opacity-70">{nameOf.get(n.sender_id) || "—"} · {when(n.created_at)}</p>
                    <p className="whitespace-pre-wrap">{n.body}</p>
                  </li>
                ))}
              </ul>
            )}
            <MessageComposer kind="dm" targetId={withId!} placeholder="Message your teammate…" cta="Send DM" />
          </>
        )}
      </section>
    </div>
  );
}

// ── Channels: shared topic chat ──────────────────────────────────────────────
async function ChannelsView({ db, chId }: { db: any; chId?: string }) {
  const { data: channels } = await db.from("channels").select("*").eq("archived", false).order("name");
  const list = (channels ?? []) as any[];
  const active = chId ? list.find((c) => c.id === chId) : list[0];
  let msgs: any[] = [];
  if (active) {
    const { data } = await db.from("channel_messages").select("*").eq("channel_id", active.id).order("created_at", { ascending: true });
    msgs = data ?? [];
  }
  return (
    <div className="grid gap-5 md:grid-cols-[220px_1fr]">
      <aside className="flex flex-col gap-1 border border-line-warm bg-white p-2">
        <p className="px-2 py-1 text-[12px] font-semibold uppercase tracking-wide text-ink-faint">Channels</p>
        {list.map((c) => (
          <Link key={c.id} href={`/staff/messages?view=channels&ch=${c.id}`}
            className={`px-2 py-1.5 text-[14px] ${active?.id === c.id ? "bg-cream/70 font-medium text-forest" : "text-charcoal hover:bg-cream/40"}`}>
            #{c.name}
          </Link>
        ))}
        <div className="mt-2 border-t border-line-soft pt-2"><CreateChannelForm /></div>
      </aside>

      <section className="border border-line-warm bg-white p-5">
        {!active ? <p className="text-[15px] prose-muted">No channels yet — create one.</p> : (
          <>
            <h2 className="font-fraunces text-[18px] font-medium text-forest">#{active.name}</h2>
            {active.description && <p className="mb-3 text-[12px] prose-muted">{active.description}</p>}
            {msgs.length === 0 ? <p className="text-[14px] prose-muted">No messages yet.</p> : (
              <ul className="flex flex-col gap-2">
                {msgs.map((n: any) => (
                  <li key={n.id} className="border-b border-line-soft/60 pb-2 text-[14px]">
                    <p className="text-[12px]"><span className="font-medium text-forest">{n.author_name || "—"}</span> <span className="text-ink-faint">· {when(n.created_at)}</span></p>
                    <p className="whitespace-pre-wrap text-charcoal">{n.body}</p>
                  </li>
                ))}
              </ul>
            )}
            <MessageComposer kind="channel" targetId={active.id} placeholder={`Message #${active.name}…`} cta="Post" />
          </>
        )}
      </section>
    </div>
  );
}

// ── Oversight (admin/BM): read all staff DMs ─────────────────────────────────
async function OversightView({ db }: { db: any }) {
  const [{ data: roster }, { data: dms }] = await Promise.all([
    db.rpc("staff_roster"),
    db.from("direct_messages").select("*").order("created_at", { ascending: false }).limit(200),
  ]);
  const nameOf = new Map<string, string>((roster ?? []).map((r: any) => [r.id, r.name || r.email]));
  const list = (dms ?? []) as any[];
  return (
    <section className="flex flex-col gap-3">
      <p className="text-[13px] prose-muted">Every employee-to-employee DM, newest first. Staff are told these are company records.</p>
      {list.length === 0 ? <p className="text-[15px] prose-muted">No direct messages yet.</p> : (
        <ul className="flex flex-col gap-1">
          {list.map((n: any) => (
            <li key={n.id} className="border-b border-line-soft/60 py-2 text-[14px]">
              <p className="text-[12px] text-ink-faint">{nameOf.get(n.sender_id) || "—"} → {nameOf.get(n.recipient_id) || "—"} · {when(n.created_at)}</p>
              <p className="whitespace-pre-wrap text-charcoal">{n.body}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
