"use client";
import { useEffect, useRef } from "react";
import { markDmRead, markChannelRead } from "@/app/staff/actions";

/** On mount, clear the unread badge for the DM/channel the user just opened. */
export function MarkRead({ kind, id }: { kind: "dm" | "channel"; id: string }) {
  const done = useRef(false);
  useEffect(() => {
    if (done.current || !id) return;
    done.current = true;
    (kind === "dm" ? markDmRead(id) : markChannelRead(id)).catch(() => {});
  }, [kind, id]);
  return null;
}
