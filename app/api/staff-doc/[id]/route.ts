import { NextResponse, type NextRequest } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/** Secure open/download for an employee document. The authed read is RLS-scoped
 *  (the owning employee or a privileged staffer); we hand back a signed URL. */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const db = createClient();
  const { data: doc } = await db.from("staff_documents").select("path,name,signed_path").eq("id", params.id).maybeSingle();
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const admin = createServiceClient();
  // Prefer the completed/signed copy (from DocuSign) once it exists.
  const filePath = (doc as any).signed_path || (doc as any).path;
  const dlName = (doc as any).signed_path ? `signed-${(doc as any).name}` : (doc as any).name;
  const { data, error } = await admin.storage.from("staff-docs")
    .createSignedUrl(filePath, 60, { download: dlName });
  if (error || !data?.signedUrl) return NextResponse.json({ error: "Unavailable" }, { status: 500 });
  return NextResponse.redirect(data.signedUrl);
}
