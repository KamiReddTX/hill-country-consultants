"use client";
import Link from "next/link";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-cream px-6 text-center">
      <p className="kicker">Something went wrong</p>
      <h1 className="font-fraunces text-[36px] leading-tight text-forest">We hit a snag.</h1>
      <p className="max-w-[34em] text-[16px] prose-soft">An unexpected error occurred. You can try again, or head back home — nothing you did is lost.</p>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        <button onClick={() => reset()} className="btn-gold text-[15px]">Try again</button>
        <Link href="/" className="link-underline text-[15px] text-forest">Back to home</Link>
      </div>
    </main>
  );
}
