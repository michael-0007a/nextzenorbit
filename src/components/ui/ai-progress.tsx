"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { estimateProgress, type AiPlan, type AiStage } from "@/lib/ai/progress";

/**
 * Progress for AI work. Real server stages (when the route reports them) move the bar to the right
 * step; time within a step is estimated from measured durations. Never shows 100% before the work ends.
 */
export function AiProgress({ plan, stage, className }: { plan: AiPlan; stage?: AiStage | null; className?: string }) {
  const [now, setNow] = useState(() => Date.now());
  // When the current step started, and the first reported step (earlier steps were skipped, e.g. already parsed).
  const [track, setTrack] = useState<{ stage?: AiStage | null; at: number; first: number | null }>(() => ({ stage, at: now, first: null }));
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 250); return () => clearInterval(timer); }, []);
  const reported = stage ? plan.findIndex(step => step.stage === stage) : -1;
  // A new stage restarts the step clock (adjusting state during render; accurate to the 250ms tick).
  if (track.stage !== stage) setTrack({ stage, at: now, first: track.first ?? (reported >= 0 ? reported : null) });

  const first = track.first ?? (reported >= 0 ? reported : 0);
  // A stage outside the plan (e.g. page fitting when no limit was expected) counts as the last step.
  const index = stage && reported < 0 ? plan.length - 1 : reported;
  const { steps, active, current, percent, secondsLeft: left, slow } = estimateProgress(plan, index, Math.min(first, plan.length - 1), Math.max(0, now - track.at) / 1000);

  return <div className={cn("w-full space-y-2", className)} aria-live="polite">
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <span className="font-medium text-foreground">{current.label}…</span>
      <span className="shrink-0 text-xs text-text-secondary">
        {steps.length > 1 && `Step ${active + 1} of ${steps.length} · `}
        {slow ? "Taking longer than usual, still working" : left > 0 ? `about ${left}s left` : "almost done"}
      </span>
    </div>
    <div role="progressbar" aria-label={current.label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}
      className="h-2 w-full overflow-hidden rounded-full bg-muted">
      <div className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out" style={{ width: `${percent}%` }} />
    </div>
  </div>;
}
