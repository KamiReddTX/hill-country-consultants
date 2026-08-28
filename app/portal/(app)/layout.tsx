import type { ReactNode } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getPortalClient } from "@/lib/portal";
import { AUTH_BYPASS } from "@/lib/auth-bypass";
import { PortalNav } from "@/components/portal/portal-nav";
import { SignOutButton } from "@/components/portal/sign-out-button";
import { SITE } from "@/content/site";

export const metadata: Metadata = { title: "Client Portal", robots: { index: false } };
// Authed portal — always render per request, never statically prerender.
export const dynamic = "force-dynamic";

export default async function PortalLayout({ children }: { children: ReactNode }) {
  const client = await getPortalClient();
  // Signed in (middleware guarantees a user) but not a client → send to staff or login.
  if (!client) redirect("/portal/login");

  // Suspended (e.g. non-payment): block the portal with a notice until reactivated.
  if ((client as any).suspended) {
    return (
      <div className="min-h-screen bg-cream">
        <header className="sticky top-0 z-40 border-b border-line/70 bg-white/85 shadow-[0_1px_0_rgba(224,214,191,.6)] backdrop-blur-md supports-[backdrop-filter]:bg-white/75">
          <div className="shell flex flex-wrap items-center justify-between gap-3 py-4">
            <div>
              <p className="kicker">Client portal</p>
              <p className="font-fraunces text-[20px] text-forest">{client.business || client.contact || "Your account"}</p>
            </div>
            <SignOutButton />
          </div>
        </header>
        <main className="shell py-16">
          <div className="mx-auto max-w-[40em] border-2 border-gold bg-white p-8 text-center">
            <h1 className="font-fraunces text-[26px] text-forest">Your account is on hold</h1>
            <span className="rule-gold mx-auto my-3" />
            <p className="text-[15px] prose-soft">Access to your portal is temporarily paused{(client as any).suspended_reason ? ` (${(client as any).suspended_reason})` : ""}. Please reach out so we can get you back up and running.</p>
            <p className="mt-4 text-[15px]"><a className="link-underline" href="mailto:info@hillcountryconsultants.com">info@hillcountryconsultants.com</a> · 470-478-1590</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      {AUTH_BYPASS && (
        <div className="bg-red-700 px-4 py-1.5 text-center text-[12px] font-semibold uppercase tracking-wide text-white">
          Test mode — login is temporarily bypassed. Turn this off before launch.
        </div>
      )}
      <header className="sticky top-0 z-40 border-b border-line/70 bg-white/85 shadow-[0_1px_0_rgba(224,214,191,.6)] backdrop-blur-md supports-[backdrop-filter]:bg-white/75">
        <div className="shell flex flex-wrap items-center justify-between gap-3 py-4">
          <div>
            <p className="kicker">Client portal</p>
            <p className="font-fraunces text-[20px] text-forest">{client.business || client.contact || "Your account"}</p>
          </div>
          <div className="flex items-center gap-4">
            <span className={`text-[12px] font-semibold uppercase tracking-wide ${client.status === "Active" ? "text-forest" : "text-ink-faint"}`}>
              {client.status}
            </span>
            <SignOutButton />
          </div>
        </div>
        <div className="shell"><PortalNav /></div>
      </header>
      <main className="shell py-10">{children}</main>
    </div>
  );
}
