"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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
