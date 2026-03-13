"use client";

/**
 * Plan Cards — Client Component
 *
 * Displays the three plans (Free, Pro, Elite) with pricing and features.
 */

import { Card, CardHeader, CardTitle, CardDescription, CardBody, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PLANS } from "@/lib/subscription";
import { Check, X } from "lucide-react";
import type { PlanId } from "@/types/database";

interface PlanCardsProps {
  currentPlanId: PlanId;
}

const planFeatures: Record<PlanId, { label: string; included: boolean }[]> = {
  free: [
    { label: "2 Resumes", included: true },
    { label: "5 Applications/day", included: true },
    { label: "50K AI Tokens/month", included: true },
    { label: "Basic resume parsing", included: true },
    { label: "Cover letter generator", included: false },
    { label: "Priority AI processing", included: false },
  ],
  pro: [
    { label: "Unlimited Resumes", included: true },
    { label: "50 Applications/day", included: true },
    { label: "500K AI Tokens/month", included: true },
    { label: "Advanced resume parsing", included: true },
    { label: "Cover letter generator", included: false },
    { label: "Priority AI processing", included: false },
  ],
  elite: [
    { label: "Unlimited Resumes", included: true },
    { label: "Unlimited Applications", included: true },
    { label: "2M AI Tokens/month", included: true },
    { label: "Advanced resume parsing", included: true },
    { label: "Cover letter generator", included: true },
    { label: "Priority AI processing", included: true },
  ],
};

export function PlanCards({ currentPlanId }: PlanCardsProps) {
  const plans: PlanId[] = ["free", "pro", "elite"];

  return (
    <div>
      <h2 className="text-lg font-bold text-foreground mb-4">Available Plans</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        {plans.map((planId) => {
          const plan = PLANS[planId];
          const isCurrent = planId === currentPlanId;
          const features = planFeatures[planId];

          return (
            <Card
              key={planId}
              className={isCurrent ? "border-mint ring-1 ring-mint/20" : ""}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{plan.name}</CardTitle>
                  {isCurrent && <Badge variant="success" size="sm">Current</Badge>}
                </div>
                <CardDescription>
                  {plan.price_inr === 0 ? (
                    <span className="text-2xl font-bold text-foreground">Free</span>
                  ) : (
                    <>
                      <span className="text-2xl font-bold text-foreground">₹{plan.price_inr}</span>
                      <span className="text-text-secondary">/month</span>
                    </>
                  )}
                </CardDescription>
              </CardHeader>
              <CardBody>
                <ul className="space-y-2.5">
                  {features.map((feature) => (
                    <li key={feature.label} className="flex items-center gap-2 text-sm">
                      {feature.included ? (
                        <Check className="h-3.5 w-3.5 text-mint shrink-0" />
                      ) : (
                        <X className="h-3.5 w-3.5 text-granite shrink-0" />
                      )}
                      <span className={feature.included ? "text-foreground" : "text-granite"}>
                        {feature.label}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardBody>
              <CardFooter>
                {isCurrent ? (
                  <button
                    disabled
                    className="w-full h-10 rounded-sm border border-granite text-sm font-medium text-granite cursor-not-allowed"
                  >
                    Current Plan
                  </button>
                ) : (
                  <button
                    className="w-full h-10 rounded-sm bg-midnight text-white text-sm font-medium hover:bg-midnight/90 dark:bg-mint dark:text-midnight dark:hover:bg-leaf transition-colors"
                    onClick={() => {
                      // Payment integration will be handled in a later phase
                    }}
                  >
                    {planId === "free" ? "Downgrade" : "Upgrade"}
                  </button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}


