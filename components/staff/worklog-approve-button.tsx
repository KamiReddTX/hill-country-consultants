"use client";
import { useTransition } from "react";
import { approveWorkLog } from "@/app/staff/actions";

/** Admin control to approve a logged work entry into the client's Work Log. */
export function WorkLogApproveButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(() => approveWorkLog(id).then(() => {}))}
      className="border border-forest bg-forest px-2.5 py-1 text-[12px] font-semibold text-white disabled:opacity-50"
    >
      {pending ? "Approving…" : "Approve"}
    </button>
  );
}
