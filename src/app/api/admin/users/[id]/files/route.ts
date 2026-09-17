import { requireAdmin, isAuthError } from "@/lib/admin/guards";
import { createAdminClient } from "@/lib/supabase/admin";

const buckets = ["resume-uploads", "signup-resumes"] as const;
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (isAuthError(auth)) return auth;
  const { id } = await params;
  const search = new URL(request.url).searchParams;
  const name = search.get("name");
  const bucket = search.get("bucket");
  const body = await request.json().catch(() => null);
  if (!/^[0-9a-f-]{36}$/i.test(id) || !buckets.includes(bucket as typeof buckets[number]) || !name || /[/\\\x00-\x1f]/.test(name) || name === "." || name === ".." || body?.confirmation !== "DELETE") {
    return Response.json({ error: { message: "A valid file and final deletion confirmation are required." } }, { status: 400 });
  }
  const admin = createAdminClient();
  const { data: user, error } = await admin.from("users").select("id").eq("id", id).maybeSingle();
  if (error || !user) return Response.json({ error: { message: "Client not found." } }, { status: 404 });
  const path = `${id}/${name}`;
  const { error: storageError } = await admin.storage.from(bucket!).remove([path]);
  if (storageError) return Response.json({ error: { message: "The file could not be deleted. Please retry." } }, { status: 503 });
  const { error: referenceError } = bucket === "resume-uploads"
    ? await admin.from("resumes").update({ file_url: null }).eq("user_id", id).eq("file_url", `${bucket}/${path}`)
    : await admin.from("signup_applications").update({ resume_path: null, resume_name: null }).eq("user_id", id).eq("resume_path", path);
  if (referenceError) return Response.json({ error: { message: "The file was deleted, but its reference could not be cleared. Retry to finish." } }, { status: 503 });
  return Response.json({ success: true });
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (isAuthError(auth)) return auth;
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return Response.json({ error: { message: "Invalid client ID." } }, { status: 400 });
  const admin = createAdminClient();
  const { data: user, error } = await admin.from("users").select("id").eq("id", id).maybeSingle();
  if (error || !user) return Response.json({ error: { message: "Client not found." } }, { status: 404 });
  const search = new URL(request.url).searchParams;
  const name = search.get("name");
  const bucket = search.get("bucket");
  if (name !== null || bucket !== null) {
    // The browser chooses only a basename, never an arbitrary bucket/path or URL.
    if (!buckets.includes(bucket as typeof buckets[number]) || !name || name.includes("/") || name.includes("\\") || name === "." || name === "..") {
      return Response.json({ error: { message: "Invalid file." } }, { status: 400 });
    }
    const { data, error: downloadError } = await admin.storage.from(bucket!).download(`${id}/${name}`);
    if (downloadError || !data) return Response.json({ error: { message: "The original file could not be downloaded." } }, { status: 404 });
    return new Response(data, { headers: {
      "Content-Type": data.type || "application/octet-stream",
      "Content-Disposition": `attachment; filename="${name.replace(/[^a-zA-Z0-9._-]/g, "_")}"`,
      "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff",
    } });
  }
  const results = await Promise.all(buckets.map(async bucket => {
    const { data, error } = await admin.storage.from(bucket).list(id, { limit: 100, sortBy: { column: "created_at", order: "desc" } });
    // Older installations may not have the signup bucket yet.
    if (error) throw error;
    return (data || []).filter(file => file.id).map(file => ({ bucket, name: file.name, size: file.metadata?.size || 0, created_at: file.created_at }));
  })).catch(error => { console.error("Admin original-file listing failed:", error); return null; });
  if (!results) return Response.json({ error: { message: "Unable to load uploaded files. Please retry." } }, { status: 503 });
  return Response.json({ files: results.flat() }, { headers: { "Cache-Control": "private, no-store" } });
}
