# API reference: Nextzen Orbit

Last reviewed from code: 2026-10-26, branch `main` (beta merged).

All routes live under `src/app/api/**/route.ts`. Authentication is the Supabase session cookie. The extension sends it with `credentials: "include"`.

## Gate applied before every route

`src/middleware.ts` runs first. For a signed-in user, any `/api/*` path except `/api/auth/*`, `/api/webhooks/*`, `/api/onboarding*`, `/api/performance` and `/api/internal/jobs` returns:

| Status | Code | When |
| --- | --- | --- |
| 403 | `APPROVAL_REQUIRED` | Signup application not approved |
| 402 | `PAYMENT_REQUIRED` | No active service. Checkout routes are exempt: `/api/subscription`, `/api/subscription/create`, `/api/payments/create-order`, `/api/payments/reconcile` |
| 503 | – | Account status lookup failed (fails closed) |

Routes still check the session themselves and return 401 when signed out.

## Response format

Most routes use the helpers in `src/types/api.ts`:

```json
{ "success": true, "data": { } }
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "Human-readable text", "details": { } } }
```

`ERROR_CODES` are `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION_ERROR`, `RATE_LIMITED`, `INTERNAL_ERROR`, `PAYMENT_FAILED`, `SUBSCRIPTION_REQUIRED`, `TRIAL_EXPIRED` and `AI_QUOTA_EXCEEDED` (429, when a daily AI allowance is used up; see [ai-usage-limits.md](ai-usage-limits.md)). A few older routes return `{ success: false, error: { message } }` without a code. Rate-limited calls return 429.

## Client routes

| Route | Methods | Notes |
| --- | --- | --- |
| `/api/auth/callback` | GET | OAuth code exchange. Creates `users` and `profiles` rows, then redirects to `/onboarding` or the app |
| `/api/onboarding` | POST | Submit the signup application (`submit_signup_application`). 5 per user per 15 minutes |
| `/api/onboarding/upload` | POST | Signed upload ticket for the signup resume (`signup-resumes`, up to 10 MB) |
| `/api/profile` | GET, PATCH | Profile and job preferences (Zod-validated) |
| `/api/resumes` | GET, POST | List and create resumes |
| `/api/resumes/upload` | POST | Upload a PDF/DOCX, then AI parse (`maxDuration` 60) |
| `/api/resumes/[id]` | GET, PATCH, DELETE | Read, autosave, hard delete with file cleanup |
| `/api/resumes/[id]/improve` | POST | Whole-resume rewrite through the quality gate (`maxDuration` 120) |
| `/api/resumes/[id]/optimize` | POST | JD rewrite with an intensity setting, through the quality gate (`maxDuration` 120) |
| `/api/resumes/[id]/tailor` | POST | Suggestions only |
| `/api/resumes/[id]/enhance` | POST | Bullet rewrite / summary generation |
| `/api/resumes/[id]/export` | GET | `?format=pdf\|docx\|latex&template=` |
| `/api/resumes/[id]/versions` | GET, POST | List and snapshot versions |
| `/api/resumes/[id]/versions/[versionId]/restore` | POST | Restore a snapshot |
| `/api/resumes/export-admin` | GET | Client download of a resume an admin generated for them |
| `/api/analyzer` | POST | Resume vs JD score, breakdown, skills, suggestions |
| `/api/cover-letter/generate` | POST | Generate a cover letter (not persisted) |
| `/api/cover-letter/export` | POST | DOCX/PDF of a letter. Requires sign-in |
| `/api/applications` | GET, POST | Tracker list and create |
| `/api/applications/[id]` | GET, PATCH, DELETE | Tracker item |
| `/api/jobs/search` | POST | Adzuna search: country, salary, exclusions, age, sort, page. 60 per minute |
| `/api/jobs/saved-searches` | GET, POST, DELETE | Private saved searches |
| `/api/jobs` | GET | Catalog listing for career pages |
| `/api/jobs/queue` | GET, POST | The client's own queue (read) and shortlist enqueue |
| `/api/jobs/aggregate` | – | Legacy entry point that shares the search logic; no handlers |
| `/api/notifications` | GET, PATCH | Unread notifications; mark read |
| `/api/subscription` | GET | Current subscription and plan |
| `/api/subscription/create` | POST | Start PayU checkout for a plan (INR only). 5 per 5 minutes |
| `/api/payments/create-order` | POST | PayU order for `pro` / `elite`, monthly INR. 5 per 5 minutes |
| `/api/payments/reconcile` | POST | Check PayU for pending or given `txnid` and activate. 6 per 5 minutes |
| `/api/careers`, `/api/careers/[slug]` | GET | Career list and page data |
| `/api/roadmaps`, `/api/roadmaps/[id]` | GET | Roadmaps and steps |
| `/api/interview-questions` | GET | Filter by career, company, difficulty, topic |
| `/api/youtube` | GET | Stored resources |
| `/api/ai-notes`, `/api/ai-notes/[id]` | GET, POST / GET, PATCH, DELETE | User notes |
| `/api/ai/generate-notes` | POST | AI-generated topic notes |
| `/api/projects`, `/api/projects/[id]` | GET, POST / GET, PATCH, DELETE | User projects |
| `/api/autofill/profile` | GET | Profile, education and experience for the extension |
| `/api/autofill/telemetry` | POST | Field-coverage telemetry, written with the service role with size caps (042 forbids client inserts) |
| `/api/geo` | GET | Visitor country from Vercel geo headers (currency display) |
| `/api/ai-quota` | GET | Today's AI allowance for all three buckets (`rewrite`, `cover_letter`, `light`) |
| `/api/messages` | GET, POST | The client's thread with their team. 30 messages per 10 minutes |
| `/api/linkedin/optimize` | POST | `{ resumeId, targetRole }`: LinkedIn headline, About, top skills and rewritten bullets from an owned resume. 10 per hour, `light` bucket |
| `/api/mock-interviews` | GET, POST | List sessions / start one `{ role, jobDescription? }`. 10 per hour, `light` bucket |
| `/api/mock-interviews/[id]` | GET | One session |
| `/api/mock-interviews/[id]/answer` | POST | `{ index, answer }`: score one answer; the last one sets `overall` and `completed_at`. 60 per hour, `light` bucket |

## Admin routes (`/api/admin/*`)

All of these call `requireAdmin` (or `requireSuperAdmin` where noted) and then use the service-role client. Supervisors and super admins can act on every client. Ordinary admins are supposed to be limited to their assigned clients.

Per-client routes enforce that with `denyUnassignedClient` (`src/lib/admin/assignments.ts`, audit fix F2/F3), which also fails closed for unknown roles. That covers files, resumes, upload, optimize, cover letters, notifications, subscription activate, resume export, `export-admin`, messages and the per-client generator pages.

| Route | Methods | Notes |
| --- | --- | --- |
| `/api/admin/stats` | GET | Dashboard counts (`performance_admin_stats`) |
| `/api/admin/analytics` | GET | Team / per-admin analytics |
| `/api/admin/users` | GET | Client list (`performance_admin_users`) |
| `/api/admin/users/[id]` | GET | Client detail |
| `/api/admin/users/[id]/files` | GET, DELETE | Client original files |
| `/api/admin/users/[id]/resumes` | DELETE | Delete a client resume |
| `/api/admin/users/[id]/work-authorization` | GET | Private work-authorization answers (assigned or supervisory) |
| `/api/admin/signup-applications` | POST | Approve or reject (supervisor / super admin). 60 per minute |
| `/api/admin/signup-applications/[id]/resume` | GET | Signed URL for the original application file |
| `/api/admin/team` | GET, POST, PATCH, DELETE | Team list and allocation (writes need a super admin) |
| `/api/admin/team/action` | POST | `suspend`, `unsuspend`, `reset_password` (super admin) |
| `/api/admin/targets` | GET | Monthly target report (`client_target_report`) |
| `/api/admin/jobs/search` | POST | Search on behalf of a client |
| `/api/admin/jobs/queue` | POST | Enqueue for a client |
| `/api/admin/apply-queue` | GET, POST, PATCH | Queue page, claim, release, mark applied (`update_team_queue_job`) |
| `/api/admin/resumes` | GET, POST | Admin-generated resumes for a client |
| `/api/admin/resumes/upload` | POST | Upload a client source resume (`maxDuration` 60) |
| `/api/admin/resumes/optimize` | POST | Tailored resume for a client (`maxDuration` 120). 10 per minute |
| `/api/admin/cover-letters` | GET, POST | Saved admin cover letters |
| `/api/admin/cover-letters/generate` | POST | Generate a client cover letter. 10 per minute |
| `/api/admin/cover-letters/[id]/export` | GET | Download |
| `/api/admin/document-workspace` | GET, POST, DELETE | Private library: list, save (optionally to a client), delete |
| `/api/admin/document-workspace/upload` | POST | Parse a source in memory, up to 4 MB (`maxDuration` 120) |
| `/api/admin/document-workspace/generate` | POST | Start a `document_jobs` generation (`maxDuration` 120) |
| `/api/admin/document-workspace/jobs/[id]` | GET | Poll a job and resume a stale lease |
| `/api/admin/document-workspace/export` | POST | PDF/DOCX of the current draft |
| `/api/admin/subscription/activate` | POST | "Verify payment & sync plan": reconciles with PayU and never grants unpaid access |
| `/api/admin/notifications` | POST | Send a notification to one user: `{ user_id, type, title, message?, metadata? }` |
| `/api/admin/sso-users` | GET, POST, DELETE | SSO client accounts (super admin) |
| `/api/admin/reference-cache` | POST | Invalidate reference-data caches (super admin) |
| `/api/admin/messages` | GET | Threads with unread client messages (assigned clients for an admin, all for supervisors) |
| `/api/admin/users/[id]/messages` | GET, POST | One client's thread. 120 per 10 minutes, assignment checked |
| `/api/admin/ai-quota/requests` | GET, POST | Admin asks for extra allowance `{ bucket, reason }`; supervisors list pending requests |
| `/api/admin/ai-quota/requests/[id]` | POST | Supervisor decision `{ decision: "approved" \| "denied", extra }` |

## Webhooks and internal

| Route | Methods | Notes |
| --- | --- | --- |
| `/api/webhooks/payu` | POST | PayU success/failure form post. Verifies the response hash, calls `complete_payu_payment`, then redirects (303) to `/subscription?payment=...` |
| `/api/internal/jobs` | GET | Optional maintenance hook: `Authorization: Bearer $CRON_SECRET`. Recovers up to two stale document jobs and removes finished jobs older than 7 days |
| `/api/performance` | POST | Anonymous web-vitals beacon. 60 per minute per hashed IP |
