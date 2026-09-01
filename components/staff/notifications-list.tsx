"use client";
import { useState, useTransition } from "react";
import { markNotificationRead, markAllNotificationsRead } from "@/app/staff/actions";
import type { NotificationRow } from "@/lib/notify";

const KIND_DOT: Record<string, string> = {
  assignment: "bg-forest", approval: "bg-green-600", changes: "bg-gold", document: "bg-blue-600", info: "bg-ink-faint",
};

export function NotificationsList({ initial }: { initial: NotificationRow[] }) {
  const [items, setItems] = useState(initial);
  const [pending, start] = useTransition();
  const anyUnread = items.some((n) => !n.read);

  const openOne = (n: NotificationRow) => {
    if (!n.read) {
      setItems((xs) => xs.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      start(() => markNotificationRead(n.id).then(() => {}));
    }
    if (n.href) window.location.href = n.href;
  };
  const clearAll = () => {
    setItems((xs) => xs.map((x) => ({ ...x, read: true })));
    start(() => markAllNotificationsRead().then(() => {}));
  };

  if (items.length === 0) return <p className="text-[15px] prose-muted">No notifications yet.</p>;

  return (
    <div className="flex flex-col gap-3">
      {anyUnread && (
        <button onClick={clearAll} disabled={pending} className="self-start text-[13px] font-medium text-forest hover:underline">
          Mark all read
        </button>
      )}
      <ul className="flex flex-col gap-2">
        {items.map((n) => (
          <li key={n.id}>
            <button
              onClick={() => openOne(n)}
              className={`flex w-full items-start gap-3 border p-3 text-left ${n.read ? "border-line-soft bg-white" : "border-line-warm bg-cream/50"}`}
            >
              <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read ? "bg-transparent" : KIND_DOT[n.kind] || "bg-forest"}`} />
              <span className="min-w-0 flex-1">
                <span className={`block text-[14px] ${n.read ? "text-ink-muted" : "font-medium text-charcoal"}`}>{n.title}</span>
                {n.body && <span className="block text-[13px] prose-muted">{n.body}</span>}
                <span className="block text-[11px] text-ink-faint">{new Date(n.created_at).toLocaleString()}</span>
              </span>
              {n.href && <span className="shrink-0 text-[12px] text-forest">Open →</span>}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
