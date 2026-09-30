import { createAdminClient } from "@/lib/supabase/admin";

export async function assignedClientIds(adminId: string): Promise<string[]> {
  const { data, error } = await createAdminClient().from("client_admin_assignments").select("user_id").eq("admin_id", adminId);
  if (error) throw new Error("Unable to load client assignments.");
  return (data || []).map(row => row.user_id);
}
export async function isAssignedToClient(adminId: string, clientId: string): Promise<boolean> {
  const { data, error } = await createAdminClient().from("client_admin_assignments").select("user_id").eq("admin_id", adminId).eq("user_id", clientId).maybeSingle();
  if (error) throw new Error("Unable to verify client assignment.");
  return !!data;
}
