import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getStaff } from "@/lib/auth";
import type { StaffRow, ClientRow, LeadRow, PunchRow, BookingRow } from "@/lib/database.types";

export { getStaff };

/** Two-week pay periods anchored to 2026-01-05 (Central-agnostic; date math). */
export function periodOf(offset = 0) {
  const anchor = Date.UTC(2026, 0, 5);
  const now = Date.now();
  const idx = Math.floor((now - anchor) / (14 * 86400000)) - offset;
  const start = new Date(anchor + idx * 14 * 86400000);
  const end = new Date(anchor + (idx + 1) * 14 * 86400000 - 86400000);
  const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
  return { idx, startISO: start.toISOString().slice(0, 10), endISO: end.toISOString().slice(0, 10), label: `${fmt(start)} – ${fmt(end)}` };
}

export function hoursBetween(startISO: string, endISO: string | null) {
  if (!endISO) return 0;
  return (new Date(endISO).getTime() - new Date(startISO).getTime()) / 3600000;
}

/** Every role an employee holds — the roles[] array, falling back to the legacy single role. */
export const rolesOf = (s: StaffRow | null): string[] =>
  s?.roles && s.roles.length ? s.roles : s?.role ? [s.role] : [];
export const hasRole = (s: StaffRow | null, r: string) => rolesOf(s).includes(r);

export const isAdmin = (s: StaffRow | null) => hasRole(s, "Administrator");
/** Admin or Business Manager — full visibility across every client. */
export const isPrivileged = (s: StaffRow | null) => hasRole(s, "Administrator") || hasRole(s, "Business Manager");
export const isSalesOrAdmin = (s: StaffRow | null) =>
  hasRole(s, "Account manager") || hasRole(s, "Sales staff") || hasRole(s, "Sales Manager") || isPrivileged(s);
/** Sales leadership — the manager-level Sales console (Sales Manager, BM, Admin). */
export const isSalesLead = (s: StaffRow | null) => hasRole(s, "Sales Manager") || isPrivileged(s);

/** All clients (RLS lets any staff read). */
export async function getClients(): Promise<ClientRow[]> {
  const db = createClient();
  const { data } = await db.from("clients").select("*").order("created_at", { ascending: false });
  return data ?? [];
}
/** Clients owned by this staff's role, plus unassigned (visible to everyone). */
export function splitClients(clients: ClientRow[], staff: StaffRow) {
  const mine = clients.filter((c) => c.assigned_to && c.assigned_to === staff.id);
  const unassigned = clients.filter((c) => !c.assigned_to);
  return { mine, unassigned };
}

export async function getLeads(): Promise<LeadRow[]> {
  const db = createClient();
  const { data } = await db.from("leads").select("*").order("created_at", { ascending: false });
  return data ?? [];
}

export async function getBookings(): Promise<BookingRow[]> {
  const db = createClient();
  const { data } = await db.from("bookings").select("*").order("created_at", { ascending: false });
  return data ?? [];
}

/** My open punch (clocked in, not out), or null. */
export async function getOpenPunch(staff: StaffRow): Promise<PunchRow | null> {
  const db = createClient();
  const { data } = await db.from("punches").select("*").eq("staff_id", staff.id).is("ended_at", null).order("started_at", { ascending: false }).maybeSingle();
  return data ?? null;
}

/** My punches within a date window (inclusive ISO). */
export async function getMyPunches(staff: StaffRow, startISO: string, endISO: string): Promise<PunchRow[]> {
  const db = createClient();
  const { data } = await db.from("punches").select("*").eq("staff_id", staff.id)
    .gte("started_at", startISO).lte("started_at", endISO + "T23:59:59Z")
    .order("started_at", { ascending: false });
  return data ?? [];
}

/** Everyone currently on the clock (admin sees all; RLS scopes non-admins to self). */
export async function getOnTheClock(): Promise<PunchRow[]> {
  const db = createClient();
  const { data } = await db.from("punches").select("*").is("ended_at", null).order("started_at", { ascending: false });
  return data ?? [];
}

/** Staff directory (admin only per RLS). */
/** Minimal staff picker options (id + display name only, no pay) — safe to show
 *  to account managers who can't read the full directory under RLS. */
export async function getStaffOptions(): Promise<{ id: string; label: string }[]> {
  const { data } = await createServiceClient().from("staff").select("id,name,email,active").eq("active", true);
  return (data ?? []).map((s: any) => ({ id: s.id, label: s.name || s.email }));
}

export async function getDirectory(): Promise<StaffRow[]> {
  const db = createClient();
  const { data } = await db.from("staff").select("*").order("created_at", { ascending: false });
  return data ?? [];
}

export { ROLE_OPTIONS } from "@/content/roles";
export const usd = (n: number) => "$" + n.toLocaleString("en-US", { maximumFractionDigits: 2 });

/** The signed-in staff member (links their row by email on first login). */
export async function getStaffMember(): Promise<StaffRow | null> {
  const db = createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return null;
  await db.rpc("link_staff_to_user");
  const { data } = await db.from("staff").select("*").eq("user_id", user.id).eq("active", true).maybeSingle();
  return data ?? null;
}
