import { redirect } from "next/navigation";
import Link from "next/link";
import { getStaffMember, getClients, isPrivileged, getMessageUnreads } from "@/lib/staff";
import { createClient } from "@/lib/supabase/server";
import { StaffReplyForm } from "@/components/staff/staff-reply-form";
import { MessageComposer } from "@/components/staff/message-composer";
import { CreateChannelForm } from "@/components/staff/create-channel-form";
import { ChannelAdmin } from "@/components/staff/channel-admin";
import { MarkRead } from "@/components/staff/mark-read";
import { LocalTime } from "@/components/local-time";

function dot(n?: number) {
  return n ? <span className="ml-1.5 inline-flex min-w-[18px] items-center justify-center rounded-full bg-gold px-1.5 py-0.5 text-[11px] font-semibold leading-none text-forest">{n}</span> : null;
}

export default async function StaffMessagesPage({ searchParams }: {
  searchParams?: { view?: string; with?: string; ch?: string; q?: string };
}) {
  const me = await getStaffMember();
  if (!me) redirect("/staff/login");
  const admin = isPrivileged(me);
  const view = searchParams?.view || "clients";
  const db = createClient();
  const unread = await getMessageUnreads(me.id).catch(() => ({ dmTotal: 0, chanTotal: 0, total: 0, byMate: new Map(), byChannel: new Map() } as any));

  const tab = (id: string, label: string, badge?: number) => (
    <Link href={`/staff/messages?view=${id}`}
      className={`px-3 py-1.5 text-[14px] ${view === id ? "border-b-2 border-forest font-medium text-forest" : "prose-muted hover:text-forest"}`}>{label}{dot(badge)}</Link>
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
        {tab("dm", "Team DMs", unread.dmTotal)}
        {tab("channels", "Channels", unread.chanTotal)}
        {tab("search", "Search")}
        {admin && tab("oversight", "Oversight")}
      </nav>

      {view === "clients" && <ClientsView db={db} admin={admin} />}
      {view === "dm" && <DmView db={db} meId={me.id} withId={searchParams?.with} byMate={unread.byMate} />}
      {view === "channels" && <ChannelsView db={db} meId={me.id} admin={admin} chId={searchParams?.ch} byChannel={unread.byChannel} />}
      {view === "search" && <SearchView db={db} q={searchParams?.q} />}
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

  // Attachments for the visible messages.
  const noteIds = (notes ?? []).map((n: any) => n.id);
  const { data: nfiles } = noteIds.length ? await db.from("note_files").select("*").in("note_id", noteIds) : { data: [] as any[] };
  const filesByNote = new Map<string, any[]>();
  (nfiles ?? []).forEach((f: any) => { const a = filesByNote.get(f.note_id) || []; a.push(f); filesByNote.set(f.note_id, a); });

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
                  <li key={n.id} className={`max-w-[80%] px-3 py-2 text-[14px] ${n.sender === "staff" ? "ml-auto bg-forest text-white" : "bg-cream/60 text-charcoal"}`}>
                    <p className="mb-0.5 text-[11px] opacity-70">{n.sender === "staff" ? (n.author_name || "Team") : "Client"} · <LocalTime iso={n.created_at} /></p>
                    {n.body && <p className="whitespace-pre-wrap">{n.body}</p>}
                    {(filesByNote.get(n.id) || []).map((f: any) => (
                      <a key={f.id} href={`/api/message-file/${f.id}`} target="_blank" rel="noreferrer" className={`mt-1 block text-[12px] underline ${n.sender === "staff" ? "text-white/90" : "text-forest"}`}>📎 {f.name}</a>
                    ))}
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
                        <span className="text-[11px] text-ink-faint">{n.author_name || "Team"} · <LocalTime iso={n.created_at} /></span>
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

// ── Team DMs ─────────────────────────────────────────────────────────────────
async function DmView({ db, meId, withId, byMate }: { db: any; meId: string; withId?: string; byMate: Map<string, number> }) {
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
            className={`flex items-center justify-between px-2 py-1.5 text-[14px] ${withId === m.id ? "bg-cream/70 font-medium text-forest" : "text-charcoal hover:bg-cream/40"}`}>
            <span>{m.name || m.email}</span>{dot(byMate.get(m.id))}
          </Link>
        ))}
      </aside>

      <section className="border border-line-warm bg-white p-5">
        {!active ? <p className="text-[15px] prose-muted">Pick a teammate to start a conversation.</p> : (
          <>
            <MarkRead kind="dm" id={withId!} />
            <h2 className="mb-3 font-fraunces text-[18px] font-medium text-forest">{nameOf.get(withId!)}</h2>
            {thread.length === 0 ? <p className="text-[14px] prose-muted">No messages yet. Say hello.</p> : (
              <ul className="flex flex-col gap-2">
                {thread.map((n: any) => (
                  <li key={n.id} className={`max-w-[80%] px-3 py-2 text-[14px] ${n.sender_id === meId ? "ml-auto bg-forest text-white" : "bg-cream/60 text-charcoal"}`}>
                    <p className="mb-0.5 text-[11px] opacity-70">{nameOf.get(n.sender_id) || "—"} · <LocalTime iso={n.created_at} /></p>
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

// ── Channels ─────────────────────────────────────────────────────────────────
async function ChannelsView({ db, meId, admin, chId, byChannel }: { db: any; meId: string; admin: boolean; chId?: string; byChannel: Map<string, number> }) {
  const { data: channels } = await db.from("channels").select("*").eq("archived", false).order("name");
  const list = (channels ?? []) as any[];
  const active = chId ? list.find((c) => c.id === chId) : list[0];
  let msgs: any[] = [];
  let posters: string[] = [];
  let mates: any[] = [];
  let canPost = true;
  if (active) {
    const [{ data: cm }, { data: cp }, { data: roster }] = await Promise.all([
      db.from("channel_messages").select("*").eq("channel_id", active.id).order("created_at", { ascending: true }),
      db.from("channel_posters").select("staff_id").eq("channel_id", active.id),
      db.rpc("staff_roster"),
    ]);
    msgs = cm ?? [];
    posters = (cp ?? []).map((r: any) => r.staff_id);
    mates = ((roster ?? []) as any[]).filter((r) => r.id !== meId);
    canPost = admin || (active.post_policy || "all") === "all" || posters.includes(meId);
  }
  return (
    <div className="grid gap-5 md:grid-cols-[220px_1fr]">
      <aside className="flex flex-col gap-1 border border-line-warm bg-white p-2">
        <p className="px-2 py-1 text-[12px] font-semibold uppercase tracking-wide text-ink-faint">Channels</p>
        {list.map((c) => (
          <Link key={c.id} href={`/staff/messages?view=channels&ch=${c.id}`}
            className={`flex items-center justify-between px-2 py-1.5 text-[14px] ${active?.id === c.id ? "bg-cream/70 font-medium text-forest" : "text-charcoal hover:bg-cream/40"}`}>
            <span>#{c.name}</span>{dot(byChannel.get(c.id))}
          </Link>
        ))}
        {admin && <div className="mt-2 border-t border-line-soft pt-2"><CreateChannelForm /></div>}
      </aside>

      <section className="border border-line-warm bg-white p-5">
        {!active ? <p className="text-[15px] prose-muted">No channels yet{admin ? " — create one." : "."}</p> : (
          <>
            <MarkRead kind="channel" id={active.id} />
            <h2 className="font-fraunces text-[18px] font-medium text-forest">#{active.name}{active.post_policy === "restricted" ? <span className="ml-2 text-[11px] font-normal text-ink-faint">· restricted posting</span> : null}</h2>
            {active.description && <p className="mb-3 text-[12px] prose-muted">{active.description}</p>}
            {admin && <ChannelAdmin channel={active} mates={mates} posters={posters} />}
            {msgs.length === 0 ? <p className="text-[14px] prose-muted">No messages yet.</p> : (
              <ul className="flex flex-col gap-2">
                {msgs.map((n: any) => (
                  <li key={n.id} className="border-b border-line-soft/60 pb-2 text-[14px]">
                    <p className="text-[12px]"><span className="font-medium text-forest">{n.author_name || "—"}</span> <span className="text-ink-faint">· <LocalTime iso={n.created_at} /></span></p>
                    <p className="whitespace-pre-wrap text-charcoal">{n.body}</p>
                  </li>
                ))}
              </ul>
            )}
            {canPost
              ? <MessageComposer kind="channel" targetId={active.id} placeholder={`Message #${active.name}…`} cta="Post" />
              : <p className="mt-3 border-t border-line-soft pt-3 text-[13px] prose-muted">Posting in this channel is limited to selected members. You can read it, but not post.</p>}
          </>
        )}
      </section>
    </div>
  );
}

// ── Search across everything the user can see ────────────────────────────────
async function SearchView({ db, q }: { db: any; q?: string }) {
  const term = (q || "").trim();
  const field = "min-h-touch w-full max-w-[420px] border border-line-warm bg-white px-3 text-[15px]";
  const searchBox = (
    <form method="get" className="flex items-center gap-2">
      <input type="hidden" name="view" value="search" />
      <input name="q" defaultValue={term} placeholder="Search messages…" className={field} />
      <button className="btn-gold text-[14px]">Search</button>
    </form>
  );
  if (term.length < 2) return <div className="flex flex-col gap-3">{searchBox}<p className="text-[14px] prose-muted">Type at least two characters to search your clients, DMs, channels, and team notes.</p></div>;

  const like = `%${term}%`;
  const [clients, { data: cNotes }, { data: dms }, { data: chMsgs }, { data: sNotes }, { data: roster }, { data: chans }] = await Promise.all([
    getClients(),
    db.from("client_notes").select("*").ilike("body", like).order("created_at", { ascending: false }).limit(30),
    db.from("direct_messages").select("*").ilike("body", like).order("created_at", { ascending: false }).limit(30),
    db.from("channel_messages").select("*").ilike("body", like).order("created_at", { ascending: false }).limit(30),
    db.from("client_staff_notes").select("*").ilike("body", like).order("created_at", { ascending: false }).limit(30),
    db.rpc("staff_roster"),
    db.from("channels").select("id,name"),
  ]);
  const cname = new Map<string, string>((clients ?? []).map((c: any) => [c.id, c.business || c.contact || c.email]));
  const sname = new Map<string, string>((roster ?? []).map((r: any) => [r.id, r.name || r.email]));
  const chname = new Map<string, string>((chans ?? []).map((c: any) => [c.id, c.name]));

  const total = (cNotes?.length || 0) + (dms?.length || 0) + (chMsgs?.length || 0) + (sNotes?.length || 0);
  const group = (title: string, rows: any[], line: (r: any) => string) => rows.length > 0 && (
    <section key={title}>
      <h3 className="mb-1 text-[13px] font-semibold text-forest">{title} ({rows.length})</h3>
      <ul className="flex flex-col gap-1">
        {rows.map((r: any) => (
          <li key={r.id} className="border-b border-line-soft/60 py-1.5 text-[14px]">
            <p className="text-[12px] text-ink-faint">{line(r)} · <LocalTime iso={r.created_at} /></p>
            <p className="whitespace-pre-wrap text-charcoal">{r.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );

  return (
    <div className="flex flex-col gap-5">
      {searchBox}
      {total === 0 ? <p className="text-[14px] prose-muted">No messages match &ldquo;{term}.&rdquo;</p> : (
        <div className="flex flex-col gap-5">
          {group("Client threads", cNotes ?? [], (r) => `${cname.get(r.client_id) || "Client"} · ${r.sender === "staff" ? (r.author_name || "Team") : "Client"}`)}
          {group("Team DMs", dms ?? [], (r) => `${sname.get(r.sender_id) || "—"} → ${sname.get(r.recipient_id) || "—"}`)}
          {group("Channels", chMsgs ?? [], (r) => `#${chname.get(r.channel_id) || "channel"} · ${r.author_name || "—"}`)}
          {group("Team notes", sNotes ?? [], (r) => `${cname.get(r.client_id) || "Client"} · ${r.author_name || "Team"} (private)`)}
        </div>
      )}
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
              <p className="text-[12px] text-ink-faint">{nameOf.get(n.sender_id) || "—"} → {nameOf.get(n.recipient_id) || "—"} · <LocalTime iso={n.created_at} /></p>
              <p className="whitespace-pre-wrap text-charcoal">{n.body}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
