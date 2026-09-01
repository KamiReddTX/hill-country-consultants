import { redirect } from "next/navigation";
import { getStaffMember } from "@/lib/staff";
import { getNotifications } from "@/lib/notify";
import { NotificationsList } from "@/components/staff/notifications-list";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const me = await getStaffMember();
  if (!me) redirect("/staff/login");
  const items = await getNotifications(me.id, 50);
  return (
    <div className="flex max-w-[42em] flex-col gap-6">
      <div>
        <h1 className="font-fraunces text-[32px] font-normal text-forest">Notifications</h1>
        <span className="rule-gold mb-4 mt-2" />
        <p className="prose-soft">Assignments, approvals, change requests, and documents that need you.</p>
      </div>
      <NotificationsList initial={items} />
    </div>
  );
}
