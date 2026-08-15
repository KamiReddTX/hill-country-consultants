import { redirect } from "next/navigation";
import { getStaffMember, getClients, isPrivileged } from "@/lib/staff";
import { createClient } from "@/lib/supabase/server";
import { StaffVault } from "@/components/staff/staff-vault";
import type { VaultRow } from "@/lib/database.types";

export default async function StaffVaultPage() {
  const me = await getStaffMember();
  if (!me) redirect("/staff/login");
  const clients = await getClients();
  const priv = isPrivileged(me);
  const mine = priv ? clients : clients.filter((c) => c.assigned_to === me.id);
  const ids = mine.map((c) => c.id);

  const db = createClient();
  const { data: vault } = ids.length
    ? await db.from("client_vault").select("*").in("client_id", ids).order("updated_at", { ascending: false })
    : { data: [] as any[] };
  const byClient = new Map<string, VaultRow[]>();
  (vault ?? []).forEach((v: any) => { const a = byClient.get(v.client_id) || []; a.push(v); byClient.set(v.client_id, a); });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-fraunces text-[32px] font-normal text-forest">Shared vault</h1>
        <span className="rule-gold mb-4 mt-2" />
        <p className="max-w-[48em] prose-soft">Send the vault invite during kickoff, then keep each client&apos;s register current — the accounts we hold access to. The client sees this list (read-only) on their portal. Live passwords stay in the shared password manager, never here.</p>
      </div>

      {mine.length === 0 ? (
        <p className="border border-dashed border-line-warm bg-white p-6 text-[15px] prose-muted">No clients assigned to you yet.</p>
      ) : (
        <ul className="flex flex-col gap-5">
          {mine.map((c) => (
            <li key={c.id} className="border border-line-warm bg-white p-5">
              <p className="font-fraunces text-[18px] text-forest">{c.business || c.contact || c.email}</p>
              <p className="text-[12px] prose-muted">{c.contact || ""}{c.email ? ` · ${c.email}` : ""}</p>
              <StaffVault clientId={c.id} rows={byClient.get(c.id) || []} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
