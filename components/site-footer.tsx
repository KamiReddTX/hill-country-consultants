import Link from "next/link";
import Image from "next/image";
import { SITE } from "@/content/site";
import { getSiteContent, pick } from "@/lib/site-content";

/** Footer nav — one row, matches the header with Home and Policies added. */
const FOOTER_LINKS: { href: string; label: string }[] = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/industries", label: "Industries" },
  { href: "/plans", label: "Plans & Pricing" },
  { href: "/book", label: "Book & Pay" },
  { href: "/training", label: "Training" },
  { href: "/about", label: "About" },
  { href: "/faq", label: "FAQ" },
  { href: "/get-started", label: "Get Started" },
  { href: "/careers", label: "Careers" },
  { href: "/policies", label: "Policies & Procedures" },
];

/**
 * Three-band forest footer (matches the approved build): logo + full nav row,
 * then contact and business hours, then copyright with legal and portal links.
 * The employee and client portals are reached here — they are part of the site.
 */
export async function SiteFooter() {
  const c = await getSiteContent();
  const email = pick(c, "biz.email", SITE.email);
  const phone = pick(c, "biz.phone", SITE.phone);
  const phoneHref = c["biz.phone"] ? `tel:${c["biz.phone"].replace(/[^0-9+]/g, "")}` : SITE.phoneHref;
  const locations = pick(c, "biz.locations", "Longview, TX · Atlanta, GA");
  return (
    <footer className="bg-forest text-white">
      {/* Band 1 — logo + full nav */}
      <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-x-10 gap-y-4 px-6 pb-[22px] pt-6">
        <Image
          src="/assets/logo-horizontal-reversed.png"
          alt="Hill Country Consultants"
          width={410}
          height={115}
          className="h-auto w-[196px] shrink-0"
        />
        <nav aria-label="Footer" className="flex flex-wrap justify-end gap-x-5 gap-y-2.5">
          {FOOTER_LINKS.map((it) => (
            <Link
              key={it.href}
              href={it.href}
              className="whitespace-nowrap font-inter text-[13.5px] text-white transition-colors hover:text-[#c2a24a]"
            >
              {it.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Band 2 — contact + hours */}
      <div className="border-t border-white/15">
        <div className="mx-auto flex max-w-[1180px] flex-wrap items-baseline justify-between gap-x-9 gap-y-3 px-6 py-5 font-inter text-[13.5px]">
          <div className="flex flex-wrap items-baseline gap-x-[18px] gap-y-2">
            <a href={`mailto:${email}`} className="whitespace-nowrap text-white transition-colors hover:text-[#c2a24a]">{email}</a>
            <a href={phoneHref} className="whitespace-nowrap text-white transition-colors hover:text-[#c2a24a]">{phone}</a>
            <span className="whitespace-nowrap text-white/85">{locations}</span>
            <span className="whitespace-nowrap text-white/85">Nationwide since 2024</span>
          </div>
          <div className="flex flex-wrap items-baseline gap-x-[18px] gap-y-2 text-white/85">
            <span className="whitespace-nowrap">Mon &amp; Fri 9–5</span>
            <span className="whitespace-nowrap">Tue &amp; Thu 11–7</span>
            <span className="whitespace-nowrap">Wed &amp; Sun closed</span>
            <span className="whitespace-nowrap">Sat by appointment</span>
            <span className="whitespace-nowrap text-white/60">Eastern</span>
          </div>
        </div>
      </div>

      {/* Band 3 — copyright + legal + portals */}
      <div className="border-t border-white/15">
        <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-x-[22px] gap-y-2.5 px-6 pb-[26px] pt-4 font-inter text-[12.5px]">
          <p className="text-white/80">© {new Date().getFullYear()} {SITE.name}. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2.5 text-white/80">
            <Link href="/terms" className="whitespace-nowrap transition-colors hover:text-[#c2a24a]">Terms of Service</Link>
            <Link href="/refund-policy" className="whitespace-nowrap transition-colors hover:text-[#c2a24a]">Refund &amp; Cancellation</Link>
            <Link href="/privacy" className="whitespace-nowrap transition-colors hover:text-[#c2a24a]">Privacy Policy</Link>
            <Link
              href="/portal/login"
              className="whitespace-nowrap border-b border-white/50 pb-0.5 font-medium text-white transition-colors hover:border-[#c2a24a] hover:text-[#c2a24a]"
            >
              Client Portal
            </Link>
            <Link
              href="/staff/login"
              className="whitespace-nowrap border-b border-white/50 pb-0.5 font-medium text-white transition-colors hover:border-[#c2a24a] hover:text-[#c2a24a]"
            >
              Employee Portal
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
