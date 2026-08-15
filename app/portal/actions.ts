"use server";
export type ActionResult = { error?: string; ok?: boolean };

import { revalidatePath } from "next/cache";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getPortalClient } from "@/lib/portal";

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
  revalidatePath("/portal/tasks");
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
  revalidatePath("/portal/messages"); revalidatePath("/staff/messages");
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
