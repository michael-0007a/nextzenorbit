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
import { useEffect, useState } from "react";
import SubscriptionCheckout from "@/components/SubscriptionCheckout";

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
  const [currency, setCurrency] = useState<"USD" | "INR">("USD");

  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz === "Asia/Kolkata" || tz === "Asia/Calcutta") {
        setCurrency("INR");
      }
    } catch (e) {
      // Ignore
    }
  }, []);

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
              className={isCurrent ? "border-primary ring-1 ring-primary/20" : ""}
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
                      {currency === "INR" ? (
                        <span className="text-2xl font-bold text-foreground">₹{plan.price_inr}</span>
                      ) : (
                        <span className="text-2xl font-bold text-foreground">${plan.price_usd}</span>
                      )}
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
                        <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                      ) : (
                        <X className="h-3.5 w-3.5 text-text-secondary shrink-0" />
                      )}
                      <span className={feature.included ? "text-foreground" : "text-text-secondary"}>
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
                    className="w-full h-10 rounded-full border border-border text-sm font-medium text-text-secondary bg-white/5 cursor-not-allowed"
                  >
                    Current Plan
                  </button>
                ) : planId === "free" ? (
                  <button
                    className="w-full h-10 rounded-full border border-border text-sm font-medium text-text-secondary bg-white/5 hover:bg-white/10 transition-colors duration-300"
                    onClick={() => {
                      alert("To downgrade to Free, please cancel your subscription. Your plan will revert to Free at the end of the billing cycle.");
                    }}
                  >
                    Downgrade
                  </button>
                ) : (
                  <SubscriptionCheckout
                    plan={planId as "pro" | "elite"}
                    className="w-full h-10 rounded-full bg-gradient-to-r from-primary to-primary-light text-white text-sm font-medium transition-transform duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Upgrade
                  </SubscriptionCheckout>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}


