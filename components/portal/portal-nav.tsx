"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/portal", label: "Onboarding" },
  { href: "/portal/roadmap", label: "Roadmap" },
  { href: "/portal/tasks", label: "Task board" },
  { href: "/portal/vault", label: "Shared vault" },
  { href: "/portal/work-log", label: "Work log" },
  { href: "/portal/weekly", label: "Weekly report" },
  { href: "/portal/files", label: "Files" },
  { href: "/portal/messages", label: "Messages" },
];

export function PortalNav() {
  const path = usePathname();
  return (
    <nav className="flex flex-wrap gap-x-1 gap-y-1 border-b border-line">
      {TABS.map((t) => {
        const active = path === t.href;
        return (
          <Link key={t.href} href={t.href}
            className={`min-h-touch px-4 py-3 text-[14px] font-medium ${active ? "border-b-2 border-gold text-forest" : "text-ink-muted hover:text-forest"}`}>
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
