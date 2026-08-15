import { createServiceClient } from "@/lib/supabase/server";

/** Upload attachments for a message (client_notes row) into the private
 *  client-files bucket and record them on note_files. Returns count saved. */
export async function uploadNoteFiles(clientId: string, noteId: string, files: File[], uploadedBy: string): Promise<number> {
  if (!files.length) return 0;
  const admin = createServiceClient();
  let saved = 0;
  for (const file of files.slice(0, 10)) {
    const safe = file.name.replace(/[^\w.\-]+/g, "_").slice(0, 120);
    const path = `messages/${clientId}/${Date.now()}-${safe}`;
    const buf = Buffer.from(await file.arrayBuffer());
    const up = await admin.storage.from("client-files").upload(path, buf, { contentType: file.type || "application/octet-stream" });
    if (!up.error) {
      await admin.from("note_files").insert({ note_id: noteId, client_id: clientId, name: file.name.slice(0, 200), path, size: file.size, uploaded_by: uploadedBy } as any);
      saved++;
    }
  }
  return saved;
}
