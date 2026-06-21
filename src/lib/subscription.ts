/**
 * Subscription Utilities (Server-Side)
 *
 * Functions for checking subscription status, trial state, plan limits.
 * Used by dashboard layouts, API routes, and server components.
 */

import type { SubscriptionRow, PlanId } from "@/types/database";

// ── Plan configuration ──
export const PLANS = {
  free: {
    name: "Free",
    price_inr: 0,
    price_paise: 0,
    price_inr_annual: 0,
    price_usd: 0,
    price_usd_annual: 0,
    ai_tokens_per_month: 50_000,
    resumes: 2,
    applications_per_day: 5,
    cover_letter: false,
    priority_ai: false,
  },
  pro: {
    name: "Pro",
    price_inr: 1, // Keep test pricing
    price_paise: 100,
    price_inr_annual: 3_999,
    price_usd: 1, // Set to $1 for testing
    price_usd_annual: 79,
    ai_tokens_per_month: 500_000,
    resumes: Infinity,
    applications_per_day: 50,
    cover_letter: false,
    priority_ai: false,
  },
  elite: {
    name: "Elite",
    price_inr: 1, // Keep test pricing
    price_paise: 100,
    price_inr_annual: 7_999,
    price_usd: 1, // Set to $1 for testing
    price_usd_annual: 149,
    ai_tokens_per_month: 2_000_000,
    resumes: Infinity,
    applications_per_day: Infinity,
    cover_letter: true,
    priority_ai: true,
  },
} as const;

// ── Subscription checks ──

export function isTrialActive(sub: SubscriptionRow | null): boolean {
  if (!sub) return false;
  if (sub.status !== "trialing") return false;
  if (!sub.trial_ends_at) return false;
  return new Date(sub.trial_ends_at) > new Date();
}

export function isSubscriptionActive(sub: SubscriptionRow | null): boolean {
  if (!sub) return false;
  return (
    sub.status === "active" ||
    (sub.status === "trialing" && isTrialActive(sub))
  );
}

export function getTrialDaysRemaining(sub: SubscriptionRow | null): number {
  if (!sub || !sub.trial_ends_at) return 0;
  const remaining = new Date(sub.trial_ends_at).getTime() - Date.now();
  return Math.max(0, Math.ceil(remaining / (1000 * 60 * 60 * 24)));
}

export function getPlanLimits(planId: PlanId) {
  return PLANS[planId] || PLANS.free;
}

export function canCreateResume(
  sub: SubscriptionRow | null,
  currentCount: number
): boolean {
  const planId = isSubscriptionActive(sub) ? (sub?.plan_id ?? "free") : "free";
  const limits = getPlanLimits(planId);
  return currentCount < limits.resumes;
}

export function canTrackApplication(
  sub: SubscriptionRow | null,
  todayCount: number
): boolean {
  const planId = isSubscriptionActive(sub) ? (sub?.plan_id ?? "free") : "free";
  const limits = getPlanLimits(planId);
  return todayCount < limits.applications_per_day;
}

