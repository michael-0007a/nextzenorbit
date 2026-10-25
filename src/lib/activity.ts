import { createAdminClient } from "@/lib/supabase/admin";

export type ActivityItem = {
  kind: "applied" | "resume" | "cover_letter";
  title: string;
  detail: string | null;
  actor_name: string | null;
  happened_at: string;
};
export type ActivityWeek = { applied: number; resumes: number; cover_letters: number };

/** Work the team did for this client. userId must come from the server session, never the request. */
export async function getClientActivity(userId: string, now = new Date()) {
  const admin = createAdminClient();
  const since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const [items, week] = await Promise.all([
    admin.rpc("client_activity", { p_user_id: userId, p_limit: 20 }),
    admin.rpc("client_activity_summary", { p_user_id: userId, p_since: since }),
  ]);
  if (items.error || week.error) {
    // The dashboard still renders without the feed.
    console.error("Client activity unavailable:", items.error ?? week.error);
    return null;
  }
  return { items: items.data ?? [], week: week.data ?? { applied: 0, resumes: 0, cover_letters: 0 } };
}
