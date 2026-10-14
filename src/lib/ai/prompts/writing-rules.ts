/**
 * Shared rules for every prompt that writes resume or cover-letter copy.
 * Tuned in a blind bake-off: these remove the phrasing recruiters flag as AI-written.
 * BANNED_PHRASES is also enforced in code by the resume quality gate.
 */
export const BANNED_PHRASES = [
  "passionate", "proven", "demonstrated", "results-driven", "detail-oriented", "dynamic", "leveraged",
  "spearheaded", "utilized", "synergy", "cutting-edge", "robust", "seamless", "fostered", "orchestrated",
  "delve", "adept", "showcasing", "track record", "strong ability", "expertise", "pioneered",
];

/** How hard tailoring pushes. Hard facts (numbers, tools, employers, titles, dates, credentials) never change at any level. */
export type Intensity = "conservative" | "moderate" | "aggressive";

const HARD_FACTS = `- Never invent numbers, metrics, tools, technologies, platforms, employers, titles, dates, certifications, degrees or scale. Use only numbers that appear in the source.
- Keep every role, identified by its id, with its title, employer and dates unchanged. A bullet stays in the role it came from; never move work between roles.
- Do not state a number of years of experience unless the source states it.`;

export function factRules(level: Intensity = "conservative") {
  if (level === "conservative") return `FACTS
- Use only facts in the source resume.
- A job-posting term may appear only if the resume names it or a bullet plainly shows it. Otherwise report it as missing.
${HARD_FACTS}`;
  return `FACTS
${HARD_FACTS}
- IMPLIED SKILLS ARE WANTED: name a competency the work clearly demonstrates even when the resume never uses the word, in the job posting's terminology. Example: "coordinated scheduling, resource allocation and labor supervision" demonstrates project planning and resource management; "resolved escalations across risk, legal and technology teams" demonstrates stakeholder management and issue resolution. Add these to bullets, the summary and the skills list.
- The test for an implied skill: a hiring manager reading the original bullet would agree it shows that skill. Tools and technologies are never implied; they must be named in the source.
- Never open a bullet with participated, supported, assisted, helped, worked on or responsible for: say what the person actually did.${level === "aggressive" ? `
- PUSH THE CANDIDATE: frame every bullet around ownership, scope and impact. Upgrade verbs to the strongest the work supports: coordinated or managed becomes led, drove, owned or directed; helped or supported becomes delivered or executed when the person did the work. Merge related bullets into fewer, stronger statements: at most 5 bullets per role, no two bullets about the same work. Open every bullet with a strong verb the work supports (Led, Drove, Owned, Delivered, Built, Directed, Launched, Streamlined, Automated, Designed) and put the result or scope in the first half of the bullet. Lead with transferable experience that maps to the job, even from a different industry.` : ""}`;
}

export function styleRules(level: Intensity = "conservative") {
  const tone = level === "aggressive" ? "Confident and assertive: the strongest honest version of this candidate. State outcomes and ownership directly."
    : level === "moderate" ? "Confident and specific, like a strong candidate describing their own work to a hiring manager."
    : "Plain, specific, slightly understated, like a competent person describing their own work to a hiring manager.";
  return `STYLE (must read as written by the candidate, not by an AI)
- ${tone}
- Order each role's bullets by relevance to the job. Rewrite each job-relevant bullet so the relevant part leads, using the job posting's terms for work the candidate did. Do not return source bullets word for word when a supported improvement exists.
- Keep the substance of every source bullet that matters for the job; reword, do not thin it out.
- Each bullet starts with a concrete verb; current role in present tense, past roles in past tense. No two bullets in a role start with the same verb.
- Vary bullet length (roughly 10 to 26 words).
- No labelled prefixes like "Documentation:". No em dashes. ASCII hyphens only.
- Never use: ${BANNED_PHRASES.join(", ")}.
- Summary: 2 to 3 sentences, opens with the candidate's actual title, then the strongest facts for the target role. No soft-skill claims.`;
}

export const RESUME_FACT_RULES = factRules();
export const WRITING_STYLE_RULES = styleRules();
