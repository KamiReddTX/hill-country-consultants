import type { ReactNode } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getStaffMember, isAdmin, isPrivileged, isSalesOrAdmin, isSalesLead, getMessageUnreads } from "@/lib/staff";
import { StaffNav } from "@/components/staff/staff-nav";
import { StaffSignOut } from "@/components/staff/staff-signout";

export const metadata: Metadata = { title: "Staff Portal", robots: { index: false } };

export default async function StaffLayout({ children }: { children: ReactNode }) {
  const me = await getStaffMember();
  if (!me) redirect("/staff/login");

  const priv = isPrivileged(me), admin = isAdmin(me), sales = isSalesOrAdmin(me), salesLead = isSalesLead(me), hourly = me.hourly;
  const unread = await getMessageUnreads(me.id).catch(() => ({ total: 0 } as any));
  // Dashboard first for every employee (content differs by role — a manager sees
  // a firm-wide roll-up, an individual sees their own clients and hours).
  const tabs: { href: string; label: string; badge?: number }[] = [{ href: "/staff", label: "Dashboard" }];
  // Manager overview + tools (the Admin tab is retired — its queues now live on
  // the Dashboard, and per-client work lives on the Clients tab).
  if (priv) tabs.push({ href: "/staff/directory", label: "Directory" });
  if (admin) tabs.push({ href: "/staff/payroll", label: "Payroll" });
  if (salesLead) tabs.push({ href: "/staff/sales", label: "Sales" });
  // Everyday work tabs — every employee's job surface (scoped to their clients)
  tabs.push(
    { href: "/staff/onboarding", label: "Onboarding" },
    { href: "/staff/calendar", label: "Calendar" },
    { href: "/staff/tasks", label: "Task board" },
    { href: "/staff/checklists", label: "Checklists" },
    { href: "/staff/work-log", label: "Work log" },
    { href: "/staff/vault", label: "Vault" },
    { href: "/staff/files", label: "Files" },
    { href: "/staff/weekly", label: "Weekly report" },
    { href: "/staff/messages", label: "Messages", badge: unread.total || undefined },
  );
  if (hourly) tabs.push({ href: "/staff/clock", label: "Timesheet" });
  // Sales tabs
  if (sales) tabs.push(
    { href: "/staff/intake", label: "Intake" }, { href: "/staff/pipeline", label: "Pipeline" },
    { href: "/staff/accounts", label: "Accounts" }, { href: "/staff/commissions", label: "Commissions" },
    { href: "/staff/playbook", label: "Playbook" }, { href: "/staff/follow-ups", label: "Follow-ups" });
  // Manager operations
  if (priv || sales) tabs.push({ href: "/staff/daily", label: "Daily tasks" }, { href: "/staff/delivery", label: "Delivery" }, { href: "/staff/clients", label: "Clients" }, { href: "/staff/reports", label: "Reports" });
  // My profile is always last.
  tabs.push({ href: "/staff/profile", label: "My profile" });

  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b border-line bg-white">
        <div className="shell flex flex-wrap items-center justify-between gap-3 py-4">
          <div>
            <p className="kicker">Employee portal</p>
            <p className="font-fraunces text-[20px] text-forest">{me.name || me.email}</p>
            <p className="text-[12px] prose-muted">{me.role}{me.employee_code ? ` · ${me.employee_code}` : ""}{me.hourly ? " · hourly" : ""}</p>
          </div>
          <StaffSignOut />
        </div>
        <div className="shell"><StaffNav tabs={tabs} /></div>
      </header>
      <main className="shell py-10">{children}</main>
    </div>
  );
}
