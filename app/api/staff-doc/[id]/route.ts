import { NextResponse, type NextRequest } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/** Secure open/download for an employee document. The authed read is RLS-scoped
 *  (the owning employee or a privileged staffer); we hand back a signed URL. */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const db = createClient();
  const { data: doc } = await db.from("staff_documents").select("path,name").eq("id", params.id).maybeSingle();
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const admin = createServiceClient();
  const { data, error } = await admin.storage.from("staff-docs")
    .createSignedUrl((doc as any).path, 60, { download: (doc as any).name });
  if (error || !data?.signedUrl) return NextResponse.json({ error: "Unavailable" }, { status: 500 });
  return NextResponse.redirect(data.signedUrl);
}
