import { redirect } from "next/navigation";
import { getPortalClient, getPortalData } from "@/lib/portal";
import { VaultManager } from "@/components/portal/vault-manager";

const HANDOFF = [
  "Your account team sends you a vault invitation from our password manager — check the sender is hillcountryconsultants.com.",
  "Accept it and create your own master password. We never see it.",
  "Share each login through the password manager — never on this page.",
  "We register the account here so you always see what access we hold, and for what purpose.",
  "At offboarding, access is revoked or returned the same day and the vault share is deleted.",
];

export default async function VaultPage() {
  const client = await getPortalClient();
  if (!client) redirect("/portal/login");
  const { vault } = await getPortalData(client);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-fraunces text-[32px] font-normal text-forest">Shared vault</h1>
        <span className="rule-gold mb-4 mt-2" />
        <p className="max-w-[52em] prose-soft">The accounts your account team holds access to — {vault.length} {vault.length === 1 ? "entry" : "entries"} on file. Your VA/AM keeps this list current so you always know exactly what we can reach and why.</p>
      </div>

      <div className="band-forest p-6">
        <p className="max-w-[52em] text-[15px] text-white">
          Live passwords belong in the encrypted password-manager vault we share with you, <strong>not in a browser page</strong>.
          This screen is your record — what account, which user, when it last changed — and flags anything being re-synced.
          No password field exists here, by design.
        </p>
      </div>

      <div>
        <p className="kicker mb-3">Accounts we hold</p>
        <VaultManager rows={vault} />
      </div>

      <div>
        <h2 className="mb-3 font-fraunces text-[20px] font-medium text-forest">How the handoff works</h2>
        <ol className="flex flex-col gap-2">
          {HANDOFF.map((h, i) => <li key={i} className="border-t border-line-soft pt-2 text-[15px] prose-soft"><span className="mr-2 text-ink-faint">{i + 1}.</span>{h}</li>)}
        </ol>
      </div>
    </div>
  );
}
