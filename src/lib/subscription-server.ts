import { createAdminClient } from "@/lib/supabase/admin";
import { isSubscriptionActive, getPlanLimits } from "@/lib/subscription";
import type { SubscriptionRow } from "@/types/database";

/**
 * Checks if the user is allowed to generate content using AI
 * by evaluating their active subscription tier and current monthly usage.
 */
export async function checkAiTokenUsage(userId: string): Promise<{ allowed: boolean; error?: string }> {
  const admin = createAdminClient();
  
  // 1. Fetch user's subscription
  const { data: sub } = await admin
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  const typedSub = sub as SubscriptionRow | null;
  const planId = isSubscriptionActive(typedSub) ? (typedSub?.plan_id ?? "free") : "free";
  const limits = getPlanLimits(planId);

  // If monthly limit is Infinity, they can always use it
  if (limits.ai_tokens_per_month === Infinity) {
    return { allowed: true };
  }

  // 2. Fetch current billing period usage
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const { data: usage } = await admin
    .from("ai_usage")
    .select("tokens_used")
    .eq("user_id", userId)
    .gte("billing_period_start", periodStart.toISOString())
    .lte("billing_period_end", periodEnd.toISOString())
    .maybeSingle();

  const tokensUsed = usage?.tokens_used ?? 0;
  if (tokensUsed >= limits.ai_tokens_per_month) {
    return { 
      allowed: false, 
      error: `Monthly AI token limit of ${limits.ai_tokens_per_month.toLocaleString()} tokens reached. Please upgrade your plan to continue using AI features.`
    };
  }

  return { allowed: true };
}
