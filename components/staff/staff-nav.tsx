"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export type NavItem = { href: string; label: string; badge?: number };
export type NavGroup = { label: string; href?: string; badge?: number; items?: NavItem[] };

/** Grouped employee-portal nav. Single-destination entries (Home, Messages) render
 *  as direct links; everything else is tucked into a labelled dropdown so the bar
 *  stays short and scannable instead of a 30-tab wall. */
export function StaffNav({ groups }: { groups: NavGroup[] }) {
  const path = usePathname();
  const [open, setOpen] = useState<string | null>(null);

  const isActive = (href: string) => (href === "/staff" ? path === "/staff" : path.startsWith(href));
  const groupActive = (g: NavGroup) => (g.href ? isActive(g.href) : (g.items || []).some((i) => isActive(i.href)));

  const tabCls = (active: boolean) =>
    `min-h-touch px-3.5 py-3 text-[13.5px] font-medium whitespace-nowrap ${active ? "border-b-2 border-gold text-forest" : "text-ink-muted hover:text-forest"}`;
  const Badge = ({ n }: { n?: number }) =>
    n ? <span className="ml-1.5 inline-flex min-w-[18px] items-center justify-center rounded-full bg-gold px-1.5 py-0.5 text-[11px] font-semibold leading-none text-forest">{n}</span> : null;

  return (
    <nav className="flex flex-wrap items-center gap-x-0.5 gap-y-1 border-b border-line">
      {groups.map((g) => {
        const active = groupActive(g);
        if (g.href) {
          return (
            <Link key={g.label} href={g.href} onClick={() => setOpen(null)} className={tabCls(active)}>
              {g.label}<Badge n={g.badge} />
            </Link>
          );
        }
        const isOpen = open === g.label;
        return (
          <div key={g.label} className="relative">
            <button type="button" onClick={() => setOpen(isOpen ? null : g.label)}
              className={`${tabCls(active)} inline-flex items-center gap-1`} aria-expanded={isOpen}>
              {g.label}<Badge n={g.badge} /><span className="text-[9px] leading-none opacity-70">▼</span>
            </button>
            {isOpen && (
              <>
                <button type="button" aria-label="Close menu" className="fixed inset-0 z-10 cursor-default" onClick={() => setOpen(null)} />
                <div className="absolute left-0 z-20 mt-0.5 flex min-w-[210px] flex-col border border-line-warm bg-white py-1 shadow-[0_8px_24px_rgba(32,36,31,0.12)]">
                  {(g.items || []).map((i) => {
                    const a = isActive(i.href);
                    return (
                      <Link key={i.href} href={i.href} onClick={() => setOpen(null)}
                        className={`flex items-center justify-between px-3.5 py-2 text-[13.5px] ${a ? "bg-cream font-medium text-forest" : "text-ink-muted hover:bg-cream/60 hover:text-forest"}`}>
                        {i.label}<Badge n={i.badge} />
                      </Link>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        );
      })}
    </nav>
  );
}
