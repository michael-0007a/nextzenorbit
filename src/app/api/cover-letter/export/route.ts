/**
 * Cover Letter Export API — PDF and DOCX generation
 *
 * POST /api/cover-letter/export
 */

import { NextRequest, NextResponse } from "next/server";
import { getCachedUser } from '@/lib/supabase/server';
import { cachedExport } from '@/lib/resume/export-cache';
import { renderCoverLetter } from '@/lib/resume/cover-letter-export';
import { createTimings } from '@/lib/performance';
import { unsupportedPdfCharacters } from '@/lib/resume/layout';
import { createEmptyResumeContent } from '@/lib/validations/resume';
import { getTemplate } from '@/lib/resume/templates';

export async function POST(request: NextRequest) {
  const timings=createTimings();
  try {
    const {user}=await getCachedUser();if(!user)return NextResponse.json({success:false,error:'Please sign in.'},{status:401});
    const body = await request.json();
    const { content, format, filename } = body;

    if (typeof content!=='string'||!content.trim()||content.length>30000||!['pdf','docx'].includes(format)) {
      return NextResponse.json(
        { success: false, error: "Missing content or format" },
        { status: 400 }
      );
    }

    if (format === "docx") {
      const buffer=await timings.measure('render',()=>cachedExport(user.id,'cover-letter-docx',content,()=>renderCoverLetter(content,'docx')));
      const uint8Array = new Uint8Array(buffer);

      return new NextResponse(uint8Array, {
        headers: {...timings.headers(), 'Cache-Control':'private, no-store',
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "Content-Disposition": `attachment; filename="${String(filename || "cover_letter").replace(/[^a-zA-Z0-9_-]/g,"_")}.docx"`,
        },
      });
    } else if (format === "pdf") {
      // Render locally to avoid an additional network compilation request.
      try {
        if(unsupportedPdfCharacters({...createEmptyResumeContent(),summary:{text:content}},getTemplate('modern')).length)return NextResponse.json({success:false,error:'Use DOCX to preserve characters unsupported by the PDF font.'},{status:422});
        const pdfBuffer=await timings.measure('render',()=>cachedExport(user.id,'cover-letter-pdf',content,()=>renderCoverLetter(content,'pdf')));
        const uint8Array = new Uint8Array(pdfBuffer);

        return new NextResponse(uint8Array, {
          headers: {...timings.headers(), 'Cache-Control':'private, no-store',
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="${String(filename || "cover_letter").replace(/[^a-zA-Z0-9_-]/g,"_")}.pdf"`,
          },
        });
      } catch (latexError) {
        console.error("Cover letter PDF generation failed:", latexError);
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
