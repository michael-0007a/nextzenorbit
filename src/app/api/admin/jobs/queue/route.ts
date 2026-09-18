import { requireAdmin, isAuthError } from "@/lib/admin/guards";
import { queueSearchJobs } from "@/lib/jobs/queue";
export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (isAuthError(auth)) return auth;
  return queueSearchJobs(request, auth, true);
}
