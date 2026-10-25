import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ClientMessageRow } from "@/types/database";

export const messageBodySchema = z.object({ body: z.string().trim().min(1, "Write a message.").max(4000, "Messages are limited to 4,000 characters.") });

const THREAD_LIMIT = 200;

/** Latest messages, oldest first. Marks the other side's messages as read for this viewer. */
export async function readThread(clientId: string, viewer: "client" | "team"): Promise<ClientMessageRow[]> {
  const admin = createAdminClient();
  const { data, error } = await admin.from("client_messages").select("*").eq("client_id", clientId)
    .order("created_at", { ascending: false }).limit(THREAD_LIMIT);
  if (error) throw new Error("Unable to load messages.");
  const unread = (data ?? []).filter((m) => !m.read_at && m.from_team === (viewer === "client")).map((m) => m.id);
  if (unread.length) {
    const { error: readError } = await admin.from("client_messages").update({ read_at: new Date().toISOString() }).in("id", unread);
    if (readError) console.error("Unable to mark messages read:", readError.code);
  }
  return (data ?? []).reverse();
}

export async function sendMessage(clientId: string, senderId: string, fromTeam: boolean, body: string): Promise<ClientMessageRow> {
  const admin = createAdminClient();
  const { data, error } = await admin.from("client_messages")
    .insert({ client_id: clientId, sender_id: senderId, from_team: fromTeam, body }).select("*").single();
  if (error || !data) throw new Error("Unable to send message.");
  if (fromTeam) {
    // Surfaces in the client's existing notification bell; failure must not lose the message.
    const { error: notifyError } = await admin.from("notifications").insert({
      user_id: clientId, type: "admin_message", title: "New message from your Orbit team",
      message: body.slice(0, 140), metadata: { message_id: data.id },
    });
    if (notifyError) console.error("Message notification failed:", notifyError.code);
  }
  return data;
}

/** Threads with client messages the team has not read yet. clientIds=null means every client. */
export async function unreadThreads(clientIds: string[] | null) {
  if (clientIds && clientIds.length === 0) return [];
  const admin = createAdminClient();
  let query = admin.from("client_messages").select("client_id, created_at").eq("from_team", false).is("read_at", null)
    .order("created_at", { ascending: false }).limit(1000);
  if (clientIds) query = query.in("client_id", clientIds);
  const { data, error } = await query;
  if (error) throw new Error("Unable to load unread messages.");
  const threads = new Map<string, { client_id: string; unread: number; latest_at: string }>();
  for (const row of data ?? []) {
    const thread = threads.get(row.client_id) ?? { client_id: row.client_id, unread: 0, latest_at: row.created_at };
    thread.unread++;
    threads.set(row.client_id, thread);
  }
  return [...threads.values()];
}
