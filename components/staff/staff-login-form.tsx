"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export function StaffLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(""); setBusy(true);
    const db = createClient();
    const { error } = await db.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    setBusy(false);
    if (error) { setError("That didn't match. Check with your administrator if you can't sign in."); return; }
    router.push("/staff"); router.refresh();
  }
  const field = "min-h-touch w-full border border-line-warm bg-white px-4 py-3 text-[16px] outline-none focus:border-forest";
  return (
    <section className="section-cream min-h-screen">
      <div className="shell flex max-w-md flex-col gap-5 py-20">
        <Link href="/" className="kicker hover:text-forest">← Hill Country Consultants</Link>
        <h1 className="font-fraunces text-[32px] font-normal text-forest">Staff Login</h1>
        <span className="rule-gold" />
        <form onSubmit={submit} className="flex flex-col gap-4 border border-line-warm bg-white p-6">
          <label className="flex flex-col gap-1.5"><span className="text-[13px] font-medium text-ink-faint">Work email</span>
            <input type="email" required className={field} value={email} onChange={(e) => setEmail(e.target.value)} /></label>
          <label className="flex flex-col gap-1.5"><span className="text-[13px] font-medium text-ink-faint">Password</span>
            <input type="password" required className={field} value={password} onChange={(e) => setPassword(e.target.value)} /></label>
          {error && <p className="text-[14px] text-red-700">{error}</p>}
          <button disabled={busy} className="btn-gold">{busy ? "Signing in…" : "Sign in"}</button>
        </form>
        <p className="text-[13px] prose-muted">Internal — Hill Country Consultants. Access is provisioned by an administrator.</p>
      </div>
    </section>
  );
}
