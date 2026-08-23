import { getSiteContent } from "@/lib/site-content";

/** Site-wide announcement bar. Renders only when an admin has toggled it on and
 *  set text (via /staff/site-content). */
export async function SiteBanner() {
  const c = await getSiteContent();
  if (c["banner.active"] !== "on") return null;
  const text = (c["banner.text"] || "").trim();
  if (!text) return null;
  return (
    <div className="bg-forest text-white">
      <div className="shell py-2 text-center text-[13.5px] font-medium">{text}</div>
    </div>
  );
}
