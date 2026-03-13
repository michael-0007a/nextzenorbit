/**
 * Resume Tailor Panel — Client Component
 *
 * AI-powered suggestions to tailor a resume for a specific job.
 * Used after job analysis to apply recommendations.
 */

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Wand2,
  Loader2,
  CheckCircle2,
  ArrowRight,
  Lightbulb,
  GripVertical,
  Sparkles,
  FileText,
  X,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface BulletRewrite {
  sectionType: string;
  entryId: string;
  originalBullet: string;
  suggestedBullet: string;
  reason: string;
}

interface TailoringResult {
  sectionOrder: string[];
  keywordsToAdd: string[];
  bulletRewrites: BulletRewrite[];
  skillsToHighlight: string[];
  summaryRewrite: string | null;
  overallTips: string[];
}

interface ResumeTailorPanelProps {
  resumeId: string;
  jobDescription: string;
  matchedSkills?: string[];
  missingSkills?: string[];
  onApplySuggestion?: (type: string, data: unknown) => void;
  className?: string;
}

export function ResumeTailorPanel({
  resumeId,
  jobDescription,
  matchedSkills = [],
  missingSkills = [],
  onApplySuggestion,
  className,
}: ResumeTailorPanelProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TailoringResult | null>(null);
  const [appliedSuggestions, setAppliedSuggestions] = useState<Set<string>>(new Set());

  const handleTailor = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch(`/api/resumes/${resumeId}/tailor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobDescription,
          matchedSkills,
          missingSkills,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.data);
        toast.success("Tailoring suggestions ready!");
      } else {
        throw new Error(data.error?.message || "Tailoring failed");
      }
    } catch (err) {
      console.error("Tailor error:", err);
      toast.error("Failed to generate suggestions. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const markApplied = (id: string) => {
    setAppliedSuggestions((prev) => new Set(prev).add(id));
  };

  const handleApplyBullet = (rewrite: BulletRewrite) => {
    if (onApplySuggestion) {
      onApplySuggestion("bullet", rewrite);
    }
    markApplied(`bullet-${rewrite.entryId}-${rewrite.originalBullet.slice(0, 20)}`);
    toast.success("Bullet point updated!");
  };

  const handleApplySummary = (summary: string) => {
    if (onApplySuggestion) {
      onApplySuggestion("summary", summary);
    }
    markApplied("summary");
    toast.success("Summary updated!");
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Generate Button */}
      {!result && (
        <Card className="border-dashed">
          <CardBody className="text-center py-8">
            <div className="mx-auto w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
              <Wand2 className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">
              Smart Resume Tailoring
            </h3>
            <p className="text-sm text-text-secondary mb-4 max-w-md mx-auto">
              Get AI-powered suggestions to tailor your resume specifically for this job,
              based on the analysis results.
            </p>
            <Button
              variant="primary"
              onClick={handleTailor}
              disabled={loading}
              leftIcon={loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            >
              {loading ? "Generating Suggestions..." : "Generate Tailoring Suggestions"}
            </Button>
          </CardBody>
        </Card>
      )}

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Summary Rewrite */}
            {result.summaryRewrite && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    Suggested Summary
                  </CardTitle>
                </CardHeader>
                <CardBody>
                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <p className="text-sm text-foreground leading-relaxed">
                      {result.summaryRewrite}
                    </p>
                  </div>
                  <div className="mt-3 flex gap-2">
                    {appliedSuggestions.has("summary") ? (
                      <Badge variant="success" size="sm">
                        <Check className="h-3 w-3 mr-1" /> Applied
                      </Badge>
                    ) : (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleApplySummary(result.summaryRewrite!)}
                        leftIcon={<Check className="h-3 w-3" />}
                      >
                        Apply Summary
                      </Button>
                    )}
                  </div>
                </CardBody>
              </Card>
            )}

            {/* Keywords to Add */}
            {result.keywordsToAdd.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Keywords to Add
                  </CardTitle>
                  <CardDescription>
                    Include these keywords from the job description
                  </CardDescription>
                </CardHeader>
                <CardBody>
                  <div className="flex flex-wrap gap-2">
                    {result.keywordsToAdd.map((keyword, i) => (
                      <Badge key={i} variant="primary" size="sm">
                        + {keyword}
                      </Badge>
                    ))}
                  </div>
                </CardBody>
              </Card>
            )}

            {/* Skills to Highlight */}
            {result.skillsToHighlight.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    Skills to Emphasize
                  </CardTitle>
                  <CardDescription>
                    Make these skills more prominent in your resume
                  </CardDescription>
                </CardHeader>
                <CardBody>
                  <div className="flex flex-wrap gap-2">
                    {result.skillsToHighlight.map((skill, i) => (
                      <Badge key={i} variant="success" size="sm">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardBody>
              </Card>
            )}

            {/* Bullet Rewrites */}
            {result.bulletRewrites.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <ArrowRight className="h-4 w-4 text-primary" />
                    Suggested Bullet Improvements
                  </CardTitle>
                  <CardDescription>
                    Enhanced bullet points for better impact
                  </CardDescription>
                </CardHeader>
                <CardBody className="space-y-4">
                  {result.bulletRewrites.map((rewrite, i) => {
                    const id = `bullet-${rewrite.entryId}-${rewrite.originalBullet.slice(0, 20)}`;
                    const isApplied = appliedSuggestions.has(id);

                    return (
                      <div
                        key={i}
                        className={cn(
                          "p-3 rounded-lg border",
                          isApplied ? "bg-primary/5 border-primary/20" : "bg-muted/50 border-border"
                        )}
                      >
                        <div className="space-y-2">
                          <div className="flex items-start gap-2">
                            <X className="h-4 w-4 text-error shrink-0 mt-0.5" />
                            <p className="text-sm text-text-secondary line-through">
                              {rewrite.originalBullet}
                            </p>
                          </div>
                          <div className="flex items-start gap-2">
                            <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                            <p className="text-sm text-foreground">
                              {rewrite.suggestedBullet}
                            </p>
                          </div>
                          {rewrite.reason && (
                            <p className="text-xs text-granite ml-6 italic">
                              {rewrite.reason}
                            </p>
                          )}
                        </div>
                        <div className="mt-3 flex gap-2">
                          {isApplied ? (
                            <Badge variant="success" size="sm">
                              <Check className="h-3 w-3 mr-1" /> Applied
                            </Badge>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleApplyBullet(rewrite)}
                              leftIcon={<Check className="h-3 w-3" />}
                            >
                              Apply Change
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </CardBody>
              </Card>
            )}

            {/* Section Order Suggestion */}
            {result.sectionOrder.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-primary" />
                    Recommended Section Order
                  </CardTitle>
                </CardHeader>
                <CardBody>
                  <div className="flex flex-wrap gap-2">
                    {result.sectionOrder.map((section, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-muted border border-border"
                      >
                        <span className="text-xs font-bold text-primary">{i + 1}</span>
                        <span className="text-sm text-foreground capitalize">{section}</span>
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>
            )}

            {/* Overall Tips */}
            {result.overallTips.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-warning" />
                    Additional Tips
                  </CardTitle>
                </CardHeader>
                <CardBody>
                  <ul className="space-y-2">
                    {result.overallTips.map((tip, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <ArrowRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span className="text-text-secondary">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </CardBody>
              </Card>
            )}

            {/* Regenerate Button */}
            <div className="flex justify-center pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleTailor}
                disabled={loading}
                leftIcon={loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              >
                Regenerate Suggestions
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

