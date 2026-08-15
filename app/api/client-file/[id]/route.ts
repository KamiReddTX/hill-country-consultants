import { NextResponse, type NextRequest } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/** Secure open/download for a shared client file. The authed read is RLS-scoped
 *  (owning client or staff); we then hand back a short-lived signed URL. */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const db = createClient();
  const { data: file } = await db.from("client_files").select("path,name").eq("id", params.id).maybeSingle();
  if (!file) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const admin = createServiceClient();
  const { data, error } = await admin.storage
    .from("client-files")
    .createSignedUrl((file as any).path, 60, { download: (file as any).name });
  if (error || !data?.signedUrl) return NextResponse.json({ error: "Unavailable" }, { status: 500 });
  return NextResponse.redirect(data.signedUrl);
}
