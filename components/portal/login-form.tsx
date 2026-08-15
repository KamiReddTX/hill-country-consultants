"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export function ClientLoginForm({ welcome }: { welcome?: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [resetMsg, setResetMsg] = useState("");
  const [resetBusy, setResetBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(""); setBusy(true);
    const db = createClient();
    const { error } = await db.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    setBusy(false);
    if (error) { setError("That email or password didn't match. Check your welcome email, or call 470-478-1590."); return; }
    router.push("/portal");
    router.refresh();
  }

  async function sendReset() {
    const clean = email.trim().toLowerCase();
    if (!clean || !clean.includes("@")) { setResetMsg("Enter your email above first, then tap this again."); return; }
    setResetMsg(""); setResetBusy(true);
    const db = createClient();
    await db.auth.resetPasswordForEmail(clean, { redirectTo: `${window.location.origin}/auth/callback?next=/portal` });
    setResetBusy(false);
    setResetMsg("If that email has an account, a reset link is on its way. Check your inbox.");
  }

  const field = "min-h-touch w-full border border-line-warm bg-white px-4 py-3 text-[16px] outline-none focus:border-forest";
  return (
    <section className="section-cream min-h-screen">
      <div className="shell flex max-w-md flex-col gap-5 py-20">
        <Link href="/" className="kicker hover:text-forest">← Hill Country Consultants</Link>
        <h1 className="font-fraunces text-[32px] font-normal text-forest">Client Login</h1>
        <span className="rule-gold" />
        {welcome && (
          <p className="border border-line-warm bg-white p-4 text-[15px] prose-soft">
            Thanks for your booking. Check your email for an invite to set your password, then sign in below.
          </p>
        )}
        <form onSubmit={submit} className="flex flex-col gap-4 border border-line-warm bg-white p-6">
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-ink-faint">Email</span>
            <input type="email" required className={field} value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-ink-faint">Password</span>
            <input type="password" required className={field} value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          {error && <p className="text-[14px] text-red-700">{error}</p>}
          <button disabled={busy} className="btn-gold">{busy ? "Signing in…" : "Sign in"}</button>
          <div className="border-t border-line-soft pt-3">
            <button type="button" onClick={sendReset} disabled={resetBusy} className="link-underline text-[14px] text-forest disabled:opacity-50">
              {resetBusy ? "Sending…" : "Forgot your password? Email me a reset link"}
            </button>
            {resetMsg && <p className="mt-1 text-[13px] prose-muted">{resetMsg}</p>}
          </div>
        </form>
        <p className="text-[14px] prose-muted">
          Accounts are created when you book a service. Trouble signing in?{" "}
          <a className="link-underline" href="mailto:info@hillcountryconsultants.com">info@hillcountryconsultants.com</a> · 470-478-1590.
        </p>
      </div>
    </section>
  );
}
