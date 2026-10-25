# Changelog — Nextzen Orbit

## v0.6.0 — Auto-Apply System (2026-03-20)

### Added
- **Job Preferences** — New profile section with preferred role, location, salary range, work type, experience, and portal selection
- **Job Search** — Adzuna API integration for searching real job listings (India market)
- **Job Queue** — Add jobs to auto-apply queue from search results, with deduplication
- **Playwright Worker** — Background worker that polls queue, opens job URLs, and fills application forms
- **Indeed Form Filler** — Hardcoded selectors for Indeed Easy Apply forms
- **AI Form Filler** — Groq/LLaMA-powered generic form detection and filling
- **Screenshot Proof** — Worker captures proof screenshots after applying, uploaded to Supabase Storage with 7-day signed URLs
- **Cleanup Cron** — `/api/cron/cleanup` endpoint to delete expired screenshots
- **Sidebar Navigation** — "Job Search" item with Rocket icon and NEW badge

### Database
- Migration 011: Job preference columns on `profiles`
- Migration 012: `job_queue` table with RLS
- Migration 013: Screenshot proof columns (`screenshot_url`, `screenshot_expires_at`)

### Files Added
- `src/app/(dashboard)/job-search/page.tsx` — Job Search page
- `src/components/dashboard/job-search-client.tsx` — Interactive search UI
- `src/lib/jobs/adzuna.ts` — Adzuna API client
- `src/app/api/jobs/search/route.ts` — Search API
- `src/app/api/jobs/queue/route.ts` — Queue API
- `src/app/api/cron/cleanup/route.ts` — Screenshot cleanup
- `src/lib/ai/prompts/auto-cover-letter.ts` — Batch cover letter prompt
- `worker/` — Entire worker directory (index.ts, worker.ts, supabase.ts, browser.ts, fillers/)

### Updated
- `docs/DEPLOYMENT.md` — Rewritten for Fly.io deployment
- `docs/ARCHITECTURE.md` — Full system architecture with auto-apply pipeline
- `docs/DATABASE_SCHEMA.md` — All tables documented
- `docs/API_DOCS.md` — New endpoints documented

---

## v0.5.0 — Payment Integration (2026-03-15)

### Added
- Razorpay payment integration
- Subscription tiers (Free, Pro, Premium)
- Payment webhook handling
- AI usage tracking

---

## v0.4.0 — Resume Builder (2026-03-10)

### Added
- Resume builder with live preview
- AI resume analyzer (Groq/LLaMA)
- Multiple resume templates
- Resume PDF export

---

## v0.3.0 — Dashboard (2026-03-05)

### Added
- Application tracking Kanban board
- Dashboard with stats cards
- Profile management

---

## v0.2.0 — Authentication (2026-03-02)

### Added
- Google OAuth via Supabase
- Login/signup pages
- Protected routes

---

## v0.1.0 — Initial Setup (2026-03-01)

### Added
- Next.js 16 project scaffolding
- Supabase integration
- Yeldra design system
- Landing page

---

*Last updated: 2026-03-20*
