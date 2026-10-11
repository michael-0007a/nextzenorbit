"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ChevronRight, Inbox, MessageSquare } from "lucide-react";
import { SkeletonList } from "@/components/ui/skeleton";

type Thread = { client_id: string; name: string; unread: number; latest_at: string };

export default function AdminMessagesPage() {
  const [threads, setThreads] = useState<Thread[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/messages", { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.error?.message || "Unable to load messages.");
        setThreads(result.data);
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Messages</h1>
        <p className="text-sm text-text-secondary">Clients waiting for a reply. Open a client to read and answer the full thread.</p>
      </div>
      <div className="glass-card rounded-3xl overflow-hidden divide-y divide-border/60">
        {error && <p className="p-6 text-sm text-error">{error}</p>}
        {!error && threads === null && <div className="p-6"><SkeletonList count={3} /></div>}
        {threads?.length === 0 && (
          <div className="flex flex-col items-center p-10 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-white/5"><Inbox className="h-6 w-6 text-text-secondary" /></div>
            <p className="text-sm font-semibold text-foreground">All caught up</p>
            <p className="mt-1 text-sm text-text-secondary">No client is waiting for a reply.</p>
          </div>
        )}
        {threads?.map((thread) => (
          <Link key={thread.client_id} href={`/admin/users/${thread.client_id}#messages`} className="group flex items-center gap-4 p-4 hover:bg-white/5 transition-colors">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><MessageSquare className="h-4 w-4" /></div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">{thread.name}</p>
              <p className="text-xs text-text-secondary">{formatDistanceToNow(new Date(thread.latest_at), { addSuffix: true })}</p>
            </div>
            <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-bold text-white">{thread.unread} new</span>
            <ChevronRight className="h-4 w-4 text-text-secondary transition-transform group-hover:translate-x-0.5" />
          </Link>
        ))}
      </div>
    </div>
  );
}
