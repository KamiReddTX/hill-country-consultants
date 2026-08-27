"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

/** Section sub-nav for the prospecting module. Admin tab shows only for admins. */
export function ProspectSubnav({ isAdmin }: { isAdmin?: boolean }) {
  const path = usePathname();
  const items = [
    { href: "/staff/prospecting", label: "Search" },
    { href: "/staff/prospecting/lists", label: "Lists" },
    { href: "/staff/prospecting/usage", label: "My usage" },
    ...(isAdmin ? [{ href: "/staff/prospecting/admin", label: "Admin" }] : []),
  ];
  return (
    <nav className="flex flex-wrap gap-1 border-b border-line-warm">
      {items.map((it) => {
        const active = path === it.href;
        return (
          <Link key={it.href} href={it.href}
            className={`px-3 py-2 text-[13.5px] font-medium ${active ? "border-b-2 border-gold text-forest" : "text-ink-faint hover:text-forest"}`}>
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
