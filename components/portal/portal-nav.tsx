import { StaffNav, type NavGroup } from "@/components/staff/staff-nav";

/** Client portal navigation. Uses the same grouped nav component as the employee
 *  portal so the two feel consistent. Ten destinations collapse into three short
 *  menus plus two one-click links; every label is unique. */
const GROUPS: NavGroup[] = [
  { label: "Your onboarding", href: "/portal" },
  { label: "My project", items: [
    { href: "/portal/roadmap", label: "Roadmap" },
    { href: "/portal/tasks", label: "Task board" },
    { href: "/portal/calendar", label: "Calendar" },
    { href: "/portal/work-log", label: "Work log" },
    { href: "/portal/weekly", label: "Weekly report" },
  ]},
  { label: "Files & vendors", items: [
    { href: "/portal/files", label: "Files" },
    { href: "/portal/vault", label: "Shared vault" },
    { href: "/portal/vendors", label: "Preferred vendors" },
  ]},
  { label: "Messages", href: "/portal/messages" },
];

export function PortalNav() {
  return <StaffNav groups={GROUPS} />;
}
