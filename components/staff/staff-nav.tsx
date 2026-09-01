"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export type NavItem = { href: string; label: string; badge?: number };
export type NavGroup = { label: string; href?: string; badge?: number; items?: NavItem[] };

/** Grouped employee-portal nav. On desktop it's a bar of labelled dropdowns; on
 *  phones it collapses to a hamburger that opens a full vertical menu — so a
 *  manager's ~8 groups don't wrap into an unusable pile of rows. */
export function StaffNav({ groups }: { groups: NavGroup[] }) {
  const path = usePathname();
  const [open, setOpen] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => (href === "/staff" || href === "/portal" ? path === href : path.startsWith(href));
  const groupActive = (g: NavGroup) => (g.href ? isActive(g.href) : (g.items || []).some((i) => isActive(i.href)));

  const tabCls = (active: boolean) =>
    `min-h-touch px-3.5 py-3 text-[13.5px] font-medium whitespace-nowrap ${active ? "border-b-2 border-gold text-forest" : "text-ink-muted hover:text-forest"}`;
  const Badge = ({ n }: { n?: number }) =>
    n ? <span className="ml-1.5 inline-flex min-w-[18px] items-center justify-center rounded-full bg-gold px-1.5 py-0.5 text-[11px] font-semibold leading-none text-forest">{n}</span> : null;

  return (
    <>
      {/* Mobile: hamburger + collapsible vertical menu */}
      <div className="md:hidden">
        <button
          type="button" onClick={() => setMobileOpen((v) => !v)} aria-expanded={mobileOpen}
          className="flex min-h-touch w-full items-center justify-between border-y border-line px-1 py-3 text-[14px] font-medium text-forest"
        >
          <span className="inline-flex items-center gap-2">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round"/></svg>
            Menu
          </span>
          <span className="text-[11px] opacity-70">{mobileOpen ? "Close" : "Open"}</span>
        </button>
        {mobileOpen && (
          <div className="flex flex-col gap-1 border-b border-line py-2">
            {groups.map((g) =>
              g.href ? (
                <Link key={g.label} href={g.href} onClick={() => setMobileOpen(false)}
                  className={`px-2 py-2 text-[14px] font-medium ${groupActive(g) ? "text-forest" : "text-ink-muted"}`}>
                  {g.label}<Badge n={g.badge} />
                </Link>
              ) : (
                <div key={g.label} className="py-1">
                  <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">{g.label}</p>
                  <div className="flex flex-col">
                    {(g.items || []).map((i) => (
                      <Link key={i.href} href={i.href} onClick={() => setMobileOpen(false)}
                        className={`flex items-center justify-between px-4 py-2 text-[14px] ${isActive(i.href) ? "bg-cream font-medium text-forest" : "text-ink-muted hover:bg-cream/60"}`}>
                        {i.label}<Badge n={i.badge} />
                      </Link>
                    ))}
                  </div>
                </div>
              ),
            )}
          </div>
        )}
      </div>

      {/* Desktop: dropdown bar */}
      <nav className="hidden flex-wrap items-center gap-x-0.5 gap-y-1 border-b border-line md:flex">
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
    </>
  );
}
