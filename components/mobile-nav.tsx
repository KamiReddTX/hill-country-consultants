"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { NAV } from "@/content/site";

/** Mobile navigation: a hamburger toggle (shown below md) that opens a stacked
 *  menu with the same links, hierarchy, and CTAs as the desktop nav. Closes on
 *  link tap, Escape, or a tap on the backdrop; locks body scroll while open. */
export function MobileNav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    if (open) {
      document.addEventListener("keydown", onKey);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls="mobile-nav-panel"
        onClick={() => setOpen((v) => !v)}
        className="relative z-[60] inline-flex min-h-touch min-w-touch items-center justify-center text-forest"
      >
        {open ? (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        )}
      </button>

      {open && (
        <>
          <button
            aria-hidden="true"
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default bg-charcoal/25"
          />
          <div
            id="mobile-nav-panel"
            className="absolute left-0 right-0 top-full z-50 max-h-[calc(100vh-64px)] overflow-y-auto border-b border-line bg-white shadow-lg"
          >
            <nav className="shell flex flex-col py-2" aria-label="Primary">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="border-b border-line-soft py-3 font-inter text-[15px] font-medium text-charcoal hover:text-forest"
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="/portal/login"
                onClick={() => setOpen(false)}
                className="border-b border-line-soft py-3 font-inter text-[15px] font-medium text-forest hover:text-charcoal"
              >
                Client Login
              </Link>
              <Link
                href="/get-started"
                onClick={() => setOpen(false)}
                className="btn-gold mb-2 mt-3 text-[15px]"
              >
                Get Started
              </Link>
            </nav>
          </div>
        </>
      )}
    </div>
  );
}
