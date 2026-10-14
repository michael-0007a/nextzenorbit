import { requireAdmin, isAuthError } from "@/lib/admin/guards";
import { isAssignedToClient } from "@/lib/admin/assignments";
import { createAdminClient } from "@/lib/supabase/admin";
import { renderCoverLetter } from "@/lib/resume/cover-letter-export";
import { unsupportedPdfCharacters } from "@/lib/resume/layout";
import { createEmptyResumeContent } from "@/lib/validations/resume";
import { getTemplate } from "@/lib/resume/templates";
import { z } from "zod";

/** GET /api/admin/cover-letters/:id/export?format=pdf|docx — saved admin cover letter for an assigned client. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (isAuthError(auth)) return auth;
  const { id } = await params;
  const format = new URL(request.url).searchParams.get("format") || "pdf";
  if (!z.string().uuid().safeParse(id).success || !["pdf", "docx"].includes(format)) return Response.json({ error: { message: "Invalid cover letter or format." } }, { status: 400 });
  const { data: letter, error } = await createAdminClient().from("admin_cover_letters").select("user_id, title, content").eq("id", id).maybeSingle();
  if (error) return Response.json({ error: { message: "Cover letter is temporarily unavailable." } }, { status: 503 });
  if (!letter) return Response.json({ error: { message: "Cover letter not found." } }, { status: 404 });
  if (auth.role === "admin" && !await isAssignedToClient(auth.userId, letter.user_id)) return Response.json({ error: { message: "This client is not assigned to you." } }, { status: 403 });
  if (format === "pdf" && unsupportedPdfCharacters({ ...createEmptyResumeContent(), summary: { text: letter.content } }, getTemplate("modern")).length)
    return Response.json({ error: { message: "Some characters need Word export to preserve them. Download Word instead." } }, { status: 422 });
  try {
    const buffer = await renderCoverLetter(letter.content, format as "pdf" | "docx");
    return new Response(new Uint8Array(buffer), { headers: {
      "Content-Type": format === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${letter.title.replace(/[^a-zA-Z0-9_-]/g, "_") || "cover_letter"}.${format}"`,
      "Cache-Control": "private, no-store",
    } });
  } catch {
    return Response.json({ error: { message: "Export failed. Please try again." } }, { status: 500 });
  }
}
