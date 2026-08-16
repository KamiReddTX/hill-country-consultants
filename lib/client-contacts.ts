import { createServiceClient } from "@/lib/supabase/server";

/** All email addresses on file for a client: the primary plus any additional
 *  contacts. Deduped + lowercased. Server-only (uses the service role). */
export async function getClientEmails(clientId: string, primary?: string | null): Promise<string[]> {
  const set = new Set<string>();
  if (primary) set.add(String(primary).trim().toLowerCase());
  try {
    const { data } = await createServiceClient().from("client_contacts").select("email").eq("client_id", clientId);
    (data ?? []).forEach((r: any) => { if (r.email) set.add(String(r.email).trim().toLowerCase()); });
  } catch (e) { console.warn("[getClientEmails]", e); }
  return [...set].filter(Boolean);
}
