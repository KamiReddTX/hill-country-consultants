import { NextResponse, type NextRequest } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/** Secure open/download for a shared client file. The authed read is RLS-scoped
 *  (owning client or staff); we then hand back a short-lived signed URL. */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const db = createClient();
  const { data: file } = await db.from("client_files").select("path,name,doc_url").eq("id", params.id).maybeSingle();
  if (!file) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Link rows (Google Docs, etc.) just redirect to the shared document.
  if ((file as any).doc_url) return NextResponse.redirect((file as any).doc_url);
  if (!(file as any).path) return NextResponse.json({ error: "Not a stored file" }, { status: 400 });

  // ?preview=1 opens inline (browser previews PDFs/images); default forces download.
  const preview = req.nextUrl.searchParams.get("preview") === "1";
  const admin = createServiceClient();
  const { data, error } = await admin.storage
    .from("client-files")
    .createSignedUrl((file as any).path, 60, preview ? {} : { download: (file as any).name });
  if (error || !data?.signedUrl) return NextResponse.json({ error: "Unavailable" }, { status: 500 });
  return NextResponse.redirect(data.signedUrl);
}
