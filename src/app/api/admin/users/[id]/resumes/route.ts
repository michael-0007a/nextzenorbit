import { requireAdmin, isAuthError } from "@/lib/admin/guards";
import { deleteSavedResume } from "@/lib/resume/delete";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (isAuthError(auth)) return auth;
  const { id } = await params;
  const search = new URL(request.url).searchParams;
  const resumeId = search.get("resume_id") || "";
  const kind = search.get("kind") || "saved";
  const body = await request.json().catch(() => null);
  if (!/^[0-9a-f-]{36}$/i.test(id) || !/^[0-9a-f-]{36}$/i.test(resumeId) || !["saved", "generated"].includes(kind) || body?.confirmation !== "DELETE") {
    return Response.json({ error: { message: "A valid resume and final deletion confirmation are required." } }, { status: 400 });
  }
  return deleteSavedResume(resumeId, id, kind === "generated");
}
