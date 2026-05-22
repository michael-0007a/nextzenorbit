# Architecture — Nextzen Orbit

## System Overview

Nextzen Orbit is an AI-powered job application platform. It helps users build resumes, search for jobs, and auto-apply using browser automation.

```
┌─────────────────────────────────────────────────────────────────┐
│                         User (Browser)                          │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Next.js App (App Router)                      │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │
│  │ Dashboard │  │ Resume   │  │ Job      │  │ Applications     │ │
│  │ Page      │  │ Builder  │  │ Search   │  │ Kanban Tracker   │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └───────┬──────────┘ │
│       │              │             │                │            │
│  ┌────▼──────────────▼─────────────▼────────────────▼──────────┐ │
│  │                     API Routes (/api)                        │ │
│  │  /auth   /profile   /resumes   /jobs/search   /jobs/queue   │ │
│  │  /ai     /webhooks  /cron/cleanup                           │ │
│  └──────────────────────────┬──────────────────────────────────┘ │
└─────────────────────────────┼───────────────────────────────────┘
                              │
              ┌───────────────┼───────────────────────┐
              ▼               ▼                       ▼
┌─────────────────┐  ┌───────────────┐  ┌─────────────────────┐
│   Supabase      │  │   Groq AI     │  │   Adzuna API        │
│   - Auth        │  │   (LLaMA 3.3) │  │   (Job Search)      │
│   - Database    │  │               │  │                     │
│   - Storage     │  │   - Resume    │  │   - Free tier       │
│     - resumes   │  │     parsing   │  │   - India market    │
│     - shots     │  │   - Form      │  │                     │
│                 │  │     detection │  │                     │
└────────┬────────┘  └───────────────┘  └─────────────────────┘
         │
         │  polls job_queue
         ▼
┌──────────────────────────────────────┐
│   Playwright Worker (background)     │
│                                      │
│   1. Poll Supabase for pending jobs  │
│   2. Open job URL in browser         │
│   3. Detect form (AI or hardcoded)   │
│   4. Fill fields from user profile   │
│   5. Take proof screenshot           │
│   6. Upload to Supabase Storage      │
│   7. Mark job as applied             │
│   8. Create application record       │
└──────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Next.js 16 (App Router) | SSR + Client Components |
| Styling | Tailwind CSS | Utility-first CSS |
| UI | Custom Yeldra design system | `src/components/ui/` |
| Auth | Supabase Auth (Google OAuth) | Login/signup |
| Database | Supabase PostgreSQL | All data storage |
| Storage | Supabase Storage | Resumes + screenshots |
| AI | Groq (LLaMA 3.3 70B) | Resume parsing, form detection |
| Job Search | Adzuna API (free) | India job listings |
| Automation | Playwright | Browser automation |
| Payments | Razorpay | Subscription billing |

---

## Directory Structure

```
nextzenorbit/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # Login, signup pages
│   │   ├── (dashboard)/        # Protected dashboard pages
│   │   │   ├── dashboard/      # Main dashboard
│   │   │   ├── profile/        # Profile + job preferences
│   │   │   ├── resumes/        # Resume builder
│   │   │   ├── applications/   # Kanban tracker
│   │   │   └── job-search/     # Job search + queue
│   │   └── api/                # API routes
│   │       ├── auth/           # Auth callbacks
│   │       ├── profile/        # Profile CRUD
│   │       ├── resumes/        # Resume CRUD
│   │       ├── ai/             # AI endpoints
│   │       ├── jobs/           # Job search + queue
│   │       │   ├── search/     # Adzuna search
│   │       │   └── queue/      # Queue management
│   │       ├── webhooks/       # Payment webhooks
│   │       └── cron/           # Scheduled cleanup
│   ├── components/
│   │   ├── ui/                 # Design system (Button, Card, etc.)
│   │   ├── layout/             # Sidebar, PageHeader
│   │   ├── forms/              # ProfileForm, ResumeForm
│   │   └── dashboard/          # JobSearchClient
│   ├── lib/
│   │   ├── supabase/           # Supabase clients (server, admin)
│   │   ├── ai/                 # Groq client + prompts
│   │   ├── jobs/               # Adzuna API client
│   │   └── validations/        # Zod schemas
│   └── types/                  # TypeScript types (database.ts)
├── worker/                     # Standalone Playwright worker
│   ├── src/
│   │   ├── index.ts            # Bootstrap (loads env)
│   │   ├── worker.ts           # Main polling loop
│   │   ├── supabase.ts         # Worker Supabase client
│   │   ├── browser.ts          # Playwright manager
│   │   └── fillers/
│   │       ├── indeed.ts       # Indeed form selectors
│   │       └── generic.ts      # AI-powered form filler
│   ├── package.json
│   └── tsconfig.json
├── supabase/
│   └── migrations/             # SQL migrations (001-013)
└── docs/                       # Documentation
```

---

## Data Flow: Auto-Apply Pipeline

```
User searches jobs on /dashboard/job-search
        │
        ▼
POST /api/jobs/search   →  Adzuna API  →  job results
        │
        ▼
User clicks "Add to Queue"
        │
        ▼
POST /api/jobs/queue    →  INSERT into job_queue (status: pending)
        │
        ▼
Worker polls job_queue  →  picks job   →  status: processing
        │
        ▼
Playwright opens job URL → detects form → fills fields
        │
        ▼
Screenshot captured     →  uploaded to Supabase Storage
        │
        ▼
job_queue updated       →  status: applied
                        →  screenshot_url + 7-day expiry
        │
        ▼
Application record created in applications table
        │
        ▼
User sees result on dashboard + screenshot proof in queue panel
```

---

## Key Design Decisions

1. **Worker is separate from Next.js** — Playwright needs system-level Chromium, doesn't work in serverless. Runs as a standalone process.

2. **Lazy Supabase client in worker** — ESM imports execute before module-level code, so dotenv must load in a bootstrap file (`index.ts`) that dynamically imports the worker.

3. **Indeed-first, AI-fallback** — Hardcoded Indeed selectors are fast and reliable. AI generic filler is the fallback for unknown job sites.

4. **7-day screenshot TTL** — Screenshots are proof of submission, not permanent records. Signed URLs expire automatically. Cleanup cron removes the files.

5. **Adzuna over scraping** — Adzuna API is free, legal, and returns structured data. Playwright scraping is reserved for the apply step, not job discovery.

---

*Last updated: 2026-03-20*
