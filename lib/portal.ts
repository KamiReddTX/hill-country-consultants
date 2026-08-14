import { createClient } from "@/lib/supabase/server";
import type { ClientRow, BookingRow, ClientTaskRow, VaultRow } from "@/lib/database.types";

export interface WorkLogRow { id: string; worked_on: string; service: string | null; task: string | null; performed_by: string | null; hours: number }
export interface DeliverableRow { id: string; name: string; service: string | null; status: string; file_url: string | null; delivered_on: string | null }
export interface NoteRow { id: string; body: string; created_at: string }

export interface PortalData {
  client: ClientRow;
  bookings: BookingRow[];
  tasks: ClientTaskRow[];
  vault: VaultRow[];
  workLog: WorkLogRow[];
  deliverables: DeliverableRow[];
  notes: NoteRow[];
}

/** The signed-in client, or null if this user isn't a client. RLS returns only their row. */
export async function getPortalClient(): Promise<ClientRow | null> {
  const db = createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return null;
  // First-login claim: bind this client row to the auth user by email (no-op after).
  await db.rpc("link_client_to_user");
  const { data } = await db.from("clients").select("*").eq("user_id", user.id).maybeSingle();
  return data ?? null;
}

/** All of a client's working data. Every query is RLS-scoped to their own rows. */
export async function getPortalData(client: ClientRow): Promise<PortalData> {
  const db = createClient();
  const id = client.id;
  const [bookings, tasks, vault, workLog, deliverables, notes] = await Promise.all([
    db.from("bookings").select("*").eq("client_id", id).order("created_at", { ascending: false }),
    db.from("client_tasks").select("*").eq("client_id", id).order("created_at", { ascending: false }),
    db.from("client_vault").select("*").eq("client_id", id).order("updated_at", { ascending: false }),
    db.from("client_work_log").select("*").eq("client_id", id).order("worked_on", { ascending: false }),
    db.from("client_deliverables").select("*").eq("client_id", id).order("delivered_on", { ascending: false }),
    db.from("client_notes").select("*").eq("client_id", id).order("created_at", { ascending: false }),
  ]);
  return {
    client,
    bookings: bookings.data ?? [],
    tasks: tasks.data ?? [],
    vault: vault.data ?? [],
    workLog: (workLog.data as WorkLogRow[]) ?? [],
    deliverables: (deliverables.data as DeliverableRow[]) ?? [],
    notes: (notes.data as NoteRow[]) ?? [],
  };
}

/** Onboarding checklist — each step's "done" is derived from real account signals,
 *  never fabricated. No signal → pending. */
export function deriveOnboarding(d: PortalData) {
  const steps = [
    { key: "kickoff", t: "Kickoff call", when: "Week one · day 1–2", d: "Thirty to sixty minutes with your account lead to confirm goals, priorities, and who owns what on both sides.", done: !!d.client.kickoff_at },
    { key: "roadmap", t: "30-day roadmap", when: "Week one · day 2", d: "The first thirty days in writing — what we deliver, in what order, and what we need from you to hit each date.", done: !!d.client.roadmap_at },
    { key: "creds", t: "Secure credential handoff", when: "Week one · day 2–3", d: "Logins move through a shared password-manager vault. Nothing in email, nothing in plain text, returned at offboarding.", done: d.vault.length > 0 },
    { key: "board", t: "Shared task board", when: "Week one · day 3", d: "Your board goes live so every request, its status and its due date are visible to both of us.", done: d.tasks.length > 0 },
    { key: "files", t: "Channels & file structure", when: "Week one · day 4–5", d: "Communication channels are set, and your folder structure and naming convention are built before the first deliverable.", done: d.deliverables.length > 0 },
  ];
  const doneCount = steps.filter((s) => s.done).length;
  return { steps, doneCount, total: steps.length, pct: Math.round((doneCount / steps.length) * 100) };
}

/** Weekly report is derived from the real work log + deliverables. Empty until
 *  the first Friday-after-start report exists. */
export function deriveWeekly(d: PortalData) {
  if (d.workLog.length === 0 && d.deliverables.length === 0) return null;
  const byService: Record<string, number> = {};
  d.workLog.forEach((w) => { const k = w.service || "General"; byService[k] = (byService[k] || 0) + Number(w.hours || 0); });
  const totalHours = d.workLog.reduce((s, w) => s + Number(w.hours || 0), 0);
  return {
    totalHours: totalHours.toFixed(1),
    byService: Object.entries(byService).sort((a, b) => b[1] - a[1]).map(([svc, h]) => ({ svc, hours: h.toFixed(1) })),
    delivered: d.deliverables.slice(0, 8),
  };
}

export const money = (cents: number) => "$" + (cents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 });

/** Statuses an AM/VA can set on each roadmap phase. */
export const ROADMAP_STATUSES = ["Not started", "In progress", "Complete"] as const;
export type RoadmapStatus = (typeof ROADMAP_STATUSES)[number];

/** The five fixed roadmap phases. Per-client status + notes live in
 *  client_roadmap and are overlaid on top of these. */
export const ROADMAP_FRAMEWORK: { key: string; window: string; t: string; d: string }[] = [
  { key: "onboarding", window: "Days 1–5", t: "Onboarding complete", d: "Kickoff call, credential handoff through the vault, task board live, channels and file structure built." },
  { key: "baseline", window: "Days 5–10", t: "Document baseline", d: "We inventory what exists — capabilities statement, certifications, insurance, SOPs — and list what is missing or expired." },
  { key: "deliverables", window: "Days 10–20", t: "First deliverables", d: "Highest-pain work first, against your tier allotment. Every item runs its pre-delivery review before it reaches you." },
  { key: "systems", window: "Days 15–25", t: "Systems and templates", d: "Naming convention, folder structure, intake forms and reusable templates so the work holds after we hand it back." },
  { key: "review", window: "Day 30", t: "First full review", d: "What we delivered, what is in flight, what capacity went unused, and what we recommend for the next thirty days." },
];

export interface RoadmapRow { phase: string; status: string; note: string | null }

/** A client's saved roadmap phase rows (sparse — only phases staff have set). */
export async function getClientRoadmap(clientId: string): Promise<RoadmapRow[]> {
  const db = createClient();
  const { data } = await db.from("client_roadmap").select("phase,status,note").eq("client_id", clientId);
  return (data as RoadmapRow[]) ?? [];
}
