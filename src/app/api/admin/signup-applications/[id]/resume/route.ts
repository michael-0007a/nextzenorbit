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
  const { data: signed, error: signError } = await admin.storage.from("signup-resumes").createSignedUrl(data.resume_path, 60, { download: data.resume_name || "resume" });
  if (signError || !signed) return Response.json({ error: { message: "Unable to download resume." } }, { status: 503 });
  return new Response(null, { status:302, headers:{ Location:signed.signedUrl, "Cache-Control":"private, no-store" } });
}
