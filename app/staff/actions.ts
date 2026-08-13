"use server";
export type ActionResult = { error?: string; ok?: boolean };

import { revalidatePath } from "next/cache";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getStaffMember } from "@/lib/staff";

/** Clock in with a task note. The punch carries THIS staff member (RLS-enforced). */
export async function clockIn(formData: FormData): Promise<ActionResult> {
  const me = await getStaffMember();
  if (!me) return { error: "Not signed in." };
  const db = createClient();
  const { data: open } = await db.from("punches").select("id").eq("staff_id", me.id).is("ended_at", null).maybeSingle();
  if (open) return { error: "You're already clocked in." };
  const { error } = await db.from("punches").insert({ staff_id: me.id, note: String(formData.get("note") || "") || null });
  if (error) return { error: error.message };
  revalidatePath("/staff/clock"); revalidatePath("/staff");
  return { ok: true };
}

/** Clock out your own open punch. No one can clock out another person. */
export async function clockOut(): Promise<ActionResult> {
  const me = await getStaffMember();
  if (!me) return { error: "Not signed in." };
  const db = createClient();
  const { data: open } = await db.from("punches").select("*").eq("staff_id", me.id).is("ended_at", null).order("started_at", { ascending: false }).maybeSingle();
  if (!open) return { error: "You're not clocked in." };
  const hours = (Date.now() - new Date(open.started_at).getTime()) / 3600000;
  const { error } = await db.from("punches").update({ ended_at: new Date().toISOString(), hours: Math.round(hours * 100) / 100 }).eq("id", open.id);
  if (error) return { error: error.message };
  revalidatePath("/staff/clock"); revalidatePath("/staff");
  return { ok: true };
}

/** Admin only: force a stuck punch closed (RLS allows admin update on any punch). */
export async function forceClockOut(punchId: string, startedAt: string): Promise<ActionResult> {
  const me = await getStaffMember();
  if (me?.role !== "Administrator") return { error: "Admins only." };
  const db = createClient();
  const hours = (Date.now() - new Date(startedAt).getTime()) / 3600000;
  const { error } = await db.from("punches").update({ ended_at: new Date().toISOString(), hours: Math.round(hours * 100) / 100, closed_by_admin: true }).eq("id", punchId);
  if (error) return { error: error.message };
  revalidatePath("/staff/admin");
  return { ok: true };
}

/** Admin only: set the owning role on a client (empty string = unassign).
 *  Ownership lives on clients.assigned_to and every surface reads it. */
export async function assignClient(clientId: string, role: string): Promise<ActionResult> {
  const me = await getStaffMember();
  if (me?.role !== "Administrator") return { error: "Admins only." };
  const db = createClient();
  const { error } = await db.from("clients").update({ assigned_to: role }).eq("id", clientId);
  if (error) return { error: error.message };
  revalidatePath("/staff/admin"); revalidatePath("/staff");
  return { ok: true };
}

/** Admin only: change a client's status. */
export async function setClientStatus(clientId: string, status: string): Promise<ActionResult> {
  const me = await getStaffMember();
  if (me?.role !== "Administrator") return { error: "Admins only." };
  const db = createClient();
  const { error } = await db.from("clients").update({ status }).eq("id", clientId);
  if (error) return { error: error.message };
  revalidatePath("/staff/admin");
  return { ok: true };
}

/** Sales/admin: create a lead. Employee code is stamped from the signed-in rep. */
export async function createLead(formData: FormData): Promise<ActionResult> {
  const me = await getStaffMember();
  if (!me) return { error: "Not signed in." };
  if (!me.employee_code) return { error: "Your profile has no employee code — an admin sets this. Intake requires one." };
  const db = createClient();
  const { error } = await db.from("leads").insert({
    business: String(formData.get("business") || "") || null,
    contact: String(formData.get("contact") || "") || null,
    email: String(formData.get("email") || "") || null,
    phone: String(formData.get("phone") || "") || null,
    industry: String(formData.get("industry") || "") || null,
    timeline: String(formData.get("timeline") || "") || null,
    pain: String(formData.get("pain") || "") || null,
    lead_with: String(formData.get("lead_with") || "") || null,
    tier: String(formData.get("tier") || "") || null,
    stage: "New lead",
    rep_name: me.name,
    rep_code: me.employee_code,
  });
  if (error) return { error: error.message };
  revalidatePath("/staff/pipeline");
  return { ok: true };
}

export async function updateLeadStage(leadId: string, stage: string): Promise<ActionResult> {
  const me = await getStaffMember();
  if (!me) return { error: "Not signed in." };
  const db = createClient();
  const { error } = await db.from("leads").update({ stage }).eq("id", leadId);
  if (error) return { error: error.message };
  revalidatePath("/staff/pipeline");
  return { ok: true };
}

/** Mark a lead won → create the client, attributed to the rep's code. */
export async function markLeadWon(leadId: string): Promise<ActionResult> {
  const me = await getStaffMember();
  if (!me) return { error: "Not signed in." };
  const db = createClient();
  const { error } = await db.rpc("create_client_from_lead", { p_lead: leadId });
  if (error) return { error: error.message };
  revalidatePath("/staff/pipeline"); revalidatePath("/staff/follow-ups"); revalidatePath("/staff");
  return { ok: true };
}

/** Admin only: add a staff row. The person is then invited via Supabase Auth and
 *  claims the row on first login (link_staff_to_user). */
export async function addStaff(formData: FormData): Promise<ActionResult> {
  const me = await getStaffMember();
  if (me?.role !== "Administrator") return { error: "Admins only." };
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const db = createClient();
  const { error } = await db.from("staff").insert({
    email,
    name: String(formData.get("name") || "") || null,
    role: String(formData.get("role") || "Virtual assistant") as any,
    rate: Number(formData.get("rate") || 0),
    employee_code: String(formData.get("employee_code") || "") || null,
    hourly: formData.get("hourly") === "on",
  });
  if (error) return { error: error.message };
  // Invite the new staffer to set a password; /auth/callback binds their staff
  // row to the auth user on first login.
  try {
    const site = process.env.NEXT_PUBLIC_SITE_URL || "";
    await createServiceClient().auth.admin.inviteUserByEmail(
      email,
      site ? { redirectTo: `${site}/auth/callback?next=/staff` } : undefined,
    );
  } catch (e) { console.warn("[addStaff] invite", e); }
  revalidatePath("/staff/admin");
  return { ok: true };
}

export async function signOutStaff() {
  const db = createClient();
  await db.auth.signOut();
  revalidatePath("/staff");
}

/** Admin only: approve a two-week timesheet for a staff member. */
export async function approveTimesheet(staffId: string, periodStart: string, periodEnd: string): Promise<ActionResult> {
  const me = await getStaffMember();
  if (me?.role !== "Administrator") return { error: "Admins only." };
  const db = createClient();
  const { error } = await db.from("timesheet_approvals").upsert(
    { staff_id: staffId, period_start: periodStart, period_end: periodEnd, approved_by: me.id },
    { onConflict: "staff_id,period_start" },
  );
  if (error) return { error: error.message };
  revalidatePath("/staff/admin");
  return { ok: true };
}

/** The four board columns a client task moves through (mirrors the portal task board). */
const TASK_COLUMNS = ["Requested", "In progress", "In review", "Delivered"] as const;

/** Staff: advance (or move back) a client task's board column. RLS allows staff updates. */
export async function moveTaskColumn(taskId: string, column: string): Promise<ActionResult> {
  const me = await getStaffMember();
  if (!me) return { error: "Not signed in." };
  if (!(TASK_COLUMNS as readonly string[]).includes(column)) return { error: "Unknown column." };
  const db = createClient();
  const { error } = await db.from("client_tasks").update({ column_name: column }).eq("id", taskId);
  if (error) return { error: error.message };
  revalidatePath("/staff/delivery"); revalidatePath("/staff/daily"); revalidatePath("/portal/tasks");
  return { ok: true };
}

/** Staff: log one work-log entry for a client. Stamped with the signed-in staffer. */
export async function logWork(formData: FormData): Promise<ActionResult> {
  const me = await getStaffMember();
  if (!me) return { error: "Not signed in." };
  const clientId = String(formData.get("client_id") || "");
  if (!clientId) return { error: "Pick a client." };
  const hours = Number(formData.get("hours") || 0);
  if (!(hours > 0)) return { error: "Enter the hours worked." };
  const db = createClient();
  const { error } = await db.from("client_work_log").insert({
    client_id: clientId,
    worked_on: String(formData.get("worked_on") || "") || new Date().toISOString().slice(0, 10),
    service: String(formData.get("service") || "") || null,
    task: String(formData.get("task") || "") || null,
    performed_by: me.name || me.role,
    hours,
  });
  if (error) return { error: error.message };
  revalidatePath("/staff/daily"); revalidatePath("/staff/delivery");
  revalidatePath("/portal/work-log"); revalidatePath("/portal/weekly");
  return { ok: true };
}

/** Staff: record one deliverable for a client (populates the client's Files & weekly report). */
export async function addDeliverable(formData: FormData): Promise<ActionResult> {
  const me = await getStaffMember();
  if (!me) return { error: "Not signed in." };
  const clientId = String(formData.get("client_id") || "");
  const name = String(formData.get("name") || "").trim();
  if (!clientId) return { error: "Pick a client." };
  if (!name) return { error: "Give the deliverable a name." };
  const db = createClient();
  const { error } = await db.from("client_deliverables").insert({
    client_id: clientId,
    name,
    service: String(formData.get("service") || "") || null,
    status: String(formData.get("status") || "") || "Delivered",
    file_url: String(formData.get("file_url") || "") || null,
    delivered_on: String(formData.get("delivered_on") || "") || new Date().toISOString().slice(0, 10),
  });
  if (error) return { error: error.message };
  revalidatePath("/staff/delivery"); revalidatePath("/portal/files"); revalidatePath("/portal/weekly");
  return { ok: true };
}
