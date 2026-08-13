import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SetPasswordForm } from "@/components/auth/set-password-form";

export const metadata: Metadata = {
  title: "Set your password",
  robots: { index: false, follow: false },
};

/**
 * Shown after an invite/recovery link establishes a session (via /auth/callback).
 * The visitor chooses a password, then continues to their portal. If there's no
 * session, they're sent to sign in.
 */
export default async function SetPasswordPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  const db = createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) redirect("/portal/login");

  const next =
    searchParams.next && searchParams.next.startsWith("/staff") ? "/staff" : "/portal";

  return <SetPasswordForm next={next} email={user.email ?? ""} />;
}
