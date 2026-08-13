import { redirect } from "next/navigation";
import { getPortalClient, getPortalData } from "@/lib/portal";
import { MessageForm } from "@/components/portal/message-form";
import { linkifyEmail } from "@/components/linkify";

const CHANNELS = [
  { n: "Your account lead", d: "One named contact for every service line. Requests acknowledged the same business day." },
  { n: "Shared task board", d: "Anything with a due date lives there, not in an inbox thread." },
  { n: "Email", d: "info@hillcountryconsultants.com for anything you want on the record." },
  { n: "Phone", d: "470-478-1590 during office hours. Blockers get a same-day call back." },
  { n: "Scheduled reviews", d: "On your tier cadence, with a summary each cycle." },
];

export default async function MessagesPage() {
  const client = await getPortalClient();
  if (!client) redirect("/portal/login");
  const { notes } = await getPortalData(client);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-fraunces text-[32px] font-normal text-forest">Messages</h1>
        <span className="rule-gold mb-4 mt-2" />
        <p className="max-w-[48em] prose-soft">Anything you send here reaches your account lead and is kept on the record.</p>
      </div>

      <MessageForm />

      <div>
        <p className="kicker mb-3">Your messages</p>
        {notes.length === 0 ? (
          <p className="border border-dashed border-line-warm bg-white p-6 text-[15px] prose-muted">No messages yet.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {notes.map((n) => (
              <li key={n.id} className="border border-line-warm bg-white p-4">
                <p className="text-[15px] prose-soft">{n.body}</p>
                <p className="mt-1 text-[12px] text-ink-faint">{new Date(n.created_at).toLocaleString()}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <p className="kicker mb-3">How to reach us</p>
        <ul className="grid gap-3 md:grid-cols-2">
          {CHANNELS.map((c) => (
            <li key={c.n} className="border-t border-line-soft pt-3"><p className="text-[15px] font-medium text-charcoal">{c.n}</p><p className="text-[14px] prose-soft">{linkifyEmail(c.d)}</p></li>
          ))}
        </ul>
      </div>
    </div>
  );
}
