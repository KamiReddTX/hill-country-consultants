import Link from "next/link";
import { rateLinesFor } from "@/content/pricing";
import type { ServiceKey } from "@/content/services";

/**
 * Per-service pricing lines. Fixed-rate lines link to /book with the item
 * preselected ("Book now"); scoped lines link to a quote request.
 */
export function RateLines({ svc }: { svc: ServiceKey }) {
  const lines = rateLinesFor(svc);
  if (!lines.length) return null;
  return (
    <ul className="divide-y divide-line-soft border-y border-line-soft">
      {lines.map((l, i) => {
        const isBook = !!l.cart;
        const href = isBook ? `/book?add=${l.cart}` : `/book?quote=${l.quote}`;
        return (
          <li key={i} className="flex flex-wrap items-center justify-between gap-3 py-4">
            <div className="min-w-0">
              <p className="text-[16px] text-charcoal">{l.n}</p>
              <p className="text-[14px] prose-muted tabular-nums">{l.p}</p>
            </div>
            <Link
              href={href}
              className={isBook ? "btn-gold px-4 text-[13.5px]" : "btn-outline px-4 text-[13.5px]"}
            >
              {isBook ? "Book & pay" : "Request a quote"}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
