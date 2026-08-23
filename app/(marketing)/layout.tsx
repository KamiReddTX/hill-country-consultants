import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SectionTabs } from "@/components/section-tabs";
import { SiteBanner } from "@/components/site-banner";

/** Public marketing shell — header + footer around every public page. */
export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteBanner />
      <SiteHeader />
      <SectionTabs />
      <main>{children}</main>
      <SiteFooter />
    </>
  );
}
