"use server";
export type ActionResult = { error?: string; ok?: boolean };

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getPortalClient } from "@/lib/portal";

/** Client adds a request to their own task board (lands in "Requested"). */
export async function addTaskRequest(formData: FormData): Promise<ActionResult> {
  const client = await getPortalClient();
  if (!client) return { error: "Not signed in." };
  const title = String(formData.get("title") || "").trim();
  if (!title) return { error: "A short description is required." };
  const db = createClient();
  const { error } = await db.from("client_tasks").insert({
    client_id: client.id,
    title,
    service: String(formData.get("service") || "") || null,
    due_date: String(formData.get("due") || "") || null,
    column_name: "Requested",
    created_by: "client",
  });
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
  const { error } = await db.from("client_notes").insert({ client_id: client.id, body });
  if (error) return { error: error.message };
  revalidatePath("/portal/messages");
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
