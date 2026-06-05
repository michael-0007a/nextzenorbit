# Nextzen Orbit - Whole App Documentation

Last reviewed from code: 2026-04-10

For non-technical readers (leadership, operations, and cross-functional team members), read `docs/TEAM_CONTEXT_BRIEF.md` first.

This document is the code-grounded overview of the current app. It explains:

- what the product is trying to do
- what is already built
- how the app works end to end
- what each major file/folder is responsible for
- what is missing, inconsistent, or still rough

This document focuses on source code and real runtime flows. Generated and vendor folders such as `.next/`, `node_modules/`, `worker/node_modules/`, and `supabase/.temp/` are intentionally excluded from the responsibility map.

## 1. What the app is trying to do

Nextzen Orbit is an AI-assisted job search workspace built for the Indian job market.

The intended product flow is:

1. A user signs in with Google.
2. The user fills a profile with personal details and job preferences.
3. The user creates or uploads resumes.
4. AI helps parse, improve, tailor, and analyze those resumes against job descriptions.
5. The user generates cover letters.
6. The user tracks applications in a Kanban/table tracker.
7. The user searches jobs from external sources.
8. Matching jobs are surfaced for manual applications.
9. An assisted autofill extension helps fill application forms while the user controls submission.
10. Subscription and usage tracking support a future paid product model.

In short: resume builder + AI application copilot + job tracker + assisted autofill.

## 2. What is already built

### Core product areas

- Public landing page and marketing shell
- Google OAuth login/register flow with Supabase
- Auth-protected dashboard shell
- Profile CRUD, including job preferences for assisted autofill
- Resume CRUD
- Resume upload from PDF/DOCX
- AI resume parsing into structured JSON
- Resume editor with autosave and live preview
- Resume export to PDF, DOCX, and LaTeX
- Resume version history and restore
- Job description analyzer with score, keyword gaps, and suggestions
- AI bullet rewriting and summary generation
- AI full-resume improvement
- AI JD-based optimization with conservative/moderate/aggressive modes
- AI tailoring suggestions for specific jobs
- Cover letter generation and export
- Application tracker in Kanban and table forms
- Subscription data model and payment order/webhook foundation
- Adzuna-powered job search
- Legacy job queue for auto-apply (deprecated)
- Screenshot viewing and screenshot cleanup cron (legacy worker support)
- Legacy Playwright worker for background auto-apply (deprecated)

### Important architectural decisions already present

- Next.js App Router is used for all pages and API routes.
- Supabase handles auth, PostgreSQL, and storage.
- Groq is the AI provider.
- Zod validates profile, resume, and API request data.
- Service-role Supabase clients are used in server routes where RLS recursion or privileged access would otherwise block the flow.
- Assisted autofill runs in a Chrome extension; no autonomous submission is allowed.

## 3. Current status by feature

### Solid / active

- Auth and dashboard shell
- Profile management
- Resume upload, editing, exporting, and versioning
- AI resume analysis/improvement/tailoring flows
- Cover letter generation UI and API
- Application tracker
- Job search UI (Adzuna)
- Legacy job queue APIs (deprecated)

### Partly built / foundation exists but not fully finished

- Subscription enforcement
- Payment checkout UX
- Assisted autofill portal coverage and field mapping
- Cover letter persistence and queue integration
- Dashboard analytics and activity

### Clearly unfinished or placeholder

- Real notification system
- Real search in top nav
- Final subscription upgrade flow
- Autofill adapter library and portal QA automation
- Persistent cover-letter records despite having a table

## 4. How the app works

## 4.1 Auth and session flow

1. Public pages live under `src/app/page.tsx` and `src/app/(auth)/*`.
2. Google sign-in starts from `src/app/(auth)/actions.ts`.
3. Supabase OAuth returns to `src/app/api/auth/callback/route.ts`.
4. On first login, the callback creates rows in:
   - `users`
   - `profiles`
   - `subscriptions`
5. `src/proxy.ts` refreshes Supabase auth cookies and redirects anonymous users away from protected pages.
6. Dashboard routes also do their own server-side `getUser()` checks before rendering.

## 4.2 Resume creation and editing flow

### Blank resume flow

1. User clicks "New Resume" in `src/components/resume/resume-grid.tsx`.
2. `POST /api/resumes` creates a structured JSON resume skeleton.
3. If profile data exists, basic contact info is prefilled.
4. User is redirected to `/(dashboard)/resumes/[id]`.
5. `src/components/forms/resume-editor-with-preview.tsx` loads the resume into a tabbed editor with autosave.

### Upload flow

1. User uploads PDF/DOCX in `src/components/resume/resume-grid.tsx`.
2. `POST /api/resumes/upload` validates file type and size.
3. Raw file is uploaded to the `resume-uploads` storage bucket.
4. `src/lib/ai/parsers/resume-parser.ts` extracts text using `unpdf` or `mammoth`.
5. The extracted text is sent to Groq using `RESUME_PARSER_PROMPT_V1`.
6. Parsed JSON is validated against the resume schema.
7. A resume row is created in `resumes`.
8. AI token usage is recorded in `ai_usage`.

### Editing, preview, export, and versions

1. Resume content is edited section-by-section through `react-hook-form`.
2. Autosave triggers PATCH requests to `/api/resumes/[id]`.
3. `ResumePreview` renders a live HTML/CSS preview of the resume.
4. `ResumeActions` exposes:
   - export
   - template change
   - AI improvement
   - JD optimization
   - version save/restore
5. PDF export uses:
   - LaTeX via an external API for the preferred path
   - React PDF as fallback for resume export
6. DOCX export uses the `docx` package.
7. Version snapshots are stored in `resume_versions`.

## 4.3 AI analysis and optimization flow

### Job analyzer

1. User opens `/analyzer`.
2. `src/components/analyzer/job-analyzer-form.tsx` submits job description + resume selection.
3. `POST /api/analyzer` fetches the resume and formats it as text.
4. Groq runs `JOB_ANALYZER_PROMPT_V2`.
5. API returns:
   - overall score
   - weighted breakdown
   - keyword matches
   - gaps
   - suggestions
   - extracted job summary

### Resume improvement

- `POST /api/resumes/[id]/improve` runs a whole-resume rewrite using `RESUME_IMPROVER_PROMPT_V1`.
- It saves a backup version before updating the live resume.

### JD optimization

- `POST /api/resumes/[id]/optimize` tailors the resume to a specific JD.
- The user can choose:
  - conservative
  - moderate
  - aggressive
- Aggressive mode requires acknowledgment in the UI.
- A backup version is saved before the optimized version is written.

### Tailoring suggestions

- `POST /api/resumes/[id]/tailor` produces suggestions instead of directly mutating the resume.
- Suggestions include:
  - section ordering
  - keywords to add
  - bullet rewrites
  - summary rewrite
  - general tips

## 4.4 Cover letter flow

1. User selects a resume and pastes a job description at `/cover-letter`.
2. `POST /api/cover-letter/generate` fetches the selected resume.
3. Groq runs `COVER_LETTER_PROMPT_V1`.
4. The generated text is returned to the client.
5. Export options:
   - TXT direct download in the browser
   - DOCX via `/api/cover-letter/export`
   - PDF via LaTeX API in `/api/cover-letter/export`

Note: generated cover letters are not currently saved in the `cover_letters` table.
Note: `POST /api/cover-letter/export` currently does not enforce auth at the route level.

## 4.5 Application tracking flow

1. Applications page fetches rows from `applications`.
2. `ApplicationsView` toggles between Kanban and table mode.
3. Kanban supports:
   - optimistic drag/drop status updates
   - add/edit/delete
4. Table supports:
   - search
   - status filtering
5. All CRUD goes through `/api/applications` and `/api/applications/[id]`.

## 4.6 Job search and assisted autofill flow

### Search

1. Job search page preloads:
   - user profile defaults
   - available resumes
2. `JobSearchClient` submits to `POST /api/jobs/search`.
3. `src/lib/jobs/adzuna.ts` calls Adzuna and normalizes results.
4. User opens a job listing and applies manually (no auto-apply queue).

### Assisted autofill (extension)

1. User opens a job portal with the extension active.
2. The content script detects fields and maps them to profile/resume data.
3. The extension requests the user's autofill profile from the app API.
4. The user reviews and clicks "Fill"; final submission remains manual.

Note: the legacy job_queue + worker flow is deprecated and retained only for historical data.

## 4.7 Subscription and payments flow

1. OAuth callback creates a trialing `subscriptions` row for new users.
2. Subscription page reads:
   - `subscriptions`
   - `ai_usage`
   - resume count
3. `POST /api/payments/create-order` calculates GST and creates a provider order.
4. Payment provider is selected through `src/lib/payments/index.ts`.
5. Webhooks update `subscriptions` and store `webhook_events`.

Important: order creation and webhook handling exist, but a complete client checkout flow is not finished in this repo.

## 5. Source map: what files do what

## 5.1 Root files

- `package.json` - main web app dependencies and scripts.
- `package-lock.json` - npm lockfile for the web app.
- `next.config.ts` - Next.js config; enables React Compiler and Google image domains.
- `tsconfig.json` - main TypeScript config; excludes `worker/`.
- `eslint.config.mjs` - ESLint setup for Next.js + TypeScript.
- `.env.local` - local environment variables for app services.
- `README.md` - older high-level overview; currently behind the real code.
- `Guidelines.md` - project guidance/reference document.
- `build-output.txt`, `tsc-out.txt`, `tsc-output.txt` - local diagnostic artifacts, not product code.
- `test-types.ts` - local type/testing helper artifact.

## 5.2 Public assets

- `public/file.svg`
- `public/globe.svg`
- `public/next.svg`
- `public/vercel.svg`
- `public/window.svg`

These are starter/static assets. There is currently no `public/templates/` directory even though some template configs reference preview image paths there.

## 5.3 App entry and routing

- `src/proxy.ts` - auth/session middleware-like gate for route access.
- `src/app/layout.tsx` - root HTML shell and metadata.
- `src/app/globals.css` - full design tokens, Tailwind v4 theme variables, global styles.
- `src/app/page.tsx` - public landing page.

## 5.4 Auth pages and actions

- `src/app/(auth)/layout.tsx` - auth-page shell.
- `src/app/(auth)/actions.ts` - Google sign-in and sign-out server actions.
- `src/app/(auth)/login/page.tsx` - login screen.
- `src/app/(auth)/register/page.tsx` - signup/trial screen.
- `src/app/(auth)/verify/page.tsx` - email verification placeholder screen.

## 5.5 Dashboard pages

- `src/app/(dashboard)/layout.tsx` - shared dashboard shell with sidebar and top nav.
- `src/app/(dashboard)/dashboard/page.tsx` - overview page with hero, counts, and placeholders.
- `src/app/(dashboard)/profile/page.tsx` - profile loader/initializer.
- `src/app/(dashboard)/resumes/page.tsx` - resume list page.
- `src/app/(dashboard)/resumes/[id]/page.tsx` - single resume editor page.
- `src/app/(dashboard)/analyzer/page.tsx` - job analyzer page.
- `src/app/(dashboard)/cover-letter/page.tsx` - cover letter generator page.
- `src/app/(dashboard)/applications/page.tsx` - application tracker page.
- `src/app/(dashboard)/job-search/page.tsx` - job search and queue page.
- `src/app/(dashboard)/subscription/page.tsx` - subscription page.
- `src/app/(dashboard)/settings/page.tsx` - settings/security page.

## 5.6 API routes

### Auth

- `src/app/api/auth/callback/route.ts` - OAuth callback, user/profile/subscription bootstrap.

### Profile

- `src/app/api/profile/route.ts` - profile GET/PATCH.

### Applications

- `src/app/api/applications/route.ts` - list/create applications.
- `src/app/api/applications/[id]/route.ts` - get/update/delete a single application.

### Resume CRUD and file handling

- `src/app/api/resumes/route.ts` - list/create resumes.
- `src/app/api/resumes/upload/route.ts` - upload and AI-parse PDF/DOCX.
- `src/app/api/resumes/[id]/route.ts` - get/update/delete resume.

### Resume AI

- `src/app/api/resumes/[id]/enhance/route.ts` - bullet rewrite and summary generation.
- `src/app/api/resumes/[id]/improve/route.ts` - whole-resume improvement.
- `src/app/api/resumes/[id]/optimize/route.ts` - JD-targeted optimization with embellishment levels.
- `src/app/api/resumes/[id]/tailor/route.ts` - suggestion-only tailoring API.

### Resume export and versions

- `src/app/api/resumes/[id]/export/route.ts` - PDF/DOCX/LaTeX export.
- `src/app/api/resumes/[id]/versions/route.ts` - list/create resume snapshots.
- `src/app/api/resumes/[id]/versions/[versionId]/restore/route.ts` - restore a version.

### Analyzer and cover letters

- `src/app/api/analyzer/route.ts` - AI resume-vs-JD analysis.
- `src/app/api/cover-letter/generate/route.ts` - AI cover letter generation.
- `src/app/api/cover-letter/export/route.ts` - PDF/DOCX export for cover letters; currently does not enforce auth.

### Jobs and worker support

- `src/app/api/jobs/search/route.ts` - Adzuna job search.
- `src/app/api/jobs/queue/route.ts` - list/add queued jobs.
- `src/app/api/jobs/screenshot/route.ts` - regenerate signed screenshot URLs.
- `src/app/api/cron/cleanup/route.ts` - screenshot cleanup job.

### Payments and webhooks

- `src/app/api/payments/create-order/route.ts` - create payment orders.
- `src/app/api/webhooks/razorpay/route.ts` - Razorpay webhook processing.
- `src/app/api/webhooks/cashfree/route.ts` - Cashfree webhook processing.

## 5.7 Components

### Layout and providers

- `src/components/providers/providers.tsx` - theme provider + sonner toaster.
- `src/components/layout/sidebar.tsx` - main dashboard navigation.
- `src/components/layout/top-nav.tsx` - top bar with avatar menu and placeholder search/notifications.
- `src/components/layout/page-header.tsx` - reusable page title block.
- `src/components/layout/index.ts` - re-export file for layout components.

### Dashboard

- `src/components/dashboard/job-search-client.tsx` - interactive search/queue UI.
- `src/components/dashboard/trial-banner.tsx` - trial state banner.
- `src/components/dashboard/activity-feed.tsx` - placeholder/unused activity widget.
- `src/components/dashboard/metric-card.tsx` - reusable metric component, currently unused.
- `src/components/dashboard/quick-actions.tsx` - reusable quick-action cards, currently unused.

### Profile and settings

- `src/components/forms/profile-form.tsx` - profile editor with job preferences.
- `src/components/forms/settings-form.tsx` - password/session/account danger zone UI.

### Resume editing

- `src/components/forms/resume-editor-with-preview.tsx` - current main resume editor.
- `src/components/forms/resume-editor.tsx` - older editor without preview; appears superseded.
- `src/components/forms/resume-sections/contact-section.tsx` - contact form section.
- `src/components/forms/resume-sections/summary-section.tsx` - summary form section.
- `src/components/forms/resume-sections/experience-section.tsx` - experience form section.
- `src/components/forms/resume-sections/education-section.tsx` - education form section.
- `src/components/forms/resume-sections/skills-section.tsx` - skills form section.
- `src/components/forms/resume-sections/projects-section.tsx` - projects form section.
- `src/components/forms/resume-sections/certifications-section.tsx` - certifications form section.
- `src/components/forms/resume-sections/languages-section.tsx` - languages form section.

### Resume actions and preview

- `src/components/resume/resume-grid.tsx` - resume list/create/upload/delete UI.
- `src/components/resume/resume-actions.tsx` - export/template/history/AI action bar.
- `src/components/resume/resume-preview.tsx` - live preview that imitates export layout.
- `src/components/resume/template-selector.tsx` - template chooser UI.
- `src/components/resume/ai-enhance.tsx` - AI bullet and summary helpers.
- `src/components/resume/resume-tailor-panel.tsx` - suggestion-only tailoring UI.

### Analyzer

- `src/components/analyzer/job-analyzer-form.tsx` - analyzer form and results display.
- `src/components/analyzer/keyword-heatmap.tsx` - visualization for keyword matching.
- `src/components/analyzer/radar-chart.tsx` - breakdown chart for analyzer scores.

### Cover letters

- `src/components/cover-letter/cover-letter-generator.tsx` - cover letter form/output/export UI.

### Applications

- `src/components/applications/applications-view.tsx` - toggles between Kanban and table.
- `src/components/applications/applications-kanban.tsx` - drag/drop tracker and modal CRUD.
- `src/components/applications/applications-table.tsx` - search/filter table view.
- `src/components/applications/new-application-button.tsx` - older add-application component; appears unused by the current page.

### Subscription

- `src/components/subscription/subscription-details.tsx` - current plan and usage display.
- `src/components/subscription/plan-cards.tsx` - available plan cards, upgrade CTA placeholder.

### UI primitives

- `src/components/ui/avatar.tsx` - avatar display.
- `src/components/ui/badge.tsx` - badge primitive.
- `src/components/ui/button.tsx` - button primitive.
- `src/components/ui/card.tsx` - card primitives.
- `src/components/ui/input.tsx` - input field primitive.
- `src/components/ui/modal.tsx` - modal component.
- `src/components/ui/sheet.tsx` - sheet/drawer primitive.
- `src/components/ui/skeleton.tsx` - loading skeletons.
- `src/components/ui/textarea.tsx` - textarea primitive.
- `src/components/ui/theme-toggle.tsx` - theme switcher.
- `src/components/ui/use-toast.ts` - toast helper used by some older components.
- `src/components/ui/index.ts` - UI re-exports.

## 5.8 Hooks

- `src/hooks/use-user.ts` - client hook for Supabase auth state.
- `src/hooks/use-subscription.ts` - client hook for subscription state and plan checks.

## 5.9 Libraries

### Supabase

- `src/lib/supabase/server.ts` - server-side Supabase client with cookies.
- `src/lib/supabase/client.ts` - browser Supabase client.
- `src/lib/supabase/admin.ts` - service-role client for privileged access.
- `src/lib/supabase/middleware.ts` - session refresh helper used by `src/proxy.ts`.
- `src/lib/supabase/helpers.ts` - helper utilities for DB writes used by some webhook flows.

### AI parser and prompts

- `src/lib/ai/parsers/resume-parser.ts` - file text extraction + AI JSON normalization.
- `src/lib/ai/prompts/resume-parser.ts` - structured resume parsing prompt.
- `src/lib/ai/prompts/job-analyzer.ts` - job analyzer prompt and types.
- `src/lib/ai/prompts/resume-enhancer.ts` - bullet rewrite, summary, and cover-letter prompts.
- `src/lib/ai/prompts/resume-improver.ts` - whole-resume and JD optimizer prompts.
- `src/lib/ai/prompts/resume-tailor.ts` - suggestion-only tailoring prompt.
- `src/lib/ai/prompts/auto-cover-letter.ts` - batch auto-cover-letter prompt, currently unused.

### Resume generation

- `src/lib/resume/templates.ts` - React PDF template metadata.
- `src/lib/resume/latex-templates.ts` - LaTeX template list and LaTeX generation.
- `src/lib/resume/pdf-document.tsx` - React PDF document renderer.
- `src/lib/resume/word-document.ts` - DOCX generator.

### Business logic and utilities

- `src/lib/subscription.ts` - plan definitions and plan checks.
- `src/lib/jobs/adzuna.ts` - Adzuna API client and search schema.
- `src/lib/utils.ts` - class merging, INR formatting, phone validation, delay.
- `src/lib/animations/index.ts` - animation re-exports.
- `src/lib/animations/presets.ts` - Framer Motion presets.

### Payments

- `src/lib/payments/index.ts` - provider selection and exports.
- `src/lib/payments/types.ts` - payment interfaces, pricing, GST.
- `src/lib/payments/razorpay.ts` - Razorpay provider and webhook signature verification.
- `src/lib/payments/cashfree.ts` - Cashfree provider and webhook signature verification.

### Validation

- `src/lib/validations/profile.ts` - profile Zod schema.
- `src/lib/validations/resume.ts` - full resume JSON schema and form schema.

## 5.10 Types

- `src/types/database.ts` - application-wide typed view of the Supabase schema.
- `src/types/api.ts` - standard API success/error helpers and codes.

## 5.11 Legacy worker (deprecated)

This worker is kept for reference only and is not part of the assisted autofill roadmap.

- `worker/package.json` - worker-only dependencies and scripts.
- `worker/src/index.ts` - bootstrap loader for env vars.
- `worker/src/worker.ts` - main polling loop and orchestration.
- `worker/src/browser.ts` - browser/page lifecycle and proof overlay.
- `worker/src/supabase.ts` - worker-side service-role DB/storage operations.
- `worker/src/fillers/indeed.ts` - hardcoded Indeed form filler.
- `worker/src/fillers/generic.ts` - AI-detected generic form filler.

## 5.12 Database and migrations

- `supabase/migrations/001_initial_schema.sql` - users, profiles, subscriptions, resumes, applications, ai_usage, webhook_events, base RLS.
- `supabase/migrations/002_resume_storage.sql` - resume storage bucket and policies.
- `supabase/migrations/003_add_avatar_url.sql` - profile expansion fields.
- `supabase/migrations/004_full_name.sql` - duplicate profile-field migration pattern.
- `supabase/migrations/005_fix_users_rls_recursion.sql` - RLS recursion fix for users.
- `supabase/migrations/006_add_deleted_at.sql` - deleted_at on resumes.
- `supabase/migrations/007_fix_all_rls_recursion.sql` - broader RLS recursion fixes.
- `supabase/migrations/008_resume_versions_cover_letters.sql` - resume_versions and cover_letters tables.
- `supabase/migrations/009_applications_table.sql` - applications table migration pass.
- `supabase/migrations/010_storage_buckets.sql` - storage bucket setup.
- `supabase/migrations/011_job_preferences.sql` - profile job-preference columns.
- `supabase/migrations/012_job_queue.sql` - job_queue table and policies.
- `supabase/migrations/013_screenshot_columns.sql` - screenshot proof columns.

## 5.13 Scripts and docs

- `scripts/fix-rls.ts` - one-off helper that prints SQL guidance for RLS recursion issues.
- `docs/ARCHITECTURE.md` - architecture-focused doc, but older than the current codebase.
- `docs/API_DOCS.md` - route reference, also partly outdated.
- `docs/DATABASE_SCHEMA.md` - schema doc, partly outdated.
- `docs/DEPLOYMENT.md`, `docs/PAYMENTS.md`, `docs/SECURITY.md`, `docs/UI_PATTERNS.md`, `docs/ASSUMPTIONS.md`, `docs/CHANGELOG.md` - specialized docs that should be treated as supporting material, not source of truth over code.
- `docs/resume_1773335132826.pdf` - sample/generated PDF artifact.

## 6. Data model

Main tables used by the app:

- `users` - public user identity mirror for app-level relations.
- `profiles` - profile details and job preferences.
- `subscriptions` - plan, provider, billing, and trial state.
- `resumes` - structured resume JSON content.
- `resume_versions` - resume snapshots for rollback/history.
- `cover_letters` - schema exists but current generation flow does not save to it.
- `applications` - tracked job applications.
- `job_queue` - legacy auto-apply queue (deprecated).
- `ai_usage` - token accounting per billing period.
- `webhook_events` - webhook audit log.

Storage buckets:

- `resume-uploads` - uploaded PDF/DOCX source files
- `screenshots` - legacy proof images from worker submissions (deprecated)

## 7. External services and environment assumptions

The app currently depends on:

- Supabase URL + anon key + service role key
- Groq API key
- Adzuna API credentials
- Razorpay credentials and webhook secret
- Cashfree credentials and webhook secret
- `NEXT_PUBLIC_APP_URL`
- `CRON_SECRET` for screenshot cleanup route

Legacy worker dependencies (deprecated):

- its own `.env.local`
- Playwright/Chromium runtime support
- access to the same Supabase and Groq credentials

## 8. What is lacking or inconsistent

This section is based on the current code, not aspirational docs.

### Product and flow gaps

- Subscription enforcement is effectively disabled in `src/lib/subscription.ts`.
- `canCreateResume()` and `canTrackApplication()` always return `true` in dev mode.
- The plan cards shown to users do not match the live plan logic.
- Upgrade buttons in `src/components/subscription/plan-cards.tsx` do not trigger a real checkout flow.
- Payment order creation and webhook handlers exist, but there is no finished client-side payment completion flow in the repo.
- Generated cover letters are not stored in the `cover_letters` table.
- `job_queue.cover_letter_id` exists but is not used by the current queue/worker flow.

### Dashboard gaps

- Dashboard "Avg. Match" and "AI Credits" are placeholders in `src/app/(dashboard)/dashboard/page.tsx`.
- Recent activity is an empty-state block only.
- `activity-feed.tsx`, `metric-card.tsx`, and `quick-actions.tsx` exist but are not used by the current dashboard page.
- Top-nav search and notifications are UI placeholders only.

### Assisted autofill gaps

- Field detection reliability across Workday, Greenhouse, Lever, and LinkedIn Easy Apply.
- Portal-specific adapters and mapping coverage are not implemented yet.
- Profile-to-form mapping review UI is still missing.
- No end-to-end QA harness for autofill flows.
- Extension packaging and distribution are not set up.

### Data/doc mismatches

- `src/app/api/resumes/route.ts` comment says "non-deleted", but GET does not filter `deleted_at IS NULL`.
- `src/app/api/resumes/[id]/route.ts` comments say "soft-delete", but the implementation performs a hard delete.
- Older docs and README still mention older phase plans or older stack versions.
- `README.md` says Next.js 15, but `package.json` uses Next.js `16.1.6`.
- Template configs in `src/lib/resume/templates.ts` and `src/lib/resume/latex-templates.ts` reference preview image paths under `/templates/...`, but `public/templates/` does not exist.

### Security and access gaps

- `src/app/api/cover-letter/export/route.ts` does not validate user auth before exporting content.
- `src/proxy.ts` does not include `/cover-letter` and `/job-search` in `PROTECTED_PATHS`; those pages are still protected by dashboard layout auth, but route protection logic is split across two layers.
- API response shapes are inconsistent across routes: some use `apiError(...)` (`src/types/api.ts` contract), while others return custom `{ success: false, error: { message } }` payloads.

### Plan and pricing inconsistencies

- `src/lib/subscription.ts` sets all plan quotas to `Infinity`.
- `src/components/subscription/plan-cards.tsx` still displays finite limits like "2 Resumes" and "50K AI Tokens/month".
- `PLANS.free` and `PLANS.pro` both currently mark `cover_letter` and `priority_ai` as `true`, while the UI feature table says those are excluded.

### Legacy or currently unused files

- `src/components/forms/resume-editor.tsx` - older editor, likely replaced by the preview version.
- `src/components/applications/new-application-button.tsx` - old add-application flow using direct browser Supabase client.
- `src/components/dashboard/activity-feed.tsx` - not wired into the dashboard page.
- `src/components/dashboard/metric-card.tsx` - not wired into the dashboard page.
- `src/components/dashboard/quick-actions.tsx` - not wired into the dashboard page.
- `src/lib/ai/prompts/auto-cover-letter.ts` - prompt exists but is not used anywhere in `src/`.

## 9. Recommended next steps

If the goal is to make the app production-ready, the highest-value next steps are:

1. Decide the true product scope.
   - Resume copilot only
   - Resume + tracker
   - Assisted autofill extension

2. Finish subscription truth and pricing.
   - align `PLANS`
   - align UI feature tables
   - re-enable real enforcement

3. Finish payment UX.
   - connect plan cards to checkout
   - verify post-payment state transitions in the UI

4. Build assisted autofill.
   - portal adapters and field maps
   - user review + one-click fill
   - per-portal QA and reliability tracking
   - extension packaging + distribution

5. Clean up docs and legacy files.
   - refresh README
   - remove or archive unused dashboard/application components
   - align specialized docs with the code

6. Decide whether cover letters should be persisted.
   - if yes, use the `cover_letters` table
   - connect it to `job_queue.cover_letter_id`

## 10. Short repo summary

Nextzen Orbit is already a substantial app. The strongest parts today are the resume system, AI-assisted editing/analyzing, and the application tracker. The platform is now shifting from legacy auto-apply toward an assisted autofill extension that keeps users in control of submission.
