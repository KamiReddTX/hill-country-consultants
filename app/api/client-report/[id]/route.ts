import { NextResponse, type NextRequest } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/** Secure open/download for a weekly report PDF. The authed read is RLS-scoped
 *  (owning client or staff), then we hand back a short-lived signed URL. */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const db = createClient();
  const { data: report } = await db.from("client_reports").select("path,name").eq("id", params.id).maybeSingle();
  if (!report) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const admin = createServiceClient();
  const { data, error } = await admin.storage
    .from("client-reports")
    .createSignedUrl((report as any).path, 60, { download: `${(report as any).name}.pdf`.replace(/[^\w.\- ]+/g, "_") });
  if (error || !data?.signedUrl) return NextResponse.json({ error: "Unavailable" }, { status: 500 });
  return NextResponse.redirect(data.signedUrl);
}
