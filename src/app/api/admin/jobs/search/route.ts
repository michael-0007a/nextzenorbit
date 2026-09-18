import { requireAdmin, isAuthError } from "@/lib/admin/guards";
import { searchJobs } from "@/lib/jobs/search";
import { adzunaSearchSchema } from "@/lib/jobs/adzuna";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (isAuthError(auth)) return auth;
  const limited = await rateLimit("job-search", auth.userId, 60, 60);
  if (limited) return limited;
  const parsed = adzunaSearchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: { message: "Invalid search parameters." } }, { status: 400 });
  try {
    return Response.json({ success: true, data: await searchJobs(parsed.data) });
  } catch {
    return Response.json({ error: { message: "Job search is temporarily unavailable. Please retry." } }, { status: 503 });
  }
}
