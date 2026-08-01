/**
 * useSubscription — Client-side subscription state hook
 *
 * Fetches the current user's subscription via RLS-protected read.
 * Exposes plan status, trial info, and plan checks.
 */

"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
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
  activePlanId: PlanId;
  refetch: () => Promise<void>;
}

export function useSubscription(): UseSubscriptionReturn {
  const [subscription, setSubscription] = useState<SubscriptionRow | null>(null);
  const [loading, setLoading] = useState(true);
  const hasFetched = useRef(false);

  const fetchSubscription = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    console.log("[useSubscription] auth user id:", user?.id);

    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .maybeSingle();

    console.log("[useSubscription] data:", data);
    console.log("[useSubscription] error:", error);
    if (data) {
      console.log("[useSubscription] status:", data.status, "plan_id:", data.plan_id);
    }

    setSubscription(data as SubscriptionRow | null);
    setLoading(false);
  }, []);

  useEffect(() => {
    // Only fetch once on mount
    if (!hasFetched.current) {
      hasFetched.current = true;
      // This is a legitimate data fetching pattern on mount
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchSubscription();
    }
  }, [fetchSubscription]);

  const isActive = isSubscriptionActive(subscription);

  return {
    subscription,
    loading,
    isTrialing: isTrialActive(subscription),
    isActive,
    daysRemaining: getTrialDaysRemaining(subscription),
    isPro: isActive && subscription?.plan_id === "pro",
    isElite: isActive && subscription?.plan_id === "elite",
    activePlanId: isActive ? (subscription?.plan_id || "free") : "free",
    refetch: fetchSubscription,
  };
}

