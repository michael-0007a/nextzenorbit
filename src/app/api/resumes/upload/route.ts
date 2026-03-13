/**
 * Resume Upload API
 *
 * POST /api/resumes/upload
 *
 * Accepts PDF/DOCX file via multipart/form-data.
 * 1. Stores raw file in Supabase Storage (resume-uploads bucket)
 * 2. Extracts text from file
 * 3. Sends text to Groq (llama-3.3-70b-versatile) for structured parsing
 * 4. Creates a new resume row with parsed content
 * 5. Deducts AI tokens from user's budget
 *
 * Auth required. Max 5MB. Uses admin client to bypass RLS.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { extractText, parseResumeWithAI } from "@/lib/ai/parsers/resume-parser";
import type { ResumeContent } from "@/lib/validations/resume";
import { apiError, ERROR_CODES } from "@/types/api";
import { canCreateResume } from "@/lib/subscription";
import type { SubscriptionRow } from "@/types/database";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export async function POST(request: Request): Promise<Response> {
  try {
    // 1. Authenticate
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return apiError(ERROR_CODES.UNAUTHORIZED, "Please sign in.", 401);
    }

    // 2. Parse multipart form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return apiError(ERROR_CODES.VALIDATION_ERROR, "No file provided.", 400);
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return apiError(
        ERROR_CODES.VALIDATION_ERROR,
        "Only PDF and DOCX files are accepted.",
        400
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return apiError(
        ERROR_CODES.VALIDATION_ERROR,
        "File size must be under 5MB.",
        400
      );
    }

    const admin = createAdminClient();

    // Ensure user exists in public.users table (required for FK constraint)
    const { data: existingUser } = await admin
      .from("users")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (!existingUser) {
      await admin.from("users").insert({
        id: user.id,
        email: user.email!,
        role: "user",
      });
    }

    // 3. Check subscription limits
    const [subRes, countRes] = await Promise.all([
      admin.from("subscriptions").select("*").eq("user_id", user.id).maybeSingle(),
      admin
        .from("resumes")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id),
    ]);

    if (!canCreateResume(subRes.data as SubscriptionRow | null, countRes.count ?? 0)) {
      return apiError(
        ERROR_CODES.SUBSCRIPTION_REQUIRED,
        "Resume limit reached. Upgrade your plan to create more.",
        403
      );
    }

    // 4. Upload file to Supabase Storage (use admin for storage too)
    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.type === "application/pdf" ? "pdf" : "docx";
    const fileName = `${user.id}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await admin.storage
      .from("resume-uploads")
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError.message);
      // Continue even if storage fails — parsing is more important
    }

    // 5. Extract text from file
    let resumeText = "";
    try {
      resumeText = await extractText(buffer, file.type);
    } catch (extractError) {
      console.error("Text extraction error:", extractError);
      // Continue with empty text - user can fill in manually
    }

    // 6. Parse with AI if we have text, otherwise create empty resume
    let content: ResumeContent;
    let tokensUsed = 0;
    let parsedByAI = false;

    if (resumeText && resumeText.length >= 50) {
      const parseResult = await parseResumeWithAI(resumeText);
      content = parseResult.content;
      tokensUsed = parseResult.tokensUsed;
      parsedByAI = parseResult.parsedByAI;
    } else {
      // Not enough text - create empty resume for manual entry
      content = {
        contact: {
          full_name: "",
          email: "",
          phone: "",
          location: "",
          linkedin_url: "",
          portfolio_url: "",
          github_url: "",
        },
        summary: { text: "" },
        experience: [],
        education: [],
        skills: [],
        projects: [],
        certifications: [],
        languages: [],
        custom_sections: [],
      };
    }

    // 7. Track AI token usage
    if (tokensUsed > 0) {
      const now = new Date();
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

      // Upsert ai_usage for current billing period
      const { data: existingUsage } = await admin
        .from("ai_usage")
        .select("id, tokens_used")
        .eq("user_id", user.id)
        .gte("billing_period_start", periodStart)
        .maybeSingle();

      if (existingUsage) {
        const usage = existingUsage as { id: string; tokens_used: number };
        await admin
          .from("ai_usage")
          .update({
            tokens_used: usage.tokens_used + tokensUsed,
            last_used_at: now.toISOString(),
          })
          .eq("id", usage.id);
      } else {
        await admin.from("ai_usage").insert({
          user_id: user.id,
          billing_period_start: periodStart,
          billing_period_end: periodEnd,
          tokens_used: tokensUsed,
        });
      }
    }

    // 8. Derive title from contact name or file name
    const title =
      content.contact?.full_name
        ? `${content.contact.full_name}'s Resume`
        : file.name.replace(/\.(pdf|docx)$/i, "") || "Uploaded Resume";

    // 9. Create resume row (file is stored in storage bucket separately)
    const { data: resume, error: resumeError } = await admin
      .from("resumes")
      .insert({
        user_id: user.id,
        title,
        content: content as ResumeContent,
        is_base: true,
      })
      .select()
      .single();

    if (resumeError) {
      console.error("Resume create error:", resumeError.message);
      return apiError(ERROR_CODES.INTERNAL_ERROR, "Failed to save resume.", 500);
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          resume,
          parsedByAI,
          tokensUsed,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Resume upload error:", error);
    return apiError(ERROR_CODES.INTERNAL_ERROR, "Something went wrong.", 500);
  }
}
