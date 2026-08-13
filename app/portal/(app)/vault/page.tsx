import { redirect } from "next/navigation";
import { getPortalClient, getPortalData } from "@/lib/portal";
import { VaultManager } from "@/components/portal/vault-manager";

const HANDOFF = [
  "You receive a vault invitation from our password manager — check the sender is hillcountryconsultants.com.",
  "Accept it and create your own master password. We never see it.",
  "Register each login here, and share the actual credential through the password manager — never on this page.",
  "We confirm in writing what access we hold, and for what purpose.",
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
        <p className="max-w-[52em] prose-soft">A register of the access we hold for you — {vault.length} {vault.length === 1 ? "entry" : "entries"} on file. Update an entry the day a password changes and our work never stops on a locked account.</p>
      </div>

      <div className="band-forest p-6">
        <p className="max-w-[52em] text-[15px] text-white">
          Live passwords belong in the encrypted password-manager vault we share with you, <strong>not in a browser page</strong>.
          This screen keeps the record straight — what account, which user, when it last changed — and flags anything that needs
          re-syncing. No password field exists here, by design.
        </p>
      </div>

      <VaultManager rows={vault} />

      <div>
        <h2 className="mb-3 font-fraunces text-[20px] font-medium text-forest">How the handoff works</h2>
        <ol className="flex flex-col gap-2">
          {HANDOFF.map((h, i) => <li key={i} className="border-t border-line-soft pt-2 text-[15px] prose-soft"><span className="mr-2 text-ink-faint">{i + 1}.</span>{h}</li>)}
        </ol>
      </div>
    </div>
  );
}
