"use client";
import { useState, useTransition } from "react";
import { saveKbArticle } from "@/app/staff/actions";

type Article = { id?: string; title?: string; category?: string; tags?: string[]; body?: string };

/** Create or edit a KB article. Admin / Business Manager. */
export function KbArticleForm({ article, onDone }: { article?: Article; onDone?: string }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState("");
  const editing = !!article?.id;
  return (
    <form
      action={(fd) => start(async () => {
        setMsg("");
        if (article?.id) fd.set("id", article.id);
        const r = await saveKbArticle(fd);
        setMsg(r?.error ? r.error : (editing ? "Saved" : "Published"));
      })}
      className="flex flex-col gap-2"
    >
      <div className="flex flex-wrap gap-2">
        <input name="title" required defaultValue={article?.title || ""} placeholder="Title" className="min-h-touch flex-1 min-w-[220px] border border-line-warm bg-white px-2 text-[14px]" />
        <input name="category" defaultValue={article?.category || "General"} placeholder="Category" className="min-h-touch w-40 border border-line-warm bg-white px-2 text-[13px]" />
        <input name="tags" defaultValue={(article?.tags || []).join(", ")} placeholder="tags, comma, separated" className="min-h-touch w-56 border border-line-warm bg-white px-2 text-[13px]" />
      </div>
      <textarea name="body" defaultValue={article?.body || ""} placeholder="Write the article… (plain text)" rows={editing ? 6 : 4} className="w-full border border-line-warm bg-white px-2 py-1.5 text-[13px]" />
      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className="btn-gold text-[13px] disabled:opacity-50">{pending ? "Saving…" : editing ? "Save changes" : "Publish article"}</button>
        {msg && <span className="text-[12px] text-forest">{msg}</span>}
      </div>
    </form>
  );
}
