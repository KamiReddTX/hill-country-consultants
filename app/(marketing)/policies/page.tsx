import type { Metadata } from "next";
import { LegalView } from "@/components/legal-view";
import { LEGAL } from "@/content/legal";
export const metadata: Metadata = { title: "Policies & Procedures", description: "The operating terms every Hill Country Consultants engagement runs on — scope, plans, payment, delivery, confidentiality and communication.", alternates: { canonical: "/policies" } };
export default function Page() { return <LegalView page={LEGAL.policies} />; }
