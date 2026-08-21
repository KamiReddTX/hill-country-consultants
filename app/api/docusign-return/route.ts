import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { envelopeStatus, combinedPdf } from "@/lib/docusign";
import { getStaffMember } from "@/lib/staff";

export const runtime = "nodejs";

/** Where DocuSign returns the employee after embedded signing. If the envelope
 *  is complete, record it as signed and store the completed PDF. */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const docId = url.searchParams.get("doc");
  const event = url.searchParams.get("event");
  const site = process.env.NEXT_PUBLIC_SITE_URL || url.origin;

  // Only process for a signed-in staff member (the employee who just signed);
  // the write is additionally gated on the real DocuSign envelope status below.
  const me = await getStaffMember();
  if (me && docId && event === "signing_complete") {
    try {
      const admin = createServiceClient();
      const { data: doc } = await admin.from("staff_documents").select("*").eq("id", docId).maybeSingle();
      const env = (doc as any)?.docusign_envelope_id;
      // Only the employee the document belongs to may complete it.
      if (doc && (doc as any).staff_id === me.id && env && (await envelopeStatus(env)) === "completed") {
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
