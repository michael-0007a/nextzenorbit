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
    price_inr: 0, price_paise: 0, price_inr_annual: 0,
    price_usd: 0, price_usd_annual: 0,
    price_eur: 0, price_eur_annual: 0,
    price_gbp: 0, price_gbp_annual: 0,
    price_cad: 0, price_cad_annual: 0,
    price_aud: 0, price_aud_annual: 0,
    ai_tokens_per_month: Infinity,
    resumes: Infinity,
    applications_per_day: Infinity,
    cover_letter: true,
    priority_ai: true,
  },
  pro: {
    name: "Pro",
    price_inr: 499, price_paise: 49_900, price_inr_annual: 3_999,
    price_usd: 9, price_usd_annual: 79,
    price_eur: 9, price_eur_annual: 79,
    price_gbp: 8, price_gbp_annual: 69,
    price_cad: 12, price_cad_annual: 99,
    price_aud: 14, price_aud_annual: 119,
    ai_tokens_per_month: Infinity,
    resumes: Infinity,
    applications_per_day: Infinity,
    cover_letter: true,
    priority_ai: true,
  },
  elite: {
    name: "Elite",
    price_inr: 999, price_paise: 99_900, price_inr_annual: 7_999,
    price_usd: 19, price_usd_annual: 149,
    price_eur: 19, price_eur_annual: 149,
    price_gbp: 15, price_gbp_annual: 119,
    price_cad: 25, price_cad_annual: 199,
    price_aud: 29, price_aud_annual: 229,
    ai_tokens_per_month: Infinity,
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

