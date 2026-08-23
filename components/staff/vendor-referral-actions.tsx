"use client";
import { useTransition } from "react";
import { handleVendorReferral } from "@/app/staff/actions";

/** Admin/BM: action or dismiss a pending vendor referral. */
export function VendorReferralActions({ id }: { id: string }) {
  const [pending, start] = useTransition();
  const btn = "min-h-touch border border-line-warm px-3 text-[12px] disabled:opacity-50";
  return (
    <span className="flex items-center gap-2">
      <button type="button" disabled={pending} className={`${btn} text-forest`}
        onClick={() => start(() => handleVendorReferral(id, "actioned").then(() => {}))}>Mark actioned</button>
      <button type="button" disabled={pending} className={btn}
        onClick={() => start(() => handleVendorReferral(id, "dismissed").then(() => {}))}>Dismiss</button>
    </span>
  );
}
