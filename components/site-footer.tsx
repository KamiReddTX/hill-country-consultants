import Link from "next/link";
import Image from "next/image";
import { SITE, FOOTER_NAV, LEGAL_NAV } from "@/content/site";

/** The single forest band on the page: contact, navigation, legal. */
export function SiteFooter() {
  return (
    <footer className="band-forest">
      <div className="shell grid gap-10 py-16 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Image
            src="/assets/logo-horizontal-reversed.png"
            alt="Hill Country Consultants"
            width={410}
            height={115}
            className="h-[46px] w-auto"
          />
          <p className="mt-5 max-w-xs text-[15px] text-white/80">
            The capability of a full staff, without the payroll. Hybrid consulting and virtual assistance.
          </p>
          <p className="kicker mt-6">{SITE.since}</p>
          <p className="mt-1 text-[15px] text-white/80">
            {SITE.locations}, {SITE.serving}.
          </p>
        </div>

        <nav aria-label="Site" className="flex flex-col gap-2.5">
          <p className="kicker mb-1">Explore</p>
          {FOOTER_NAV.map((item) => (
            <Link key={item.href} href={item.href} className="text-[15px] text-white/85 hover:text-gold-onForest">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex flex-col gap-2.5">
          <p className="kicker mb-1">Contact</p>
          <a href={`mailto:${SITE.email}`} className="text-[15px] text-white/85 hover:text-gold-onForest">
            {SITE.email}
          </a>
          <a href={SITE.phoneHref} className="text-[15px] text-white/85 hover:text-gold-onForest">
            {SITE.phone}
          </a>
          <div className="mt-4 flex flex-col gap-2.5">
            <p className="kicker mb-1">Legal</p>
            {LEGAL_NAV.map((item) => (
              <Link key={item.href} href={item.href} className="text-[14px] text-white/70 hover:text-gold-onForest">
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
      <div className="border-t border-white/15">
        <div className="shell flex flex-col justify-between gap-2 py-5 text-[13px] text-white/60 sm:flex-row">
          <p>© {new Date().getFullYear()} {SITE.name}. All rights reserved.</p>
          <p>All sales final. See the Refund &amp; Cancellation Policy.</p>
        </div>
      </div>
    </footer>
  );
}
