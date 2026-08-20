"use client";
import { useTransition } from "react";
import { deleteKbArticle } from "@/app/staff/actions";

export function KbDeleteButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <button type="button" disabled={pending} onClick={() => { if (confirm("Delete this article?")) start(() => deleteKbArticle(id).then(() => {})); }} className="text-[11px] text-red-700 underline disabled:opacity-40">
      {pending ? "…" : "delete"}
    </button>
  );
}
