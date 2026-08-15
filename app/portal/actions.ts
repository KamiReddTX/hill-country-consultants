"use server";
export type ActionResult = { error?: string; ok?: boolean };

import { revalidatePath } from "next/cache";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getPortalClient } from "@/lib/portal";
import { sendStaffTaskAlert, sendStaffMessageAlert } from "@/lib/email";
import type { ClientRow } from "@/lib/database.types";

/** Email the client's assigned VA/AM (a single owner). No-op if unassigned. */
async function notifyAssignedStaff(
  client: ClientRow,
  build: (email: string) => Promise<void>,
): Promise<void> {
  try {
    const aid = (client as any).assigned_to as string | null;
    if (!aid || !/^[0-9a-f-]{36}$/i.test(aid)) return;
    const { data: s } = await createServiceClient().from("staff").select("email").eq("id", aid).maybeSingle();
    const email = (s as any)?.email;
    if (email) await build(email);
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
  const { error } = await createClient().rpc("client_approve_task", { p_task: taskId });
  if (error) return { error: error.message };
  revalidatePath("/portal/tasks");
  return { ok: true };
}

/** Client asks for changes (→ back to "In progress", flags the VA/AM to call). */
export async function requestChanges(taskId: string): Promise<ActionResult> {
  const client = await getPortalClient();
  if (!client) return { error: "Not signed in." };
  const { error } = await createClient().rpc("client_request_changes", { p_task: taskId });
  if (error) return { error: error.message };
  revalidatePath("/portal/tasks");
  return { ok: true };
}

/** Add a credential REGISTER entry — records what account we hold, never a password. */
export async function addVaultEntry(formData: FormData): Promise<ActionResult> {
  const client = await getPortalClient();
  if (!client) return { error: "Not signed in." };
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
  const db = createClient();
  const { error } = await db.from("client_vault").update({ needs_resync: needs, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/portal/vault");
  return { ok: true };
}

export async function deleteVaultEntry(id: string): Promise<ActionResult> {
  const client = await getPortalClient();
  if (!client) return { error: "Not signed in." };
  const db = createClient();
  const { error } = await db.from("client_vault").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/portal/vault");
  return { ok: true };
}

/** Client posts a message to their account lead (stored as a client note). */
export async function addMessage(formData: FormData): Promise<ActionResult> {
  const client = await getPortalClient();
  if (!client) return { error: "Not signed in." };
  const body = String(formData.get("body") || "").trim();
  if (!body) return { error: "Write a message first." };
  const db = createClient();
  const { error } = await db.from("client_notes").insert({ client_id: client.id, body, sender: "client", author_name: client.contact || null });
  if (error) return { error: error.message };
  await notifyAssignedStaff(client, (to) =>
    sendStaffMessageAlert({ to, clientName: clientLabel(client), portalUrl: siteUrl() ? `${siteUrl()}/staff/messages` : "" }),
  );
  revalidatePath("/portal/messages"); revalidatePath("/staff/messages");
  return { ok: true };
}

/** Client adds an event to their own calendar (visible to their account team). */
export async function addClientEvent(formData: FormData): Promise<ActionResult> {
  const client = await getPortalClient();
  if (!client) return { error: "Not signed in." };
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
  revalidatePath("/portal");
  return { ok: true };
}
