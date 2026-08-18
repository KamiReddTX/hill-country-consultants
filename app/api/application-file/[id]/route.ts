import { NextResponse, type NextRequest } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/** Download an applicant's résumé. The authed read is RLS-scoped (only privileged
 *  staff can read job_applications); we then hand back a short-lived signed URL. */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const db = createClient();
  const { data: app } = await db.from("job_applications").select("resume_path,name").eq("id", params.id).maybeSingle();
  const path = (app as any)?.resume_path;
  if (!app || !path) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const admin = createServiceClient();
  const dl = `resume-${String((app as any).name || "applicant").replace(/[^\w.\-]+/g, "_")}`;
  const { data, error } = await admin.storage.from("applications").createSignedUrl(path, 60, { download: dl });
  if (error || !data?.signedUrl) return NextResponse.json({ error: "Unavailable" }, { status: 500 });
  return NextResponse.redirect(data.signedUrl);
}
