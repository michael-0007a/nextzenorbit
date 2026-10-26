# Five client features

Status: **live on main** since the beta merge (`b9b0678`, 2026-10-26; built in `aa0191e`, restyled in `34c6366`). Migrations 043–045 are applied. The original plan is in [plans/plan.html](plans/plan.html); the ideas they came from are in [plans/feature-ideas.html](plans/feature-ideas.html).

All five sit behind the normal gate (approved and paid). Client user ids always come from the server session and are never taken from the request.

## 1. Client progress feed

**What:** the client dashboard shows what the team did for them: jobs applied, resumes and cover letters made, who did each and when, plus this week's totals.

| Piece | Where |
| --- | --- |
| Data | Built from existing tables. No new writes in admin routes |
| SQL | `043_client_activity_feed.sql`: `client_activity(p_user_id, p_before, p_limit)` and `client_activity_summary(p_user_id, p_since)` (`SECURITY DEFINER`, service role only), plus three indexes on `job_queue`, `admin_resumes` and `admin_cover_letters` |
| Server | `src/lib/activity.ts`: `getClientActivity(userId)` returns the 20 latest items plus a 7-day summary |
| UI | `src/app/(dashboard)/dashboard/page.tsx`, `components/dashboard/activity-feed.tsx` |

Event kinds are `applied` (from `job_queue.applied_by` / `applied_at`), `resume` and `cover_letter`. Actor names come from staff profiles.

## 2. Client ↔ team messaging

**What:** one message thread per client, shared by the client and everyone assigned to them.

| Piece | Where |
| --- | --- |
| Table | `client_messages` (044): `client_id`, `sender_id`, `from_team`, `body` (1–4,000 chars), `created_at`, `read_at`. RLS on, no policies (server only) |
| Server | `src/lib/messages.ts`: `readThread` (the latest 200; marks the other side's messages read), `sendMessage`, `unreadThreads` |
| Client API | `GET/POST /api/messages`, limited to 30 messages per 10 minutes |
| Team API | `GET /api/admin/messages` lists threads with unread client messages (an admin sees assigned clients, a supervisor sees all). `GET/POST /api/admin/users/[id]/messages`, limited to 120 per 10 minutes and checked against assignment |
| UI | `/messages` (client), `/admin/messages` (staff inbox), `components/messages/message-thread.tsx` |

Delivery is in-app only: no email, push or WhatsApp. Threads refresh when you open or poll them.

## 3. LinkedIn profile optimizer

**What:** from a saved resume and a target role, the AI writes a LinkedIn headline, About section, top skills, and 2–3 rewritten bullets per role.

| Piece | Where |
| --- | --- |
| API | `POST /api/linkedin/optimize` `{ resumeId, targetRole }`. Checks resume ownership, `maxDuration` 60, limited to 10 per hour, uses the `light` AI bucket |
| Prompt | `src/lib/ai/prompts/linkedin.ts`: `linkedinProfileSchema` (headline, about up to `LINKEDIN_LIMITS`, 3–15 skills, up to 10 roles × up to 3 bullets) |
| UI | `/linkedin`, `components/linkedin/linkedin-optimizer.tsx` (copy buttons per field) |

Output is suggestions to paste into LinkedIn. Nothing is posted automatically.

## 4. CTC → in-hand and offer comparison

**What:** compare up to 3 Indian offers side by side: monthly in-hand pay, annual in-hand pay, and first-year cash. The best figures are highlighted.

| Piece | Where |
| --- | --- |
| Math | `src/lib/salary/ctc.ts`: pure functions that run in the browser, with no server or database. Offers are remembered only in the browser's `localStorage`. `TAX_YEAR = "FY 2026-27"` |
| UI | `/offers`, `components/offers/offer-compare.tsx` |

- **Inputs** (`OfferInput`):
  - CTC, variable pay, basic as a percentage of fixed pay, PF on the ₹15,000 wage cap or on full basic;
  - professional tax, tax regime (new or old), and old-regime deductions;
  - joining bonus and notice buyout.
- **Rules modeled:** both regimes' slabs, standard deduction (₹75,000 new / ₹50,000 old), the rebate limit (₹12L new / ₹5L old), surcharge, 4% cess, 12% PF, 4.81% gratuity, and the 80C cap.
- **Maintenance:** re-check the rules against incometax.gov.in after each Union Budget, and bump `TAX_YEAR`.

## 5. AI mock interviews (basic)

**What:** generate 5 questions for a role (2 behavioural, 2 role-specific, 1 situational). The user answers one at a time and gets a score from 1 to 5, strengths, gaps and an improved answer. An overall score is shown at the end.

| Piece | Where |
| --- | --- |
| Table | `mock_interviews` (045): `role`, `job_description` (≤8,000), `questions` (1–10), `answers` jsonb, `overall` (0–100), `completed_at`. Server only |
| API | `POST /api/mock-interviews` starts a session (10 per hour, `light` bucket). `GET /api/mock-interviews/[id]`. `POST /api/mock-interviews/[id]/answer` scores one answer (60 per hour, `light` bucket) |
| Prompt | `src/lib/ai/prompts/mock-interview.ts`: `mockQuestionsSchema`, `mockFeedbackSchema`, `overallScore` |
| UI | `/interviews/mock`, `components/interviews/mock-interview.tsx` |

Improved answers keep to facts the candidate gave and mark any missing detail as `[placeholder]`. Answers are saved with a read-modify-write of the array, which is fine for one user answering in order (see the `shortcut:` note in the answer route).

## Navigation

The client sidebar has **Messages**, **LinkedIn**, **Offer Compare** and **Mock Interview**. The admin sidebar has **Messages** and **AI Limits**.

## Tests

- `scripts/test-client-feed-messages.cjs`: feed and messaging ownership and assignment rules.
- `scripts/test-ai-features.cjs`: LinkedIn and mock interview validation, ownership and quota.
- `scripts/test-salary.cjs`: tax and in-hand calculations against worked examples.
