import { redirect } from "next/navigation";
import { getPortalClient, getPortalData } from "@/lib/portal";
import { TaskRequestForm } from "@/components/portal/task-request-form";

const COLUMNS = ["Requested", "In progress", "In review", "Delivered"];

export default async function TasksPage() {
  const client = await getPortalClient();
  if (!client) redirect("/portal/login");
  const { tasks } = await getPortalData(client);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-fraunces text-[32px] font-normal text-forest">Task board</h1>
        <span className="rule-gold mb-4 mt-2" />
        <p className="max-w-[48em] prose-soft">Add a request and your account lead sees it the same business day. Everything with a due date lives here, not in an inbox thread.</p>
      </div>
      <TaskRequestForm />
      <div className="grid gap-4 md:grid-cols-4">
        {COLUMNS.map((col) => {
          const items = tasks.filter((t) => (t.column_name || "Requested") === col);
          return (
            <div key={col} className="border border-line-warm bg-white">
              <div className="flex items-center justify-between border-b border-line-soft px-4 py-3">
                <p className="text-[13px] font-semibold uppercase tracking-wide text-forest">{col}</p>
                <span className="text-[12px] prose-muted">{items.length}</span>
              </div>
              <ul className="flex flex-col gap-2 p-3">
                {items.length === 0 && <li className="px-1 py-2 text-[13px] text-ink-faint">Nothing here.</li>}
                {items.map((t) => (
                  <li key={t.id} className="border border-line-soft bg-cream/50 p-3">
                    <p className="text-[14px] text-charcoal">{t.title}</p>
                    <p className="text-[12px] prose-muted">{t.service || "—"}{t.due_date ? ` · needed by ${t.due_date}` : ""}</p>
                    {t.created_by === "client" && <p className="text-[11px] text-ink-faint">Your request</p>}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
