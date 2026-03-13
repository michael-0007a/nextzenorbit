/**
 * useSubscription — Client-side subscription state hook
 *
 * Fetches the current user's subscription via RLS-protected read.
 * Exposes plan status, trial info, and plan checks.
 */

"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { SubscriptionRow } from "@/types/database";
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
  refetch: () => Promise<void>;
}

export function useSubscription(): UseSubscriptionReturn {
  const [subscription, setSubscription] = useState<SubscriptionRow | null>(null);
  const [loading, setLoading] = useState(true);
  const hasFetched = useRef(false);

  const fetchSubscription = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("subscriptions")
      .select("*")
      .single();

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

  return {
    subscription,
    loading,
    isTrialing: isTrialActive(subscription),
    isActive: isSubscriptionActive(subscription),
    daysRemaining: getTrialDaysRemaining(subscription),
    isPro: subscription?.plan_id === "pro",
    isElite: subscription?.plan_id === "elite",
    refetch: fetchSubscription,
  };
}

