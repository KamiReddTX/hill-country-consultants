"use client";
import { useTransition } from "react";
import { handleUpgradeRequest } from "@/app/staff/actions";

/** Admin/BM: mark a service-upgrade request contacted or closed. */
export function UpgradeRequestActions({ id }: { id: string }) {
  const [pending, start] = useTransition();
  const btn = "min-h-touch border border-line-warm px-3 text-[12px] disabled:opacity-50";
  return (
    <span className="flex items-center gap-2">
      <button type="button" disabled={pending} className={`${btn} text-forest`}
        onClick={() => start(() => handleUpgradeRequest(id, "contacted").then(() => {}))}>Mark contacted</button>
      <button type="button" disabled={pending} className={btn}
        onClick={() => start(() => handleUpgradeRequest(id, "closed").then(() => {}))}>Close</button>
    </span>
  );
}
