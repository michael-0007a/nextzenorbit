import { requireAdmin, isAuthError } from "@/lib/admin/guards";
import { createAdminClient } from "@/lib/supabase/admin";
import { extractText, parseResumeWithAI } from "@/lib/ai/parsers/resume-parser";
import { hasResumeBody, parseExportContent } from "@/lib/resume/export-content";
import { rateLimit } from "@/lib/rate-limit";

export const maxDuration = 60;

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (isAuthError(auth)) return auth;
  const limited = await rateLimit("admin-resume-upload", auth.userId, 10, 300);
  if (limited) return limited;
  try {
    if (Number(request.headers.get("content-length")) > 6 * 1024 * 1024) return Response.json({ error: { message: "Choose a file under 5 MB." } }, { status: 413 });
    const form = await request.formData();
    const userId = String(form.get("userId") || "");
    if (!/^[0-9a-f-]{36}$/i.test(userId)) return Response.json({ error: { message: "Invalid client." } }, { status: 400 });
    const file = form.get("file");
    if (!(file instanceof File) || !file.size || file.size > 5 * 1024 * 1024 || !/\.(pdf|docx)$/i.test(file.name)) return Response.json({ error: { message: "Choose a PDF or DOCX under 5 MB." } }, { status: 400 });
    const admin = createAdminClient();
    const { data: user, error: userError } = await admin.from("users").select("id").eq("id", userId).maybeSingle();
    if (userError) throw userError;
    if (!user) return Response.json({ error: { message: "Client not found." } }, { status: 404 });
    const buffer = Buffer.from(await file.arrayBuffer());
    const pdf = /\.pdf$/i.test(file.name);
    if (pdf ? buffer.subarray(0, 5).toString() !== "%PDF-" : buffer.subarray(0, 2).toString() !== "PK") return Response.json({ error: { message: "Invalid document format." } }, { status: 400 });
    const type = pdf ? "application/pdf" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    const text = await extractText(buffer, type);
    if (text.trim().length < 50) return Response.json({ error: { message: "This document has no readable resume text. Upload a text-based PDF or DOCX." } }, { status: 422 });
    const parsed = await parseResumeWithAI(text, { signal: AbortSignal.timeout(25000) });
    const content = parseExportContent(parsed.content);
    if (!parsed.parsedByAI || !content.success || !hasResumeBody(content.data)) return Response.json({ error: { message: "Resume parsing is unavailable. Your selected file is preserved; please retry." } }, { status: 503 });
    const path = `${userId}/${crypto.randomUUID()}.${pdf ? "pdf" : "docx"}`;
    const { error: uploadError } = await admin.storage.from("resume-uploads").upload(path, buffer, { contentType: type });
    if (uploadError) throw uploadError;
    const { data: resume, error } = await admin.from("resumes").insert({ user_id: userId, title: file.name.replace(/\.(pdf|docx)$/i, ""), content: content.data, template_id: "classic", is_base: false, file_url: `resume-uploads/${path}` }).select("id,title,content,template_id").single();
    if (error) throw error;
    return Response.json({ success: true, data: { resume } }, { status: 201 });
  } catch (error) {
    console.error("Admin resume upload failed:", error);
    return Response.json({ error: { message: "Unable to parse and save this resume. Please try again." } }, { status: 503 });
  }
}
