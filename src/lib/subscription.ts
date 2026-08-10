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
    name: "Silver",
    price_inr: 13999, price_paise: 1399900, price_inr_annual: 167988,
    price_usd: 149, price_usd_annual: 1788,
    ai_tokens_per_month: Infinity,
    resumes: Infinity,
    applications_per_month: 300,
    cover_letter: true,
    priority_ai: true,
  },
  pro: {
    name: "Gold",
    price_inr: 18999, price_paise: 1899900, price_inr_annual: 227988,
    price_usd: 199, price_usd_annual: 2388,
    ai_tokens_per_month: Infinity,
    resumes: Infinity,
    applications_per_month: 400,
    cover_letter: true,
    priority_ai: true,
  },
  elite: {
    name: "Elite",
    price_inr: 23999, price_paise: 2399900, price_inr_annual: 287988,
    price_usd: 249, price_usd_annual: 2988,
    ai_tokens_per_month: Infinity,
    resumes: Infinity,
    applications_per_month: 500,
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
  monthCount: number
): boolean {
  const planId = isSubscriptionActive(sub) ? (sub?.plan_id ?? "free") : "free";
  const limits = getPlanLimits(planId);
  return monthCount < limits.applications_per_month;
}

