import { createServiceClient } from "@/lib/supabase/server";

export type NotifyKind = "assignment" | "approval" | "changes" | "document" | "info";

/**
 * Create an in-app notification for one employee. Best-effort: a notification is
 * never allowed to break the action that triggered it, so failures are swallowed
 * with a warning. Inserts run with the service role (RLS insert is closed).
 */
export async function notify(
  staffId: string | null | undefined,
  n: { kind: NotifyKind; title: string; body?: string | null; href?: string | null },
): Promise<void> {
  try {
    if (!staffId || !/^[0-9a-f-]{36}$/i.test(staffId)) return;
    await createServiceClient().from("notifications").insert({
      staff_id: staffId,
      kind: n.kind,
      title: n.title,
      body: n.body ?? null,
      href: n.href ?? null,
    } as any);
  } catch (e) {
    console.warn("[notify]", e);
  }
}

/** Unread notification count for a staff member (for the header bell badge). */
export async function getUnreadNotificationCount(staffId: string): Promise<number> {
  try {
    const { count } = await createServiceClient()
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("staff_id", staffId)
      .eq("read", false);
    return count ?? 0;
  } catch {
    return 0;
  }
}

export interface NotificationRow {
  id: string; kind: string; title: string; body: string | null; href: string | null; read: boolean; created_at: string;
}

/** Most recent notifications for a staff member (newest first). */
export async function getNotifications(staffId: string, limit = 30): Promise<NotificationRow[]> {
  try {
    const { data } = await createServiceClient()
      .from("notifications")
      .select("id,kind,title,body,href,read,created_at")
      .eq("staff_id", staffId)
      .order("created_at", { ascending: false })
      .limit(limit);
    return (data as NotificationRow[]) ?? [];
  } catch {
    return [];
  }
}
