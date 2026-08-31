import { redirect } from "next/navigation";
import { getPortalClient, getPortalData, deriveOnboarding, money } from "@/lib/portal";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { SITE } from "@/content/site";
import { KickoffStep } from "@/components/portal/kickoff-step";
import { OnboardingRecording } from "@/components/portal/onboarding-recording";
import { PhotoShootButton } from "@/components/portal/photo-shoot-button";
import { FeedbackCard, ReferralCard } from "@/components/portal/client-extras";
import { computeAllotmentUsage, monthKey } from "@/lib/allotments";

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

  // This month's plan usage (included vs used). Read this client's rows with the
  // service client (the page is already scoped to the signed-in client).
  const ym = monthKey();
  const svc = createServiceClient();
  const [{ data: wl }, { data: adj }] = await Promise.all([
    svc.from("client_work_log").select("hours,worked_on,approved").eq("client_id", client.id),
    svc.from("client_allotment_adjustments").select("service_key,delta").eq("client_id", client.id).eq("period_month", `${ym}-01`),
  ]);
  const vaHours = (wl ?? []).filter((w: any) => String(w.worked_on || "").slice(0, 7) === ym && w.approved !== false).reduce((s: number, w: any) => s + Number(w.hours || 0), 0);
  const usageLines = computeAllotmentUsage((client as any).plan, vaHours, ((adj ?? []) as any[]).map((a) => ({ service_key: a.service_key, delta: Number(a.delta) }))).filter((u) => u.allot != null);

  // Recent activity feed — merged from what's already loaded, newest first.
  const activity = [
    ...data.deliverables.map((d: any) => ({ when: d.delivered_on || d.created_at, text: `Deliverable: ${d.name}${d.status ? ` — ${d.status}` : ""}` })),
    ...data.tasks.map((t: any) => ({ when: t.created_at, text: `Task: ${t.title} (${t.column_name})` })),
    ...data.notes.map((n: any) => ({ when: n.created_at, text: "Message posted in your portal" })),
  ].filter((a) => a.when).sort((a, b) => new Date(b.when).getTime() - new Date(a.when).getTime()).slice(0, 8);
  const clDone = cl.filter((i) => i.done).length;
  const clGroups: { section: string | null; items: any[] }[] = [];
  { const idx = new Map<string, number>(); for (const it of cl) { const k = it.section || ""; if (!idx.has(k)) { idx.set(k, clGroups.length); clGroups.push({ section: it.section, items: [] }); } clGroups[idx.get(k)!].items.push(it); } }
  const clPct = cl.length ? Math.round((clDone / cl.length) * 100) : 0;
  // assigned_to holds the owning employee's staff id — resolve it to a name.
  let lead = "Assigned within one business day";
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
          Your week-one onboarding, step by step. Each step is marked complete as it happens — nothing here is
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
                {s.key === "kickoff" && <KickoffStep url={SITE.kickoffUrl} done={s.done} completed={!!(client as any).kickoff_completed_at} kickoffAt={(client as any).kickoff_at || null} />}
              </div>
            </li>
          ))}
        </ul>
      </section>

      {((client as any).onboarding_video_url || (client as any).onboarding_transcript_path) && (
        <OnboardingRecording
          videoUrl={(client as any).onboarding_video_url || null}
          hasTranscript={!!(client as any).onboarding_transcript_path}
          clientId={client.id}
          recordedAt={(client as any).onboarding_recorded_at || null}
        />
      )}

      {activity.length > 0 && (
        <section>
          <h2 className="mb-1 font-fraunces text-[22px] font-medium text-forest">Recent activity</h2>
          <p className="mb-3 text-[14px] prose-muted">The latest on your account. Open the tabs above for full detail.</p>
          <ul className="flex flex-col gap-1.5">
            {activity.map((a, i) => (
              <li key={i} className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line-soft/60 pb-1.5 text-[14px]">
                <span className="text-charcoal">{a.text}</span>
                <span className="text-[12px] text-ink-faint">{new Date(a.when).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

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

      {usageLines.length > 0 && (
        <section>
          <h2 className="mb-1 font-fraunces text-[22px] font-medium text-forest">This month&rsquo;s usage</h2>
          <p className="mb-3 max-w-[48em] text-[14px] prose-muted">What your plan includes this month and how much has been used. Resets at the start of each month.</p>
          <div className="grid gap-3 md:grid-cols-2">
            {usageLines.map((u) => {
              const pct = u.allot ? Math.min(100, Math.round((u.used / u.allot) * 100)) : 0;
              return (
                <div key={u.key} className="border border-line-warm bg-white p-4">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[14px] font-medium text-charcoal">{u.label}</span>
                    <span className="text-[13px] tabular-nums prose-muted">{u.used} / {u.allot} {u.unit}</span>
                  </div>
                  <div className="mt-2 h-2 w-full bg-line-soft"><div className={`h-2 ${u.over ? "bg-red-600" : "bg-forest"}`} style={{ width: `${pct}%` }} /></div>
                  {u.over
                    ? <p className="mt-1 text-[12px] text-red-700">Over by {Math.abs(u.remaining as number)} {u.unit} — additional usage may be billed.</p>
                    : <p className="mt-1 text-[12px] prose-muted">{u.remaining} {u.unit} remaining</p>}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {!(client as any).plan && (
        <section>
          <h2 className="mb-2 font-fraunces text-[22px] font-medium text-forest">Your services</h2>
          <div className="border border-line-warm bg-white p-5">
            <p className="mb-3 max-w-[48em] text-[15px] prose-soft">You&rsquo;re set up <strong>à la carte</strong> — billed per service, with no monthly plan or allotment to track. Book individual services anytime; anything custom is quoted in writing before it begins. Prefer a monthly plan? Ask your account team and we&rsquo;ll map it out.</p>
            <a href="/book" className="btn-gold text-[14px]">Book a service</a>
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
        <h2 className="mb-3 font-fraunces text-[22px] font-medium text-forest">Stay in touch</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <FeedbackCard />
          <ReferralCard />
        </div>
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
