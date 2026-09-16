import { requireAdmin, isAuthError } from "@/lib/admin/guards";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (isAuthError(auth)) return auth;
  if (auth.role === "admin") return Response.json({ error: { message: "Supervisor access required." } }, { status: 403 });
  const { id } = await params;
  const admin = createAdminClient();
  const { data, error } = await admin.from("signup_applications").select("resume_path, resume_name").eq("user_id", id).maybeSingle();
  if (error || !data?.resume_path) return Response.json({ error: { message: "Resume not found." } }, { status: 404 });
  const file = await admin.storage.from("signup-resumes").download(data.resume_path);
  if (file.error) return Response.json({ error: { message: "Unable to download resume." } }, { status: 503 });
  return new Response(file.data, { headers: { "Content-Type": file.data.type, "Content-Disposition": `attachment; filename="${(data.resume_name || "resume").replace(/[^a-zA-Z0-9._-]/g, "_")}"`, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
}
