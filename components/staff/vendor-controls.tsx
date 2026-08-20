"use client";
import { useTransition } from "react";
import { setVendor1099, deleteVendor } from "@/app/staff/actions";

/** Toggle a vendor's 1099 flag and delete a vendor. */
export function VendorControls({ id, is1099 }: { id: string; is1099: boolean }) {
  const [pending, start] = useTransition();
  return (
    <span className="flex items-center gap-3">
      <label className="flex items-center gap-1 text-[12px] text-charcoal">
        <input type="checkbox" defaultChecked={is1099} disabled={pending} onChange={(e) => start(() => setVendor1099(id, e.target.checked).then(() => {}))} className="h-4 w-4" /> 1099
      </label>
      <button type="button" disabled={pending} onClick={() => { if (confirm("Delete this vendor?")) start(() => deleteVendor(id).then(() => {})); }} className="text-[11px] text-red-700 underline disabled:opacity-40">delete</button>
    </span>
  );
}
