import { redirect } from "next/navigation";
import { getStaffMember, isPrivileged } from "@/lib/staff";
import { createClient } from "@/lib/supabase/server";
import { LocalTime } from "@/components/local-time";
import { KbArticleForm } from "@/components/staff/kb-article-form";
import { KbDeleteButton } from "@/components/staff/kb-delete-button";

export const dynamic = "force-dynamic";

/** Knowledge base — internal how-tos and reference. All staff read; Admin /
 *  Business Manager write. */
export default async function KbPage({ searchParams }: { searchParams: { q?: string } }) {
  const me = await getStaffMember();
  if (!me) redirect("/staff/login");
  const canEdit = isPrivileged(me);
  const q = (searchParams?.q || "").trim().toLowerCase();

  // RLS lets any staff read kb_articles.
  const { data: all } = await createClient().from("kb_articles").select("*").order("category").order("title");
  const articles = (all ?? []).filter((a: any) =>
    !q || a.title.toLowerCase().includes(q) || a.body.toLowerCase().includes(q) || (a.tags || []).some((t: string) => t.toLowerCase().includes(q)),
  );
  const byCat = new Map<string, any[]>();
  for (const a of articles) { const arr = byCat.get(a.category) || []; arr.push(a); byCat.set(a.category, arr); }
  const cats = [...byCat.keys()].sort();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-fraunces text-[32px] font-normal text-forest">Knowledge base</h1>
        <span className="rule-gold mb-2 mt-2" />
        <p className="max-w-[56em] text-[13px] prose-muted">
          Internal how-tos, playbook notes, and reference for the team. Everyone can read; admins and business managers can publish and
          edit. Use the search to find an article by title, body, or tag.
        </p>
      </div>

      <form className="flex items-center gap-2" action="/staff/kb">
        <input name="q" defaultValue={searchParams?.q || ""} placeholder="Search articles…" className="min-h-touch w-72 border border-line-warm bg-white px-3 text-[14px]" />
        <button type="submit" className="btn-outline px-3 text-[13px]">Search</button>
      </form>

      {canEdit && (
        <section className="border border-line-warm bg-white p-4">
          <p className="mb-2 text-[13px] font-semibold text-forest">New article</p>
          <KbArticleForm />
        </section>
      )}

      {cats.length === 0 ? (
        <p className="text-[15px] prose-muted">{q ? "No articles match your search." : "No articles yet."}</p>
      ) : cats.map((cat) => (
        <section key={cat}>
          <h2 className="mb-2 font-fraunces text-[20px] font-medium text-forest">{cat}</h2>
          <div className="flex flex-col gap-2">
            {byCat.get(cat)!.map((a: any) => (
              <details key={a.id} className="border border-line-warm bg-white">
                <summary className="min-h-touch cursor-pointer list-none px-4 py-3">
                  <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="text-[15px] font-medium text-charcoal">{a.title}</span>
                    {(a.tags || []).map((t: string) => <span key={t} className="text-[11px] text-ink-faint">#{t}</span>)}
                    <span className="text-[11px] text-ink-faint">updated <LocalTime iso={a.updated_at} mode="date" /></span>
                  </span>
                </summary>
                <div className="flex flex-col gap-3 border-t border-line-soft p-4">
                  <p className="whitespace-pre-wrap text-[14px] text-charcoal">{a.body || <span className="prose-muted">No content.</span>}</p>
                  {canEdit && (
                    <details className="border-t border-line-soft pt-3">
                      <summary className="cursor-pointer text-[12px] text-forest">Edit article</summary>
                      <div className="mt-2 flex flex-col gap-2">
                        <KbArticleForm article={{ id: a.id, title: a.title, category: a.category, tags: a.tags, body: a.body }} />
                        <span className="text-[12px]"><KbDeleteButton id={a.id} /></span>
                      </div>
                    </details>
                  )}
                </div>
              </details>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
