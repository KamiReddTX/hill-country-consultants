"use client";
import { useTransition } from "react";
import { deleteCalendarEvent } from "@/app/staff/actions";

/** Small × to remove a calendar event you own or created. */
export function DeleteEventButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <button type="button" disabled={pending} title="Remove"
      onClick={() => start(async () => { await deleteCalendarEvent(id); })}
      className="shrink-0 px-1 text-[12px] leading-none text-white/70 hover:text-white disabled:opacity-40">×</button>
  );
}
