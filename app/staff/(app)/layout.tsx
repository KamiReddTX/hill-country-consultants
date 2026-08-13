import type { ReactNode } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getStaffMember, isAdmin, isSalesOrAdmin } from "@/lib/staff";
import { StaffNav } from "@/components/staff/staff-nav";
import { StaffSignOut } from "@/components/staff/staff-signout";

export const metadata: Metadata = { title: "Staff Portal", robots: { index: false } };

export default async function StaffLayout({ children }: { children: ReactNode }) {
  const me = await getStaffMember();
  if (!me) redirect("/staff/login");

  const admin = isAdmin(me), sales = isSalesOrAdmin(me), hourly = me.hourly;
  const tabs: { href: string; label: string }[] = [{ href: "/staff", label: "Dashboard" }];
  if (admin) tabs.push({ href: "/staff/admin", label: "Admin" });
  tabs.push({ href: "/staff/daily", label: "Daily tasks" });
  if (hourly) tabs.push({ href: "/staff/clock", label: "Time clock" });
  if (sales) tabs.push(
    { href: "/staff/intake", label: "Intake" }, { href: "/staff/pipeline", label: "Pipeline" },
    { href: "/staff/accounts", label: "Accounts" }, { href: "/staff/commissions", label: "Commissions" });
  tabs.push({ href: "/staff/clients", label: "All clients" }, { href: "/staff/delivery", label: "Delivery" });
  if (sales) tabs.push({ href: "/staff/playbook", label: "Playbook" }, { href: "/staff/follow-ups", label: "Follow-ups" });
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
