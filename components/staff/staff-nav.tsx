"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function StaffNav({ tabs }: { tabs: { href: string; label: string }[] }) {
  const path = usePathname();
  return (
    <nav className="flex flex-wrap gap-x-1 gap-y-1 border-b border-line">
      {tabs.map((t) => {
        const active = t.href === "/staff" ? path === "/staff" : path.startsWith(t.href);
        return (
          <Link key={t.href} href={t.href}
            className={`min-h-touch px-3.5 py-3 text-[13.5px] font-medium ${active ? "border-b-2 border-gold text-forest" : "text-ink-muted hover:text-forest"}`}>
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
