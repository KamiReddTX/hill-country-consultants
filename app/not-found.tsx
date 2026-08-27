import Link from "next/link";
import { SITE } from "@/content/site";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-cream px-6 text-center">
      <p className="kicker">404</p>
      <h1 className="font-fraunces text-[40px] leading-tight text-forest">This page wandered off.</h1>
      <p className="max-w-[34em] text-[16px] prose-soft">The page you&rsquo;re looking for doesn&rsquo;t exist or has moved. Let&rsquo;s get you back on track.</p>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        <Link href="/" className="btn-gold text-[15px]">Back to home</Link>
        <Link href="/services" className="link-underline text-[15px] text-forest">Browse services</Link>
        <Link href="/get-started" className="link-underline text-[15px] text-forest">Get Started</Link>
      </div>
      <p className="mt-6 text-[13px] prose-muted">{SITE.name} · {SITE.email} · {SITE.phone}</p>
    </main>
  );
}
