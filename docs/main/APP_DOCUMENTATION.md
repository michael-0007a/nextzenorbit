# Nextzen Orbit: whole-app documentation (main)

Last reviewed from code: 2026-10-16, branch `main` at `808c909`.
Beta-only changes are in [`../beta/BETA_OVERVIEW.md`](../beta/BETA_OVERVIEW.md). Non-technical readers should start with [TEAM_CONTEXT_BRIEF.md](TEAM_CONTEXT_BRIEF.md).

This is the code-grounded tour of the production app: what it does, how each flow works, which files own what, and the known gaps. Generated and vendor folders (`.next/`, `node_modules/`, `build/`) are excluded.

## 1. What the product is

Nextzen Orbit is a **done-for-you job search service with a client workspace**. Clients apply, get reviewed, pay for a plan, and then a team of staff (admins) applies to jobs on their behalf. Staff tailor resumes and cover letters for each job. Clients also get self-serve AI tools: a resume builder, a JD analyzer, a cover letter generator, career pages, and an application tracker.

Markets: India first (INR pricing, Adzuna India, CTC conventions), with onboarding for the US, UK, Canada, Australia, New Zealand, Singapore, South Africa and others.

## 2. Users and roles

| Role | Who | Access |
| --- | --- | --- |
| `user` | Client | Client app only, after approval **and** payment |
| `sso_user` | Client account created by a super admin | Client app; skips billing |
| `admin` | Recruiter / staff | Admin console for their **assigned** clients |
| `supervisor_admin` | Team lead | All clients, signup review, allocation, analytics |
| `super_admin` | Owner | Everything, including team, SSO users, reference cache |

The four non-`user` roles are "privileged" and bypass payment. Guards are in `src/lib/admin/guards.ts` (`requireAdmin`, `requireSuperAdmin`). Client access goes through assignments (`src/lib/admin/assignments.ts`, migration 039).

## 3. Feature status

### Live and solid

- Google sign-in for clients; email/password sign-in for staff at `/admin/login`.
- Signup application with resume upload, supervisor review and approval (033, 036).
- Paid access: PayU monthly INR checkout, idempotent activation, payment reconciliation (035).
- Resume builder: upload and AI parse (PDF/DOCX), editor with autosave and live preview, version history, PDF/DOCX/LaTeX export.
- AI resume rewriting through the **quality gate** (writer, reviewer, line fixes, then restore anything still unsupported). Tailoring strength options and stage-aware progress bars.
- Templates: Classic, Modern, Creative, Jake's Resume, Deedy Two-Column, Awesome CV, plus three C2C contract templates. A user can pick a page count (Auto, 1, 2, or 3–10), and the fitter guarantees it.
- JD analyzer, cover letter generator, AI bullet/summary helpers, tailoring suggestions.
- Application tracker (Kanban + table).
- Job search workspace: Adzuna multi-country search, saved searches, shortlist, per-client queue (037).
- Admin console: My Clients, the apply queue with claim/complete, per-client resume and cover letter generators, and the standalone document workspace with async jobs (038, 041). Also signup review, team allocation with monthly targets (039), analytics, SSO users, team management, notifications.
- Career workspace: career pages, roadmaps, interview questions, YouTube resources, AI notes, projects.
- Assisted autofill Chrome extension (Workday, Greenhouse, Lever, LinkedIn, Microsoft Careers). It never submits forms.
- Performance read models and the signed access envelope (040).

### Known gaps on main

- **Client email/password sign-in is broken**: the login form posts to `/api/auth/login`, which does not exist. Fixed on beta.
- No daily AI allowance. Only per-minute burst limits on admin generation, plus monthly `ai_usage` token accounting. Allowances are on beta (migration 046).
- The USD gateway is a placeholder, so checkout is INR-only. Annual billing isn't offered at checkout.
- The Vercel functions run in Mumbai (`bom1`) while the database is in Tokyo, which slows every request. Beta moves to `hnd1`.
- Client-generated cover letters aren't saved (the `cover_letters` table is unused). Admin cover letters are saved in `admin_cover_letters`.
- The top-nav search is a UI shell. Notifications work (admin-sent, `notifications` table).
- The legacy `job_queue` columns from auto-apply (`screenshot_url`, `cover_letter_id`) are unused. The table itself is now the admin apply queue.
- The security audit run-3 fixes (F2–F9, N3, N6) are only on beta. On main, some admin routes skip the client-assignment check, and extension telemetry is silently dropped. See [SECURITY.md](SECURITY.md#open-on-main-fixed-on-beta).

## 4. How the app works

### 4.1 Sign-in, approval and payment gate

1. A client starts Google OAuth from `src/app/(auth)/actions.ts` (`signInWithGoogle`, rate limited per IP). Supabase returns to `GET /api/auth/callback`.
2. On first login the callback creates `users` and `profiles` rows with the service-role client, then redirects to `/onboarding` unless the account is already approved.
3. `/onboarding` collects details by country (see [expanded-onboarding.md](expanded-onboarding.md)) and a resume (signed direct upload to the private `signup-resumes` bucket). `POST /api/onboarding` calls the `submit_signup_application` RPC, which stores the snapshot, original file and parsed base resume in one transaction.
4. A supervisor or super admin reviews the application at `/admin/signup-applications` (`review_signup_application`). Rejection blocks the email and phone (`registration_blocks`).
5. An approved client sees `/subscription` until they pay (see [PAYMENTS.md](PAYMENTS.md)).
6. `src/middleware.ts` (default export `proxy`) enforces all of this on every request:
   - It refreshes the Supabase session.
   - Unapproved users get `403 APPROVAL_REQUIRED` from `/api/*`. Unpaid users get `402 PAYMENT_REQUIRED`, except on checkout paths. The exempt paths are `/api/auth`, `/api/webhooks`, `/api/onboarding`, `/api/performance` and `/api/internal/jobs`.
   - Dashboard pages redirect to `/onboarding` or `/subscription` for the same two reasons.
   - It computes `AccountAccess` once (`src/lib/account-access.ts`) and forwards it as an HMAC-signed, 30-second, path-bound header (`src/lib/access-envelope.ts`). Server code reads it with `getRequestAccess` (`src/lib/request-access.ts`).
7. Staff sign in at `/admin/login` with email and password (`src/app/(admin-auth)/actions.ts`, rate limited per IP and per email). The admin layout checks the role.

### 4.2 Resumes

- **Create:** `POST /api/resumes` creates a JSON resume, prefilled with contact details from the profile.
- **Upload:** `POST /api/resumes/upload` takes a PDF or DOCX and stores the original in `resume-uploads`. `src/lib/ai/parsers/resume-parser.ts` extracts the text (`unpdf` / `mammoth`, including DOCX headers and footers), and Kimi K2.5 parses it into the resume schema.
- **Edit:** `src/components/forms/resume-editor-with-preview.tsx` uses react-hook-form sections and autosaves through `PATCH /api/resumes/[id]`. The preview renders the same line plan as the exports.
- **Rewrite:** `POST /api/resumes/[id]/improve` (whole resume) and `/optimize` (against a JD; strength conservative, moderate or aggressive). Both:
  - save a backup version first;
  - run `fitGeneratedResume` → `src/lib/resume/quality-gate.ts`: code checks, a DeepSeek V3.2 review, targeted Kimi line fixes, then restoring any line still unsupported to the candidate's original;
  - stream stage progress (`src/lib/ai/progress.ts`).

  C2C resumes only rewrite the summary.
- **Suggest:** `POST /api/resumes/[id]/tailor` returns suggestions only. `/enhance` rewrites bullets and generates summaries.
- **Export:** `GET /api/resumes/[id]/export?format=pdf|docx|latex&template=`. PDF is rendered locally with `@react-pdf/renderer`, Word with `docx`, and LaTeX is editable source. All three use `src/lib/resume/layout.ts`.
- **Versions:** `GET/POST /api/resumes/[id]/versions` and `/versions/[versionId]/restore`.
- **Delete:** a hard delete of the row and its stored files (`src/lib/resume/delete.ts`).

Details: [resume-generation.md](resume-generation.md).

### 4.3 Analyzer and cover letters

- `POST /api/analyzer` scores a resume against a JD: weighted breakdown, matched and missing skills, suggestions. If the model fails, a code fallback produces the analysis.
- `POST /api/cover-letter/generate` writes a letter from a resume plus a JD. `POST /api/cover-letter/export` returns DOCX or PDF and requires sign-in.
- Usage is recorded per call in `ai_usage` (monthly token totals).

### 4.4 Applications tracker

- `/applications` toggles between Kanban (drag and drop, optimistic status) and a table (search, filter).
- CRUD goes through `/api/applications` and `/api/applications/[id]`, and reads use the `performance_applications` read model.

### 4.5 Job search and the apply queue

- Clients and admins search through `POST /api/jobs/search` (Adzuna, `src/lib/jobs/adzuna.ts`). The search supports country, salary currency, exclusions, posting age and sorting. Results are cached for 5 minutes and written to the `jobs` catalog (`store_job_results`).
- Saved searches live in `saved_job_searches`. Shortlisted jobs go to a client's queue (`enqueue_search_jobs`), and only from fresh catalog rows (under 24 hours old).
- Admins work the queue at `/admin/apply-queue`: they claim a job, apply manually on the employer site, and mark it applied. `applied_by` / `applied_at` are stamped atomically (039).
- Details: [job-search-improvement-plan.md](job-search-improvement-plan.md) and [shared-client-assignments.md](shared-client-assignments.md).

### 4.6 Admin console

| Page | Purpose |
| --- | --- |
| `/admin` | Dashboard stats (`performance_admin_stats`) |
| `/admin/users`, `/admin/users/[id]` | My Clients, client details, files, work authorization, resumes |
| `/admin/users/[id]/generate-resume`, `/generate-cover-letter` | Per-client tailored documents, saved to `admin_resumes` / `admin_cover_letters` |
| `/admin/create-resume`, `/admin/create-cover-letter` | Standalone document workspace with async `document_jobs` |
| `/admin/job-search`, `/admin/apply-queue` | Search for a client, then work their queue |
| `/admin/signup-applications` | Review applications (supervisors and super admins) |
| `/admin/team` | Admin team, allocation, monthly targets |
| `/admin/analytics`, `/admin/analytics/[id]` | Team and per-admin analytics (`performance_admin_analytics`) |
| `/admin/sso-users` | Create and remove SSO client accounts (super admin) |
| `/admin/settings` | Staff settings |

### 4.7 Career workspace

`/career` lists careers. `/career/[slug]` shows a roadmap, interview questions, YouTube resources, AI notes and the user's projects. The data comes from `src/services/*` and `src/features/career`, and the seed data from `npm run seed:career-workspace`. See [CAREER_WORKSPACE_ARCHITECTURE.md](CAREER_WORKSPACE_ARCHITECTURE.md).

### 4.8 Assisted autofill

The extension in `extensions/nextzen-orbit-autofill` detects form fields on supported portals and calls `GET /api/autofill/profile` with the user's session cookie. It fills fields only when the user clicks, and reports anonymous coverage to `POST /api/autofill/telemetry`. File inputs and submission stay manual. See [AUTOFILL_EXTENSION_TESTING.md](AUTOFILL_EXTENSION_TESTING.md).

## 5. Source map

### App routes (`src/app`)

- `(marketing)`: `/`, plus the compliance, privacy, refund and terms pages.
- `(auth)`: `/login`, `/register`, `/verify`, `/onboarding`, `/onboarding/terms`.
- `(dashboard)`: `/dashboard`, `/profile`, `/resumes`, `/resumes/[id]`, `/analyzer`, `/cover-letter`, `/applications`, `/job-search`, `/career`, `/career/[slug]`, `/subscription`, `/settings`.
- `(admin-auth)`: `/admin/login`. `(admin)/admin/*`: the pages in 4.6.
- `api/**`: see [API_DOCS.md](API_DOCS.md).

### Libraries (`src/lib`)

| Path | Responsibility |
| --- | --- |
| `supabase/{client,server,admin}.ts` | Browser, cookie-bound and service-role clients |
| `supabase/middleware.ts` | Session refresh used by the proxy |
| `account-access.ts`, `access-envelope.ts`, `request-access.ts` | One-query access state and the signed header |
| `admin/guards.ts`, `admin/assignments.ts`, `admin/targets.ts` | Staff authorization, client membership, monthly target split |
| `admin/documents/*` | Document workspace upload, parse, generate, jobs |
| `ai/model.ts` | Bedrock client and model ids (`AI_WRITER_MODEL`, `AI_EXTRACT_MODEL`, `AI_REVIEW_MODEL`) |
| `ai/prompts/*` | Prompts; `writing-rules.ts` holds the shared rules and intensity |
| `ai/parsers/resume-parser.ts`, `ai/json.ts`, `ai/progress.ts` | Parsing, JSON extraction, stage progress |
| `resume/quality-gate.ts`, `resume/fit-generated-resume.ts` | The rewrite pipeline and page-count guarantee (`trimToPages`) |
| `resume/layout.ts`, `templates.ts`, `pdf-document.tsx`, `word-document.ts`, `latex-templates.ts` | Rendering and export |
| `payments/*` | PayU provider, USD placeholder, reconcile |
| `subscription.ts`, `subscription-server.ts` | Plans and access checks |
| `jobs/adzuna.ts`, `jobs/queue.ts` | Job search and queue helpers |
| `rate-limit.ts` | Hashed, fail-closed counters (`consume_request_limit`) |
| `onboarding.ts`, `validations/*` | Approval checks and Zod schemas |

### Other folders

- `src/services/*`: data services (careers, jobs, notes, projects, roadmaps, interview, youtube, users, subscription, autofill).
- `src/types/database.ts`, `src/types/api.ts`: DB types; `apiError` / `ERROR_CODES`.
- `src/components/*`: UI primitives (`ui/`), layout, forms, resume, admin, applications, analyzer, career.
- `scripts/test-*.cjs`: `node:test` suites that load sources with mocks (no live server). Some run migrations in PGlite.
- `supabase/migrations/001–041`: the schema used by main. 042–046 are beta-only but already applied to the shared database.

## 6. External services

| Service | Use | Config |
| --- | --- | --- |
| Supabase (Tokyo) | Auth, Postgres, Storage | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |
| Amazon Bedrock | All AI: Kimi K2.5 writes and parses, DeepSeek V3.2 reviews | `AWS_BEARER_TOKEN_BEDROCK`, `AWS_REGION` |
| PayU | INR checkout | `PAYU_MERCHANT_KEY`, `PAYU_MERCHANT_SALT`, `NEXT_PUBLIC_PAYU_URL` |
| Adzuna | Job search | `ADZUNA_APP_ID`, `ADZUNA_APP_KEY` |
| YouTube Data API | Career resource search (`/api/youtube/search`) | `YOUTUBE_API_KEY` |
| Vercel | Hosting, region `bom1` | `NEXT_PUBLIC_APP_URL`, optional `CRON_SECRET` |

The AI cost estimate per feature is in the repo root, `AI_COST_ESTIMATE.md`.
