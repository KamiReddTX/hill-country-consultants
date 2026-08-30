import { NextResponse, type NextRequest } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/** Serve a client's onboarding-call transcript PDF. The authed read is RLS-scoped
 *  (the owning client or their staff), then we hand back a short-lived signed URL
 *  that opens inline in a new tab. */
export async function GET(_req: NextRequest, { params }: { params: { clientId: string } }) {
  const db = createClient();
  const { data: row } = await db.from("clients").select("onboarding_transcript_path,business,contact").eq("id", params.clientId).maybeSingle();
  const path = (row as any)?.onboarding_transcript_path as string | null;
  if (!row || !path) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const admin = createServiceClient();
  const { data, error } = await admin.storage.from("client-files").createSignedUrl(path, 60, {});
  if (error || !data?.signedUrl) return NextResponse.json({ error: "Unavailable" }, { status: 500 });
  return NextResponse.redirect(data.signedUrl);
}
