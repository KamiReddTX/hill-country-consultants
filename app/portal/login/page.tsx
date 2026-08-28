import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ClientLoginForm } from "@/components/portal/login-form";
import { AUTH_BYPASS } from "@/lib/auth-bypass";
export const metadata: Metadata = { title: "Client Login", robots: { index: false } };
export const dynamic = "force-dynamic";
export default function Page({ searchParams }: { searchParams: { welcome?: string } }) {
  // TEMPORARY: while login is bypassed, skip the form and go straight in.
  if (AUTH_BYPASS) redirect("/portal");
  return <ClientLoginForm welcome={searchParams.welcome === "1"} />;
}
