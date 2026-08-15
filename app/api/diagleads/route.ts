import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** TEMPORARY diagnostic — attempts the exact leads insert the inquiry form does,
 *  reports the real Postgres error, then removes the test row. DELETE AFTER USE. */
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const env = { url: !!url, key: !!key };
  if (!url || !key) return NextResponse.json({ stage: "env", env });

  const admin = createClient<Database>(url, key, { auth: { persistSession: false } });
  const marker = `diag+${Date.now()}@example.com`;
  const { error } = await admin.from("leads").insert({
    business: "DIAG", contact: "DIAG", email: marker, phone: "0",
    industry: "DIAG", timeline: "now", pain: "diag", rep_code: null, stage: "New lead",
  });
  let cleanup: string | null = null;
  if (!error) {
    const del = await admin.from("leads").delete().eq("email", marker);
    cleanup = del.error ? del.error.message : "removed test row";
  }
  return NextResponse.json({
    stage: "insert", env, inserted: !error, cleanup,
    error: error ? { message: error.message, details: (error as any).details, hint: (error as any).hint, code: (error as any).code } : null,
  });
}
