"use client";
import { useState, useTransition } from "react";
import { setPreferredVendorFlag, deletePreferredVendor } from "@/app/staff/actions";

/** Admin/BM: toggle public/active and delete a preferred vendor. */
export function PreferredVendorControls({ id, isPublic, active }: { id: string; isPublic: boolean; active: boolean }) {
  const [pending, start] = useTransition();
  const [confirm, setConfirm] = useState(false);
  const btn = "min-h-touch border border-line-warm px-3 text-[12px] disabled:opacity-50";
  return (
    <span className="flex flex-wrap items-center gap-2">
      <button type="button" disabled={pending} className={btn}
        onClick={() => start(() => setPreferredVendorFlag(id, "is_public", !isPublic).then(() => {}))}>
        {isPublic ? "On website" : "Hidden"}
      </button>
      <button type="button" disabled={pending} className={btn}
        onClick={() => start(() => setPreferredVendorFlag(id, "active", !active).then(() => {}))}>
        {active ? "Active" : "Inactive"}
      </button>
      {confirm ? (
        <button type="button" disabled={pending} className={`${btn} text-red-700`}
          onClick={() => start(() => deletePreferredVendor(id).then(() => {}))}>Confirm delete</button>
      ) : (
        <button type="button" className={`${btn} text-red-700`} onClick={() => setConfirm(true)}>Delete</button>
      )}
    </span>
  );
}
