import Groq from "groq-sdk";

// All text AI runs on Amazon Bedrock. Models were picked in a blind resume bake-off:
// Kimi K2.5 writes the most natural, best-tailored copy and parses a resume in ~14s
// (DeepSeek took ~41s). DeepSeek V3.2 is the most literal, so it fact-checks the writer.
export const AI_WRITER_MODEL = "moonshotai.kimi-k2.5";
export const AI_EXTRACT_MODEL = "moonshotai.kimi-k2.5";
export const AI_REVIEW_MODEL = "deepseek.v3.2";

/**
 * Bedrock serves an OpenAI-compatible /openai/v1/chat/completions endpoint, the same
 * path groq-sdk calls, so groq-sdk is used purely as the HTTP client. Auth is a
 * Bedrock API key (AWS_BEARER_TOKEN_BEDROCK).
 */
export function createAIClient(options: { timeout?: number; maxRetries?: number } = {}) {
  return new Groq({
    apiKey: process.env.AWS_BEARER_TOKEN_BEDROCK,
    baseURL: `https://bedrock-runtime.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com`,
    // A full resume rewrite normally takes 12-25s. Kimi occasionally loops (one test run streamed
    // 64k characters for 200s), so cut a stuck call at 40s and retry once inside the 85s budget.
    timeout: options.timeout ?? 40_000,
    maxRetries: options.maxRetries ?? 1,
  });
}
