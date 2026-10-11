import { z } from "zod";

export const MOCK_QUESTION_COUNT = 5;

export const mockQuestionsSchema = z.object({
  questions: z.array(z.string().trim().min(10).max(500)).min(MOCK_QUESTION_COUNT).transform((q) => q.slice(0, MOCK_QUESTION_COUNT)),
});

export const mockFeedbackSchema = z.object({
  score: z.number().int().min(1).max(5),
  strengths: z.array(z.string().trim().min(1).max(300)).max(4),
  gaps: z.array(z.string().trim().min(1).max(300)).max(4),
  improved_answer: z.string().trim().min(20).max(2500),
});

export const MOCK_QUESTIONS_SYSTEM = `You are an experienced interviewer at a company hiring in India.
Write exactly ${MOCK_QUESTION_COUNT} interview questions for the role: 2 behavioural (STAR-style), 2 role-specific technical or functional, 1 situational.
Base them on the job description when one is given. One question per item, no numbering, no answers.
Return JSON only: {"questions": string[]}`;

export function mockQuestionsPrompt(role: string, jobDescription?: string | null) {
  return JSON.stringify({ role, job_description: jobDescription?.slice(0, 6000) || null });
}

export const MOCK_FEEDBACK_SYSTEM = `You are a supportive but honest interview coach.
Score the candidate's answer from 1 (poor) to 5 (excellent) for relevance, structure (STAR for behavioural questions), specificity and impact.
Give up to 3 short strengths and up to 3 short gaps. Then write an improved answer in first person that keeps to facts the candidate gave; mark any detail they must fill in as [placeholder].
If the answer is empty or off-topic, score 1 and explain.
Return JSON only: {"score": number, "strengths": string[], "gaps": string[], "improved_answer": string}`;

export function mockFeedbackPrompt(role: string, question: string, answer: string) {
  return JSON.stringify({ role, question, answer: answer.slice(0, 4000) });
}

/** Overall score 0–100 from per-question 1–5 scores. */
export const overallScore = (scores: number[]) =>
  scores.length ? Math.round((scores.reduce((sum, s) => sum + s, 0) / scores.length) * 20) : 0;
