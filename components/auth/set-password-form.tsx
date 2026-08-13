"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

/** Set-a-password form for invited clients and staff. Updates the signed-in
 *  (invited) user's password, then continues to their portal. */
export function SetPasswordForm({ next, email }: { next: string; email: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 8) { setError("Use at least 8 characters."); return; }
    if (password !== confirm) { setError("The two passwords don't match."); return; }
    setBusy(true);
    const db = createClient();
    const { error } = await db.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      setError("We couldn't set your password. Open the link in your email again, or call 470-478-1590.");
      return;
    }
    router.push(next);
    router.refresh();
  }

  const field = "min-h-touch w-full border border-line-warm bg-white px-4 py-3 text-[16px] outline-none focus:border-forest";
  return (
    <section className="section-cream min-h-screen">
      <div className="shell flex max-w-md flex-col gap-5 py-20">
        <Link href="/" className="kicker hover:text-forest">← Hill Country Consultants</Link>
        <h1 className="font-fraunces text-[32px] font-normal text-forest">Set your password</h1>
        <span className="rule-gold" />
        <p className="text-[15px] prose-soft">
          Choose a password for {email || "your account"}. You&apos;ll use it to sign in from now on.
        </p>
        <form onSubmit={submit} className="flex flex-col gap-4 border border-line-warm bg-white p-6">
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-ink-faint">New password</span>
            <input type="password" required minLength={8} autoComplete="new-password" className={field} value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-ink-faint">Confirm password</span>
            <input type="password" required autoComplete="new-password" className={field} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </label>
          {error && <p className="text-[14px] text-red-700" role="alert">{error}</p>}
          <button disabled={busy} className="btn-gold">{busy ? "Saving…" : "Set password & continue"}</button>
        </form>
        <p className="text-[14px] prose-muted">
          Trouble?{" "}
          <a className="link-underline" href="mailto:info@hillcountryconsultants.com">info@hillcountryconsultants.com</a> · 470-478-1590.
        </p>
      </div>
    </section>
  );
}
