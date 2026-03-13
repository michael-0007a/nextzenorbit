/**
 * Resume Export API — PDF & Word Generation
 *
 * GET /api/resumes/[id]/export?format=pdf|docx|latex&template=classic-professional
 *
 * Generates and returns a PDF, Word document, or LaTeX source.
 * Auth required.
 */

import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { renderToBuffer } from "@react-pdf/renderer";
import { ResumePDF } from "@/lib/resume/pdf-document";
import { getTemplate } from "@/lib/resume/templates";
import { generateLatex } from "@/lib/resume/latex-templates";
import { generateWordDocument } from "@/lib/resume/word-document";
import { resumeContentSchema } from "@/lib/validations/resume";
import { apiError, ERROR_CODES } from "@/types/api";
import type { ResumeRow } from "@/types/database";

// LaTeX compilation service URL (using latex.ytotech.com - free LaTeX API)
const LATEX_API_URL = "https://latex.ytotech.com/builds/sync";

async function compileLatexToPdf(latexCode: string): Promise<Buffer> {
  const response = await fetch(LATEX_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      compiler: "pdflatex",
      resources: [
        {
          main: true,
          content: latexCode,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("LaTeX compilation error:", errorText);
    throw new Error("LaTeX compilation failed");
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return apiError(ERROR_CODES.UNAUTHORIZED, "Please sign in.", 401);
    }

    // Get params from query
    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get("template") || "classic-professional";
    const format = searchParams.get("format") || "pdf";
    const useLatex = searchParams.get("latex") === "true";

    if (!["pdf", "docx", "latex"].includes(format)) {
      return apiError(
        ERROR_CODES.VALIDATION_ERROR,
        "Supported formats: pdf, docx, latex",
        400
      );
    }

    // Fetch resume
    const admin = createAdminClient();
    const { data: resume, error } = await admin
      .from("resumes")
      .select("id, user_id, title, content, template_id")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (error || !resume) {
      return apiError(ERROR_CODES.NOT_FOUND, "Resume not found.", 404);
    }

    const typedResume = resume as ResumeRow;

    // Parse and validate content
    const contentResult = resumeContentSchema.safeParse(typedResume.content);
    if (!contentResult.success) {
      return apiError(ERROR_CODES.VALIDATION_ERROR, "Invalid resume content.", 400);
    }

    const content = contentResult.data;
    const filename = typedResume.title.replace(/[^a-zA-Z0-9]/g, "_");

    // Generate based on format
    if (format === "latex") {
      // Return raw LaTeX source
      const latexCode = generateLatex(content, templateId);
      return new Response(latexCode, {
        status: 200,
        headers: {
          "Content-Type": "application/x-tex",
          "Content-Disposition": `attachment; filename="${filename}.tex"`,
        },
      });
    }

    if (format === "docx") {
      // Generate Word document
      const docxBuffer = await generateWordDocument(content);
      const uint8Array = new Uint8Array(docxBuffer);
      return new Response(uint8Array, {
        status: 200,
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "Content-Disposition": `attachment; filename="${filename}.docx"`,
          "Content-Length": docxBuffer.length.toString(),
        },
      });
    }

    // PDF generation
    let pdfBuffer: Buffer;

    if (useLatex) {
      // Use LaTeX compilation for PDF
      const latexCode = generateLatex(content, templateId);
      try {
        pdfBuffer = await compileLatexToPdf(latexCode);
      } catch (latexError) {
        console.error("LaTeX PDF generation failed, falling back to react-pdf:", latexError);
        // Fallback to react-pdf if LaTeX fails
        const template = getTemplate(typedResume.template_id || "classic");
        const buffer = await renderToBuffer(
          ResumePDF({ content, template })
        );
        pdfBuffer = Buffer.from(buffer);
      }
    } else {
      // Use react-pdf for PDF generation (default)
      const template = getTemplate(typedResume.template_id || templateId);
      const buffer = await renderToBuffer(
        ResumePDF({ content, template })
      );
      pdfBuffer = Buffer.from(buffer);
    }

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
    console.error("Export error:", err);
    return apiError(ERROR_CODES.INTERNAL_ERROR, "Failed to generate export.", 500);
  }
}


