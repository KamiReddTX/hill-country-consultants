import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildApplicationPdf } from "@/lib/reports";
import type { JobApplicationRow } from "@/lib/database.types";

export const runtime = "nodejs";

/** Full employment-application packet as a downloadable PDF. The read is
 *  RLS-scoped — only privileged staff (Admin/BM) can select job_applications —
 *  so an unauthorized caller simply gets "Not found". */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const db = createClient();
  const { data } = await db.from("job_applications").select("*").eq("id", params.id).maybeSingle();
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const a = data as JobApplicationRow;

  const pdf = await buildApplicationPdf(a);
  const safe = String(a.name || "applicant").replace(/[^\w.\-]+/g, "_");
  return new NextResponse(Buffer.from(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="HCC-application-${safe}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
