/**
 * Keyword Heatmap — Client Component
 *
 * Color-coded visualization of keyword matches.
 */

"use client";

import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Keyword {
  keyword: string;
  category: "technical" | "soft" | "tool" | "certification" | "domain";
  found: boolean;
  importance: "required" | "preferred" | "bonus";
  resumeMatch?: string;
}

interface KeywordHeatmapProps {
  keywords: {
    required: Keyword[];
    preferred: Keyword[];
    bonus: Keyword[];
  };
  className?: string;
}

const categoryColors: Record<Keyword["category"], string> = {
  technical: "bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400",
  soft: "bg-purple-500/10 border-purple-500/30 text-purple-600 dark:text-purple-400",
  tool: "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400",
  certification: "bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400",
  domain: "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400",
};

export function KeywordHeatmap({ keywords, className }: KeywordHeatmapProps) {
  const renderKeyword = (kw: Keyword, index: number) => (
    <motion.div
      key={`${kw.keyword}-${index}`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.03 }}
      className={cn(
        "relative group inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all",
        kw.found
          ? "bg-primary/10 border-primary/30 text-primary"
          : kw.importance === "required"
          ? "bg-error/10 border-error/30 text-error"
          : "bg-muted border-border text-text-secondary",
        categoryColors[kw.category]
      )}
      title={kw.found && kw.resumeMatch ? `Matched: ${kw.resumeMatch}` : undefined}
    >
      {/* Match indicator */}
      {kw.found ? (
        <Check className="h-3 w-3 text-primary" />
      ) : kw.importance === "required" ? (
        <X className="h-3 w-3 text-error" />
      ) : null}

      {/* Keyword text */}
      <span>{kw.keyword}</span>

      {/* Importance indicator for required */}
      {kw.importance === "required" && !kw.found && (
        <span className="text-error">*</span>
      )}
    </motion.div>
  );

  const requiredFound = keywords.required.filter(k => k.found).length;
  const preferredFound = keywords.preferred.filter(k => k.found).length;
  const bonusFound = keywords.bonus.filter(k => k.found).length;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Required Keywords */}
      {keywords.required.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h4 className="text-sm font-semibold text-foreground">
              Required Skills
            </h4>
            <span className={cn(
              "text-xs px-2 py-0.5 rounded-full font-medium",
              requiredFound === keywords.required.length
                ? "bg-primary/10 text-primary"
                : requiredFound > keywords.required.length / 2
                ? "bg-warning/10 text-warning"
                : "bg-error/10 text-error"
            )}>
              {requiredFound}/{keywords.required.length} matched
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {keywords.required.map((kw, i) => renderKeyword(kw, i))}
          </div>
        </div>
      )}

      {/* Preferred Keywords */}
      {keywords.preferred.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h4 className="text-sm font-semibold text-foreground">
              Preferred Skills
            </h4>
            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-text-secondary font-medium">
              {preferredFound}/{keywords.preferred.length} matched
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {keywords.preferred.map((kw, i) => renderKeyword(kw, i))}
          </div>
        </div>
      )}

      {/* Bonus Keywords */}
      {keywords.bonus.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h4 className="text-sm font-semibold text-foreground">
              Nice to Have
            </h4>
            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-text-secondary font-medium">
              {bonusFound}/{keywords.bonus.length} matched
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {keywords.bonus.map((kw, i) => renderKeyword(kw, i))}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="pt-4 border-t border-border">
        <p className="text-xs text-granite mb-2">Category Legend:</p>
        <div className="flex flex-wrap gap-3 text-xs">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-blue-500/30" /> Technical
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-purple-500/30" /> Soft Skills
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-amber-500/30" /> Tools
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-green-500/30" /> Certifications
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-rose-500/30" /> Domain
          </span>
        </div>
      </div>
    </div>
  );
}


