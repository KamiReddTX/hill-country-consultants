import type { Metadata } from "next";
import { LegalView } from "@/components/legal-view";
import { LEGAL } from "@/content/legal";
export const metadata: Metadata = { title: "Terms of Service", description: "Terms governing use of this website and the purchase of services from Hill Country Consultants.", alternates: { canonical: "/terms" }, openGraph: { title: "Terms of Service · Hill Country Consultants", description: "Terms governing use of this website and the purchase of services from Hill Country Consultants.", url: "/terms" } };
export default function Page() { return <LegalView page={LEGAL.terms} />; }
