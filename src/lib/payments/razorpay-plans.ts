/**
 * Razorpay Plan ID Mapping
 *
 * Maps app-level plan names ("pro", "elite") to Razorpay plan IDs.
 * Plan IDs are created in the Razorpay dashboard and are immutable.
 *
 * PRO:   ₹499/month — plan_T0H779JLxVRvvq
 * ELITE: ₹999/month — plan_T0H7kejuxrlmuV
 */

export const RAZORPAY_PLAN_IDS = {
  pro: "plan_T0H779JLxVRvvq",
  elite: "plan_T0H7kejuxrlmuV",
} as const;

export type RazorpayPlanName = keyof typeof RAZORPAY_PLAN_IDS;

/**
 * Resolves an app plan name to its Razorpay plan ID.
 * Throws if the plan name is invalid.
 */
export function getRazorpayPlanId(plan: string): string {
  const planId = RAZORPAY_PLAN_IDS[plan as RazorpayPlanName];

  if (!planId) {
    throw new Error(
      `Invalid plan "${plan}". Valid plans: ${Object.keys(RAZORPAY_PLAN_IDS).join(", ")}`
    );
  }

  return planId;
}

/**
 * Reverse lookup: Razorpay plan ID → app plan name.
 * Returns undefined if not found.
 */
export function getPlanNameFromRazorpayId(
  razorpayPlanId: string
): RazorpayPlanName | undefined {
  const entries = Object.entries(RAZORPAY_PLAN_IDS) as [RazorpayPlanName, string][];
  const match = entries.find(([, id]) => id === razorpayPlanId);
  return match?.[0];
}
