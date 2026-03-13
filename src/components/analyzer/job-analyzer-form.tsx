"use client";

/**
 * Job Analyzer Form — Client Component (v2.0)
 *
 * Paste a job description, select a resume, and get detailed AI analysis
 * with radar chart visualization and keyword heatmap.
 */

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import {
  Search,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  FileText,
  Lightbulb,
  ArrowRight,
  Building2,
} from "lucide-react";
import { RadarChart } from "./radar-chart";
import { KeywordHeatmap } from "./keyword-heatmap";
import { cn } from "@/lib/utils";

interface ResumeOption {
  id: string;
  title: string;
}

interface Keyword {
  keyword: string;
  category: "technical" | "soft" | "tool" | "certification" | "domain";
  found: boolean;
  importance: "required" | "preferred" | "bonus";
  resumeMatch?: string;
}

interface GapAnalysis {
  skill: string;
  importance: "critical" | "important" | "nice-to-have";
  suggestion: string;
}

interface AnalysisResult {
  score: number;
  breakdown: {
    technicalSkills: { score: number; weight: number };
    experience: { score: number; weight: number };
    education: { score: number; weight: number };
    softSkills: { score: number; weight: number };
  };
  keywords: {
    required: Keyword[];
    preferred: Keyword[];
    bonus: Keyword[];
  };
  gaps: GapAnalysis[];
  suggestions: string[];
  jobSummary: {
    title: string;
    company: string;
    seniorityLevel: string;
    employmentType: string;
    keyRequirements: string[];
  } | null;
  matchedSkills: string[];
  missingSkills: string[];
}

interface JobAnalyzerFormProps {
  resumes: ResumeOption[];
}

export function JobAnalyzerForm({ resumes }: JobAnalyzerFormProps) {
  const [jobDescription, setJobDescription] = useState("");
  const [selectedResumeId, setSelectedResumeId] = useState(resumes[0]?.id ?? "");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!jobDescription.trim()) {
      toast.error("Please paste a job description.");
      return;
    }

    if (jobDescription.trim().length < 100) {
      toast.error("Job description seems too short. Please paste the complete description.");
      return;
    }

    if (!selectedResumeId) {
      toast.error("Please select a resume to compare.");
      return;
    }

    setAnalyzing(true);
    setResult(null);

    try {
      const res = await fetch("/api/analyzer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_description: jobDescription.trim(),
          resume_id: selectedResumeId,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Analysis failed");
      }

      const data = await res.json();

      if (data.success) {
        setResult(data.data);
        toast.success("Analysis complete!");
      } else {
        // Handle legacy response format
        setResult({
          score: data.score || 0,
          breakdown: data.breakdown || getDefaultBreakdown(),
          keywords: data.keywords || { required: [], preferred: [], bonus: [] },
          gaps: data.gaps || [],
          suggestions: data.suggestions || [],
          jobSummary: data.jobSummary || null,
          matchedSkills: data.matchedSkills || [],
          missingSkills: data.missingSkills || [],
        });
        toast.success("Analysis complete!");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to analyze";
      toast.error(message);
    } finally {
      setAnalyzing(false);
    }
  };

  const getDefaultBreakdown = () => ({
    technicalSkills: { score: 0, weight: 40 },
    experience: { score: 0, weight: 30 },
    education: { score: 0, weight: 15 },
    softSkills: { score: 0, weight: 15 },
  });

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-primary";
    if (score >= 60) return "text-warning";
    return "text-error";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-primary/10 border-primary/30";
    if (score >= 60) return "bg-warning/10 border-warning/30";
    return "bg-error/10 border-error/30";
  };

  return (
    <div className="space-y-6">
      {/* Input Form */}
      <Card className="relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary-light to-primary" />
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Search className="h-4 w-4 text-primary" />
            </div>
            Job Description Analyzer
          </CardTitle>
          <CardDescription>
            Paste the job description and select a resume for AI-powered compatibility analysis.
          </CardDescription>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleAnalyze} className="space-y-4">
            {resumes.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Compare with Resume
                </label>
                <select
                  value={selectedResumeId}
                  onChange={(e) => setSelectedResumeId(e.target.value)}
                  className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
                >
                  {resumes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {resumes.length === 0 && (
              <div className="flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/5 p-3">
                <AlertCircle className="h-4 w-4 text-warning shrink-0" />
                <p className="text-sm text-foreground">
                  You haven&apos;t created any resumes yet.{" "}
                  <Link href="/resumes" className="text-primary hover:underline font-medium">
                    Create one first
                  </Link>{" "}
                  to use the analyzer.
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Job Description
              </label>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                rows={10}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-granite focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors resize-none"
                placeholder="Paste the full job description here including requirements, responsibilities, and qualifications..."
              />
              <p className="mt-1.5 text-xs text-granite">
                {jobDescription.length} characters • Include requirements, responsibilities, and qualifications for best results
              </p>
            </div>

            <Button
              type="submit"
              variant="primary"
              isLoading={analyzing}
              disabled={resumes.length === 0}
              leftIcon={<Sparkles className="h-4 w-4" />}
            >
              {analyzing ? "Analyzing..." : "Analyze Match"}
            </Button>
          </form>
        </CardBody>
      </Card>

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Score + Radar Chart */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Overall Score */}
              <Card className="relative overflow-hidden">
                <div className={`absolute top-0 left-0 right-0 h-1 ${
                  result.score >= 80
                    ? "bg-gradient-to-r from-primary via-primary-light to-primary"
                    : result.score >= 60
                    ? "bg-gradient-to-r from-warning via-warning/70 to-warning"
                    : "bg-gradient-to-r from-error via-error/70 to-error"
                }`} />
                <CardBody className="p-6">
                  <div className="flex items-center gap-6">
                    <div
                      className={cn(
                        "flex h-24 w-24 items-center justify-center rounded-2xl border-2 text-4xl font-bold",
                        getScoreBg(result.score),
                        getScoreColor(result.score)
                      )}
                    >
                      {result.score}%
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-foreground">Match Score</h3>
                      <p className="text-sm text-text-secondary mt-1">
                        {result.score >= 80
                          ? "Excellent match! Your resume aligns strongly with this role."
                          : result.score >= 60
                          ? "Good match with room for improvement. Consider addressing the gaps below."
                          : "Your resume needs significant tailoring for this role."}
                      </p>
                      <div className="mt-3 h-2.5 w-full rounded-full bg-muted overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${result.score}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className={cn(
                            "h-full rounded-full",
                            result.score >= 80 ? "bg-primary" : result.score >= 60 ? "bg-warning" : "bg-error"
                          )}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Job Summary */}
                  {result.jobSummary && (
                    <div className="mt-6 pt-6 border-t border-border">
                      <div className="flex items-center gap-2 mb-3">
                        <Building2 className="h-4 w-4 text-granite" />
                        <span className="text-sm font-medium text-foreground">Job Summary</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-granite">Title:</span>
                          <span className="ml-2 text-foreground">{result.jobSummary.title}</span>
                        </div>
                        {result.jobSummary.company && (
                          <div>
                            <span className="text-granite">Company:</span>
                            <span className="ml-2 text-foreground">{result.jobSummary.company}</span>
                          </div>
                        )}
                        {result.jobSummary.seniorityLevel && (
                          <div>
                            <span className="text-granite">Level:</span>
                            <span className="ml-2 text-foreground capitalize">{result.jobSummary.seniorityLevel}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardBody>
              </Card>

              {/* Radar Chart */}
              {result.breakdown && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      Score Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardBody className="flex items-center justify-center pb-6">
                    <RadarChart
                      data={[
                        { label: "Technical", value: result.breakdown.technicalSkills?.score || 0 },
                        { label: "Experience", value: result.breakdown.experience?.score || 0 },
                        { label: "Education", value: result.breakdown.education?.score || 0 },
                        { label: "Soft Skills", value: result.breakdown.softSkills?.score || 0 },
                      ]}
                      size={220}
                    />
                  </CardBody>
                </Card>
              )}
            </div>

            {/* Keyword Heatmap */}
            {result.keywords && (result.keywords.required?.length > 0 || result.keywords.preferred?.length > 0) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    Keyword Analysis
                  </CardTitle>
                  <CardDescription>
                    Skills and keywords from the job description matched against your resume
                  </CardDescription>
                </CardHeader>
                <CardBody>
                  <KeywordHeatmap keywords={result.keywords} />
                </CardBody>
              </Card>
            )}

            {/* Gap Analysis */}
            {result.gaps && result.gaps.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-warning" />
                    Gap Analysis
                  </CardTitle>
                  <CardDescription>
                    Critical skills to address for a stronger application
                  </CardDescription>
                </CardHeader>
                <CardBody>
                  <div className="space-y-3">
                    {result.gaps.map((gap, i) => (
                      <div
                        key={i}
                        className={cn(
                          "p-3 rounded-lg border",
                          gap.importance === "critical"
                            ? "bg-error/5 border-error/30"
                            : gap.importance === "important"
                            ? "bg-warning/5 border-warning/30"
                            : "bg-muted border-border"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <Badge
                            variant={gap.importance === "critical" ? "error" : gap.importance === "important" ? "warning" : "default"}
                            size="sm"
                          >
                            {gap.importance}
                          </Badge>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-foreground">{gap.skill}</p>
                            <p className="text-xs text-text-secondary mt-1">{gap.suggestion}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>
            )}

            {/* Suggestions */}
            {result.suggestions && result.suggestions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-primary" />
                    Recommendations
                  </CardTitle>
                </CardHeader>
                <CardBody>
                  <ul className="space-y-3">
                    {result.suggestions.map((suggestion, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm">
                        <ArrowRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span className="text-text-secondary">{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </CardBody>
              </Card>
            )}

            {/* Legacy Skills Display (for backward compatibility) */}
            {(!result.keywords || (result.keywords.required?.length === 0 && result.keywords.preferred?.length === 0)) && (
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Matched Skills */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      Matched Skills ({result.matchedSkills?.length || 0})
                    </CardTitle>
                  </CardHeader>
                  <CardBody>
                    <div className="flex flex-wrap gap-2">
                      {result.matchedSkills?.map((skill) => (
                        <Badge key={skill} variant="success" size="sm">
                          {skill}
                        </Badge>
                      ))}
                      {(!result.matchedSkills || result.matchedSkills.length === 0) && (
                        <p className="text-sm text-granite">No skills matched</p>
                      )}
                    </div>
                  </CardBody>
                </Card>

                {/* Missing Skills */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <AlertCircle className="h-4 w-4 text-error" />
                      Missing Skills ({result.missingSkills?.length || 0})
                    </CardTitle>
                  </CardHeader>
                  <CardBody>
                    <div className="flex flex-wrap gap-2">
                      {result.missingSkills?.map((skill) => (
                        <Badge key={skill} variant="error" size="sm">
                          {skill}
                        </Badge>
                      ))}
                      {(!result.missingSkills || result.missingSkills.length === 0) && (
                        <p className="text-sm text-granite">No gaps found</p>
                      )}
                    </div>
                  </CardBody>
                </Card>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

