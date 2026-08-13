import type { Metadata } from "next";
import { StaffLoginForm } from "@/components/staff/staff-login-form";
export const metadata: Metadata = { title: "Staff Login", robots: { index: false } };
export default function Page() { return <StaffLoginForm />; }
