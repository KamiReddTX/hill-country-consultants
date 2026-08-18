import { redirect } from "next/navigation";
import { getPortalClient, getPortalData, deriveOnboarding, money } from "@/lib/portal";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { SITE } from "@/content/site";
import { KickoffStep } from "@/components/portal/kickoff-step";
import { PhotoShootButton } from "@/components/portal/photo-shoot-button";

export default async function OnboardingPage() {
  const client = await getPortalClient();
  if (!client) redirect("/portal/login");
  const data = await getPortalData(client);
  const ob = deriveOnboarding(data);

  // Read-only checklist the account team maintains for this client (e.g. a
  // branding launch cycle). Grouped by section, in order.
  const { data: checklist } = await createClient()
    .from("client_checklist_items").select("*").eq("client_id", client.id).order("position", { ascending: true });
  const cl = (checklist ?? []) as any[];
  const clDone = cl.filter((i) => i.done).length;
  const clGroups: { section: string | null; items: any[] }[] = [];
  { const idx = new Map<string, number>(); for (const it of cl) { const k = it.section || ""; if (!idx.has(k)) { idx.set(k, clGroups.length); clGroups.push({ section: it.section, items: [] }); } clGroups[idx.get(k)!].items.push(it); } }
  const clPct = cl.length ? Math.round((clDone / cl.length) * 100) : 0;
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

      {cl.length > 0 && (
        <section>
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h2 className="font-fraunces text-[22px] font-medium text-forest">Your checklist</h2>
            <span className="text-[13px] prose-muted">{clDone} of {cl.length} done · {clPct}%</span>
          </div>
          <div className="mt-2 h-1.5 w-full max-w-md bg-line-soft"><div className="h-1.5 bg-gold" style={{ width: `${clPct}%` }} /></div>
          <div className="mt-4 flex flex-col gap-4">
            {clGroups.map((g, gi) => (
              <div key={gi}>
                {g.section && <p className="mb-1 text-[12px] font-semibold uppercase tracking-wide text-forest">{g.section}</p>}
                <ul className="flex flex-col gap-1">
                  {g.items.map((it) => (
                    <li key={it.id} className="flex items-start gap-2 text-[15px]">
                      <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center border text-[10px] leading-none ${it.done ? "border-forest bg-forest text-white" : "border-line-warm bg-white text-transparent"}`}>✓</span>
                      <span className={it.done ? "text-ink-faint line-through" : "text-charcoal"}>{it.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-2 font-fraunces text-[22px] font-medium text-forest">Marketing photo shoot</h2>
        <div className="border border-line-warm bg-white p-5">
          <p className="mb-3 max-w-[48em] text-[15px] prose-soft">Ready for fresh brand photography? Book a consultation with our photographer. Your account manager coordinates the shoot and it&apos;s billed through your HCC account — no separate vendor to set up.</p>
          <PhotoShootButton url={SITE.photographerUrl} />
        </div>
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
        <div className="grid gap-4 md:grid-cols-2">
          {[
            { role: "Your account lead", name: lead, owns: "Your single point of contact — the daily work plus scope, the 30-day roadmap, reviews and escalation." },
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
