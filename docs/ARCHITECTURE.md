# Architecture — Nextzen Orbit

## System Overview

Nextzen Orbit is an AI-powered career workspace. It helps users build resumes, search for jobs, and apply faster using an assisted autofill extension (no autonomous auto-apply).

```
┌─────────────────────────────────────────────────────────────────┐
│                 User (Browser + Extension)                      │
└─────────────────┬───────────────────────┬───────────────────────┘
                  │                       │
                  ▼                       ▼
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
│  │  /auth   /profile   /resumes   /jobs/search   /autofill      │ │
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
│                 │  │               │  │                     │
└─────────────────┘  └───────────────┘  └─────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ Chrome Extension (Manifest V3)                                   │
│ - Content scripts detect fields                                  │
│ - Assist panel + popup UI                                        │
│ - User triggers fill; no auto-submit                             │
└─────────────────────────────────────────────────────────────────┘
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
| Storage | Supabase Storage | Resumes + uploads (legacy screenshots) |
| AI | Groq (LLaMA 3.3 70B) | Resume parsing, form detection |
| Job Search | Adzuna API (free) | India job listings |
| Extension | Chrome Extension (MV3) | Assisted autofill |
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
│   │       ├── jobs/           # Job search + legacy queue
│   │       │   ├── search/     # Adzuna search
│   │       │   └── queue/      # Legacy queue management
│   │       ├── autofill/       # Extension profile endpoints
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
├── supabase/
│   └── migrations/             # SQL migrations (001-013)
├── extensions/                 # Chrome extension (assisted autofill)
│   └── nextzen-orbit-autofill/
└── docs/                       # Documentation
```

---

## Data Flow: Assisted Autofill

```
User searches jobs on /dashboard/job-search
        │
        ▼
POST /api/jobs/search   →  Adzuna API  →  job results
        │
        ▼
User opens job listing in a portal
        │
        ▼
Extension detects fields → requests profile from /api/autofill/profile
        │
        ▼
User clicks "Fill" → form populated with profile data
        │
        ▼
User submits manually (no auto-submit)
```

---

## Key Design Decisions

1. **Assisted autofill only** — No autonomous submission; the user stays in control.

2. **Extension-first UX** — Content scripts detect fields and the popup/assist panel drives user-triggered fills.

3. **Portal adapters are modular** — Separate mapping logic for Workday, Greenhouse, Lever, and LinkedIn.

4. **Adzuna over scraping** — Adzuna API is free, legal, and returns structured data for search.

---

*Last updated: 2026-05-23*
