"use server";
export type ActionResult = { error?: string; ok?: boolean };

import { revalidatePath } from "next/cache";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getPortalClient } from "@/lib/portal";
import { sendStaffTaskAlert, sendStaffMessageAlert, sendKickoffScheduledAlert, sendServiceUpgradeRequest, sendKickoffRescheduled } from "@/lib/email";
import { uploadNoteFiles } from "@/lib/message-files";
import type { ClientRow } from "@/lib/database.types";

/**
 * Email the client's assigned VA/AM. If the client is UNASSIGNED (a brand-new
 * à la carte purchase has no owner yet), fall back to the admin / business-
 * manager / accounts-manager inbox so a new client's first message or request
 * is never silently dropped. Last resort is ADMIN_NOTIFY_EMAIL.
 */
async function notifyAssignedStaff(
  client: ClientRow,
  build: (email: string) => Promise<void>,
): Promise<void> {
  try {
    const admin = createServiceClient();
    const aid = (client as any).assigned_to as string | null;
    let emails: string[] = [];
    if (aid && /^[0-9a-f-]{36}$/i.test(aid)) {
      const { data: s } = await admin.from("staff").select("email").eq("id", aid).maybeSingle();
      if ((s as any)?.email) emails.push((s as any).email);
    }
    if (emails.length === 0) {
      // Unassigned: notify every active admin / BM / AM so someone picks it up.
      const { data: mgrs } = await admin.from("staff").select("email,roles,role").eq("active", true);
      emails = (mgrs || [])
        .filter((st: any) => {
          const r = Array.isArray(st.roles) ? st.roles : [];
          return r.includes("Administrator") || r.includes("Business Manager") || r.includes("Accounts Manager")
            || st.role === "Administrator" || st.role === "Business Manager" || st.role === "Accounts Manager";
        })
        .map((st: any) => st.email).filter(Boolean);
      const fallback = process.env.ADMIN_NOTIFY_EMAIL || "info@hillcountryconsultants.com";
      if (emails.length === 0 && fallback) emails = [fallback];
    }
    // De-dupe and send.
    for (const email of Array.from(new Set(emails))) { if (email) await build(email); }
  } catch (e) { console.warn("[notifyAssignedStaff]", e); }
}

const siteUrl = () => process.env.NEXT_PUBLIC_SITE_URL || "";
const clientLabel = (c: ClientRow) => c.business || c.contact || c.email;

/**
 * Client submits a task: full description, date needed, and any documents.
 * Lands in "Requested". Files go to a private bucket via the service role, with
 * their metadata recorded on client_task_files.
 */
export async function addTaskRequest(formData: FormData): Promise<ActionResult> {
  const client = await getPortalClient();
  if (!client) return { error: "Not signed in." };
  if ((client as any).suspended) return { error: "Your account is suspended. Please contact us to reactivate." };
  const details = String(formData.get("details") || "").trim();
  if (!details) return { error: "Describe exactly what you need us to do." };
  const due = String(formData.get("due") || "") || null;
  const title = details.length > 70 ? details.slice(0, 70).trimEnd() + "…" : details;

  const db = createClient();
  const { data: task, error } = await db
    .from("client_tasks")
    .insert({ client_id: client.id, title, details, due_date: due, column_name: "Requested", created_by: "client" })
    .select("id")
    .single();
  if (error || !task) return { error: error?.message || "Could not save your task." };

  const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length) {
    try {
      const admin = createServiceClient();
      for (const file of files.slice(0, 10)) {
        const safe = file.name.replace(/[^\w.\-]+/g, "_").slice(0, 120);
        const path = `${client.id}/${task.id}/${Date.now()}-${safe}`;
        const buf = Buffer.from(await file.arrayBuffer());
        const up = await admin.storage.from("task-files").upload(path, buf, { contentType: file.type || "application/octet-stream" });
        if (!up.error) {
          await admin.from("client_task_files").insert({
            task_id: task.id, client_id: client.id, name: file.name.slice(0, 200), path, size: file.size, uploaded_by: "client",
          } as any);
        }
      }
    } catch (e) { console.error("[addTaskRequest] upload", e); }
  }
  await notifyAssignedStaff(client, (to) =>
    sendStaffTaskAlert({ to, clientName: clientLabel(client), title, due: due || "", portalUrl: siteUrl() ? `${siteUrl()}/staff/daily` : "" }),
  );
  revalidatePath("/portal/tasks"); revalidatePath("/staff/daily");
  return { ok: true };
}

/** Client approves a delivered task (from "In review" → "Delivered", dated). */
export async function approveTask(taskId: string): Promise<ActionResult> {
  const client = await getPortalClient();
  if (!client) return { error: "Not signed in." };
  if ((client as any).suspended) return { error: "Your account is suspended. Please contact us to reactivate." };
  const { error } = await createClient().rpc("client_approve_task", { p_task: taskId });
  if (error) return { error: error.message };
  revalidatePath("/portal/tasks");
  return { ok: true };
}

/** Client asks for changes (→ back to "In progress", flags the VA/AM to call). */
export async function requestChanges(taskId: string): Promise<ActionResult> {
  const client = await getPortalClient();
  if (!client) return { error: "Not signed in." };
  if ((client as any).suspended) return { error: "Your account is suspended. Please contact us to reactivate." };
  const { error } = await createClient().rpc("client_request_changes", { p_task: taskId });
  if (error) return { error: error.message };
  // Notify the task's assignee that the client wants changes.
  try {
    const admin = createServiceClient();
    const { data: t } = await admin.from("client_tasks").select("assignee_id,title").eq("id", taskId).maybeSingle();
    if ((t as any)?.assignee_id) {
      const { notify } = await import("@/lib/notify");
      await notify((t as any).assignee_id, { kind: "changes", title: "Client requested changes", body: `${(t as any).title} · ${clientLabel(client)}`, href: "/staff/my-work" });
    }
  } catch (e) { console.warn("[requestChanges notify]", e); }
  revalidatePath("/portal/tasks"); revalidatePath("/staff/my-work");
  return { ok: true };
}

/** Add a credential REGISTER entry — records what account we hold, never a password. */
export async function addVaultEntry(formData: FormData): Promise<ActionResult> {
  const client = await getPortalClient();
  if (!client) return { error: "Not signed in." };
  if ((client as any).suspended) return { error: "Your account is suspended. Please contact us to reactivate." };
  const name = String(formData.get("name") || "").trim();
  if (!name) return { error: "Give the entry a name (e.g. the tool it's for)." };
  const db = createClient();
  const { error } = await db.from("client_vault").insert({
    client_id: client.id,
    name,
    username: String(formData.get("username") || "") || null,
    url: String(formData.get("url") || "") || null,
    purpose: String(formData.get("purpose") || "") || null,
    needs_resync: false,
  });
  if (error) return { error: error.message };
  revalidatePath("/portal/vault");
  return { ok: true };
}

/** Flag/clear that a login needs re-syncing (e.g. after a password change). */
export async function setResync(id: string, needs: boolean): Promise<ActionResult> {
  const client = await getPortalClient();
  if (!client) return { error: "Not signed in." };
  if ((client as any).suspended) return { error: "Your account is suspended. Please contact us to reactivate." };
  const db = createClient();
  const { error } = await db.from("client_vault").update({ needs_resync: needs, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/portal/vault");
  return { ok: true };
}

export async function deleteVaultEntry(id: string): Promise<ActionResult> {
  const client = await getPortalClient();
  if (!client) return { error: "Not signed in." };
  if ((client as any).suspended) return { error: "Your account is suspended. Please contact us to reactivate." };
  const db = createClient();
  const { error } = await db.from("client_vault").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/portal/vault");
  return { ok: true };
}

/** Client posts a message to their account lead (stored as a client note),
 *  optionally with attachments. */
export async function addMessage(formData: FormData): Promise<ActionResult> {
  const client = await getPortalClient();
  if (!client) return { error: "Not signed in." };
  if ((client as any).suspended) return { error: "Your account is suspended. Please contact us to reactivate." };
  const body = String(formData.get("body") || "").trim();
  const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (!body && files.length === 0) return { error: "Write a message or attach a file." };
  const db = createClient();
  const { data: note, error } = await db.from("client_notes")
    .insert({ client_id: client.id, body, sender: "client", author_name: client.contact || null })
    .select("id").single();
  if (error) return { error: error.message };
  const saved = files.length ? await uploadNoteFiles(client.id, (note as any).id, files, client.contact || client.email || "Client") : 0;
  const inbound = process.env.INBOUND_EMAIL_DOMAIN;
  const replyTo = inbound && (client as any).reply_token ? `reply+${(client as any).reply_token}@${inbound}` : (client.email || undefined);
  await notifyAssignedStaff(client, (to) =>
    sendStaffMessageAlert({ to, clientName: clientLabel(client), portalUrl: siteUrl() ? `${siteUrl()}/staff/messages` : "", replyTo, message: body || (saved ? `Sent ${saved} file${saved > 1 ? "s" : ""}.` : "") }),
  );
  revalidatePath("/portal/messages"); revalidatePath("/staff/messages");
  return { ok: true };
}

/** Client adds an event to their own calendar (visible to their account team). */
export async function addClientEvent(formData: FormData): Promise<ActionResult> {
  const client = await getPortalClient();
  if (!client) return { error: "Not signed in." };
  if ((client as any).suspended) return { error: "Your account is suspended. Please contact us to reactivate." };
  const title = String(formData.get("title") || "").trim();
  if (!title) return { error: "Give the event a title." };
  const event_date = String(formData.get("event_date") || "");
  if (!event_date) return { error: "Pick a date." };
  const { error } = await createClient().from("client_events").insert({
    client_id: client.id, title, event_date,
    event_time: String(formData.get("event_time") || "") || null,
    note: String(formData.get("note") || "") || null,
    created_by_role: "client", created_by_name: client.contact || client.business || client.email,
  });
  if (error) return { error: error.message };
  revalidatePath("/portal/calendar"); revalidatePath("/staff/calendar");
  return { ok: true };
}

/** Client removes an event from their calendar. */
export async function deleteClientEvent(id: string): Promise<ActionResult> {
  const client = await getPortalClient();
  if (!client) return { error: "Not signed in." };
  if ((client as any).suspended) return { error: "Your account is suspended. Please contact us to reactivate." };
  const { error } = await createClient().from("client_events").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/portal/calendar");
  return { ok: true };
}

/** Sign out of the portal. */
export async function signOut() {
  const db = createClient();
  await db.auth.signOut();
  revalidatePath("/portal");
}

/**
 * The signed-in client marks their kickoff call as scheduled (after booking it
 * on the Google appointment page). Clients can't update their own row under RLS,
 * so this goes through a SECURITY DEFINER RPC scoped to auth.uid()'s client row.
 */
export async function markKickoffScheduled(): Promise<{ ok?: boolean; error?: string }> {
  const db = createClient();
  const { error } = await db.rpc("mark_kickoff_scheduled");
  if (error) return { error: error.message };

  // Alert the account owner + the team inbox so someone adds the right staff to
  // the calendar invite. Best-effort; also flags on their dashboards.
  try {
    const client = await getPortalClient();
    if (client) {
      const admin = createServiceClient();
      const recipients = new Set<string>();
      const notify = process.env.ADMIN_NOTIFY_EMAIL || "info@hillcountryconsultants.com";
      if (notify) recipients.add(notify);
      const aid = (client as any).assigned_to as string | null;
      if (aid && /^[0-9a-f-]{36}$/i.test(aid)) {
        const { data: s } = await admin.from("staff").select("email").eq("id", aid).maybeSingle();
        if ((s as any)?.email) recipients.add((s as any).email);
      }
      if (recipients.size) {
        await sendKickoffScheduledAlert({ to: [...recipients], clientName: clientLabel(client), portalUrl: siteUrl() ? `${siteUrl()}/staff` : "" });
      }
    }
  } catch (e) { console.warn("[markKickoffScheduled] alert", e); }

  revalidatePath("/portal");
  revalidatePath("/staff");
  return { ok: true };
}

/** Shared: put/refresh the kickoff on the in-app shared calendar (client_events)
 *  and email the client + admin + assigned ES/CS that it moved. */
async function syncKickoffMove(client: ClientRow, dateISO: string, time: string, byRole: string, byName: string) {
  const admin = createServiceClient();
  const whenText = `${dateISO}${time ? ` at ${time}` : ""}`;
  // Replace any existing kickoff event so the shared calendar shows one entry.
  await admin.from("client_events").delete().eq("client_id", client.id).eq("title", "Kickoff call");
  await admin.from("client_events").insert({
    client_id: client.id, title: "Kickoff call", event_date: dateISO, event_time: time || null,
    note: "Rescheduled", created_by_role: byRole, created_by_name: byName,
  } as any);
  // Notify client + admin + assigned staff.
  const recipients = new Set<string>();
  if (client.email) recipients.add(client.email);
  const notify = process.env.ADMIN_NOTIFY_EMAIL || "info@hillcountryconsultants.com";
  if (notify) recipients.add(notify);
  const aid = (client as any).assigned_to as string | null;
  if (aid && /^[0-9a-f-]{36}$/i.test(aid)) {
    const { data: s } = await admin.from("staff").select("email").eq("id", aid).maybeSingle();
    if ((s as any)?.email) recipients.add((s as any).email);
  }
  if (recipients.size) {
    await sendKickoffRescheduled({ to: [...recipients], clientName: clientLabel(client), whenText, byName, portalUrl: siteUrl() ? `${siteUrl()}/portal` : "" }).catch((e) => console.warn("[kickoff reschedule email]", e));
  }
}

/** Client reschedules their own kickoff to a new date/time (in-app picker). */
export async function rescheduleKickoff(dateISO: string, time: string): Promise<ActionResult> {
  const client = await getPortalClient();
  if (!client) return { error: "Not signed in." };
  if (!dateISO) return { error: "Pick a date." };
  const atISO = new Date(`${dateISO}T${(time || "09:00")}:00`).toISOString();
  const { error } = await createClient().rpc("client_reschedule_kickoff", { p_at: atISO });
  if (error) return { error: error.message };
  try { await syncKickoffMove(client, dateISO, time, "client", clientLabel(client)); } catch (e) { console.warn("[rescheduleKickoff]", e); }
  revalidatePath("/portal"); revalidatePath("/staff");
  return { ok: true };
}

/** Client marks their kickoff call as completed. */
export async function completeKickoff(): Promise<ActionResult> {
  const { error } = await createClient().rpc("client_complete_kickoff");
  if (error) return { error: error.message };
  revalidatePath("/portal"); revalidatePath("/staff");
  return { ok: true };
}

/**
 * Client requests a marketing photo shoot. Logs a task in their board for the
 * Account Manager to coordinate and bill through HCC, and emails the assigned
 * staffer. The client is then sent to the photographer's calendar (handled on
 * the client side after this resolves).
 */
export async function requestPhotoShoot(): Promise<ActionResult> {
  const client = await getPortalClient();
  if (!client) return { error: "Not signed in." };
  if ((client as any).suspended) return { error: "Your account is suspended. Please contact us to reactivate." };
  const title = "Marketing photo shoot consultation";
  const { error } = await createClient().from("client_tasks").insert({
    client_id: client.id,
    title,
    details: "Client requested a marketing photo shoot and was sent to the photographer's calendar to set up a consultation. Coordinate the appointment with the photographer and bill it through HCC (add a charge to this task).",
    column_name: "Requested",
    created_by: "client",
  });
  if (error) return { error: error.message };
  await notifyAssignedStaff(client, (to) =>
    sendStaffTaskAlert({ to, clientName: clientLabel(client), title, due: "", portalUrl: siteUrl() ? `${siteUrl()}/staff/daily` : "" }),
  );
  revalidatePath("/portal/tasks"); revalidatePath("/staff/daily");
  return { ok: true };
}

// ── Client satisfaction check-in + referral ──────────────────────────────────

/** Client submits a 1–5 satisfaction rating with an optional comment. */
export async function submitFeedback(formData: FormData): Promise<ActionResult> {
  const client = await getPortalClient();
  if (!client) return { error: "Not signed in." };
  const rating = Math.round(Number(formData.get("rating") || 0));
  if (rating < 1 || rating > 5) return { error: "Pick a rating from 1 to 5." };
  const comment = String(formData.get("comment") || "").slice(0, 2000) || null;
  const db = createClient();
  const { error } = await db.from("client_feedback").insert({ client_id: client.id, rating, comment });
  if (error) return { error: error.message };
  // Low scores nudge the assigned owner right away.
  if (rating <= 2) {
    await notifyAssignedStaff(client, (to) =>
      sendStaffMessageAlert({ to, clientName: clientLabel(client), message: `Left a ${rating}/5 satisfaction rating${comment ? `: ${comment.slice(0, 120)}` : ""}`, portalUrl: siteUrl() ? `${siteUrl()}/staff/clients` : "" }),
    );
  }
  revalidatePath("/portal");
  return { ok: true };
}

/** Client refers another business — creates a New lead for the sales team. */
export async function submitReferral(formData: FormData): Promise<ActionResult> {
  const client = await getPortalClient();
  if (!client) return { error: "Not signed in." };
  const business = String(formData.get("business") || "").trim();
  const contact = String(formData.get("contact") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  if (!business && !contact && !email) return { error: "Add at least a name or a way to reach them." };
  const admin = createServiceClient();
  const { error } = await admin.from("leads").insert({
    business: business || null, contact: contact || null, email: email || null, phone: phone || null,
    stage: "New lead", pain: `Referral from ${clientLabel(client)}`,
  });
  if (error) return { error: error.message };
  revalidatePath("/portal");
  return { ok: true };
}

// ── Client deliverable approvals ─────────────────────────────────────────────

/** Client approves or requests changes on a delivered item, with optional note. */
export async function reviewDeliverable(id: string, status: "approved" | "changes_requested", note: string): Promise<ActionResult> {
  const client = await getPortalClient();
  if (!client) return { error: "Not signed in." };
  if (status !== "approved" && status !== "changes_requested") return { error: "Invalid action." };
  const admin = createServiceClient();
  const { data: d } = await admin.from("client_deliverables").select("id, client_id, name").eq("id", id).maybeSingle();
  if (!d || (d as any).client_id !== client.id) return { error: "Deliverable not found." };
  const { error } = await admin.from("client_deliverables")
    .update({ approval_status: status, approval_note: note.slice(0, 1000) || null, approval_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };
  if (status === "changes_requested") {
    await notifyAssignedStaff(client, (to) =>
      sendStaffMessageAlert({ to, clientName: clientLabel(client), message: `Requested changes on "${(d as any).name}"${note ? `: ${note.slice(0, 150)}` : ""}`, portalUrl: siteUrl() ? `${siteUrl()}/staff/delivery` : "" }),
    );
  }
  revalidatePath("/portal/files");
  return { ok: true };
}

/** Client requests a service upgrade / add-on from their task board. Records it
 *  and alerts the account owner + the sales/admin inbox. */
export async function requestServiceUpgrade(formData: FormData): Promise<ActionResult> {
  const client = await getPortalClient();
  if (!client) return { error: "Please sign in again." };
  const label = String(formData.get("label") || "").trim();
  if (!label) return { error: "Pick an upgrade." };
  const note = String(formData.get("note") || "").trim() || null;
  const upgradeKey = String(formData.get("upgrade_key") || "").trim() || null;
  const admin = createServiceClient();
  const { error } = await admin.from("service_upgrade_requests").insert({
    client_id: client.id, upgrade_key: upgradeKey, label: label.slice(0, 160), note, status: "new",
  } as any);
  if (error) return { error: error.message };

  // Notify the account owner and the sales/admin inbox.
  try {
    const recipients = new Set<string>();
    const notify = process.env.ADMIN_NOTIFY_EMAIL || "info@hillcountryconsultants.com";
    recipients.add(notify);
    await notifyAssignedStaff(client, async (email) => { recipients.add(email); });
    await sendServiceUpgradeRequest({
      to: [...recipients], clientName: clientLabel(client), label, note,
      portalUrl: siteUrl() ? `${siteUrl()}/staff` : "",
    });
  } catch (e) { console.warn("[requestServiceUpgrade] notify", e); }

  revalidatePath("/portal/tasks"); revalidatePath("/staff");
  return { ok: true };
}
