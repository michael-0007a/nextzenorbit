import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getApplicationAccess } from "@/lib/onboarding";
import { rateLimit } from "@/lib/rate-limit";
import { CONSENT_VERSION, onboardingProfileSchema } from "@/lib/validations/onboarding";
import { extractText, parseResumeWithAI } from "@/lib/ai/parsers/resume-parser";
import { createEmptyResumeContent } from "@/lib/validations/resume";
import { parseExportContent } from "@/lib/resume/export-content";

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
    const body = await request.json().catch(() => null);
    const profile = onboardingProfileSchema.safeParse(body?.profile);
    if (!profile.success) return Response.json({ error: { message: "Please correct the highlighted fields.", fields: profile.error.flatten().fieldErrors } }, { status: 400 });
    if (profile.data.email.toLowerCase() !== user.email?.toLowerCase()) return Response.json({ error: { message: "Use the email address of your signed-in account." } }, { status: 400 });
    const path = typeof body?.path === "string" ? body.path : "";
    const fileName = typeof body?.name === "string" ? body.name.slice(0,200) : "Resume";
    if (!path.startsWith(`${user.id}/`) || !/^[0-9a-f-]{36}\.(pdf|doc|docx)$/i.test(path.slice(user.id.length+1))) return Response.json({ error: { message: "Upload a resume for this account." } }, { status: 400 });
    const { data: blocks, error: blockError } = await admin.from("registration_blocks").select("kind").in("value", [user.email?.trim().toLowerCase() || "", profile.data.phone.slice(1)]).limit(1);
    if (blockError) throw blockError;
    if (blocks?.length) return Response.json({ error: { message: "Registration is unavailable with these contact details." } }, { status: 403 });
    const { data: file, error: fileError } = await admin.storage.from("signup-resumes").download(path);
    if (fileError || !file) return Response.json({ error: { message: "Resume upload could not be verified. Please upload again." } }, { status: 400 });
    uploadedPath = path;
    if (!file.size || file.size > 10 * 1024 * 1024) return Response.json({ error: { message: "Upload a resume up to 10 MB." } }, { status: 400 });
    const buffer = Buffer.from(await file.arrayBuffer());
    const extension = path.split(".").pop()?.toLowerCase();
    const mime = extension === "pdf" ? "application/pdf" : extension === "doc" ? "application/msword" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    const valid = extension === "pdf" ? buffer.subarray(0,5).toString() === "%PDF-" : extension === "docx" ? buffer.subarray(0,2).toString() === "PK" : buffer.subarray(0,8).toString("hex") === "d0cf11e0a1b11ae" && buffer.includes(Buffer.from("WordDocument", "utf16le"));
    if (!valid) return Response.json({ error: { message: "The uploaded file is not a valid PDF, DOC or DOCX document." } }, { status: 400 });
    const fallback = createEmptyResumeContent({ full_name: profile.data.full_name, email: user.email || "", phone: profile.data.phone, location: profile.data.location });
    let content = fallback;
    // The original document is sufficient for admin review. AI is optional and
    // time-bounded so a provider outage cannot block a valid application.
    const text = await extractText(buffer, mime).catch(() => "");
    if (text.trim()) fallback.custom_sections = [{ id: "uploaded-text", title: "Uploaded resume text", content: text.slice(0, 3000) }];
    if (text.trim().length >= 50) {
      let timeout: ReturnType<typeof setTimeout> | undefined;
      try {
        const parsed = await Promise.race([
          parseResumeWithAI(text),
          new Promise<null>(resolve => { timeout = setTimeout(() => resolve(null), 8000); }),
        ]);
        if (parsed?.parsedByAI) {
          const result = parseExportContent({ ...parsed.content, contact: fallback.contact });
          if (result.success) content = result.data;
        }
      } catch { /* Keep the original document available for manual review. */ }
      finally { if (timeout) clearTimeout(timeout); }
    }
    const { error } = await admin.rpc("submit_signup_application", {
      p_user_id: user.id, p_profile: profile.data, p_resume_path: path,
      p_resume_name: fileName, p_content: content, p_consent_version: CONSENT_VERSION,
    });
    if (error) {
      // Submission is atomic, including duplicate/blocked identity checks.
      throw error;
    }
    uploadedPath = null;
    return Response.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Application submission failed:", error);
    return Response.json({ error: { message: "Unable to save your application. Your form is preserved; please try again." } }, { status: 503 });
  } finally {
    if (uploadedPath) {
      // Preserve the file if a network error hid a committed transaction.
      const { data, error } = await admin.from("signup_applications").select("user_id").eq("resume_path", uploadedPath).maybeSingle();
      if (!error && !data) await admin.storage.from("signup-resumes").remove([uploadedPath]);
    }
  }
}
