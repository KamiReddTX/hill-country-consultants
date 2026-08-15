import { redirect } from "next/navigation";
import { getStaffMember, rolesOf, usd } from "@/lib/staff";
import { ProfileEditForm } from "@/components/staff/profile-edit-form";

export default async function ProfilePage() {
  const me = await getStaffMember();
  if (!me) redirect("/staff/login");
  const roles = rolesOf(me);
  const managed: [string, string][] = [
    ["Role(s)", roles.length ? roles.join(", ") : me.role],
    ["Hourly", me.hourly ? "Yes" : "No"],
    ["Pay rate", me.hourly ? `${usd(Number(me.rate || 0))}/hr` : "—"],
    ["Commission", `${Number((me as any).commission_pct || 0).toFixed(1)}%`],
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="kicker">Employee portal</p>
        <h1 className="font-fraunces text-[32px] font-normal text-forest">Welcome{me.name ? `, ${me.name.split(" ")[0]}` : ""}.</h1>
        <span className="rule-gold mb-3 mt-2" />
        <p className="max-w-[46em] prose-soft">This is your workspace. Set up your profile below, then use the tabs above to do your work — everything you see is scoped to the clients you&apos;re assigned to.</p>
      </div>

      {/* Employee ID card */}
      <div className="flex flex-wrap items-center justify-between gap-4 border border-line-warm bg-forest p-6 text-white">
        <div>
          <p className="text-[12px] uppercase tracking-wide text-gold-onForest">Employee ID</p>
          <p className="font-fraunces text-[30px] leading-none">{me.employee_code || "—"}</p>
        </div>
        <div className="text-right">
          <p className="text-[15px] font-medium">{me.name || me.email}</p>
          <p className="text-[12px] text-gold-onForest">{me.email}</p>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <ProfileEditForm name={me.name || ""} phone={(me as any).phone || ""} />

        <div className="border border-line-warm bg-white p-5">
          <p className="mb-2 text-[13px] font-semibold text-forest">Managed by your administrator</p>
          <dl className="flex flex-col">
            {managed.map(([k, v]) => (
              <div key={k} className="flex justify-between border-b border-line-soft/60 py-2 last:border-0">
                <dt className="text-[14px] prose-muted">{k}</dt><dd className="text-[15px] font-medium text-charcoal">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-[12px] prose-muted">Your role, pay rate, commission, and employee ID are set by an administrator. Ask them if anything looks off.</p>
        </div>
      </div>
    </div>
  );
}
