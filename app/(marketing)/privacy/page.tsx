import type { Metadata } from "next";
import { LegalView } from "@/components/legal-view";
import { LEGAL } from "@/content/legal";
export const metadata: Metadata = { title: "Privacy Policy", description: "What Hill Country Consultants collects, why, and how it is used. We do not sell your information.", alternates: { canonical: "/privacy" }, openGraph: { title: "Privacy Policy · Hill Country Consultants", description: "What Hill Country Consultants collects, why, and how it is used. We do not sell your information.", url: "/privacy" } };
export default function Page() { return <LegalView page={LEGAL.privacy} />; }
