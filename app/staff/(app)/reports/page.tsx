import { redirect } from "next/navigation";
import { getStaffMember, getClients, isAdmin } from "@/lib/staff";

export default async function ReportsPage() {
  const me = await getStaffMember();
  if (!me) redirect("/staff/login");
  const admin = isAdmin(me);
  const clients = await getClients();
  const workable = (admin ? clients : clients.filter((c) => !c.assigned_to || c.assigned_to === me.id)).map((c) => ({
    id: c.id,
    label: c.business || c.contact || c.email,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-fraunces text-[32px] font-normal text-forest">Reports</h1>
        <span className="rule-gold mb-4 mt-2" />
        <p className="max-w-[48em] prose-soft">
          Download a task-activity report to keep on file.{" "}
          {admin ? "As an admin you can pull one client or all clients together." : "You'll get the clients assigned to you."} The
          file opens in Excel or Google Sheets.
        </p>
      </div>

      <form method="GET" action="/api/reports/tasks" className="flex flex-wrap items-end gap-3 border border-line-warm bg-white p-5">
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium text-ink-faint">Period</span>
          <select name="period" defaultValue="week" className="min-h-touch border border-line-warm px-3 text-[15px] outline-none focus:border-forest">
            <option value="week">Weekly · last 7 days</option>
            <option value="biweek">Biweekly · last 14 days</option>
            <option value="month">Monthly · last 30 days</option>
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium text-ink-faint">Client</span>
          <select name="client" defaultValue={admin ? "all" : workable[0]?.id || "all"} className="min-h-touch min-w-[220px] border border-line-warm px-3 text-[15px] outline-none focus:border-forest">
            {admin && <option value="all">All clients</option>}
            {workable.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </label>
        <button className="btn-gold px-6 text-[14px]">Download CSV</button>
      </form>

      <p className="text-[13px] prose-muted">
        Each row is a task with its client, status, due date, any charge, and the created / approved dates — filtered to tasks
        created in the selected window.
      </p>
    </div>
  );
}
