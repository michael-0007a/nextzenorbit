/**
 * TrialBanner — Shows trial countdown with upgrade CTA
 *
 * Premium design with gradient backgrounds and animated elements.
 */

import Link from "next/link";
import { Clock, ArrowRight, Sparkles, Crown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TrialBannerProps {
  daysRemaining: number;
  totalDays?: number;
  className?: string;
}

export function TrialBanner({
  daysRemaining,
  totalDays = 7,
  className,
}: TrialBannerProps) {
  const progress = Math.max(0, ((totalDays - daysRemaining) / totalDays) * 100);

  if (daysRemaining <= 0) {
    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl bg-gradient-to-r from-error/10 via-card to-card border border-error/20 p-5",
          className
        )}
      >
        <div className="absolute top-0 right-0 w-40 h-40 bg-error/10 rounded-full blur-3xl" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-error/10 border border-error/20">
              <Clock className="h-6 w-6 text-error" />
            </div>
            <div>
              <p className="text-base font-semibold text-foreground">
                Your trial has ended
              </p>
              <p className="text-sm text-text-secondary mt-0.5">
                Upgrade now to continue using all features
              </p>
            </div>
          </div>
          <Link
            href="/subscription"
            className="rounded-xl bg-gradient-to-r from-primary to-primary-light px-5 py-2.5 text-sm font-semibold text-white hover:shadow-lg hover:shadow-primary/25 transition-all flex items-center gap-2"
          >
            Upgrade Now <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/10 via-card to-secondary/5 border border-primary/20 p-5",
        className
      )}
    >
      {/* Decorative elements */}
      <div className="absolute top-0 right-20 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-10 w-24 h-24 bg-secondary/10 rounded-full blur-2xl" />

      <div className="relative flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-light shadow-lg shadow-primary/20">
            <Crown className="h-6 w-6 text-white" />
            <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-secondary">
              <Sparkles className="h-2.5 w-2.5 text-white" />
            </div>
          </div>
          <div>
            <p className="text-base font-semibold text-foreground">
              {daysRemaining} day{daysRemaining !== 1 ? "s" : ""} left in your
              free trial
            </p>
            <p className="text-sm text-text-secondary mt-0.5">
              Unlock unlimited AI features with Pro
            </p>
          </div>
        </div>
        <Link
          href="/subscription"
          className="hidden sm:flex rounded-xl border-2 border-primary text-primary px-4 py-2 text-sm font-semibold hover:bg-primary hover:text-white transition-all items-center gap-2"
        >
          View Plans <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Progress bar */}
      <div className="relative h-2.5 w-full rounded-full bg-border overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary via-primary-light to-secondary transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Day markers */}
      <div className="flex justify-between mt-2 text-xs text-stone">
        <span>Day 1</span>
        <span className="text-primary font-medium">{daysRemaining} days remaining</span>
        <span>Day {totalDays}</span>
      </div>
    </div>
  );
}
