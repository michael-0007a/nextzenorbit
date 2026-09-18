import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getApplicationAccess } from "@/lib/onboarding";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const { data: { user } } = await (await createClient()).auth.getUser();
  if (!user) return Response.json({ error: { message: "Please sign in." } }, { status: 401 });
  const limited = await rateLimit("onboarding-upload", user.id, 10, 900);
  if (limited) return limited;
  if (await getApplicationAccess(user) !== "draft") return Response.json({ error: { message: "This account cannot upload another application." } }, { status: 409 });
  const body = await request.json().catch(() => null);
  const ext = typeof body?.name === "string" ? body.name.split(".").pop()?.toLowerCase() : "";
  if (!["pdf", "doc", "docx"].includes(ext || "") || !Number.isInteger(body?.size) || body.size <= 0 || body.size > 10 * 1024 * 1024) return Response.json({ error: { message: "Choose a PDF, DOC or DOCX file up to 10 MB." } }, { status: 400 });
  const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
  const { data, error } = await createAdminClient().storage.from("signup-resumes").createSignedUploadUrl(path);
  if (error || !data) return Response.json({ error: { message: "Unable to prepare upload. Please retry." } }, { status: 503 });
  return Response.json({ path, token: data.token }, { headers: { "Cache-Control": "no-store" } });
}
