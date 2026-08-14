import { redirect } from "next/navigation";
import { getPortalClient, getPortalData } from "@/lib/portal";
import { TaskRequestForm } from "@/components/portal/task-request-form";
import { TaskReviewActions } from "@/components/portal/task-review-actions";

const COLUMNS = ["Requested", "In progress", "In review", "Delivered"];

export default async function TasksPage() {
  const client = await getPortalClient();
  if (!client) redirect("/portal/login");
  const { tasks, taskFiles } = await getPortalData(client);

  const filesByTask = new Map<string, typeof taskFiles>();
  taskFiles.forEach((f) => {
    const a = filesByTask.get(f.task_id) || [];
    a.push(f);
    filesByTask.set(f.task_id, a);
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-fraunces text-[32px] font-normal text-forest">Task board</h1>
        <span className="rule-gold mb-4 mt-2" />
        <p className="max-w-[48em] prose-soft">
          Submit a task with everything we need, and your account lead sees it the same business day. Everything with a
          due date lives here, not in an inbox thread.
        </p>
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
                {items.map((t) => {
                  const files = filesByTask.get(t.id) || [];
                  return (
                    <li key={t.id} className="border border-line-soft bg-cream/50 p-3">
                      <p className="text-[14px] text-charcoal">{t.title}</p>
                      {t.details && t.details !== t.title && <p className="mt-0.5 text-[12.5px] prose-soft">{t.details}</p>}
                      <p className="mt-1 text-[12px] prose-muted">
                        {t.paid ? "Purchased · " : ""}
                        {t.due_date ? `needed by ${t.due_date}` : "no date set"}
                      </p>
                      {files.length > 0 && (
                        <ul className="mt-1 flex flex-col gap-0.5">
                          {files.map((f) => (
                            <li key={f.id}>
                              <a href={`/api/task-file/${f.id}`} className="text-[12px] text-forest underline underline-offset-2 hover:text-gold">
                                {f.name}
                              </a>
                            </li>
                          ))}
                        </ul>
                      )}
                      {t.created_by === "client" && col === "Requested" && <p className="mt-1 text-[11px] text-ink-faint">Your request</p>}
                      {t.needs_clarification && col === "In progress" && <p className="mt-1 text-[11px] text-gold">Sent back for changes</p>}
                      {col === "In review" && <TaskReviewActions taskId={t.id} />}
                      {col === "Delivered" && t.approved_at && (
                        <p className="mt-1 text-[11px] text-forest">Approved {new Date(t.approved_at).toLocaleDateString()}</p>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
