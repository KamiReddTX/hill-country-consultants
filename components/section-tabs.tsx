"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Buying-path sub-nav. One shared component so it can never drift.
 * Renders only on /services, /services/[slug], /plans and /book.
 * On a service detail page, "All services" is the active item.
 */
const ITEMS = [
  { label: "All services", href: "/services" },
  { label: "Plans & Pricing", href: "/plans" },
  { label: "Book & pay", href: "/book" },
];

export function SectionTabs() {
  const pathname = usePathname() || "";
  const onServices = pathname === "/services" || pathname.startsWith("/services/");
  const onPlans = pathname === "/plans";
  const onBook = pathname === "/book";
  if (!onServices && !onPlans && !onBook) return null;

  const activeHref = onServices ? "/services" : onPlans ? "/plans" : "/book";

  return (
    <nav
      aria-label="Services, plans and booking"
      className="border-b border-[#e0d6bf] bg-cream"
    >
      <div className="mx-auto flex max-w-[1180px] flex-wrap items-center gap-1 px-6">
        <span className="py-4 pr-4 font-inter text-[11px] font-normal uppercase tracking-[0.18em] text-ink-faint">
          Services
        </span>
        {ITEMS.map((it) =>
          it.href === activeHref ? (
            <span
              key={it.href}
              aria-current="page"
              className="border-b-2 border-gold px-4 py-[15px] font-inter text-[14.5px] font-semibold text-forest"
            >
              {it.label}
            </span>
          ) : (
            <Link
              key={it.href}
              href={it.href}
              className="border-b-2 border-transparent px-4 py-[15px] font-inter text-[14.5px] font-medium text-ink-muted transition-colors hover:text-forest"
            >
              {it.label}
            </Link>
          ),
        )}
      </div>
    </nav>
  );
}
