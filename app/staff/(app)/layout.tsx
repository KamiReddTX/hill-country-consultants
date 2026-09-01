import type { ReactNode } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getStaffMember, isAdmin, isPrivileged, isSalesOrAdmin, isSalesLead, getMessageUnreads } from "@/lib/staff";
import { getUnreadNotificationCount } from "@/lib/notify";
import { StaffNav } from "@/components/staff/staff-nav";
import { StaffSignOut } from "@/components/staff/staff-signout";
import { AUTH_BYPASS } from "@/lib/auth-bypass";

export const metadata: Metadata = { title: "Employee Portal", robots: { index: false } };
// Authed portal — always render per request, never statically prerender.
export const dynamic = "force-dynamic";

export default async function StaffLayout({ children }: { children: ReactNode }) {
  const me = await getStaffMember();
  if (!me) redirect("/staff/login");

  const priv = isPrivileged(me), admin = isAdmin(me), sales = isSalesOrAdmin(me), salesLead = isSalesLead(me), hourly = me.hourly;
  const [unread, notifs] = await Promise.all([
    getMessageUnreads(me.id).catch(() => ({ total: 0 } as any)),
    getUnreadNotificationCount(me.id).catch(() => 0),
  ]);

  // Grouped, role-aware navigation. Home and Messages are one-click; the rest live
  // in short, labelled menus so nobody faces a 30-tab wall. A regular employee sees
  // ~4 menus; a manager/admin sees the additional groups their role unlocks.
  const groups: NavGroup[] = [{ label: "Home", href: "/staff" }];

  // My work — the daily job surface, for every employee.
  const myWork: NavItem[] = [
    { href: "/staff/my-work", label: "My work" },
    { href: "/staff/tasks", label: "Task board" },
    { href: "/staff/calendar", label: "Calendar" },
    { href: "/staff/onboarding", label: "Client onboarding" },
    { href: "/staff/checklists", label: "Checklists" },
    { href: "/staff/work-log", label: "Work log" },
    { href: "/staff/weekly", label: "Weekly report" },
    { href: "/staff/files", label: "Files" },
    { href: "/staff/vault", label: "Vault" },
  ];
  if (hourly) myWork.push({ href: "/staff/clock", label: "Timesheet" });
  groups.push({ label: "My work", items: myWork });

  // Clients — delivery + client-facing work, for anyone who carries accounts.
  if (priv || sales) groups.push({ label: "Clients", items: [
    { href: "/staff/clients", label: "All clients" },
    { href: "/staff/daily", label: "Client requests" },
    { href: "/staff/delivery", label: "Delivery" },
    { href: "/staff/reports", label: "Analytics" },
  ]});

  // Sales — pipeline and revenue tools.
  if (sales) {
    const salesItems: NavItem[] = [];
    if (salesLead) salesItems.push({ href: "/staff/sales", label: "Sales overview" });
    salesItems.push(
      { href: "/staff/pipeline", label: "Pipeline" },
      { href: "/staff/intake", label: "Intake" },
      { href: "/staff/follow-ups", label: "Follow-ups" },
      { href: "/staff/accounts", label: "My accounts" },
      { href: "/staff/prospecting", label: "Prospecting" },
      { href: "/staff/commissions", label: "Commissions" },
      { href: "/staff/playbook", label: "Playbook" },
    );
    groups.push({ label: "Sales", items: salesItems });
  }

  // Team — hiring + people, for managers/admins.
  if (salesLead || admin) {
    const team: NavItem[] = [];
    if (salesLead) team.push({ href: "/staff/directory", label: "Employees & hiring" });
    if (admin) team.push({ href: "/staff/payroll", label: "Payroll" });
    if (team.length) groups.push({ label: "Team", items: team });
  }

  // Finance — money operations, for managers/admins.
  if (priv) {
    const finance: NavItem[] = [
      { href: "/staff/billing", label: "Billing & AR" },
      { href: "/staff/renewals", label: "Renewals" },
      { href: "/staff/contracts", label: "Contracts" },
      { href: "/staff/capacity", label: "Capacity" },
    ];
    if (admin) finance.push({ href: "/staff/finance", label: "Data exports" });
    groups.push({ label: "Finance", items: finance });
  }

  // Admin — firm settings, admins only.
  if (admin) groups.push({ label: "Admin", items: [
    { href: "/staff/site-content", label: "Edit website" },
    { href: "/staff/vendors", label: "Vendors & 1099s" },
    { href: "/staff/audit", label: "Audit log" },
  ]});

  // Resources — reference material for everyone.
  groups.push({ label: "Resources", items: [
    { href: "/staff/kb", label: "Knowledge base" },
    { href: "/staff/partners", label: "Preferred vendors" },
  ]});

  // Messages — one click, with the unread badge.
  groups.push({ label: "Messages", href: "/staff/messages", badge: unread.total || undefined });

  return (
    <div className="min-h-screen bg-cream">
      {AUTH_BYPASS && (
        <div className="bg-red-700 px-4 py-1.5 text-center text-[12px] font-semibold uppercase tracking-wide text-white">
          Test mode — login is temporarily bypassed. Turn this off before launch.
        </div>
      )}
      <header className="sticky top-0 z-40 border-b border-line/70 bg-white/85 shadow-[0_1px_0_rgba(224,214,191,.6)] backdrop-blur-md supports-[backdrop-filter]:bg-white/75">
        <div className="shell flex flex-wrap items-center justify-between gap-3 py-4">
          <div>
            <p className="kicker">Employee portal</p>
            <p className="font-fraunces text-[20px] text-forest">{me.name || me.email}</p>
            <p className="text-[12px] prose-muted">{me.role}{me.employee_code ? ` · ${me.employee_code}` : ""}{me.hourly ? " · hourly" : ""}</p>
          </div>
          <div className="flex items-center gap-3">
            <a href="/staff/notifications" className="relative inline-flex items-center text-forest hover:text-gold" aria-label={`Notifications${notifs ? ` (${notifs} unread)` : ""}`} title="Notifications">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M18 8A6 6 0 1 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round"/><path d="M13.7 21a2 2 0 0 1-3.4 0" strokeLinecap="round" strokeLinejoin="round"/></svg>
              {notifs > 0 && <span className="absolute -right-2 -top-1.5 inline-flex min-w-[16px] items-center justify-center rounded-full bg-red-600 px-1 py-0.5 text-[10px] font-semibold leading-none text-white">{notifs > 99 ? "99+" : notifs}</span>}
            </a>
            <a href="/staff/profile" className="text-[13px] font-medium text-forest hover:underline">My profile</a>
            <StaffSignOut />
          </div>
        </div>
        <div className="shell"><StaffNav groups={groups} /></div>
      </header>
      <main className="shell py-10">{children}</main>
    </div>
  );
}
