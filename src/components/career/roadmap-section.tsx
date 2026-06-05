"use client";

import { useState } from "react";
import { ChevronDown, CheckCircle2, Circle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import ReactMarkdown from "react-markdown";
import { SectionHeader } from "@/components/career/section-header";
import type { RoadmapWithSteps } from "@/types/domain";

const levelConfig = {
  beginner: { label: "Beginner", color: "text-emerald-400", bg: "bg-emerald-500/15 border-emerald-500/30", dot: "bg-emerald-500", line: "from-emerald-500/40" },
  intermediate: { label: "Intermediate", color: "text-amber-400", bg: "bg-amber-500/15 border-amber-500/30", dot: "bg-amber-500", line: "from-amber-500/40" },
  advanced: { label: "Advanced", color: "text-rose-400", bg: "bg-rose-500/15 border-rose-500/30", dot: "bg-rose-500", line: "from-rose-500/40" },
} as const;

export interface RoadmapSectionProps {
  roadmap: RoadmapWithSteps | null;
}

export function RoadmapSection({ roadmap }: RoadmapSectionProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (!roadmap) {
    return (
      <section id="roadmap" className="space-y-6">
        <SectionHeader title="Roadmap" description="Structured learning path for this career track." />
        <div className="rounded-3xl border border-dashed border-border/70 bg-white/5 p-10 text-center">
          <p className="text-sm text-text-secondary">Roadmap content is coming soon.</p>
        </div>
      </section>
    );
  }

  // Sort steps by order_index
  const steps = [...roadmap.steps].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));

  return (
    <section id="roadmap" className="space-y-8">
      <SectionHeader
        title="Roadmap"
        description={`${steps.length} steps to master this career — from fundamentals to advanced skills.`}
      />

      {/* Progress bar */}
      <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-surface/40 px-5 py-3">
        {(["beginner", "intermediate", "advanced"] as const).map((level) => {
          const count = steps.filter((s) => s.level === level).length;
          const cfg = levelConfig[level];
          return (
            <div key={level} className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
              <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
              <span className="text-xs text-text-secondary">({count})</span>
            </div>
          );
        })}
        <div className="ml-auto text-xs text-text-secondary">{steps.length} total steps</div>
      </div>

      {/* Vertical flowchart timeline */}
      <div className="relative">
        {steps.map((step, index) => {
          const isOpen = expanded.has(step.id);
          const cfg = levelConfig[step.level as keyof typeof levelConfig] ?? levelConfig.beginner;
          const isLast = index === steps.length - 1;

          return (
            <div key={step.id} className="relative flex gap-5">
              {/* Left rail: dot + connector line */}
              <div className="flex flex-col items-center">
                <div
                  className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 ${cfg.bg} transition-all duration-200`}
                >
                  <span className={`text-xs font-bold ${cfg.color}`}>{index + 1}</span>
                </div>
                {!isLast && (
                  <div className="w-0.5 flex-1 bg-gradient-to-b from-border/60 to-border/20 my-1" />
                )}
              </div>

              {/* Step card */}
              <div className={`mb-4 flex-1 ${isLast ? "" : ""}`}>
                <button
                  onClick={() => toggle(step.id)}
                  className="w-full rounded-2xl border border-border/60 bg-surface/40 px-5 py-4 text-left transition-all duration-200 hover:border-primary/40 hover:bg-surface/60"
                  type="button"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={`text-[10px] font-semibold uppercase tracking-widest ${cfg.color}`}>
                            {cfg.label}
                          </span>
                        </div>
                        <h3 className="text-sm font-semibold text-foreground">{step.title}</h3>
                      </div>
                    </div>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-text-secondary transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                    />
                  </div>

                  {isOpen && step.description && (
                    <div
                      className="mt-4 border-t border-border/40 pt-4 text-xs text-text-secondary
                        prose prose-sm dark:prose-invert max-w-none
                        prose-p:my-1 prose-p:leading-relaxed
                        prose-ul:my-2 prose-ul:space-y-1
                        prose-li:my-0
                        prose-strong:text-foreground prose-strong:font-semibold"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ReactMarkdown>{step.description}</ReactMarkdown>
                    </div>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
