import { createAdminClient } from "@/lib/supabase/admin";

export function storedResumePath(fileUrl: string, userId: string): { bucket: string; path: string } | null {
  const prefix = `resume-uploads/${userId}/`;
  if (!fileUrl.startsWith(prefix)) return null;
  const name = fileUrl.slice(prefix.length);
  if (!name || /[/\\\x00-\x1f]/.test(name) || name === "." || name === "..") return null;
  return { bucket: "resume-uploads", path: `${userId}/${name}` };
}

/** Storage first: failed removal leaves the record available for a safe retry. */
export async function deleteSavedResume(id: string, userId: string, generated = false): Promise<Response> {
  const admin = createAdminClient();
  const table = generated ? "admin_resumes" : "resumes";
  const { data: resume, error } = await admin.from(table).select(generated ? "id" : "id,file_url").eq("id", id).eq("user_id", userId).maybeSingle();
  if (error) return Response.json({ error: { message: "Unable to load resume. Please retry." } }, { status: 503 });
  if (!resume) return Response.json({ error: { message: "Resume not found." } }, { status: 404 });
  const fileUrl = "file_url" in resume ? resume.file_url as string | null : null;
  if (fileUrl) {
    const file = storedResumePath(fileUrl, userId);
    if (!file) return Response.json({ error: { message: "The attached file path could not be verified. Nothing was deleted." } }, { status: 409 });
    const { error: storageError } = await admin.storage.from(file.bucket).remove([file.path]);
    if (storageError) return Response.json({ error: { message: "Unable to remove the original file. The resume was kept; please retry." } }, { status: 503 });
  }
  // Version rows cascade; application/queue references become NULL via existing FKs.
  const { data: removed, error: deleteError } = await admin.from(table).delete().eq("id", id).eq("user_id", userId).select("id");
  if (deleteError) return Response.json({ error: { message: "The resume could not be removed. Its attached file may already be deleted; retry to finish." } }, { status: 503 });
  if (!removed?.length) return Response.json({ error: { message: "Resume not found." } }, { status: 404 });
  return Response.json({ success: true, data: { id, deleted: true } });
}
