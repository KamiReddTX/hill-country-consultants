import { redirect } from "next/navigation";
import { getPortalClient, getPortalData } from "@/lib/portal";

const TREE = [
  "01 · Company documents", "   ├── Capabilities & profiles", "   └── Certifications & insurance",
  "02 · Projects", "   ├── Submittals", "   ├── RFIs & transmittals", "   └── Closeout",
  "03 · Brand & marketing", "04 · Templates & SOPs", "05 · Reviews & reporting",
];

export default async function FilesPage() {
  const client = await getPortalClient();
  if (!client) redirect("/portal/login");
  const { deliverables } = await getPortalData(client);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-fraunces text-[32px] font-normal text-forest">Files &amp; deliverables</h1>
        <span className="rule-gold mb-4 mt-2" />
        <p className="max-w-[48em] prose-soft">Your deliverables link to the shared drive we set up in week one. This is the standard folder structure your account is built on.</p>
      </div>

      <div className="grid gap-8 md:grid-cols-[260px_1fr]">
        <pre className="border border-line-warm bg-white p-4 text-[13px] leading-6 text-forest">{TREE.join("\n")}</pre>
        <div>
          <p className="kicker mb-3">Delivered files</p>
          {deliverables.length === 0 ? (
            <p className="border border-dashed border-line-warm bg-white p-6 text-[15px] prose-muted">Nothing delivered yet. Files appear here as your team completes and reviews them.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {deliverables.map((d) => (
                <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 border-t border-line-soft pt-3">
                  <div><p className="text-[15px] text-charcoal">{d.name}</p><p className="text-[12px] prose-muted">{d.service || "—"}{d.delivered_on ? ` · ${d.delivered_on}` : ""}</p></div>
                  {d.file_url ? <a href={d.file_url} className="link-underline text-[13px]" target="_blank" rel="noreferrer">Open</a> : <span className="text-[12px] text-forest">{d.status}</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
