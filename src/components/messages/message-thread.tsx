"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { ClientMessageRow } from "@/types/database";

export interface MessageThreadProps {
  /** /api/messages for clients, /api/admin/users/[id]/messages for staff. */
  endpoint: string;
  viewer: "client" | "team";
  className?: string;
}

// shortcut: polls every 10s while open; move to Supabase Realtime if message volume grows.
const POLL_MS = 10_000;

export function MessageThread({ endpoint, viewer, className }: MessageThreadProps) {
  const [messages, setMessages] = useState<ClientMessageRow[] | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const response = await fetch(endpoint, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error?.message);
      setMessages(result.data);
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, [endpoint]);

  useEffect(() => {
    load();
    const timer = setInterval(() => { if (document.visibilityState === "visible") load(); }, POLL_MS);
    return () => clearInterval(timer);
  }, [load]);

  useEffect(() => { bottom.current?.scrollIntoView({ block: "nearest" }); }, [messages?.length]);

  const send = async (event: React.FormEvent) => {
    event.preventDefault();
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body }) });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error?.message || "Unable to send message.");
      setMessages((current) => [...(current ?? []), result.data]);
      setDraft("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to send message.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={cn("glass-card rounded-2xl p-4 sm:p-6 flex flex-col gap-4", className)}>
      <div className="max-h-[55vh] min-h-48 overflow-y-auto space-y-3 pr-1" aria-live="polite">
        {messages === null && !failed && <p className="text-sm text-text-secondary">Loading messages…</p>}
        {failed && messages === null && <p className="text-sm text-error">Messages are unavailable right now. Retrying…</p>}
        {messages?.length === 0 && (
          <p className="text-sm text-text-secondary">
            {viewer === "client" ? "Ask your Orbit team anything: job preferences, companies to skip, interview updates." : "No messages with this client yet."}
          </p>
        )}
        {messages?.map((message) => {
          const mine = message.from_team === (viewer === "team");
          return (
            <div key={message.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
              <div className={cn("max-w-[85%] rounded-2xl px-4 py-2.5 text-sm", mine ? "bg-primary/15 text-foreground" : "bg-white/5 border border-border text-foreground")}>
                <p className="whitespace-pre-wrap break-words">{message.body}</p>
                <p className="mt-1 text-[11px] text-text-secondary">
                  {viewer === "client" ? (mine ? "You" : "Orbit team") : mine ? "Team" : "Client"} ·{format(new Date(message.created_at), "MMM d, h:mm a")}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottom} />
      </div>
      <form onSubmit={send} className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <Textarea
          aria-label="Message"
          className="flex-1"
          rows={2}
          maxLength={4000}
          value={draft}
          placeholder="Write a message…"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => { if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) send(event); }}
        />
        <Button type="submit" isLoading={sending} disabled={!draft.trim()}>
          <Send className="h-4 w-4" /> Send
        </Button>
      </form>
    </div>
  );
}
