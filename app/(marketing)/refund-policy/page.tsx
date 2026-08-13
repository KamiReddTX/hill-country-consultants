import type { Metadata } from "next";
import { LegalView } from "@/components/legal-view";
import { LEGAL } from "@/content/legal";
export const metadata: Metadata = { title: "Refund & Cancellation Policy", description: "All sales are final. How refunds, cancellations, chargebacks, classes and disputes are handled.", alternates: { canonical: "/refund-policy" }, openGraph: { title: "Refund & Cancellation Policy · Hill Country Consultants", description: "All sales are final. How refunds, cancellations, chargebacks, classes and disputes are handled.", url: "/refund-policy" } };
export default function Page() { return <LegalView page={LEGAL["refund-policy"]} />; }
