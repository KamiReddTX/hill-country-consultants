import type { Metadata } from "next";
import { ClientLoginForm } from "@/components/portal/login-form";
export const metadata: Metadata = { title: "Client Login", robots: { index: false } };
export default function Page({ searchParams }: { searchParams: { welcome?: string } }) {
  return <ClientLoginForm welcome={searchParams.welcome === "1"} />;
}
