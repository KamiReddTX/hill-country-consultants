import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { envelopeStatus, combinedPdf } from "@/lib/docusign";

export const runtime = "nodejs";

/** Where DocuSign returns the employee after embedded signing. If the envelope
 *  is complete, record it as signed and store the completed PDF. */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const docId = url.searchParams.get("doc");
  const event = url.searchParams.get("event");
  const site = process.env.NEXT_PUBLIC_SITE_URL || url.origin;

  if (docId && event === "signing_complete") {
    try {
      const admin = createServiceClient();
      const { data: doc } = await admin.from("staff_documents").select("*").eq("id", docId).maybeSingle();
      const env = (doc as any)?.docusign_envelope_id;
      if (env && (await envelopeStatus(env)) === "completed") {
        let signed_path = (doc as any).signed_path || null;
        try {
          const pdf = await combinedPdf(env);
          signed_path = `${(doc as any).staff_id}/signed-${Date.now()}.pdf`;
          await admin.storage.from("staff-docs").upload(signed_path, pdf, { contentType: "application/pdf" });
        } catch (e) { console.warn("[docusign-return] pdf", e); }
        const { data: staff } = await admin.from("staff").select("name,email").eq("id", (doc as any).staff_id).maybeSingle();
        await admin.from("staff_documents").update({
          docusign_status: "completed",
          signed_at: new Date().toISOString(),
          signed_name: (staff as any)?.name || (staff as any)?.email || "Employee",
          signed_path,
        }).eq("id", docId);
      }
    } catch (e) { console.warn("[docusign-return]", e); }
  }
  return NextResponse.redirect(`${site}/staff/profile`);
}
