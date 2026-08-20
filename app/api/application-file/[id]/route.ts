import { NextResponse, type NextRequest } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/** Download an applicant's résumé or credentials. The authed read is RLS-scoped
 *  (only privileged staff can read job_applications); we then hand back a
 *  short-lived signed URL. Pass ?kind=credentials for the credentials file. */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const kind = req.nextUrl.searchParams.get("kind") === "credentials" ? "credentials" : "resume";
  const db = createClient();
  const { data: app } = await db.from("job_applications").select("resume_path,credentials_path,name").eq("id", params.id).maybeSingle();
  if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const path = kind === "credentials" ? (app as any).credentials_path : (app as any).resume_path;
  if (!path) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const admin = createServiceClient();
  const dl = `${kind}-${String((app as any).name || "applicant").replace(/[^\w.\-]+/g, "_")}`;
  const { data, error } = await admin.storage.from("applications").createSignedUrl(path, 60, { download: dl });
  if (error || !data?.signedUrl) return NextResponse.json({ error: "Unavailable" }, { status: 500 });
  return NextResponse.redirect(data.signedUrl);
}
