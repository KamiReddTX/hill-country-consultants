"use client";
export function PrintButton({ label = "Print" }: { label?: string }) {
  return <button onClick={() => window.print()} className="min-h-touch border border-line-warm px-4 text-[13px]">{label}</button>;
}
