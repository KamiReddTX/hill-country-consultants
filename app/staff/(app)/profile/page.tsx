import { redirect } from "next/navigation";
import { LocalTime } from "@/components/local-time";
import { getStaffMember, getClients, rolesOf, usd } from "@/lib/staff";
import { createClient } from "@/lib/supabase/server";
import { ProfileEditForm } from "@/components/staff/profile-edit-form";
import { AvatarUpload } from "@/components/staff/avatar-upload";
import { SignDocumentButton } from "@/components/staff/sign-document-button";
import { DocusignSignButton } from "@/components/staff/docusign-sign-button";
import { docusignConfigured } from "@/lib/docusign";
import { SecurityAck } from "@/components/staff/security-ack";
import { ACK_KIND, ACK_VERSION } from "@/content/acknowledgments";
import { TimeOffForm } from "@/components/staff/time-off-form";
import { CancelTimeOff } from "@/components/staff/time-off-actions";

export default async function ProfilePage() {
  const me = await getStaffMember();
  if (!me) redirect("/staff/login");
  const m = me as any;
  const roles = rolesOf(me);
  const avatarUrl = m.avatar_path ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/staff-avatars/${m.avatar_path}` : null;

  const [clients] = await Promise.all([getClients()]);
  const db = createClient();
  const { data: docs } = await db.from("staff_documents").select("*").eq("staff_id", me.id).order("created_at", { ascending: false });
  const rows = (docs ?? []) as any[];
  const paystubs = rows.filter((d) => d.kind === "paystub");
  const toSign = rows.filter((d) => d.requires_signature && !d.signed_at);
  const dsEnabled = docusignConfigured();
  const otherDocs = rows.filter((d) => d.kind !== "paystub" && !(d.requires_signature && !d.signed_at));

  const { data: ack } = await db.from("staff_acknowledgments").select("agreed_at,agreed_name").eq("staff_id", me.id).eq("kind", ACK_KIND).eq("version", ACK_VERSION).maybeSingle();
  const ackSigned = ack ? { at: (ack as any).agreed_at as string, name: (ack as any).agreed_name as string | null } : null;

  const { data: myTimeOff } = await db.from("time_off_requests").select("*").eq("staff_id", me.id).order("start_date", { ascending: false });
  const timeOff = (myTimeOff ?? []) as any[];
  const toStatusColor = (s: string) => (s === "approved" ? "text-forest" : s === "denied" ? "text-red-700" : "text-gold-hover");

  const managed: [string, string][] = [
    ["Role(s)", roles.length ? roles.join(", ") : me.role],
    ["Employment", m.employment_type || "—"],
    ["Start date", m.start_date || "—"],
    ["Hourly", me.hourly ? "Yes" : "No"],
    ["Pay rate", me.hourly ? `${usd(Number(me.rate || 0))}/hr` : "—"],
    ["Commission", `${Number(m.commission_pct || 0).toFixed(1)}%`],
  ];
  const initial = {
    name: me.name || "", phone: m.phone || "", personal_email: m.personal_email || "", address: m.address || "",
    timezone: m.timezone || "", emergency_contact_name: m.emergency_contact_name || "", emergency_contact_phone: m.emergency_contact_phone || "",
    dd_bank_name: m.dd_bank_name || "", dd_routing: m.dd_routing || "", dd_account: m.dd_account || "", dd_account_type: m.dd_account_type || "",
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="kicker">Employee portal</p>
        <h1 className="font-fraunces text-[32px] font-normal text-forest">Welcome{me.name ? `, ${me.name.split(" ")[0]}` : ""}.</h1>
        <span className="rule-gold mb-3 mt-2" />
        <p className="max-w-[46em] prose-soft">Your workspace. Keep your profile current, sign any documents waiting for you, and use the tabs above to do your work.</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 border border-line-warm bg-forest p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full border border-white/30 bg-white/10">
            {avatarUrl ? <img src={avatarUrl} alt="" className="h-full w-full object-cover" /> : null}
          </div>
          <div><p className="text-[12px] uppercase tracking-wide text-gold-onForest">Employee ID</p><p className="font-fraunces text-[28px] leading-none">{me.employee_code || "—"}</p></div>
        </div>
        <div className="text-right"><p className="text-[15px] font-medium">{me.name || me.email}</p><p className="text-[12px] text-gold-onForest">{me.email}</p></div>
      </div>

      {toSign.length > 0 && (
        <section className="border-2 border-gold bg-cream/40 p-4">
          <p className="mb-2 text-[14px] font-semibold text-forest">Documents waiting for your signature</p>
          <ul className="flex flex-col gap-2">
            {toSign.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 border-t border-line-soft pt-2">
                <a href={`/api/staff-doc/${d.id}`} className="link-underline text-[14px]" target="_blank" rel="noreferrer">{d.name} <span className="text-[11px] text-ink-faint">· {d.kind} · read it first</span></a>
                <span className="flex flex-wrap items-center gap-2">
                  {dsEnabled && <DocusignSignButton docId={d.id} />}
                  <SignDocumentButton docId={d.id} />
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <SecurityAck signed={ackSigned} />

      <section>
        <h2 className="mb-2 font-fraunces text-[20px] font-medium text-forest">Photo</h2>
        <AvatarUpload url={avatarUrl} />
      </section>

      <section>
        <h2 className="mb-2 font-fraunces text-[20px] font-medium text-forest">Set up your profile</h2>
        <ProfileEditForm initial={initial} />
      </section>

      <section>
        <h2 className="mb-2 font-fraunces text-[20px] font-medium text-forest">Time off</h2>
        <p className="mb-3 max-w-[46em] text-[13px] prose-muted">Request time off below. Your manager approves or denies it, and approved time off is reflected on the team&apos;s capacity view.</p>
        <TimeOffForm />
        {timeOff.length > 0 && (
          <ul className="mt-3 flex flex-col gap-2">
            {timeOff.map((t) => (
              <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 border border-line-warm bg-white p-3 text-[14px]">
                <span className="text-charcoal">
                  <span className="font-medium">{t.kind}</span> · <LocalTime iso={t.start_date} mode="date" />{t.end_date !== t.start_date && <> – <LocalTime iso={t.end_date} mode="date" /></>}
                  {t.note && <span className="prose-muted"> · {t.note}</span>}
                </span>
                <span className="flex items-center gap-3">
                  <span className={`text-[12px] font-semibold uppercase tracking-wide ${toStatusColor(t.status)}`}>{t.status}</span>
                  {t.status === "pending" && <CancelTimeOff id={t.id} />}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="border border-line-warm bg-white p-5">
          <p className="mb-2 text-[13px] font-semibold text-forest">Managed by your administrator</p>
          <dl className="flex flex-col">
            {managed.map(([k, v]) => <div key={k} className="flex justify-between border-b border-line-soft/60 py-2 last:border-0"><dt className="text-[14px] prose-muted">{k}</dt><dd className="text-[15px] font-medium text-charcoal">{v}</dd></div>)}
          </dl>
        </div>

        <div className="border border-line-warm bg-white p-5">
          <p className="mb-2 text-[13px] font-semibold text-forest">My clients ({clients.length})</p>
          {clients.length === 0 ? <p className="text-[13px] prose-muted">No clients assigned to you yet.</p> : (
            <ul className="flex flex-col gap-1">
              {clients.map((c) => <li key={c.id} className="flex justify-between border-b border-line-soft/60 py-1.5 text-[14px] last:border-0"><span className="text-charcoal">{c.business || c.contact || c.email}</span><span className="text-[12px] prose-muted">{c.status}</span></li>)}
            </ul>
          )}
        </div>
      </div>

      <section>
        <h2 className="mb-2 font-fraunces text-[20px] font-medium text-forest">Paystubs</h2>
        {paystubs.length === 0 ? <p className="text-[15px] prose-muted">No paystubs yet. Your administrator posts them here.</p> : (
          <ul className="flex flex-col gap-2">
            {paystubs.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 border border-line-warm bg-white p-3">
                <span className="text-[14px] text-charcoal">{d.name} <span className="text-[12px] prose-muted">· <LocalTime iso={d.created_at} mode="date" /></span></span>
                <a href={`/api/staff-doc/${d.id}`} className="btn-gold text-[13px]">Download</a>
              </li>
            ))}
          </ul>
        )}
      </section>

      {otherDocs.length > 0 && (
        <section>
          <h2 className="mb-2 font-fraunces text-[20px] font-medium text-forest">My documents</h2>
          <ul className="flex flex-col gap-2">
            {otherDocs.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 border border-line-warm bg-white p-3">
                <span className="text-[14px] text-charcoal">{d.name} <span className="text-[12px] prose-muted">· {d.kind}{d.signed_at ? <> · signed <LocalTime iso={d.signed_at} mode="date" /></> : ""}</span></span>
                <a href={`/api/staff-doc/${d.id}`} className="link-underline text-[13px]">Open</a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
