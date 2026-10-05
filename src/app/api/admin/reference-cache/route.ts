import { revalidateTag } from "next/cache";
import { requireSuperAdmin, isAuthError } from "@/lib/admin/guards";
export async function POST() {
  const auth = await requireSuperAdmin();
  if (isAuthError(auth)) return auth;
  revalidateTag("career-reference", { expire: 0 });
  return Response.json({ success: true });
}
