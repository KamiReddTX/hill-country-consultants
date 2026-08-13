/**
 * Seed one admin, one VA, one sales rep, and one test client.
 * Run after schema.sql + the migrations are applied:
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run seed
 * Idempotent: re-running updates the same rows rather than duplicating them.
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your environment first.");
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

const PASSWORD = "ChangeMe!2026"; // change immediately after first sign-in

async function ensureUser(email: string): Promise<string> {
  const { data } = await db.auth.admin.createUser({ email, password: PASSWORD, email_confirm: true });
  if (data?.user) return data.user.id;
  // Already exists — find them.
  const { data: list } = await db.auth.admin.listUsers();
  const u = list.users.find((x) => (x.email || "").toLowerCase() === email.toLowerCase());
  if (!u) throw new Error(`Could not create or find user ${email}`);
  return u.id;
}

async function main() {
  const today = new Date().toISOString().slice(0, 10);

  const adminId = await ensureUser("admin@hillcountryconsultants.com");
  const vaId = await ensureUser("va@hillcountryconsultants.com");
  const salesId = await ensureUser("sales@hillcountryconsultants.com");
  const clientId = await ensureUser("dana@whitfieldmech.com");

  await db.from("staff").upsert([
    { user_id: adminId, email: "admin@hillcountryconsultants.com", name: "Owner (Admin)", role: "Administrator", hourly: false, rate: 0, employee_code: "HCC-AD-01", active: true },
    { user_id: vaId, email: "va@hillcountryconsultants.com", name: "Sample VA", role: "Virtual assistant", hourly: true, rate: 22, employee_code: "HCC-VA-01", active: true },
    { user_id: salesId, email: "sales@hillcountryconsultants.com", name: "Sample Rep", role: "Sales / account manager", hourly: false, rate: 0, employee_code: "HCC-SR-01", active: true },
  ], { onConflict: "email" });

  const { data: clientRow } = await db.from("clients").upsert(
    { user_id: clientId, email: "dana@whitfieldmech.com", business: "Whitfield Mechanical", contact: "Dana Whitfield", phone: "903-555-0142", status: "Active", assigned_to: "Virtual assistant", rep_code: "HCC-SR-01", retained_since: today },
    { onConflict: "email" },
  ).select("id").single();
  const cid = clientRow!.id;

  // Clean child rows for a deterministic re-seed, then add sample data so every tab shows something.
  for (const t of ["client_tasks", "client_notes", "client_vault", "client_work_log", "client_deliverables"]) {
    await db.from(t).delete().eq("client_id", cid);
  }
  await db.from("bookings").upsert(
    { client_id: cid, ref: "HCC-100001", start_date: today, pay_mode: "full", paid_cents: 35000,
      items: [{ id: "sub-pkg", name: "Construction submittal package", qty: 1, svc: "submittals", price: 350 }],
      quotes: [{ id: "q-doc", name: "Single document (capabilities, cert, profile, one-sheet, SOP)", from: "from $450" }],
      consent_terms: true, consent_at: new Date().toISOString(), consent_ip: "seed" },
    { onConflict: "ref" },
  );
  await db.from("client_tasks").insert([
    { client_id: cid, title: "Construction submittal package", service: "Construction Submittals", column_name: "In progress", paid: true, booking_ref: "HCC-100001", created_by: "staff" },
    { client_id: cid, title: "Update the capabilities statement", service: "Compliance & Documentation", column_name: "Requested", created_by: "client" },
  ]);
  await db.from("client_vault").insert([
    { client_id: cid, name: "Project management tool", username: "dana@whitfieldmech.com", url: "https://app.example.com", purpose: "Task board access", needs_resync: false },
  ]);
  await db.from("client_work_log").insert([
    { client_id: cid, worked_on: today, service: "Construction Submittals", task: "Compiled OEM cut sheets", performed_by: "Sample VA", hours: 2.5 },
  ]);
  await db.from("client_deliverables").insert([
    { client_id: cid, name: "Submittal package — HVAC (draft)", service: "Construction Submittals", status: "In review", delivered_on: today },
  ]);
  await db.from("client_notes").insert([{ client_id: cid, body: "Kickoff call scheduled — thanks!" }]);

  // A couple of leads for the pipeline.
  await db.from("leads").insert([
    { business: "Cedar Ridge Builders", contact: "Sam Ortiz", email: "sam@cedarridge.example", phone: "903-555-0199", industry: "Construction", stage: "Qualified", rep_name: "Sample Rep", rep_code: "HCC-SR-01", pain: "Submittals piling up." },
  ]);

  console.log("Seed complete.");
  console.log("Sign-ins (password for all: " + PASSWORD + " — change immediately):");
  console.log("  Admin  → admin@hillcountryconsultants.com  (/staff)");
  console.log("  VA     → va@hillcountryconsultants.com     (/staff)");
  console.log("  Sales  → sales@hillcountryconsultants.com  (/staff)");
  console.log("  Client → dana@whitfieldmech.com            (/portal)");
}

main().catch((e) => { console.error(e); process.exit(1); });
