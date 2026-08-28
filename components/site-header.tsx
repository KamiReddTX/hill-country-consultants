import Link from "next/link";
import Image from "next/image";
import { NAV } from "@/content/site";
import { MobileNav } from "@/components/mobile-nav";

/** Sticky header: horizontal logo, primary nav, Client Login, Get Started.
 *  Full nav on md+, hamburger menu (MobileNav) below md. */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-line/70 bg-white/80 shadow-[0_1px_0_rgba(224,214,191,.6)] backdrop-blur-md backdrop-saturate-150 supports-[backdrop-filter]:bg-white/70">
      <div className="relative shell flex items-center justify-between gap-6 py-4">
        <Link href="/" className="shrink-0" aria-label={`${"Hill Country Consultants"} — home`}>
          <Image
            src="/assets/logo-horizontal.png"
            alt="Hill Country Consultants — Clarity. Strategy. Organized Growth."
            width={410}
            height={115}
            priority
            className="h-[46px] w-auto sm:h-[54px]"
          />
        </Link>
        <MobileNav />
        <nav className="hidden flex-wrap items-center justify-end gap-x-5 gap-y-2 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="font-inter text-[13.5px] font-medium tracking-wide text-charcoal hover:text-forest"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/portal/login"
            className="font-inter text-[13.5px] font-medium tracking-wide text-forest hover:text-charcoal"
          >
            Client Login
          </Link>
          <Link href="/get-started" className="btn-gold px-4 text-[13.5px]">
            Get Started
          </Link>
        </nav>
      </div>
    </header>
  );
}
