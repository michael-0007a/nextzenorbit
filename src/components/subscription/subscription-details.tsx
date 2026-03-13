/**
 * Subscription Details — Server Component
 *
 * Shows current plan status, trial info, and usage meters.
 */

import { Card, CardHeader, CardTitle, CardDescription, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { isTrialActive, getTrialDaysRemaining, getPlanLimits, PLANS } from "@/lib/subscription";
import { CreditCard, Zap, FileText, Clock } from "lucide-react";
import type { SubscriptionRow, AiUsageRow } from "@/types/database";

interface SubscriptionDetailsProps {
  subscription: SubscriptionRow | null;
  aiUsage: AiUsageRow | null;
  resumeCount: number;
}

function StatusBadge({ status }: { status: string }) {
  const variant =
    status === "active" || status === "trialing"
      ? "success"
      : status === "past_due"
      ? "warning"
      : status === "cancelled"
      ? "error"
      : "default";

  return <Badge variant={variant}>{status}</Badge>;
}

function UsageMeter({ label, used, limit, icon: Icon }: { label: string; used: number; limit: number; icon: React.ElementType }) {
  const percentage = limit === Infinity ? 0 : Math.min(100, (used / limit) * 100);
  const displayLimit = limit === Infinity ? "Unlimited" : limit.toLocaleString();

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-granite" />
          <span className="text-sm font-medium text-foreground">{label}</span>
        </div>
        <span className="text-xs text-text-secondary">
          {used.toLocaleString()} / {displayLimit}
        </span>
      </div>
      <div className="h-1.5 w-full rounded-sm bg-muted overflow-hidden">
        <div
          className="h-full rounded-sm bg-mint transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export function SubscriptionDetails({ subscription, aiUsage, resumeCount }: SubscriptionDetailsProps) {
  const plan = subscription ? getPlanLimits(subscription.plan_id) : PLANS.free;
  const planName = subscription ? PLANS[subscription.plan_id]?.name ?? "Free" : "Free";
  const trialing = isTrialActive(subscription);
  const daysLeft = getTrialDaysRemaining(subscription);
  const tokensUsed = aiUsage?.tokens_used ?? 0;

  return (
    <div className="space-y-6">
      {/* Current Plan Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-mint" />
            Current Plan
          </CardTitle>
          <CardDescription>Your subscription details and billing information.</CardDescription>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xl font-bold text-foreground">{planName}</p>
              {subscription && (
                <p className="text-sm text-text-secondary mt-0.5">
                  {plan.price_inr === 0 ? "Free" : `₹${plan.price_inr}/month`}
                </p>
              )}
            </div>
            <StatusBadge status={subscription?.status ?? "trialing"} />
          </div>

          {trialing && (
            <div className="flex items-center gap-2 rounded-sm border border-mint-border bg-mint-muted p-3">
              <Clock className="h-4 w-4 text-mint" />
              <p className="text-sm text-foreground">
                <span className="font-medium">{daysLeft} days</span> remaining in your free trial.
              </p>
            </div>
          )}

          {subscription?.current_period_end && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-secondary">Current period ends</span>
              <span className="text-foreground font-medium">
                {new Date(subscription.current_period_end).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
          )}

          {subscription?.cancel_at_period_end && (
            <div className="flex items-center gap-2 rounded-sm border border-error/30 bg-error/5 p-3">
              <p className="text-sm text-error">
                Your subscription will be cancelled at the end of the current billing period.
              </p>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Usage Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-leaf" />
            Usage
          </CardTitle>
          <CardDescription>Resource usage for the current billing period.</CardDescription>
        </CardHeader>
        <CardBody className="space-y-5">
          <UsageMeter
            label="AI Tokens"
            used={tokensUsed}
            limit={plan.ai_tokens_per_month}
            icon={Zap}
          />
          <UsageMeter
            label="Resumes"
            used={resumeCount}
            limit={plan.resumes}
            icon={FileText}
          />
        </CardBody>
      </Card>
    </div>
  );
}

