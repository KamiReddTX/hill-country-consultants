import { createServiceClient } from "@/lib/supabase/server";

/** All editable site copy, as a key→value map. Reads the whole (small) table
 *  once; safe to call from any server component. Never throws. */
export async function getSiteContent(): Promise<Record<string, string>> {
  try {
    const { data } = await createServiceClient().from("site_content").select("key,value");
    const map: Record<string, string> = {};
    for (const r of (data ?? []) as any[]) if (r.value != null && r.value !== "") map[r.key] = r.value;
    return map;
  } catch {
    return {};
  }
}

/** Managed FAQ list (active, ordered). Empty array if none set — callers fall
 *  back to the built-in defaults. */
export async function getSiteFaqs(): Promise<{ id: string; question: string; answer: string }[]> {
  try {
    const { data } = await createServiceClient()
      .from("site_faqs").select("id,question,answer,active,sort")
      .eq("active", true).order("sort").order("created_at");
    return ((data ?? []) as any[]).map((f) => ({ id: f.id, question: f.question, answer: f.answer }));
  } catch {
    return [];
  }
}

/** Pick an override or fall back to the default. */
export const pick = (map: Record<string, string>, key: string, fallback: string) =>
  map[key] && map[key].trim() ? map[key] : fallback;
