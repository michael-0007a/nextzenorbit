import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getApplicationAccess } from "@/lib/onboarding";
import { rateLimit } from "@/lib/rate-limit";
import { CONSENT_VERSION, onboardingProfileSchema } from "@/lib/validations/onboarding";
import { extractText, parseResumeWithAI } from "@/lib/ai/parsers/resume-parser";
import { resumeContentSchema } from "@/lib/validations/resume";

export async function POST(request: Request) {
  const admin = createAdminClient();
  let uploadedPath: string | null = null;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: { message: "Please sign in." } }, { status: 401 });
    const limited = await rateLimit("application-submit", user.id, 5, 900);
    if (limited) return limited;
    if (await getApplicationAccess(user) !== "draft") return Response.json({ error: { message: "This account cannot submit another application." } }, { status: 409 });
    if (Number(request.headers.get("content-length")) > 6 * 1024 * 1024) return Response.json({ error: { message: "Resume must be under 5 MB." } }, { status: 413 });
    const form = await request.formData();
    const profile = onboardingProfileSchema.safeParse(JSON.parse(String(form.get("profile") || "null")));
    if (!profile.success) return Response.json({ error: { message: profile.error.issues[0]?.message || "Complete the required profile fields and consent." } }, { status: 400 });
    const { data: blocks, error: blockError } = await admin.from("registration_blocks").select("kind").in("value", [user.email?.trim().toLowerCase() || "", profile.data.phone.slice(1)]).limit(1);
    if (blockError) throw blockError;
    if (blocks?.length) return Response.json({ error: { message: "Registration is unavailable with these contact details." } }, { status: 403 });
    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0 || file.size > 5 * 1024 * 1024 || !["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"].includes(file.type)) {
      return Response.json({ error: { message: "Upload a PDF or DOCX resume under 5 MB." } }, { status: 400 });
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const isPdf = file.type === "application/pdf";
    if (isPdf ? buffer.subarray(0, 5).toString() !== "%PDF-" : buffer.subarray(0, 2).toString() !== "PK") {
      return Response.json({ error: { message: "The uploaded file is not a valid PDF or DOCX." } }, { status: 400 });
    }
    const text = await extractText(buffer, file.type);
    if (text.trim().length < 50) return Response.json({ error: { message: "We could not read your resume. Upload a PDF with selectable text or a DOCX file." } }, { status: 400 });
    const parsed = await parseResumeWithAI(text);
    if (!parsed.parsedByAI) return Response.json({ error: { message: "Resume processing is temporarily unavailable. Your application has not been submitted; please try again." } }, { status: 503 });
    const content = resumeContentSchema.parse({ ...parsed.content, contact: { ...parsed.content.contact, full_name: profile.data.full_name, email: user.email, phone: profile.data.phone, location: profile.data.location } });
    uploadedPath = `${user.id}/${crypto.randomUUID()}.${isPdf ? "pdf" : "docx"}`;
    const { error: uploadError } = await admin.storage.from("signup-resumes").upload(uploadedPath, buffer, { contentType: file.type });
    if (uploadError) throw uploadError;
    const { error } = await admin.rpc("submit_signup_application", {
      p_user_id: user.id, p_profile: profile.data, p_resume_path: uploadedPath,
      p_resume_name: file.name.slice(0, 200), p_content: content, p_consent_version: CONSENT_VERSION,
    });
    if (error) {
      // Submission is atomic, including duplicate/blocked identity checks.
      throw error;
    }
    uploadedPath = null;
    return Response.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Application submission failed:", error);
    return Response.json({ error: { message: "Unable to submit your application. Refresh to check its status before trying again." } }, { status: 400 });
  } finally {
    if (uploadedPath) {
      // Preserve the file if a network error hid a committed transaction.
      const { data, error } = await admin.from("signup_applications").select("user_id").eq("resume_path", uploadedPath).maybeSingle();
      if (!error && !data) await admin.storage.from("signup-resumes").remove([uploadedPath]);
    }
  }
}
