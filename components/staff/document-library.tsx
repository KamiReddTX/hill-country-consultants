"use client";
import { useState, useTransition } from "react";
import { uploadDocumentTemplate, deleteDocumentTemplate, assignTemplate } from "@/app/staff/actions";

type Tpl = { id: string; name: string; kind: string | null; requires_signature: boolean };
type Emp = { id: string; label: string };

/** Admin/BM: internal document library — upload templates and assign them to
 *  specific employees or everyone in a role. */
export function DocumentLibrary({ templates, roleOptions, employees }: {
  templates: Tpl[]; roleOptions: string[]; employees: Emp[];
}) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState("");
  const field = "min-h-touch border border-line-warm bg-white px-2 text-[13px]";
  const upId = "tpl-upload";

  return (
    <div className="flex flex-col gap-5">
      {/* Upload a template */}
      <form id={upId} className="flex flex-wrap items-end gap-2 border border-line-warm bg-white p-4"
        action={(fd) => start(async () => { setMsg(""); const r = await uploadDocumentTemplate(fd); if (r?.error) setMsg(r.error); else { (document.getElementById(upId) as HTMLFormElement)?.reset(); setMsg("Template added"); } })}>
        <label className="flex flex-col gap-1 text-[12px] text-ink-faint">Name<input name="name" placeholder="e.g. W-9" className={`${field} w-40`} /></label>
        <label className="flex flex-col gap-1 text-[12px] text-ink-faint">Type
          <select name="kind" defaultValue="tax" className={field}>
            <option value="tax">Tax form</option><option value="contract">Company contract</option>
            <option value="nda">NDA</option><option value="document">Other document</option>
          </select>
        </label>
        <label className="flex items-center gap-1 text-[12px] text-ink-faint"><input type="checkbox" name="requires_signature" defaultChecked /> requires signature</label>
        <input type="file" name="files" required className="text-[12px]" />
        <button disabled={pending} className="btn-gold text-[12px] disabled:opacity-50">Add template</button>
        {msg && <span className="text-[12px] text-forest">{msg}</span>}
      </form>

      {/* Templates + assignment */}
      {templates.length === 0 ? <p className="text-[13px] prose-muted">No templates yet. Upload one above (PDF recommended so it can be e-signed).</p> : (
        <div className="flex flex-col gap-2">
          {templates.map((t) => <TemplateRow key={t.id} t={t} roleOptions={roleOptions} employees={employees} />)}
        </div>
      )}
    </div>
  );
}

function TemplateRow({ t, roleOptions, employees }: { t: Tpl; roleOptions: string[]; employees: Emp[] }) {
  const [pending, start] = useTransition();
  const [role, setRole] = useState(roleOptions[0] || "");
  const [chosen, setChosen] = useState<string[]>([]);
  const [msg, setMsg] = useState("");
  const [open, setOpen] = useState(false);
  const field = "min-h-touch border border-line-warm bg-white px-2 text-[13px]";
  const toggle = (id: string) => setChosen((c) => c.includes(id) ? c.filter((x) => x !== id) : [...c, id]);
  const done = (r: any) => setMsg(r?.error || (r?.count ? `Assigned to ${r.count}` : "Assigned"));

  return (
    <div className="border border-line-warm bg-white p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[14px] font-medium text-charcoal">{t.name} <span className="text-[11px] text-ink-faint">· {t.kind}{t.requires_signature ? " · e-sign" : ""}</span></span>
        <button type="button" disabled={pending} onClick={() => start(async () => { await deleteDocumentTemplate(t.id); })} className="text-[12px] text-red-700 underline">Delete</button>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-line-soft pt-2">
        <span className="text-[12px] text-ink-faint">Assign to all:</span>
        <select value={role} onChange={(e) => setRole(e.target.value)} className={field}>
          {roleOptions.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <button type="button" disabled={pending} onClick={() => start(async () => { setMsg(""); done(await assignTemplate(t.id, { role })); })} className="btn-gold text-[12px] disabled:opacity-50">Assign to role</button>
        <button type="button" onClick={() => setOpen((o) => !o)} className="text-[12px] link-underline">{open ? "Hide" : "Or pick people"}</button>
        {msg && <span className="text-[12px] text-forest">{msg}</span>}
      </div>
      {open && (
        <div className="mt-2 border-t border-line-soft pt-2">
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {employees.map((e) => (
              <label key={e.id} className="flex items-center gap-1 text-[13px] text-charcoal"><input type="checkbox" checked={chosen.includes(e.id)} onChange={() => toggle(e.id)} /> {e.label}</label>
            ))}
          </div>
          <button type="button" disabled={pending || chosen.length === 0} onClick={() => start(async () => { setMsg(""); done(await assignTemplate(t.id, { staffIds: chosen })); })} className="btn-gold mt-2 text-[12px] disabled:opacity-50">Assign to selected ({chosen.length})</button>
        </div>
      )}
    </div>
  );
}
