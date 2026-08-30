import { redirect } from "next/navigation";
import Link from "next/link";
import { getStaffMember, getClients } from "@/lib/staff";
import { createClient } from "@/lib/supabase/server";
import { RoadmapCheck } from "@/components/staff/roadmap-check";
import { ClientRoadmapEditor } from "@/components/staff/client-roadmap-editor";
import { StaffKickoffControls } from "@/components/staff/kickoff-controls";
import { OnboardingMediaForm } from "@/components/staff/onboarding-media-form";
import { SITE } from "@/content/site";

export default async function StaffOnboardingPage() {
  const me = await getStaffMember();
  if (!me) redirect("/staff/login");
  const clients = await getClients();
  const ids = clients.map((c) => c.id);

  const db = createClient();
  const [{ data: roadmap }, { data: vault }, { data: tasks }] = ids.length ? await Promise.all([
    db.from("client_roadmap").select("phase,status,note,client_id"),
    db.from("client_vault").select("client_id"),
    db.from("client_tasks").select("client_id"),
  ]) : [{ data: [] as any[] }, { data: [] as any[] }, { data: [] as any[] }];

  const roadmapByClient = new Map<string, { phase: string; status: string; note: string | null }[]>();
  (roadmap ?? []).forEach((r: any) => { const a = roadmapByClient.get(r.client_id) || []; a.push({ phase: r.phase, status: r.status, note: r.note }); roadmapByClient.set(r.client_id, a); });
  const vaultCount = new Map<string, number>();
  (vault ?? []).forEach((v: any) => vaultCount.set(v.client_id, (vaultCount.get(v.client_id) || 0) + 1));
  const taskCount = new Map<string, number>();
  (tasks ?? []).forEach((t: any) => taskCount.set(t.client_id, (taskCount.get(t.client_id) || 0) + 1));

  const dot = (done: boolean) => <span className={`inline-block h-2.5 w-2.5 rounded-full ${done ? "bg-forest" : "border border-gold bg-white"}`} />;

  return (
    <div className="flex flex-col gap-6">
      <div><h1 className="font-fraunces text-[32px] font-normal text-forest">Client onboarding</h1><span className="rule-gold mb-4 mt-2" /><p className="max-w-[48em] prose-soft">Work each client through week-one onboarding. Mark the 30-day roadmap set after the kickoff call, and keep each phase current — the client sees the same steps on their portal.</p></div>

      {clients.length === 0 ? <p className="text-[15px] prose-muted">No clients assigned to you yet.</p> : (
        <div className="flex flex-col gap-3">
          {clients.map((c) => {
            const kickoff = !!(c as any).kickoff_at;
            const roadmapSet = !!(c as any).roadmap_at;
            const hasVault = (vaultCount.get(c.id) || 0) > 0;
            const hasTasks = (taskCount.get(c.id) || 0) > 0;
            return (
              <details key={c.id} className="border border-line-warm bg-white">
                <summary className="min-h-touch cursor-pointer px-4 py-3 text-[15px] font-medium text-charcoal">{c.business || c.contact || c.email}</summary>
                <div className="flex flex-col gap-4 border-t border-line-soft p-4">
                  <ul className="flex flex-col gap-2 text-[14px]">
                    <li className="flex flex-wrap items-center gap-2">{dot(kickoff)} Kickoff call {(c as any).kickoff_completed_at ? <span className="text-[12px] font-semibold text-forest">· completed</span> : kickoff ? <span className="text-[12px] text-forest">· booked{(c as any).kickoff_at ? ` ${new Date((c as any).kickoff_at).toLocaleDateString()}` : ""}</span> : <a href={SITE.kickoffUrl} target="_blank" rel="noreferrer" className="link-underline text-[12px]">· booking link</a>}{kickoff && !(c as any).kickoff_completed_at && <StaffKickoffControls clientId={c.id} />}</li>
                    <li className="flex flex-wrap items-center gap-2">{dot(roadmapSet)} 30-day roadmap set <RoadmapCheck clientId={c.id} done={roadmapSet} /></li>
                    <li className="flex items-center gap-2">{dot(hasVault)} Credentials in the shared vault {hasVault ? <span className="text-[12px] text-forest">· {vaultCount.get(c.id)} on file</span> : <Link href="/staff/vault" className="link-underline text-[12px]">· add in Vault</Link>}</li>
                    <li className="flex items-center gap-2">{dot(hasTasks)} First tasks on the board {hasTasks ? <span className="text-[12px] text-forest">· {taskCount.get(c.id)}</span> : <Link href="/staff/tasks" className="link-underline text-[12px]">· open Task board</Link>}</li>
                  </ul>
                  <div>
                    <p className="mb-2 text-[13px] font-semibold text-forest">30-day roadmap phases</p>
                    <ClientRoadmapEditor clientId={c.id} rows={roadmapByClient.get(c.id) || []} />
                  </div>
                  <div>
                    <p className="mb-1 text-[13px] font-semibold text-forest">Onboarding call recording</p>
                    <p className="text-[12px] prose-muted">Paste the recording link and upload the transcript PDF — the client watches and reads it from their dashboard.</p>
                    <OnboardingMediaForm clientId={c.id} videoUrl={(c as any).onboarding_video_url} hasTranscript={!!(c as any).onboarding_transcript_path} />
                  </div>
                </div>
              </details>
            );
          })}
        </div>
      )}
    </div>
  );
}
