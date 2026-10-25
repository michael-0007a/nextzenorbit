# Daily AI usage limits (beta)

Status: on `beta` (commit `a36b706`). Migration 046 is **applied** to the shared database. Main doesn't use these tables. Code: `src/lib/ai/quota.ts`, `src/app/api/ai-quota/`, `src/app/api/admin/ai-quota/requests/`, `src/app/(admin)/admin/ai-limits/`, `src/components/ai/`.

## What it does

Every AI action counts against a **daily allowance** that resets at **00:00 GMT**. Only **successful** runs are recorded, so failures and retries never use up an allowance. Admins who run out can ask a supervisor for more for that day.

## Buckets

| Bucket | Label | Routes |
| --- | --- | --- |
| `rewrite` | resume generations | `resumes/[id]/improve`, `resumes/[id]/optimize`, `admin/resumes/optimize`, document workspace (resume) |
| `cover_letter` | cover letters | `cover-letter/generate`, `admin/cover-letters/generate`, document workspace (cover letter) |
| `light` | AI actions | `analyzer`, `resumes/upload`, `resumes/[id]/tailor`, `resumes/[id]/enhance`, `admin/resumes/upload`, document workspace upload, `ai/generate-notes`, `linkedin/optimize`, starting a mock interview, scoring each mock interview answer |

Not counted: onboarding resume parsing.

## Limits per day

| Who | `rewrite` | `cover_letter` | `light` |
| --- | --- | --- | --- |
| Client on Silver (`free`) | 10 | 30 | 50 |
| Client on Gold (`pro`) | 15 | 30 | 50 |
| Client on Elite | 20 | 30 | 50 |
| `admin` | 50 | 100 | 100 |
| `supervisor_admin` | 150 | 300 | 300 |
| `super_admin` | 500 | 500 | 500 |

A client without an active subscription is limited as Silver. `sso_user` has no staff limits, so it also gets the client defaults. Approved extra for the day is added on top.

## How a route uses it

```ts
const quotaLimited = await checkAiQuota(user.id, "rewrite"); // before the model call
if (quotaLimited) return quotaLimited;                       // 429 AI_QUOTA_EXCEEDED, Retry-After until reset
// ... AI call ...
await recordAiUse(user.id, "rewrite", tokens);               // only after success
```

- The 429 body includes the `allowance` (used, limit, remaining, `resetsAt`, `canRequestMore`). The message tells clients to upgrade and tells admins to request more.
- If the quota lookup fails, the route returns 503 (fails closed). If the tables are missing (before 046), limits aren't enforced and `aiAllowance` returns `null`.
- **Known limit:** check-then-record means a few simultaneous requests can overshoot the cap slightly. The per-minute burst limits bound this. If exact caps under concurrency matter, switch to a counted reservation. (This shortcut is noted in `quota.ts`.)
- **New AI routes must call both functions**, and tests that load them must mock `@/lib/ai/quota`.

## Requesting more (admins)

1. An admin who hits a limit sees the notice (`components/ai/ai-limits-notice`) and sends `POST /api/admin/ai-quota/requests` with `{ bucket, reason }`:
   - limited to 10 per hour;
   - only one pending request per admin, bucket and day (409 otherwise).
2. Supervisors and super admins see pending requests, with today's usage, at **`/admin/ai-limits`** (`GET /api/admin/ai-quota/requests`).
3. They decide with `POST /api/admin/ai-quota/requests/[id]` and `{ decision: "approved" | "denied", extra: 1–200 (default 25) }`:
   - you can't decide your own request;
   - a decision can't be overwritten (409).
4. Approved extra applies to that bucket for that UTC day only.

Clients can't request more. Their message points them to a higher plan.

## Reading the allowance

`GET /api/ai-quota` returns today's allowance for all three buckets, for the signed-in user (`Cache-Control: private, no-store`). The UI uses it to show remaining counts.

## Data (migration 046)

| Table | Columns |
| --- | --- |
| `ai_usage_events` | `id`, `user_id`, `bucket`, `tokens` (main call only), `created_at`. Indexed by user, bucket and time |
| `ai_quota_requests` | `id`, `user_id`, `bucket`, `day`, `reason` (3–500 chars), `status` (pending/approved/denied), `extra` (0–500), `decided_by`, `decided_at` |

Both tables have RLS enabled with no policies, and grants only to `service_role`. Only the server touches them.

## Cost context

See `AI_COST_ESTIMATE.md` in the repo root. At about 3–7¢ per rewrite, an Elite client using the full 20 rewrites a day would cost at most about $1.40 a day in rewrites. Today, `tokens` only covers the writer call; recording the reviewer and fix calls would give exact per-feature cost.

## Tests

`scripts/test-ai-quota.cjs` (beta) covers the limits by role and plan, recording only on success, the 429 shape, and the request/decision rules.
