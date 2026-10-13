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

export const RESUME_FACT_RULES = `FACTS
- Use only facts in the source resume. Never invent tools, metrics, numbers, platforms, employers, titles, dates, scale or outcomes.
- A job-posting term may appear only if the resume names it or a bullet plainly shows it. Otherwise report it as missing.
- Keep every role, identified by its id, with its title, employer and dates unchanged. A bullet stays in the role it came from; never move work between roles.
- Do not state a number of years of experience unless the source states it.`;

export const WRITING_STYLE_RULES = `STYLE (must read as written by the candidate, not by an AI)
- Plain, specific, slightly understated, like a competent person describing their own work to a hiring manager.
- Rewrite each job-relevant bullet so the relevant part leads. Do not return source bullets word for word when a supported improvement exists.
- Each bullet starts with a concrete verb; current role in present tense, past roles in past tense. No two bullets in a role start with the same verb.
- Vary bullet length (roughly 10 to 26 words).
- No labelled prefixes like "Documentation:". No em dashes. ASCII hyphens only.
- Never use: ${BANNED_PHRASES.join(", ")}.
- Summary: 2 to 3 sentences, opens with the candidate's actual title, then the strongest facts for the target role. No soft-skill claims.`;
