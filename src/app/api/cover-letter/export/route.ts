/**
 * Cover Letter Export API — PDF and DOCX generation
 *
 * POST /api/cover-letter/export
 */

import { NextRequest, NextResponse } from "next/server";
import { Document, Packer, Paragraph, TextRun } from "docx";

// LaTeX compilation service URL
const LATEX_API_URL = "https://latex.ytotech.com/builds/sync";

function generateCoverLetterLatex(content: string): string {
  const paragraphs = content
    .split("\n\n")
    .map((p) => p.trim().replace(/\n/g, " "))
    .filter((p) => p);

  const escapedParagraphs = paragraphs.map((p) =>
    p
      .replace(/\\/g, "\\textbackslash{}")
      .replace(/[&%$#_{}]/g, "\\$&")
      .replace(/~/g, "\\textasciitilde{}")
      .replace(/\^/g, "\\textasciicircum{}")
  );

  return `\\documentclass[11pt,letterpaper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage{times}
\\usepackage[margin=1in]{geometry}
\\usepackage{setspace}

\\begin{document}
\\pagestyle{empty}
\\onehalfspacing

${escapedParagraphs.join("\n\n\\vspace{12pt}\n\n")}

\\end{document}`;
}

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, format, filename } = body;

    if (!content || !format) {
      return NextResponse.json(
        { success: false, error: "Missing content or format" },
        { status: 400 }
      );
    }

    if (format === "docx") {
      // Generate DOCX
      const paragraphs = content.split("\n\n").filter((p: string) => p.trim());

      const doc = new Document({
        sections: [
          {
            children: paragraphs.map(
              (para: string) =>
                new Paragraph({
                  children: [
                    new TextRun({
                      text: para.trim(),
                      font: "Times New Roman",
                      size: 24, // 12pt = 24 half-points
                    }),
                  ],
                  spacing: { after: 240 }, // 12pt spacing after
                })
            ),
          },
        ],
      });

      const buffer = await Packer.toBuffer(doc);
      const uint8Array = new Uint8Array(buffer);

      return new NextResponse(uint8Array, {
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "Content-Disposition": `attachment; filename="${filename || "cover_letter"}.docx"`,
        },
      });
    } else if (format === "pdf") {
      // Generate PDF via LaTeX
      try {
        const latexCode = generateCoverLetterLatex(content);
        const pdfBuffer = await compileLatexToPdf(latexCode);
        const uint8Array = new Uint8Array(pdfBuffer);

        return new NextResponse(uint8Array, {
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="${filename || "cover_letter"}.pdf"`,
          },
        });
      } catch (latexError) {
        console.error("LaTeX PDF generation failed:", latexError);
        return NextResponse.json(
          { success: false, error: "PDF generation failed. Try DOCX instead." },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: "Invalid format. Use pdf or docx." },
      { status: 400 }
    );
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { success: false, error: "Export failed" },
      { status: 500 }
    );
  }
}
