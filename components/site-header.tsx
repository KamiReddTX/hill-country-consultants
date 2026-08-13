import Link from "next/link";
import Image from "next/image";
import { NAV } from "@/content/site";

/** Sticky header: horizontal logo, primary nav, Client Login, Get Started. */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-white">
      <div className="shell flex items-center justify-between gap-6 py-4">
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
        <nav className="flex flex-wrap items-center justify-end gap-x-5 gap-y-2">
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
