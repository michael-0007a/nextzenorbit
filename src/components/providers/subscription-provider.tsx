"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { SubscriptionRow } from "@/types/database";

type State = { subscription: SubscriptionRow | null; loading: boolean; refetch: () => Promise<void> };
const Context = createContext<State | null>(null);
export const useSubscriptionState = () => useContext(Context);

export function SubscriptionProvider({ userId, initialSubscription, children }: {
  userId: string; initialSubscription: SubscriptionRow | null; children: React.ReactNode;
}) {
  const [subscription, setSubscription] = useState(initialSubscription);
  const pending = useRef<Promise<void> | null>(null);
  const generation = useRef(0);
  const refetch = useCallback(() => {
    if (pending.current) return pending.current;
    const current = generation.current;
    pending.current = fetch("/api/subscription", { cache: "no-store" }).then(async response => {
      const result = await response.json();
      if (current === generation.current) setSubscription(response.ok && result.success ? result.data : null);
    }).catch(() => { /* retain the last display value during transient failures */ })
      .finally(() => { pending.current = null; });
    return pending.current;
  }, []);
  useEffect(() => { setSubscription(initialSubscription); }, [initialSubscription]);
  useEffect(() => {
    const { data: { subscription: listener } } = createClient().auth.onAuthStateChange((_event, session) => {
      if (session?.user.id !== userId) { generation.current++; setSubscription(null); }
    });
    const refresh = () => { void refetch(); };
    window.addEventListener("orbit:subscription-changed", refresh);
    return () => { generation.current++; listener.unsubscribe(); window.removeEventListener("orbit:subscription-changed", refresh); };
  }, [userId, refetch]);
  return <Context.Provider value={{ subscription, loading: false, refetch }}>{children}</Context.Provider>;
}
