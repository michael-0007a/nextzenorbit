/**
 * useSubscription — Client-side subscription state hook
 *
 * Fetches the current user's subscription via RLS-protected read.
 * Exposes plan status, trial info, and plan checks.
 */

"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useSubscriptionState } from "@/components/providers/subscription-provider";
import type { SubscriptionRow, PlanId } from "@/types/database";
import {
  isTrialActive,
  isSubscriptionActive,
  getTrialDaysRemaining,
} from "@/lib/subscription";

interface UseSubscriptionReturn {
  subscription: SubscriptionRow | null;
  loading: boolean;
  isTrialing: boolean;
  isActive: boolean;
  daysRemaining: number;
  isPro: boolean;
  isElite: boolean;
  activePlanId: PlanId | null;
  refetch: () => Promise<void>;
}

export function useSubscription(): UseSubscriptionReturn {
  const shared = useSubscriptionState();
  const [subscription, setSubscription] = useState<SubscriptionRow | null>(null);
  const [loading, setLoading] = useState(true);
  const hasFetched = useRef(false);

  const fetchSubscription = useCallback(async () => {
    try {
      const res = await fetch("/api/subscription");
      if (!res.ok) {
        setSubscription(null);
        setLoading(false);
        return;
      }
      
      const json = await res.json();
      if (json.success && json.data) {
        setSubscription(json.data as SubscriptionRow);
      } else {
        setSubscription(null);
      }
    } catch (error) {
      console.error("[useSubscription] fetch error:", error);
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Only fetch once on mount
    if (!shared && !hasFetched.current) {
      hasFetched.current = true;
      // This is a legitimate data fetching pattern on mount
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchSubscription();
    }
  }, [fetchSubscription, shared]);

  const current = shared?.subscription ?? (shared ? null : subscription);
  const isActive = isSubscriptionActive(current);

  return {
    subscription: current,
    loading: shared?.loading ?? loading,
    isTrialing: isTrialActive(current),
    isActive,
    daysRemaining: getTrialDaysRemaining(current),
    isPro: isActive && current?.plan_id === "pro",
    isElite: isActive && current?.plan_id === "elite",
    activePlanId: isActive ? (current?.plan_id ?? null) : null,
    refetch: shared?.refetch ?? fetchSubscription,
  };
}

