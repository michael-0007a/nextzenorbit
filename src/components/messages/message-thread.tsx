"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { format, isSameDay, isToday, isYesterday } from "date-fns";
import { toast } from "sonner";
import { Headset, MessageSquare, Send, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { ClientMessageRow } from "@/types/database";

export interface MessageThreadProps {
  /** /api/messages for clients, /api/admin/users/[id]/messages for staff. */
  endpoint: string;
  viewer: "client" | "team";
  className?: string;
}

const dayLabel = (date: Date) => (isToday(date) ? "Today" : isYesterday(date) ? "Yesterday" : format(date, "EEE, MMM d"));

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

  const other = viewer === "client" ? { name: "Your Orbit team", icon: Headset } : { name: "Client", icon: UserRound };
  const OtherIcon = other.icon;

  return (
    <div className={cn("glass-card rounded-3xl flex flex-col overflow-hidden", className)}>
      <div className="flex items-center gap-3 border-b border-border px-5 py-4">
        <div className="relative flex h-10 w-10 items-center justify-center rounded-full border border-primary/30 bg-primary/10">
          <OtherIcon className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">{other.name}</p>
          <p className="text-xs text-text-secondary">{failed ? "Reconnecting…" : "New messages appear automatically"}</p>
        </div>
      </div>

      <div className="max-h-[55vh] min-h-64 overflow-y-auto space-y-3 px-5 py-5" aria-live="polite">
        {messages === null && !failed && (
          <div className="space-y-3">
            <Skeleton width="w-2/3" height="h-12" />
            <Skeleton width="w-1/2" height="h-12" className="ml-auto" />
          </div>
        )}
        {failed && messages === null && <p className="text-sm text-error">Messages are unavailable right now. Retrying…</p>}
        {messages?.length === 0 && (
          <div className="flex flex-col items-center py-10 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-white/5">
              <MessageSquare className="h-6 w-6 text-text-secondary" />
            </div>
            <p className="text-sm font-semibold text-foreground">{viewer === "client" ? "Start the conversation" : "No messages yet"}</p>
            <p className="mt-1 max-w-xs text-sm text-text-secondary">
              {viewer === "client" ? "Ask your Orbit team anything: job preferences, companies to skip, interview updates." : "Messages you send here reach this client and notify them."}
            </p>
          </div>
        )}
        {messages?.map((message, index) => {
          const mine = message.from_team === (viewer === "team");
          const date = new Date(message.created_at);
          const newDay = index === 0 || !isSameDay(date, new Date(messages[index - 1].created_at));
          return (
            <div key={message.id}>
              {newDay && (
                <div className="my-4 flex items-center gap-3 text-[11px] font-medium uppercase tracking-wider text-text-secondary">
                  <div className="h-px flex-1 bg-border" />{dayLabel(date)}<div className="h-px flex-1 bg-border" />
                </div>
              )}
              <div className={cn("flex", mine ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm",
                    mine ? "rounded-br-md bg-gradient-to-r from-primary to-primary-light text-white" : "rounded-bl-md border border-border bg-white/5 text-foreground",
                  )}
                >
                  <p className="whitespace-pre-wrap break-words">{message.body}</p>
                  <p className={cn("mt-1 text-[11px]", mine ? "text-white/75" : "text-text-secondary")}>
                    {viewer === "team" && !mine ? "Client · " : viewer === "client" && !mine ? "Orbit team · " : ""}{format(date, "h:mm a")}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottom} />
      </div>

      <form onSubmit={send} className="flex items-end gap-2 border-t border-border p-4">
        <Textarea
          aria-label="Message"
          className="flex-1"
          rows={2}
          maxLength={4000}
          value={draft}
          placeholder="Write a message… (Ctrl+Enter to send)"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => { if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) send(event); }}
        />
        <Button type="submit" isLoading={sending} disabled={!draft.trim()} aria-label="Send message" leftIcon={<Send className="h-4 w-4" />}>
          <span className="hidden sm:inline">Send</span>
        </Button>
      </form>
    </div>
  );
}
