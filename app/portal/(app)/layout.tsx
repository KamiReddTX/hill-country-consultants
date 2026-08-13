import type { ReactNode } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getPortalClient } from "@/lib/portal";
import { PortalNav } from "@/components/portal/portal-nav";
import { SignOutButton } from "@/components/portal/sign-out-button";
import { SITE } from "@/content/site";

export const metadata: Metadata = { title: "Client Portal", robots: { index: false } };

export default async function PortalLayout({ children }: { children: ReactNode }) {
  const client = await getPortalClient();
  // Signed in (middleware guarantees a user) but not a client → send to staff or login.
  if (!client) redirect("/portal/login");

  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b border-line bg-white">
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
