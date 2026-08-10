/**
 * Admin Resume Export API — PDF Generation
 *
 * GET /api/resumes/export-admin?id=<resume_id>&format=pdf
 *
 * Generates and returns a PDF for an admin-generated resume.
 * Auth required (User must own the admin_resume).
 */

import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { renderToBuffer } from "@react-pdf/renderer";
import { ResumePDF } from "@/lib/resume/pdf-document";
import { getTemplate } from "@/lib/resume/templates";
import { resumeContentSchema } from "@/lib/validations/resume";
import { apiError, ERROR_CODES } from "@/types/api";
import type { AdminResumeRow } from "@/types/database";

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return apiError(ERROR_CODES.UNAUTHORIZED, "Please sign in.", 401);
    }

    // Get params from query
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return apiError(ERROR_CODES.VALIDATION_ERROR, "Resume ID is required", 400);
    }

    // Fetch admin resume
    const admin = createAdminClient();
    const { data: resume, error } = await admin
      .from("admin_resumes")
      .select("id, user_id, title, content, template_id, expires_at")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (error || !resume) {
      return apiError(ERROR_CODES.NOT_FOUND, "Resume not found.", 404);
    }

    const typedResume = resume as unknown as AdminResumeRow;

    // Parse and validate content
    const contentResult = resumeContentSchema.safeParse(typedResume.content);
    if (!contentResult.success) {
      return apiError(ERROR_CODES.VALIDATION_ERROR, "Invalid resume content.", 400);
    }

    const content = contentResult.data;
    const filename = typedResume.title.replace(/[^a-zA-Z0-9]/g, "_");

    // PDF generation
    const template = getTemplate(typedResume.template_id || "classic");
    const buffer = await renderToBuffer(
      ResumePDF({ content, template })
    );
    const pdfBuffer = Buffer.from(buffer);

    const uint8ArrayPdf = new Uint8Array(pdfBuffer);
    return new Response(uint8ArrayPdf, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}.pdf"`,
        "Content-Length": pdfBuffer.length.toString(),
      },
    });
  } catch (err) {
    console.error("Admin Resume Export error:", err);
    return apiError(ERROR_CODES.INTERNAL_ERROR, "Failed to generate export.", 500);
  }
}
