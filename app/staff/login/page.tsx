import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { StaffLoginForm } from "@/components/staff/staff-login-form";
import { AUTH_BYPASS } from "@/lib/auth-bypass";
export const metadata: Metadata = { title: "Employee Login", robots: { index: false } };
export const dynamic = "force-dynamic";
export default function Page() {
  // TEMPORARY: while login is bypassed, skip the form and go straight in.
  if (AUTH_BYPASS) redirect("/staff");
  return <StaffLoginForm />;
}
