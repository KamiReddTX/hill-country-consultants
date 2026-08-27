import { createClient } from "@/lib/supabase/server";
import type { ClientRow, StaffRow } from "@/lib/database.types";

/** The signed-in auth user, or null. */
export async function getUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** The staff row for the signed-in user, or null if they aren't staff. */
export async function getStaff(): Promise<StaffRow | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("staff")
    .select("*")
    .eq("user_id", user.id)
    .eq("active", true)
    .maybeSingle();
  return data ?? null;
}

/** The client row for the signed-in user (RLS returns only their own). */
export async function getClient(): Promise<ClientRow | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("clients")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  return data ?? null;
}

export function isAdminRole(staff: StaffRow | null): boolean {
  return staff?.role === "Administrator";
}

/** Sales and admins share the sales-side tabs (Intake, Pipeline, Commissions…). */
export function isSalesOrAdmin(staff: StaffRow | null): boolean {
  const roles = staff?.roles && staff.roles.length ? staff.roles : staff?.role ? [staff.role] : [];
  return roles.some((r) => ["Engagement Specialist", "Creative Specialist", "Accounts Manager", "Account manager", "Sales staff", "Sales Manager", "Administrator", "Business Manager"].includes(r));
}
