"use client";

/**
 * Plan Cards — Client Component
 *
 * Displays the three plans (Silver, Gold, Elite) with USD pricing.
 * Shows payment method selector (USD/INR) when user clicks Subscribe.
 */

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardBody, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PLANS } from "@/lib/subscription";
import { Check, X } from "lucide-react";
import type { PlanId } from "@/types/database";
import { formatPrice } from "@/hooks/use-currency";
import SubscriptionCheckout from "@/components/SubscriptionCheckout";
import { PaymentMethodSelector, type PaymentMethod } from "@/components/subscription/payment-method-selector";

interface PlanCardsProps {
  currentPlanId: PlanId | null;
}

const planFeatures: Record<PlanId, { label: string; included: boolean }[]> = {
  free: [
    { label: "Unlimited Resumes", included: true },
    { label: "300 Applications/month", included: true },
    { label: "Assigned recruiter support", included: true },
    { label: "Advanced resume parsing", included: true },
    { label: "Cover letter generator", included: false },
    { label: "Priority AI processing", included: false },
  ],
  pro: [
    { label: "Unlimited Resumes", included: true },
    { label: "400 Applications/month", included: true },
    { label: "Assigned recruiter support", included: true },
    { label: "Advanced resume parsing", included: true },
    { label: "Cover letter generator", included: true },
    { label: "Priority AI processing", included: false },
  ],
  elite: [
    { label: "Unlimited Resumes", included: true },
    { label: "500 Applications/month", included: true },
    { label: "Assigned recruiter support", included: true },
    { label: "Advanced resume parsing", included: true },
    { label: "Cover letter generator", included: true },
    { label: "Priority AI processing", included: true },
  ],
};

export function PlanCards({ currentPlanId }: PlanCardsProps) {
  const plans: PlanId[] = ["free", "pro", "elite"];
  const [selectedPlan, setSelectedPlan] = useState<PlanId | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);

  const handleSelectPlan = (planId: PlanId) => {
    setSelectedPlan(planId);
    setPaymentMethod(null);
  };

  const handlePaymentMethodSelect = (method: PaymentMethod) => {
    setPaymentMethod(method);
  };

  return (
    <div>
      <h2 className="text-lg font-bold text-foreground mb-4">Available Plans</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        {plans.map((planId) => {
          const plan = PLANS[planId];
          const isCurrent = planId === currentPlanId;
          const features = planFeatures[planId];
          const showCheckout = selectedPlan === planId && paymentMethod;

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
                  <span className="text-2xl font-bold text-foreground">
                    {formatPrice(plan.price_usd, "USD")}
                  </span>
                  <span className="text-text-secondary">/month</span>
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
                ) : showCheckout ? (
                  <SubscriptionCheckout
                    plan={planId as "free" | "pro" | "elite"}
                    currency={paymentMethod === "inr" ? "INR" : "USD"}
                    paymentMethod={paymentMethod!}
                    className="w-full h-10 rounded-full bg-gradient-to-r from-primary to-primary-light text-white text-sm font-medium transition-transform duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Pay with {paymentMethod === "inr" ? "INR" : "USD"}
                  </SubscriptionCheckout>
                ) : (
                  <button
                    onClick={() => handleSelectPlan(planId)}
                    className="w-full h-10 rounded-full bg-gradient-to-r from-primary to-primary-light text-white text-sm font-medium transition-transform duration-300 hover:-translate-y-0.5"
                  >
                    Upgrade
                  </button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Payment Method Selector Modal */}
      {selectedPlan && !paymentMethod && (
        <PaymentMethodSelector
          plan={selectedPlan}
          open={true}
          onClose={() => setSelectedPlan(null)}
          onSelect={handlePaymentMethodSelect}
        />
      )}
    </div>
  );
}


