/**
 * AI progress: the server reports which stage it is in; the UI estimates time within a stage
 * from durations measured on Bedrock (Kimi K2.5 writer, DeepSeek V3.2 reviewer), Oct 2026:
 * parse ~20s, write 13-25s, review 7-9s, fix 3-6s, fit to a page limit ~35s.
 * Safe to import from client and server code.
 */
export type AiStage = "parse" | "write" | "review" | "fix" | "fit";
export const STAGE_LABELS: Record<AiStage, string> = {
  parse: "Reading the resume",
  write: "Writing the tailored version",
  review: "Fact-checking against the original",
  fix: "Fixing flagged lines",
  fit: "Fitting to the page limit",
};

/** A plan is the expected stages with typical seconds each; single-call features have one step. */
export type AiPlan = { label: string; seconds: number; stage?: AiStage }[];
const resumeRewrite: AiPlan = [
  { stage: "parse", label: STAGE_LABELS.parse, seconds: 20 },
  { stage: "write", label: STAGE_LABELS.write, seconds: 20 },
  { stage: "review", label: STAGE_LABELS.review, seconds: 8 },
  { stage: "fix", label: STAGE_LABELS.fix, seconds: 5 },
  { stage: "fit", label: STAGE_LABELS.fit, seconds: 32 },
];
export const AI_PLANS = {
  resumeRewrite,
  resumeUpload: [{ stage: "parse", label: STAGE_LABELS.parse, seconds: 18 }],
  coverLetter: [{ label: "Writing the cover letter", seconds: 12 }],
  analyzer: [{ label: "Comparing the resume with the job", seconds: 10 }],
  tailorSuggestions: [{ label: "Finding tailoring suggestions", seconds: 15 }],
  enhance: [{ label: "Rewriting", seconds: 7 }],
  notes: [{ label: "Writing study notes", seconds: 15 }],
  linkedin: [{ label: "Optimizing the profile", seconds: 12 }],
} satisfies Record<string, AiPlan>;

export const PROGRESS_HEADER = "x-ai-progress";
export const PROGRESS_TYPE = "application/x-ndjson";

/** The page-fitting step only runs when a page limit is set; leave it out of the estimate otherwise. */
export const resumeRewritePlan = (pageLimit?: number | null): AiPlan =>
  pageLimit ? resumeRewrite : resumeRewrite.filter(step => step.stage !== "fit");

/** Fraction of a step shown as done after `x` of its typical time; slows near the end instead of finishing early. */
const ease = (x: number) => x < 0.8 ? x : 0.8 + 0.15 * (1 - Math.exp(-(x - 0.8) * 3));

/**
 * Bar position for a plan. `reported` is the plan index of the server's current stage (-1 when unknown),
 * `first` the first reported index (earlier steps were skipped), `inStep` seconds since the step began.
 */
export function estimateProgress(plan: AiPlan, reported: number, first: number, inStep: number) {
  const steps = plan.slice(first);
  const active = Math.min(steps.length - 1, Math.max(0, reported >= 0 ? reported - first : 0));
  const total = steps.reduce((sum, step) => sum + step.seconds, 0);
  const before = steps.slice(0, active).reduce((sum, step) => sum + step.seconds, 0);
  const current = steps[active];
  return {
    steps, active, current,
    percent: Math.min(97, Math.round(((before + current.seconds * ease(inStep / current.seconds)) / total) * 100)),
    secondsLeft: Math.max(0, Math.round(total - before - Math.min(inStep, current.seconds))),
    slow: inStep > current.seconds * 1.6,
  };
}
