// Approved Groq model for all application text tasks. No unavailable-model fallback.
export const GROQ_TEXT_MODEL = "openai/gpt-oss-120b";

// Keep reasoning out of resume JSON and cover-letter text, and limit latency.
export const GROQ_TEXT_OPTIONS = {
  reasoning_effort: "low",
  include_reasoning: false,
} as const;
