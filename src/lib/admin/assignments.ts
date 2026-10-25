import { createAdminClient } from "@/lib/supabase/admin";

export async function assignedClientIds(adminId: string): Promise<string[]> {
  const { data, error } = await createAdminClient().from("client_admin_assignments").select("user_id").eq("admin_id", adminId);
  if (error) throw new Error("Unable to load client assignments.");
  return (data || []).map(row => row.user_id);
}
// Recruiter-level admins may only touch assigned clients; supervisors and super admins pass. Returns a 403 Response or null.
export async function denyUnassignedClient(auth: { userId: string; role: string }, clientId: string): Promise<Response | null> {
  if (auth.role === "supervisor_admin" || auth.role === "super_admin" || await isAssignedToClient(auth.userId, clientId)) return null;
  return Response.json({ error: { message: "This client is not assigned to you." } }, { status: 403 });
}
export async function isAssignedToClient(adminId: string, clientId: string): Promise<boolean> {
  const { data, error } = await createAdminClient().from("client_admin_assignments").select("user_id").eq("admin_id", adminId).eq("user_id", clientId).maybeSingle();
  if (error) throw new Error("Unable to verify client assignment.");
  return !!data;
}
