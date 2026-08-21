import { createServiceClient } from "@/lib/supabase/server";
import { ONBOARDING_CHECKLIST } from "@/content/onboarding";

/** Seed the standard onboarding checklist for a client, once. No-op if the
 *  client already has checklist items, so duplicate Stripe webhooks or repeat
 *  calls never double-seed. Best-effort: never throws into the caller. */
export async function seedClientOnboarding(
  admin: ReturnType<typeof createServiceClient>,
  clientId: string,
): Promise<void> {
  try {
    const { data: existing } = await admin
      .from("client_checklist_items").select("id").eq("client_id", clientId).limit(1);
    if (existing && existing.length) return;
    let position = 0;
    const rows = ONBOARDING_CHECKLIST.flatMap((grp) =>
      grp.items.map((label) => ({ client_id: clientId, section: grp.section, label, position: position++, created_by: "system" })),
    );
    if (rows.length) await admin.from("client_checklist_items").insert(rows as any);
  } catch (e) {
    console.warn("[seedClientOnboarding]", e);
  }
}
