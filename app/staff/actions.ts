"use server";
export type ActionResult = { error?: string; ok?: boolean };

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getStaffMember, isPrivileged, isSalesLead } from "@/lib/staff";
import { sendTaskPaymentRequest, sendClientMessageAlert, sendVaultInvite, sendEmployeeWelcome } from "@/lib/email";
import { buildWeeklyReportPdf } from "@/lib/reports";
import { uploadNoteFiles } from "@/lib/message-files";
import { getClientEmails } from "@/lib/client-contacts";
import { docusignConfigured, createEnvelope, recipientViewUrl } from "@/lib/docusign";

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
export async function assignClient(clientId: string, staffId: string): Promise<ActionResult> {
  const me = await getStaffMember();
  if (!isPrivileged(me)) return { error: "Admins and business managers only." };
  const db = createClient();
  // assigned_to now holds the owning employee's staff id (was a role string).
  const { error } = await db.from("clients").update({ assigned_to: staffId }).eq("id", clientId);
  if (error) return { error: error.message };
  revalidatePath("/staff/admin"); revalidatePath("/staff");
  return { ok: true };
}

/** Admin only: permanently delete a client account and all its data (bookings,
 *  tasks, notes, vault, work log, deliverables, roadmap, reports — all cascade),
 *  plus its portal login. Built for clearing test accounts. */
export async function deleteClient(clientId: string): Promise<ActionResult> {
  const me = await getStaffMember();
  if (me?.role !== "Administrator") return { error: "Admins only." };
  const admin = createServiceClient();
  const { data: client } = await admin.from("clients").select("user_id").eq("id", clientId).maybeSingle();
  const { error } = await admin.from("clients").delete().eq("id", clientId);
  if (error) return { error: error.message };
  // Remove the portal login so the email can be reused for a fresh test.
  const uid = (client as any)?.user_id;
  if (uid) { try { await admin.auth.admin.deleteUser(uid); } catch (e) { console.warn("[deleteClient] auth", e); } }
  revalidatePath("/staff/admin"); revalidatePath("/staff");
  return { ok: true };
}

/** Admin only: change a client's status. */
export async function setClientStatus(clientId: string, status: string): Promise<ActionResult> {
  const me = await getStaffMember();
  if (!isPrivileged(me)) return { error: "Admins and business managers only." };
  const db = createClient();
  const { error } = await db.from("clients").update({ status }).eq("id", clientId);
  if (error) return { error: error.message };
  revalidatePath("/staff/admin");
  return { ok: true };
}

/** Admin only: check off (or clear) a client's 30-day roadmap onboarding step.
 *  This is the one onboarding step an admin marks by hand, after the kickoff call. */
export async function setRoadmapDone(clientId: string, done: boolean): Promise<ActionResult> {
  const me = await getStaffMember();
  if (!me) return { error: "Not signed in." };
  if (!(await canReachClient(me, clientId))) return { error: "This isn't your account." };
  // clients.roadmap_at is admin-write under RLS, so go through the service client (action-gated above).
  const { error } = await createServiceClient().from("clients").update({ roadmap_at: done ? new Date().toISOString() : null }).eq("id", clientId);
  if (error) return { error: error.message };
  revalidatePath("/staff/admin"); revalidatePath("/staff/onboarding"); revalidatePath("/portal");
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
  if (!isPrivileged(me)) return { error: "Admins and business managers only." };
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const db = createClient();
  const role = String(formData.get("role") || "Virtual assistant");
  const { error } = await db.from("staff").insert({
    email,
    name: String(formData.get("name") || "") || null,
    role: role as any,
    roles: [role],
    rate: Number(formData.get("rate") || 0),
    employee_code: String(formData.get("employee_code") || "") || null,
    hourly: formData.get("hourly") === "on",
  });
  if (error) return { error: error.message };
  // Invite the new staffer. Build a server-readable token_hash link ourselves and
  // send our own branded welcome email — this avoids the fragment-token invite link
  // that lands people on the login page instead of the set-password screen.
  try {
    const site = process.env.NEXT_PUBLIC_SITE_URL || "";
    const svc = createServiceClient();
    const { data: link } = await svc.auth.admin.generateLink({
      type: "invite", email,
      options: site ? { redirectTo: `${site}/auth/callback?next=/staff` } : undefined,
    } as any);
    const hashed = (link as any)?.properties?.hashed_token;
    if (site && hashed) {
      const actionUrl = `${site}/auth/callback?token_hash=${hashed}&type=invite&next=/staff`;
      await sendEmployeeWelcome({ to: email, name: String(formData.get("name") || "") || null, actionUrl });
    } else {
      await svc.auth.admin.inviteUserByEmail(email, site ? { redirectTo: `${site}/auth/callback?next=/staff` } : undefined);
    }
  } catch (e) { console.warn("[addStaff] invite", e); }
  revalidatePath("/staff/admin");
  return { ok: true };
}

/** Admin only: send a password-reset (recovery) email so a client or employee
 *  can set a new password and get back into their portal. The recovery link lands
 *  on /auth/callback, which establishes a session and routes them to set-password. */
export async function sendPasswordReset(email: string, portal: "client" | "staff"): Promise<ActionResult> {
  const me = await getStaffMember();
  if (!isPrivileged(me)) return { error: "Admins and business managers only." };
  const clean = String(email || "").trim().toLowerCase();
  if (!clean || !clean.includes("@")) return { error: "Enter a valid email address." };
  const site = process.env.NEXT_PUBLIC_SITE_URL || "";
  const next = portal === "staff" ? "/staff" : "/portal";
  const db = createClient();
  const { error } = await db.auth.resetPasswordForEmail(
    clean,
    site ? { redirectTo: `${site}/auth/callback?next=${next}` } : undefined,
  );
  if (error) return { error: error.message };
  return { ok: true };
}

/** PUBLIC (staff login screen): file a password-reset request for an employee.
 *  No email is sent here — an admin must approve it first. We only record a
 *  request if the email actually belongs to a staff member. */
export async function requestStaffReset(email: string): Promise<ActionResult> {
  const clean = String(email || "").trim().toLowerCase();
  if (!clean || !clean.includes("@")) return { error: "Enter a valid work email." };
  const admin = createServiceClient();
  const { data: staff } = await admin.from("staff").select("id").eq("email", clean).maybeSingle();
  // Don't reveal whether the address is a real employee; only record if it is.
  if (staff) await admin.from("staff_reset_requests").insert({ email: clean, status: "pending" });
  return { ok: true };
}

/** Admin only: approve an employee reset request — sends the recovery email. */
export async function approveStaffReset(id: string): Promise<ActionResult> {
  const me = await getStaffMember();
  if (me?.role !== "Administrator") return { error: "Admins only." };
  const admin = createServiceClient();
  const { data: reqRow } = await admin.from("staff_reset_requests").select("email,status").eq("id", id).maybeSingle();
  if (!reqRow) return { error: "Request not found." };
  const site = process.env.NEXT_PUBLIC_SITE_URL || "";
  const { error } = await createClient().auth.resetPasswordForEmail(
    (reqRow as any).email,
    site ? { redirectTo: `${site}/auth/callback?next=/staff` } : undefined,
  );
  if (error) return { error: error.message };
  await admin.from("staff_reset_requests").update({ status: "approved", handled_by: me.id, handled_at: new Date().toISOString() }).eq("id", id);
  revalidatePath("/staff/admin");
  return { ok: true };
}

/** Admin only: deny an employee reset request (no email sent). */
export async function denyStaffReset(id: string): Promise<ActionResult> {
  const me = await getStaffMember();
  if (me?.role !== "Administrator") return { error: "Admins only." };
  await createServiceClient().from("staff_reset_requests")
    .update({ status: "denied", handled_by: me.id, handled_at: new Date().toISOString() }).eq("id", id);
  revalidatePath("/staff/admin");
  return { ok: true };
}

/** Admin only: suspend or reactivate an employee. Suspended (active=false) staff
 *  are blocked from every staff surface (getStaffMember requires active). */
export async function setStaffActive(staffId: string, active: boolean): Promise<ActionResult> {
  const me = await getStaffMember();
  if (!isPrivileged(me)) return { error: "Admins and business managers only." };
  if (staffId === me.id && !active) return { error: "You can't suspend your own account." };
  const { error } = await createServiceClient().from("staff").update({ active }).eq("id", staffId);
  if (error) return { error: error.message };
  revalidatePath("/staff/admin");
  return { ok: true };
}

/** Staff (owner or admin) replies to a client's message. The reply is recorded
 *  in the portal chat and the client gets an email that a response is waiting. */
export async function staffReplyMessage(formData: FormData): Promise<ActionResult> {
  const me = await getStaffMember();
  if (!me) return { error: "Not signed in." };
  const clientId = String(formData.get("clientId") || "");
  const text = String(formData.get("body") || "").trim();
  const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (!text && files.length === 0) return { error: "Write a message or attach a file." };
  const db = createClient();
  const { data: c } = await db.from("clients").select("id,email,assigned_to,reply_token").eq("id", clientId).maybeSingle();
  if (!c) return { error: "Client not found." };
  // Owner, team member (client_assignments), or admin/BM may message the client.
  if (!(await canReachClient(me, clientId))) return { error: "This isn't your client." };
  const { data: note, error } = await db.from("client_notes")
    .insert({ client_id: clientId, body: text, sender: "staff", author_name: me.name || me.email })
    .select("id").single();
  if (error) return { error: error.message };
  const saved = files.length ? await uploadNoteFiles(clientId, (note as any).id, files, me.name || me.email) : 0;
  const site = process.env.NEXT_PUBLIC_SITE_URL || "";
  const inbound = process.env.INBOUND_EMAIL_DOMAIN;
  const replyTo = inbound && (c as any).reply_token ? `reply+${(c as any).reply_token}@${inbound}` : me.email;
  try {
    const to = await getClientEmails(clientId, (c as any).email); // primary + all contacts on file
    if (to.length) await sendClientMessageAlert({ to, from: me.name || "Your account team", portalUrl: site ? `${site}/portal/messages` : "", replyTo, message: text || (saved ? `Sent you ${saved} file${saved > 1 ? "s" : ""}.` : "") });
  } catch (e) { console.warn("[staffReplyMessage] email", e); }
  revalidatePath("/staff/messages"); revalidatePath("/portal/messages");
  return { ok: true };
}

/** Staff (owner or admin) uploads one or more files into a client's shared space. */
export async function uploadClientFile(formData: FormData): Promise<ActionResult> {
  const me = await getStaffMember();
  if (!me) return { error: "Not signed in." };
  const clientId = String(formData.get("clientId") || "");
  if (!clientId) return { error: "Missing client." };
  const db = createClient();
  const { data: c } = await db.from("clients").select("id,assigned_to").eq("id", clientId).maybeSingle();
  if (!c) return { error: "Client not found." };
  if (!(await canReachClient(me, clientId))) return { error: "This isn't your client." };
  const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (!files.length) return { error: "Choose at least one file." };
  const admin = createServiceClient();
  let saved = 0;
  for (const file of files.slice(0, 10)) {
    const safe = file.name.replace(/[^\w.\-]+/g, "_").slice(0, 120);
    const path = `${clientId}/${Date.now()}-${safe}`;
    const buf = Buffer.from(await file.arrayBuffer());
    const up = await admin.storage.from("client-files").upload(path, buf, { contentType: file.type || "application/octet-stream" });
    if (!up.error) {
      await admin.from("client_files").insert({ client_id: clientId, name: file.name.slice(0, 200), path, size: file.size, uploaded_by: me.name || me.email } as any);
      saved++;
    }
  }
  if (!saved) return { error: "Upload failed — try again." };
  revalidatePath("/staff/files"); revalidatePath("/portal/files");
  return { ok: true };
}

/** Staff (owner or admin) removes a file from a client's shared space. */
export async function deleteClientFile(fileId: string): Promise<ActionResult> {
  const me = await getStaffMember();
  if (!me) return { error: "Not signed in." };
  const admin = createServiceClient();
  const { data: f } = await admin.from("client_files").select("path,client_id").eq("id", fileId).maybeSingle();
  if (!f) return { error: "Not found." };
  if (!(await canReachClient(me, (f as any).client_id))) return { error: "This isn't your client." };
  await admin.storage.from("client-files").remove([(f as any).path]);
  await admin.from("client_files").delete().eq("id", fileId);
  revalidatePath("/staff/files"); revalidatePath("/portal/files");
  return { ok: true };
}

/** Owner/BM/admin: email the client to set up the shared password vault. */
export async function sendVaultInviteEmail(clientId: string): Promise<ActionResult> {
  const me = await getStaffMember();
  if (!me) return { error: "Not signed in." };
  const db = createClient();
  const { data: c } = await db.from("clients").select("email,assigned_to").eq("id", clientId).maybeSingle();
  if (!c) return { error: "Client not found." };
  if (!(await canReachClient(me, clientId))) return { error: "This isn't your client." };
  if (!(c as any).email) return { error: "This client has no email on file." };
  const site = process.env.NEXT_PUBLIC_SITE_URL || "";
  try {
    await sendVaultInvite({ to: (c as any).email, from: me.name || "Your account team", portalUrl: site ? `${site}/portal/vault` : "" });
  } catch (e) { return { error: "Could not send the invite — try again." }; }
  return { ok: true };
}

/** Owner/BM/admin: register an account in the client's shared vault (no passwords). */
export async function addClientVaultEntry(formData: FormData): Promise<ActionResult> {
  const me = await getStaffMember();
  if (!me) return { error: "Not signed in." };
  const clientId = String(formData.get("clientId") || "");
  const name = String(formData.get("name") || "").trim();
  if (!clientId || !name) return { error: "Give the account a name." };
  const db = createClient();
  const { data: c } = await db.from("clients").select("assigned_to").eq("id", clientId).maybeSingle();
  if (!c) return { error: "Client not found." };
  if (!(await canReachClient(me, clientId))) return { error: "This isn't your client." };
  const { error } = await db.from("client_vault").insert({
    client_id: clientId, name,
    username: String(formData.get("username") || "") || null,
    url: String(formData.get("url") || "") || null,
    purpose: String(formData.get("purpose") || "") || null,
    needs_resync: false,
  } as any);
  if (error) return { error: error.message };
  revalidatePath("/staff/vault"); revalidatePath("/portal/vault");
  return { ok: true };
}

/** Owner/BM/admin: flag or clear a vault entry's re-sync state. */
export async function setClientVaultResync(id: string, needs: boolean): Promise<ActionResult> {
  const me = await getStaffMember();
  if (!me) return { error: "Not signed in." };
  const db = createClient();
  const { error } = await db.from("client_vault").update({ needs_resync: needs, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/staff/vault"); revalidatePath("/portal/vault");
  return { ok: true };
}

/** Owner/BM/admin: remove a vault entry. */
export async function deleteClientVaultEntry(id: string): Promise<ActionResult> {
  const me = await getStaffMember();
  if (!me) return { error: "Not signed in." };
  const db = createClient();
  const { error } = await db.from("client_vault").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/staff/vault"); revalidatePath("/portal/vault");
  return { ok: true };
}

/** Admin/BM: permanently delete an employee and their staff login. */
export async function deleteEmployee(staffId: string): Promise<ActionResult> {
  const me = await getStaffMember();
  if (!isPrivileged(me)) return { error: "Admins and business managers only." };
  if (staffId === me.id) return { error: "You can't delete your own account." };
  const admin = createServiceClient();
  const { data: s } = await admin.from("staff").select("user_id").eq("id", staffId).maybeSingle();
  const { error } = await admin.from("staff").delete().eq("id", staffId);
  if (error) return { error: error.message };
  const uid = (s as any)?.user_id;
  if (uid) { try { await admin.auth.admin.deleteUser(uid); } catch (e) { console.warn("[deleteEmployee] auth", e); } }
  revalidatePath("/staff/directory");
  return { ok: true };
}

/** Admin/BM: set the full set of roles an employee holds (multi-role). */
export async function setStaffRoles(staffId: string, roles: string[]): Promise<ActionResult> {
  const me = await getStaffMember();
  if (!isPrivileged(me)) return { error: "Admins and business managers only." };
  const clean = Array.from(new Set((roles || []).filter(Boolean)));
  if (clean.length === 0) return { error: "Pick at least one role." };
  const { error } = await createServiceClient().from("staff")
    .update({ roles: clean, role: clean[0] as any }).eq("id", staffId);
  if (error) return { error: error.message };
  revalidatePath("/staff/admin");
  return { ok: true };
}

/** True if the current staffer owns or is privileged over a client (can coordinate its team). */
async function ownsOrPrivileged(me: any, clientId: string): Promise<boolean> {
  if (isPrivileged(me)) return true;
  const { data: c } = await createServiceClient().from("clients").select("assigned_to").eq("id", clientId).maybeSingle();
  return !!c && (c as any).assigned_to === me.id;
}

/** True if the current staffer can reach a client (owner, team member, or privileged). */
async function canReachClient(me: any, clientId: string): Promise<boolean> {
  if (await ownsOrPrivileged(me, clientId)) return true;
  const { data: a } = await createServiceClient().from("client_assignments").select("id").eq("client_id", clientId).eq("staff_id", me.id).maybeSingle();
  return !!a;
}

/** Owner/BM/admin: add a specialist to an account's team (AM coordination). */
export async function addClientTeamMember(clientId: string, staffId: string, roleOnAccount?: string): Promise<ActionResult> {
  const me = await getStaffMember();
  if (!me) return { error: "Not signed in." };
  if (!(await ownsOrPrivileged(me, clientId))) return { error: "Only the account owner or an admin can add team members." };
  const { error } = await createServiceClient().from("client_assignments")
    .upsert({ client_id: clientId, staff_id: staffId, role_on_account: roleOnAccount || null, added_by: me.id } as any, { onConflict: "client_id,staff_id" });
  if (error) return { error: error.message };
  revalidatePath("/staff/admin"); revalidatePath("/staff/accounts");
  return { ok: true };
}

/** Owner/BM/admin: remove a specialist from an account's team. */
export async function removeClientTeamMember(assignmentId: string): Promise<ActionResult> {
  const me = await getStaffMember();
  if (!me) return { error: "Not signed in." };
  const admin = createServiceClient();
  const { data: a } = await admin.from("client_assignments").select("client_id").eq("id", assignmentId).maybeSingle();
  if (!a) return { error: "Not found." };
  if (!(await ownsOrPrivileged(me, (a as any).client_id))) return { error: "Only the account owner or an admin can remove team members." };
  const { error } = await admin.from("client_assignments").delete().eq("id", assignmentId);
  if (error) return { error: error.message };
  revalidatePath("/staff/admin"); revalidatePath("/staff/accounts");
  return { ok: true };
}

/** Owner/team/admin: assign (or clear) the worker doing a specific task. */
export async function assignTask(taskId: string, staffId: string | null): Promise<ActionResult> {
  const me = await getStaffMember();
  if (!me) return { error: "Not signed in." };
  const admin = createServiceClient();
  const { data: t } = await admin.from("client_tasks").select("client_id").eq("id", taskId).maybeSingle();
  if (!t) return { error: "Task not found." };
  if (!(await canReachClient(me, (t as any).client_id))) return { error: "This isn't your account." };
  const { error } = await admin.from("client_tasks").update({ assignee_id: staffId }).eq("id", taskId);
  if (error) return { error: error.message };
  revalidatePath("/staff/daily"); revalidatePath("/staff/delivery");
  return { ok: true };
}

/** Admin/BM: create a client account by hand and invite them to the portal. */
export async function addClient(formData: FormData): Promise<ActionResult> {
  const me = await getStaffMember();
  if (!isPrivileged(me)) return { error: "Admins and business managers only." };
  const email = String(formData.get("email") || "").trim().toLowerCase();
  if (!email || !email.includes("@")) return { error: "Enter a valid client email." };
  const billing = String(formData.get("billing_type") || "standard");
  const admin = createServiceClient();
  const { error } = await admin.from("clients").insert({
    email,
    business: String(formData.get("business") || "") || null,
    contact: String(formData.get("contact") || "") || null,
    phone: String(formData.get("phone") || "") || null,
    status: "Active",
    billing_type: ["standard", "comp", "barter"].includes(billing) ? billing : "standard",
  } as any);
  if (error) return { error: error.message.includes("duplicate") ? "A client with that email already exists." : error.message };
  // Invite them to set a password; /auth/callback binds the client row on first login.
  try {
    const site = process.env.NEXT_PUBLIC_SITE_URL || "";
    await admin.auth.admin.inviteUserByEmail(email, site ? { redirectTo: `${site}/auth/callback?next=/portal` } : undefined);
  } catch (e) { console.warn("[addClient] invite", e); }
  revalidatePath("/staff/admin");
  return { ok: true };
}

/** Admin/BM: set a client's billing type — standard, comp (zeroed), or barter. */
export async function setClientBilling(clientId: string, billingType: string): Promise<ActionResult> {
  const me = await getStaffMember();
  if (!isPrivileged(me)) return { error: "Admins and business managers only." };
  if (!["standard", "comp", "barter"].includes(billingType)) return { error: "Invalid billing type." };
  const { error } = await createServiceClient().from("clients").update({ billing_type: billingType }).eq("id", clientId);
  if (error) return { error: error.message };
  revalidatePath("/staff/admin");
  return { ok: true };
}

/** Admin/BM: set a sales rep's commission rate (percent). */
export async function setStaffCommission(staffId: string, pct: number): Promise<ActionResult> {
  const me = await getStaffMember();
  if (!isPrivileged(me)) return { error: "Admins and business managers only." };
  const clean = Math.max(0, Math.min(100, Number(pct) || 0));
  const { error } = await createServiceClient().from("staff").update({ commission_pct: clean }).eq("id", staffId);
  if (error) return { error: error.message };
  revalidatePath("/staff/directory"); revalidatePath("/staff/sales");
  return { ok: true };
}

/** Sales lead (Sales Manager/BM/Admin): assign a lead to a sales agent (sets the
 *  rep code + name so the sale attributes to them). Empty staffId unassigns. */
export async function assignLeadRep(leadId: string, staffId: string): Promise<ActionResult> {
  const me = await getStaffMember();
  if (!isSalesLead(me)) return { error: "Sales managers and admins only." };
  const admin = createServiceClient();
  let rep_code = "", rep_name: string | null = null;
  if (staffId) {
    const { data: s } = await admin.from("staff").select("employee_code,name,email").eq("id", staffId).maybeSingle();
    if (!s) return { error: "Agent not found." };
    rep_code = (s as any).employee_code || "";
    rep_name = (s as any).name || (s as any).email || null;
  }
  const { error } = await admin.from("leads").update({ rep_code, rep_name }).eq("id", leadId);
  if (error) return { error: error.message };
  revalidatePath("/staff/sales"); revalidatePath("/staff/pipeline");
  return { ok: true };
}

/** Any employee: update their own self-service profile fields. */
export async function updateMyProfile(formData: FormData): Promise<ActionResult> {
  const me = await getStaffMember();
  if (!me) return { error: "Not signed in." };
  const keys = ["name", "phone", "personal_email", "address", "timezone", "emergency_contact_name", "emergency_contact_phone", "dd_bank_name", "dd_routing", "dd_account", "dd_account_type"];
  const p: Record<string, string> = {};
  keys.forEach((k) => { p[k] = String(formData.get(k) || "").trim(); });
  const { error } = await createClient().rpc("update_my_profile", { p });
  if (error) return { error: error.message };
  revalidatePath("/staff/profile");
  return { ok: true };
}

/** Any employee: upload their own profile photo. */
export async function uploadMyAvatar(formData: FormData): Promise<ActionResult> {
  const me = await getStaffMember();
  if (!me) return { error: "Not signed in." };
  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose an image." };
  if (file.size > 5 * 1024 * 1024) return { error: "Image must be under 5MB." };
  const admin = createServiceClient();
  const ext = (file.name.split(".").pop() || "jpg").replace(/[^a-z0-9]/gi, "").slice(0, 5) || "jpg";
  const path = `${me.id}/${Date.now()}.${ext}`;
  const buf = Buffer.from(await file.arrayBuffer());
  const up = await admin.storage.from("staff-avatars").upload(path, buf, { contentType: file.type || "image/jpeg", upsert: true });
  if (up.error) return { error: up.error.message };
  await admin.from("staff").update({ avatar_path: path }).eq("id", me.id);
  revalidatePath("/staff/profile");
  return { ok: true };
}

/** Admin/BM: set an employee's employment type and start date. */
export async function setEmploymentInfo(staffId: string, employmentType: string, startDate: string): Promise<ActionResult> {
  const me = await getStaffMember();
  if (!isPrivileged(me)) return { error: "Admins and business managers only." };
  const { error } = await createServiceClient().from("staff")
    .update({ employment_type: employmentType || null, start_date: startDate || null }).eq("id", staffId);
  if (error) return { error: error.message };
  revalidatePath("/staff/directory"); revalidatePath("/staff/profile");
  return { ok: true };
}

/** Admin/BM: upload a document (paystub, contract, NDA, tax form) to an employee. */
export async function uploadStaffDocument(formData: FormData): Promise<ActionResult> {
  const me = await getStaffMember();
  if (!isPrivileged(me)) return { error: "Admins and business managers only." };
  const staffId = String(formData.get("staffId") || "");
  const kind = String(formData.get("kind") || "document");
  const requires = formData.get("requires_signature") === "on";
  if (!staffId) return { error: "Missing employee." };
  const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (!files.length) return { error: "Choose a file." };
  const admin = createServiceClient();
  let saved = 0;
  for (const file of files.slice(0, 10)) {
    const safe = file.name.replace(/[^\w.\-]+/g, "_").slice(0, 120);
    const path = `${staffId}/${Date.now()}-${safe}`;
    const buf = Buffer.from(await file.arrayBuffer());
    const up = await admin.storage.from("staff-docs").upload(path, buf, { contentType: file.type || "application/octet-stream" });
    if (!up.error) { await admin.from("staff_documents").insert({ staff_id: staffId, name: file.name.slice(0, 200), path, kind, requires_signature: requires, uploaded_by: me!.id } as any); saved++; }
  }
  if (!saved) return { error: "Upload failed — try again." };
  revalidatePath("/staff/directory"); revalidatePath("/staff/profile");
  return { ok: true };
}

/** Admin/BM: remove an employee document. */
export async function deleteStaffDocument(docId: string): Promise<ActionResult> {
  const me = await getStaffMember();
  if (!isPrivileged(me)) return { error: "Admins and business managers only." };
  const admin = createServiceClient();
  const { data: d } = await admin.from("staff_documents").select("path").eq("id", docId).maybeSingle();
  if (d) await admin.storage.from("staff-docs").remove([(d as any).path]);
  await admin.from("staff_documents").delete().eq("id", docId);
  revalidatePath("/staff/directory"); revalidatePath("/staff/profile");
  return { ok: true };
}

/** Any employee: e-sign one of their own documents (records name + time + IP). */
export async function signStaffDocument(docId: string, signedName: string): Promise<ActionResult> {
  const me = await getStaffMember();
  if (!me) return { error: "Not signed in." };
  const name = String(signedName || "").trim();
  if (!name) return { error: "Type your full legal name to sign." };
  const ip = headers().get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  const { error } = await createClient().rpc("sign_staff_document", { p_doc: docId, p_name: name, p_ip: ip });
  if (error) return { error: error.message };
  revalidatePath("/staff/profile"); revalidatePath("/staff/directory");
  return { ok: true };
}

export async function signOutStaff() {
  const db = createClient();
  await db.auth.signOut();
  revalidatePath("/staff");
}

/** Employee: sign one of their documents through DocuSign (embedded signing).
 *  Returns an embedded signing URL to send the browser to. */
export async function startDocusignSigning(docId: string): Promise<{ url?: string; error?: string }> {
  const me = await getStaffMember();
  if (!me) return { error: "Not signed in." };
  if (!docusignConfigured()) return { error: "DocuSign isn't set up yet — ask your administrator." };
  const admin = createServiceClient();
  const { data: doc } = await admin.from("staff_documents").select("*").eq("id", docId).maybeSingle();
  if (!doc || (doc as any).staff_id !== me.id) return { error: "Document not found." };
  const { data: file, error: dErr } = await admin.storage.from("staff-docs").download((doc as any).path);
  if (dErr || !file) return { error: "Couldn't load the document file." };
  const buf = Buffer.from(await file.arrayBuffer());
  const site = process.env.NEXT_PUBLIC_SITE_URL || "";
  try {
    const envelopeId = await createEnvelope({
      pdfBase64: buf.toString("base64"), docName: (doc as any).name || "Document",
      signerEmail: me.email, signerName: me.name || me.email, clientUserId: me.id,
    });
    await admin.from("staff_documents").update({ docusign_envelope_id: envelopeId, docusign_status: "sent" }).eq("id", docId);
    const url = await recipientViewUrl({
      envelopeId, signerEmail: me.email, signerName: me.name || me.email, clientUserId: me.id,
      returnUrl: `${site}/api/docusign-return?doc=${docId}`,
    });
    return { url };
  } catch (e) { console.warn("[docusign] start", e); return { error: "DocuSign error — check the setup." }; }
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

/** Staff (AM/VA): set a client's 30-day roadmap phase status + note. RLS allows
 *  staff writes; the delivery page only surfaces the staffer's own/open clients.
 *  Used as a <form> action, so it returns void. */
export async function saveRoadmapPhase(formData: FormData): Promise<void> {
  const me = await getStaffMember();
  if (!me) return;
  const clientId = String(formData.get("clientId") || "");
  const phase = String(formData.get("phase") || "");
  if (!clientId || !phase) return;
  const status = String(formData.get("status") || "Not started");
  const note = String(formData.get("note") || "").trim() || null;
  const db = createClient();
  await db.from("client_roadmap").upsert(
    { client_id: clientId, phase, status, note, updated_at: new Date().toISOString() },
    { onConflict: "client_id,phase" },
  );
  revalidatePath("/staff/delivery");
  revalidatePath("/portal/roadmap");
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

/** Accept a Requested task into the work queue. A VA/AM may accept a client
 *  request; a PURCHASED service can only be approved & assigned by an admin. */
export async function acceptTask(taskId: string): Promise<ActionResult> {
  const me = await getStaffMember();
  if (!me) return { error: "Not signed in." };
  const db = createClient();
  const { data: task } = await db.from("client_tasks").select("paid,created_by").eq("id", taskId).maybeSingle();
  const isPurchase = !!task && (task as any).paid && (task as any).created_by === "staff";
  if (isPurchase && me.role !== "Administrator") return { error: "Only an administrator can approve & assign a purchased service." };
  const { error } = await db.from("client_tasks").update({ column_name: "In progress", needs_clarification: false }).eq("id", taskId);
  if (error) return { error: error.message };
  revalidatePath("/staff/delivery"); revalidatePath("/portal/tasks");
  return { ok: true };
}

/** Staff: mark a task done and send it to the client for review. */
export async function submitTaskToClient(taskId: string): Promise<ActionResult> {
  const me = await getStaffMember();
  if (!me) return { error: "Not signed in." };
  const db = createClient();
  const { error } = await db.from("client_tasks").update({ column_name: "In review" }).eq("id", taskId);
  if (error) return { error: error.message };
  revalidatePath("/staff/delivery"); revalidatePath("/portal/tasks");
  return { ok: true };
}

/** Staff (AM/VA): set a task's extra charge and email the client a payment link. */
export async function sendTaskPaymentLink(taskId: string, amount: string): Promise<ActionResult> {
  const me = await getStaffMember();
  if (!me) return { error: "Not signed in." };
  const cents = Math.round(parseFloat(String(amount).replace(/[^0-9.]/g, "")) * 100);
  if (!cents || cents < 100) return { error: "Enter an amount of at least $1." };
  const db = createClient();
  const { data: task } = await db.from("client_tasks").select("id,title,client_id").eq("id", taskId).maybeSingle();
  if (!task) return { error: "Task not found." };
  const { data: client } = await db.from("clients").select("email,billing_type").eq("id", (task as any).client_id).maybeSingle();
  const bt = (client as any)?.billing_type;
  if (bt === "comp" || bt === "barter") return { error: `This is a ${bt} account — no charges are sent. Just deliver the task.` };
  const { error } = await db.from("client_tasks").update({ charge_cents: cents, charge_status: "sent" }).eq("id", taskId);
  if (error) return { error: error.message };
  const site = process.env.NEXT_PUBLIC_SITE_URL || "";
  try {
    if ((client as any)?.email) {
      await sendTaskPaymentRequest({
        to: (client as any).email,
        amount: "$" + (cents / 100).toFixed(2),
        payUrl: `${site}/api/pay/task/${taskId}`,
        taskTitle: (task as any).title || "Your task",
      });
    }
  } catch (e) { console.error("[sendTaskPaymentLink] email", e); }
  revalidatePath("/staff/delivery"); revalidatePath("/portal/tasks");
  return { ok: true };
}

/** Admin only: approve a logged work entry so its hours appear on the client's
 *  Work Log (and weekly report). Only approved time is shown to the client. */
export async function approveWorkLog(id: string): Promise<ActionResult> {
  const me = await getStaffMember();
  if (me?.role !== "Administrator") return { error: "Admins only." };
  const db = createClient();
  const { error } = await db.from("client_work_log").update({ approved: true, approved_by: me.name || me.role, approved_at: new Date().toISOString() }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/staff/admin"); revalidatePath("/portal/work-log"); revalidatePath("/portal/weekly");
  return { ok: true };
}

/** Admin only: generate & publish this week's PDF report for a client — the last
 *  7 days of approved hours + deliverables, stored for the client to download. */
export async function generateWeeklyReport(clientId: string): Promise<ActionResult> {
  const me = await getStaffMember();
  if (!me) return { error: "Not signed in." };
  if (!(await canReachClient(me, clientId))) return { error: "This isn't your account." };
  const db = createClient();
  const { data: client } = await db.from("clients").select("business,contact,email").eq("id", clientId).maybeSingle();
  if (!client) return { error: "Client not found." };
  const startISO = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  const endISO = new Date().toISOString().slice(0, 10);
  const [{ data: wl }, { data: dl }] = await Promise.all([
    db.from("client_work_log").select("*").eq("client_id", clientId).eq("approved", true).gte("worked_on", startISO).order("worked_on"),
    db.from("client_deliverables").select("*").eq("client_id", clientId).gte("delivered_on", startISO).order("delivered_on"),
  ]);
  const pdf = await buildWeeklyReportPdf({
    clientName: (client as any).contact || (client as any).email,
    business: (client as any).business,
    periodStart: startISO,
    periodEnd: endISO,
    workLog: ((wl as any[]) || []).map((w) => ({ worked_on: w.worked_on, service: w.service, task: w.task, performed_by: w.performed_by, hours: Number(w.hours || 0) })),
    deliverables: ((dl as any[]) || []).map((d) => ({ name: d.name, status: d.status, delivered_on: d.delivered_on })),
  });
  const admin = createServiceClient();
  const path = `${clientId}/${endISO}-weekly-${Date.now()}.pdf`;
  const up = await admin.storage.from("client-reports").upload(path, Buffer.from(pdf), { contentType: "application/pdf" });
  if (up.error) return { error: up.error.message };
  const { error } = await admin.from("client_reports").insert({
    client_id: clientId, name: `Weekly report · ${startISO} to ${endISO}`, path, period_start: startISO, period_end: endISO,
  } as any);
  if (error) return { error: error.message };
  revalidatePath("/staff/admin"); revalidatePath("/staff/weekly"); revalidatePath("/portal/weekly");
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

// ── Internal document library + assignment (admin/BM) ─────────────────────────

/** Admin/BM: add a reusable document template to the library. */
export async function uploadDocumentTemplate(formData: FormData): Promise<ActionResult> {
  const me = await getStaffMember();
  if (!isPrivileged(me)) return { error: "Admins and business managers only." };
  const file = formData.getAll("files").find((f): f is File => f instanceof File && f.size > 0);
  if (!file) return { error: "Choose a file (PDF recommended for signing)." };
  const name = String(formData.get("name") || file.name).trim();
  const kind = String(formData.get("kind") || "document");
  const requires_signature = formData.get("requires_signature") != null;
  const admin = createServiceClient();
  const safe = file.name.replace(/[^\w.\-]+/g, "_").slice(0, 120);
  const path = `templates/${Date.now()}-${safe}`;
  const up = await admin.storage.from("staff-docs").upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type || "application/octet-stream" });
  if (up.error) return { error: up.error.message };
  const { error } = await admin.from("document_templates").insert({ name, kind, path, requires_signature, created_by: me!.id });
  if (error) return { error: error.message };
  revalidatePath("/staff/directory");
  return { ok: true };
}

/** Admin/BM: remove a template from the library (does not touch already-assigned copies). */
export async function deleteDocumentTemplate(id: string): Promise<ActionResult> {
  const me = await getStaffMember();
  if (!isPrivileged(me)) return { error: "Admins and business managers only." };
  const { error } = await createServiceClient().from("document_templates").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/staff/directory");
  return { ok: true };
}

/** Admin/BM: assign a template to specific employees and/or everyone in a role.
 *  Creates a staff_documents row (to complete / e-sign) for each target. */
export async function assignTemplate(templateId: string, opts: { staffIds?: string[]; role?: string }): Promise<ActionResult> {
  const me = await getStaffMember();
  if (!isPrivileged(me)) return { error: "Admins and business managers only." };
  const admin = createServiceClient();
  const { data: tpl } = await admin.from("document_templates").select("*").eq("id", templateId).maybeSingle();
  if (!tpl) return { error: "Template not found." };
  const set = new Set<string>(opts.staffIds || []);
  if (opts.role) {
    const { data: staff } = await admin.from("staff").select("id,roles,role").eq("active", true);
    (staff ?? []).forEach((s: any) => { if ((Array.isArray(s.roles) && s.roles.includes(opts.role)) || s.role === opts.role) set.add(s.id); });
  }
  const targets = [...set];
  if (!targets.length) return { error: "No employees matched." };
  const rows = targets.map((sid) => ({
    staff_id: sid, name: (tpl as any).name, kind: (tpl as any).kind, path: (tpl as any).path,
    requires_signature: (tpl as any).requires_signature, uploaded_by: me!.name || me!.email, template_id: templateId,
  }));
  const { error } = await admin.from("staff_documents").insert(rows);
  if (error) return { error: error.message };
  revalidatePath("/staff/directory"); revalidatePath("/staff/profile");
  return { ok: true, count: targets.length } as any;
}

// ── Client contacts & suspension (admin/BM) ───────────────────────────────────

/** Admin/BM: add an extra contact (name/email/phone/title) to a client. */
export async function addClientContact(formData: FormData): Promise<ActionResult> {
  const me = await getStaffMember();
  if (!isPrivileged(me)) return { error: "Admins and business managers only." };
  const clientId = String(formData.get("clientId") || "");
  const email = String(formData.get("email") || "").trim();
  const name = String(formData.get("name") || "").trim();
  if (!clientId) return { error: "Missing client." };
  if (!email && !name) return { error: "Add at least a name or email." };
  const { error } = await createClient().from("client_contacts").insert({
    client_id: clientId, name: name || null, email: email || null,
    phone: String(formData.get("phone") || "") || null, title: String(formData.get("title") || "") || null,
  });
  if (error) return { error: error.message };
  revalidatePath("/staff/admin");
  return { ok: true };
}

/** Admin/BM: remove an extra contact. */
export async function deleteClientContact(id: string): Promise<ActionResult> {
  const me = await getStaffMember();
  if (!isPrivileged(me)) return { error: "Admins and business managers only." };
  const { error } = await createClient().from("client_contacts").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/staff/admin");
  return { ok: true };
}

/** Admin/BM: suspend (or reactivate) a client account, e.g. for non-payment.
 *  Suspended clients are blocked from the portal until reactivated. */
export async function setClientSuspended(clientId: string, suspended: boolean, reason?: string): Promise<ActionResult> {
  const me = await getStaffMember();
  if (!isPrivileged(me)) return { error: "Admins and business managers only." };
  const { error } = await createClient().from("clients").update({
    suspended,
    suspended_reason: suspended ? (reason || "Non-payment") : null,
    suspended_at: suspended ? new Date().toISOString() : null,
  }).eq("id", clientId);
  if (error) return { error: error.message };
  revalidatePath("/staff/admin"); revalidatePath("/portal");
  return { ok: true };
}

// ── Calendar ────────────────────────────────────────────────────────────────

/** Employee: add an event to your OWN calendar, a teammate's (shareable), or a
 *  CLIENT's calendar. Target: "" = me, "staff:<id>" = teammate, "client:<id>". */
export async function addCalendarEvent(formData: FormData): Promise<ActionResult> {
  const me = await getStaffMember();
  if (!me) return { error: "Not signed in." };
  const title = String(formData.get("title") || "").trim();
  if (!title) return { error: "Give the event a title." };
  const event_date = String(formData.get("event_date") || "");
  if (!event_date) return { error: "Pick a date." };
  const event_time = String(formData.get("event_time") || "") || null;
  const note = String(formData.get("note") || "") || null;
  const target = String(formData.get("target") || "");
  const db = createClient();
  if (target.startsWith("client:")) {
    const clientId = target.slice(7);
    const { error } = await db.from("client_events").insert({ client_id: clientId, title, event_date, event_time, note, created_by_role: "staff", created_by_name: me.name || me.email });
    if (error) return { error: error.message };
  } else {
    const staffId = target.startsWith("staff:") ? target.slice(6) : me.id;
    const { error } = await db.from("staff_events").insert({ staff_id: staffId, created_by: me.id, title, event_date, event_time, note });
    if (error) return { error: error.message };
  }
  revalidatePath("/staff/calendar"); revalidatePath("/portal/calendar");
  return { ok: true };
}

/** Delete a client-calendar event (RLS: anyone who can access the client). */
export async function deleteClientEvent(id: string): Promise<ActionResult> {
  const me = await getStaffMember();
  if (!me) return { error: "Not signed in." };
  const { error } = await createClient().from("client_events").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/staff/calendar"); revalidatePath("/portal/calendar");
  return { ok: true };
}

/** Delete a calendar event (RLS: owner, creator, or privileged). */
export async function deleteCalendarEvent(id: string): Promise<ActionResult> {
  const me = await getStaffMember();
  if (!me) return { error: "Not signed in." };
  const { error } = await createClient().from("staff_events").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/staff/calendar");
  return { ok: true };
}

// ── Internal messaging ────────────────────────────────────────────────────────

/** Send a 1:1 DM to a teammate. Admins/BMs can read all DMs (oversight).
 *  The recipient gets an email that a message is waiting. */
export async function sendDirectMessage(recipientId: string, body: string): Promise<ActionResult> {
  const me = await getStaffMember();
  if (!me) return { error: "Not signed in." };
  const text = String(body || "").trim();
  if (!text) return { error: "Write a message first." };
  if (!recipientId || recipientId === me.id) return { error: "Pick a teammate to message." };
  const { error } = await createClient().from("direct_messages").insert({ sender_id: me.id, recipient_id: recipientId, body: text });
  if (error) return { error: error.message };
  // Notify the recipient by email (look up their address with the service client;
  // RLS won't let one staffer read another's row).
  try {
    const admin = createServiceClient();
    const { data: r } = await admin.from("staff").select("email,personal_email,active").eq("id", recipientId).maybeSingle();
    const to = (r as any)?.email;
    if (to && (r as any)?.active) {
      const site = process.env.NEXT_PUBLIC_SITE_URL || "";
      await sendTeammateMessageAlert({ to, from: me.name || me.email, portalUrl: site ? `${site}/staff/messages?view=dm&with=${me.id}` : "", replyTo: me.email, message: text });
    }
  } catch (e) { console.warn("[sendDirectMessage] email", e); }
  revalidatePath("/staff/messages"); revalidatePath("/staff");
  return { ok: true };
}

/** Mark a DM conversation with a teammate as read (clears my unread badge). */
export async function markDmRead(withId: string): Promise<ActionResult> {
  const me = await getStaffMember();
  if (!me || !withId) return { error: "Not signed in." };
  const { error } = await createClient().from("direct_messages")
    .update({ read_at: new Date().toISOString() })
    .eq("recipient_id", me.id).eq("sender_id", withId).is("read_at", null);
  if (error) return { error: error.message };
  revalidatePath("/staff/messages"); revalidatePath("/staff");
  return { ok: true };
}

/** Mark a channel as read up to now (clears my unread badge for it). */
export async function markChannelRead(channelId: string): Promise<ActionResult> {
  const me = await getStaffMember();
  if (!me || !channelId) return { error: "Not signed in." };
  const { error } = await createClient().from("channel_reads")
    .upsert({ staff_id: me.id, channel_id: channelId, last_read_at: new Date().toISOString() }, { onConflict: "staff_id,channel_id" });
  if (error) return { error: error.message };
  revalidatePath("/staff/messages"); revalidatePath("/staff");
  return { ok: true };
}

/** Post a message to a shared channel (all staff can read). */
export async function postChannelMessage(channelId: string, body: string): Promise<ActionResult> {
  const me = await getStaffMember();
  if (!me) return { error: "Not signed in." };
  const text = String(body || "").trim();
  if (!text) return { error: "Write a message first." };
  if (!channelId) return { error: "Pick a channel." };
  const { error } = await createClient().from("channel_messages").insert({ channel_id: channelId, author_id: me.id, author_name: me.name || me.email, body: text });
  if (error) return { error: error.message };
  revalidatePath("/staff/messages");
  return { ok: true };
}

/** Admin/BM: create a shared channel. */
export async function createChannel(formData: FormData): Promise<ActionResult> {
  const me = await getStaffMember();
  if (!isPrivileged(me)) return { error: "Admins and business managers only." };
  const name = String(formData.get("name") || "").trim().replace(/^#/, "").toLowerCase().replace(/\s+/g, "-");
  if (!name) return { error: "Name the channel." };
  const { error } = await createClient().from("channels").insert({ name, description: String(formData.get("description") || "") || null, created_by: me!.id });
  if (error) return { error: error.message };
  revalidatePath("/staff/messages");
  return { ok: true };
}

/** Admin/BM: rename / re-describe / set post policy / archive a channel. */
export async function updateChannel(formData: FormData): Promise<ActionResult> {
  const me = await getStaffMember();
  if (!isPrivileged(me)) return { error: "Admins and business managers only." };
  const id = String(formData.get("id") || "");
  if (!id) return { error: "Missing channel." };
  const patch: any = {};
  const name = String(formData.get("name") || "").trim().replace(/^#/, "").toLowerCase().replace(/\s+/g, "-");
  if (name) patch.name = name;
  patch.description = String(formData.get("description") || "") || null;
  const policy = String(formData.get("post_policy") || "");
  if (policy === "all" || policy === "restricted") patch.post_policy = policy;
  if (formData.get("archived") != null) patch.archived = String(formData.get("archived")) === "true";
  const { error } = await createClient().from("channels").update(patch).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/staff/messages");
  return { ok: true };
}

/** Admin/BM: set exactly who may post in a restricted channel (replaces the list). */
export async function setChannelPosters(channelId: string, staffIds: string[]): Promise<ActionResult> {
  const me = await getStaffMember();
  if (!isPrivileged(me)) return { error: "Admins and business managers only." };
  if (!channelId) return { error: "Missing channel." };
  const db = createClient();
  await db.from("channel_posters").delete().eq("channel_id", channelId);
  if (staffIds.length) {
    const rows = staffIds.map((sid) => ({ channel_id: channelId, staff_id: sid }));
    const { error } = await db.from("channel_posters").insert(rows);
    if (error) return { error: error.message };
  }
  revalidatePath("/staff/messages");
  return { ok: true };
}

/** Add a staff-only note on a client. The client NEVER sees these — they're a
 *  private team scratchpad on the account, retained across VA changes. */
export async function addClientStaffNote(clientId: string, body: string): Promise<ActionResult> {
  const me = await getStaffMember();
  if (!me) return { error: "Not signed in." };
  const text = String(body || "").trim();
  if (!text) return { error: "Write a note first." };
  const { error } = await createClient().from("client_staff_notes").insert({ client_id: clientId, author_id: me.id, author_name: me.name || me.email, body: text });
  if (error) return { error: error.message };
  revalidatePath("/staff/messages");
  return { ok: true };
}
