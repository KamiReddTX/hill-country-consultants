import { redirect } from "next/navigation";
import { getPortalClient, getPortalData, deriveOnboarding, money } from "@/lib/portal";
import { createServiceClient } from "@/lib/supabase/server";
import { SITE } from "@/content/site";
import { KickoffStep } from "@/components/portal/kickoff-step";

export default async function OnboardingPage() {
  const client = await getPortalClient();
  if (!client) redirect("/portal/login");
  const data = await getPortalData(client);
  const ob = deriveOnboarding(data);
  // assigned_to holds the owning employee's staff id — resolve it to a name.
  let lead = "Assigned within 48 hours";
  if (client.assigned_to && /^[0-9a-f-]{36}$/i.test(client.assigned_to)) {
    const { data: s } = await createServiceClient().from("staff").select("name,email").eq("id", client.assigned_to).maybeSingle();
    lead = (s as any)?.name || (s as any)?.email || lead;
  }

  return (
    <div className="flex flex-col gap-10">
      <section>
        <h1 className="font-fraunces text-[32px] font-normal text-forest">Welcome{client.contact ? `, ${client.contact.split(" ")[0]}` : ""}.</h1>
        <span className="rule-gold mb-4 mt-2" />
        <p className="max-w-[48em] prose-soft">
          Your week-one onboarding, step by step. Each one marks done as it actually happens — nothing here is
          filled in ahead of the work.
        </p>
        <div className="mt-5 max-w-md">
          <div className="flex justify-between text-[13px] prose-muted"><span>Onboarding</span><span>{ob.doneCount} of {ob.total}</span></div>
          <div className="mt-1 h-1.5 w-full bg-line-soft"><div className="h-1.5 bg-gold" style={{ width: `${ob.pct}%` }} /></div>
        </div>
      </section>

      <section>
        <ul className="flex flex-col gap-3">
          {ob.steps.map((s) => (
            <li key={s.key} className="flex gap-4 border-t border-line-soft pt-4">
              <span className={`mt-1.5 h-3 w-3 shrink-0 rounded-full border ${s.done ? "border-forest bg-forest" : "border-gold bg-white"}`} />
              <div>
                <p className="text-[16px] font-medium text-charcoal">{s.t} <span className="ml-2 text-[12px] font-normal text-ink-faint">{s.when}</span></p>
                <p className="text-[15px] prose-soft">{s.d}</p>
                <p className={`text-[12px] font-semibold ${s.done ? "text-forest" : "text-ink-faint"}`}>{s.done ? "Done" : "Pending"}</p>
                {s.key === "kickoff" && <KickoffStep url={SITE.kickoffUrl} done={s.done} />}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 font-fraunces text-[22px] font-medium text-forest">{data.bookings.length > 1 ? "Your bookings" : "Your booking"}</h2>
        {data.bookings.length === 0 ? (
          <p className="border border-dashed border-line-warm bg-white p-6 text-[15px] prose-muted">No bookings on file yet.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {data.bookings.map((b) => (
              <div key={b.id} className="border border-line-warm bg-white p-5">
                <div className="flex justify-between"><p className="font-medium text-charcoal">{b.ref}</p><p className="tabular-nums prose-muted">{money(b.paid_cents)}</p></div>
                <p className="text-[13px] prose-muted">Start: {b.start_date || "to be confirmed"}</p>
                {b.class_name && <p className="text-[13px] prose-muted">Class: {b.class_name}{b.class_date ? ` · ${b.class_date}` : ""}</p>}
                <ul className="mt-2 flex flex-col gap-1">
                  {(b.items || []).map((it, i) => <li key={i} className="text-[14px] prose-soft">{it.name}{it.qty && it.qty > 1 ? ` × ${it.qty}` : ""}</li>)}
                  {(b.quotes || []).map((q, i) => <li key={`q${i}`} className="text-[13px] text-ink-faint">Quote requested: {q.name}</li>)}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-fraunces text-[22px] font-medium text-forest">Your team</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { role: "Account lead", name: lead, owns: "Your single point of contact — scope, the 30-day roadmap, reviews and escalation." },
            { role: "Your virtual assistant", name: lead, owns: "The daily work: inbox and calendar, CRM, vendor follow-up, document formatting, filing." },
            { role: "Service specialists", name: "Assigned per service line", owns: "Submittals, documentation, design, media and grants specialists on the lines you use." },
          ].map((t) => (
            <div key={t.role} className="border border-line-warm bg-white p-5">
              <p className="kicker mb-1">{t.role}</p>
              <p className="font-medium text-charcoal">{t.name}</p>
              <p className="mt-1 text-[14px] prose-soft">{t.owns}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
