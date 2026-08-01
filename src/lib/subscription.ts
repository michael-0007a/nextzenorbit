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
    name: "Plan 1",
    price_inr: 10999, price_paise: 1099900, price_inr_annual: 131988,
    price_usd: 130, price_usd_annual: 1560,
    price_eur: 120, price_eur_annual: 1440,
    price_gbp: 100, price_gbp_annual: 1200,
    price_cad: 180, price_cad_annual: 2160,
    price_aud: 200, price_aud_annual: 2400,
    ai_tokens_per_month: Infinity,
    resumes: Infinity,
    applications_per_month: 175,
    cover_letter: true,
    priority_ai: true,
  },
  pro: {
    name: "Plan 2",
    price_inr: 16999, price_paise: 1699900, price_inr_annual: 203988,
    price_usd: 200, price_usd_annual: 2400,
    price_eur: 190, price_eur_annual: 2280,
    price_gbp: 160, price_gbp_annual: 1920,
    price_cad: 280, price_cad_annual: 3360,
    price_aud: 310, price_aud_annual: 3720,
    ai_tokens_per_month: Infinity,
    resumes: Infinity,
    applications_per_month: 350,
    cover_letter: true,
    priority_ai: true,
  },
  elite: {
    name: "Plan 3",
    price_inr: 22999, price_paise: 2299900, price_inr_annual: 275988,
    price_usd: 270, price_usd_annual: 3240,
    price_eur: 260, price_eur_annual: 3120,
    price_gbp: 220, price_gbp_annual: 2640,
    price_cad: 380, price_cad_annual: 4560,
    price_aud: 420, price_aud_annual: 5040,
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

