import { redirect } from "next/navigation";
import { getStaffMember, isAdmin } from "@/lib/staff";
import { getSiteContent } from "@/lib/site-content";
import { createServiceClient } from "@/lib/supabase/server";
import { SiteContentEditor } from "@/components/staff/site-content-editor";
import { SiteFaqManager } from "@/components/staff/site-faq-manager";
import { PLAN_INCLUDED, PLAN_BILLED, PLAN_TERMS } from "@/content/pricing";

export const dynamic = "force-dynamic";

const GROUPS = [
  { title: "Announcement banner", note: "A site-wide notice bar (holiday hours, a promotion, etc.). Toggle it on when you want it shown.", fields: [
    { key: "banner.text", label: "Banner text", placeholder: "e.g. Holiday hours: closed Dec 24–26" },
  ] },
  { title: "Business info", note: "Shown in the site footer.", fields: [
    { key: "biz.phone", label: "Phone" },
    { key: "biz.email", label: "Email" },
    { key: "biz.locations", label: "Locations (e.g. Longview, TX · Atlanta, GA)" },
  ] },
  { title: "Home page", fields: [
    { key: "home.hero_title", label: "Hero headline" },
    { key: "home.hero_intro", label: "Hero intro", area: true },
  ] },
  { title: "About page", fields: [
    { key: "about.title", label: "Heading" },
    { key: "about.intro", label: "Intro", area: true },
  ] },
  { title: "Services page", fields: [
    { key: "services.title", label: "Heading" },
    { key: "services.intro", label: "Intro", area: true },
  ] },
  { title: "Plans page", note: "Prices and the comparison table stay in code so they always match billing. These are the surrounding words and bullet lists (one item per line).", fields: [
    { key: "plans.title", label: "Heading" },
    { key: "plans.intro", label: "Intro", area: true },
    { key: "plans.included", label: "Every plan includes (one per line)", area: true },
    { key: "plans.billed", label: "Billed separately (one per line)", area: true },
    { key: "plans.terms", label: "Terms (one per line)", area: true },
  ] },
];
const BOOL_KEYS = ["banner.active"];

export default async function SiteContentPage() {
  const me = await getStaffMember();
  if (!me) redirect("/staff/login");
  if (!isAdmin(me)) redirect("/staff");

  const values = await getSiteContent();
  // Pre-fill the plan bullet-list textareas with the current live content so the
  // admin edits from what's shown, not a blank box.
  if (!values["plans.included"]) values["plans.included"] = PLAN_INCLUDED.join("\n");
  if (!values["plans.billed"]) values["plans.billed"] = PLAN_BILLED.join("\n");
  if (!values["plans.terms"]) values["plans.terms"] = PLAN_TERMS.join("\n");
  const { data: faqs } = await createServiceClient()
    .from("site_faqs").select("id,question,answer,sort,active").order("sort").order("created_at");

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-fraunces text-[32px] font-normal text-forest">Edit website</h1>
        <span className="rule-gold mb-2 mt-2" />
        <p className="max-w-[56em] text-[14px] prose-muted">Update the copy that shows on the public site. Blank fields fall back to the built-in wording, so nothing ever breaks. Changes go live right away. Administrators only. (Services &amp; pricing editing is coming next — that content is wired into checkout, so it needs careful handling.)</p>
      </div>

      <SiteContentEditor groups={GROUPS} values={values} boolKeys={BOOL_KEYS} bannerActive={values["banner.active"] === "on"} />

      <div>
        <h2 className="mb-1 font-fraunces text-[22px] font-medium text-forest">FAQ</h2>
        <p className="mb-3 text-[14px] prose-muted">Add, edit, reorder, or hide the questions shown on the public FAQ page.</p>
        <SiteFaqManager faqs={(faqs ?? []) as any} />
      </div>
    </div>
  );
}
