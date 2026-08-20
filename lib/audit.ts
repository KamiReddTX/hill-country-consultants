import { createServiceClient } from "@/lib/supabase/server";

/** Append an entry to the audit trail. Best-effort — auditing must never block
 *  or fail the action it records, so all errors are swallowed. */
export async function logAudit(entry: {
  actorEmail?: string | null;
  action: string;   // 'create' | 'update' | 'delete' | 'send' | 'sign' | ...
  entity: string;   // 'contract' | 'invoice' | 'client' | 'expense' | ...
  entityId?: string | null;
  summary?: string | null;
}): Promise<void> {
  try {
    await createServiceClient().from("audit_log").insert({
      actor_email: entry.actorEmail ?? null,
      action: entry.action,
      entity: entry.entity,
      entity_id: entry.entityId ?? null,
      summary: entry.summary ?? null,
    });
  } catch {
    /* auditing is best-effort */
  }
}
