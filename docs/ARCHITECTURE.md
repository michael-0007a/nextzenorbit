# Architecture — Nextzen Orbit

## System Overview

Nextzen Orbit is an AI-powered resume optimization and job application SaaS platform targeting the Indian job market. Built with Next.js 15 (App Router), Supabase, and Groq AI (LLaMA 3.3 70B).

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, React 19, TypeScript, TailwindCSS v4 |
| Backend | Next.js API Routes (Server Actions) |
| Database | Supabase PostgreSQL with RLS |
| Auth | Supabase Auth (Google OAuth) |
| AI | Groq API (LLaMA 3.3 70B Versatile) |
| Payments | Razorpay (primary), Cashfree (secondary) |
| Storage | Supabase Storage |
| Hosting | Vercel |

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         Client                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Next.js   │  │   React     │  │  TailwindCSS +      │  │
│  │  App Router │  │ Components  │  │  Framer Motion      │  │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘  │
└─────────┼────────────────┼───────────────────┼──────────────┘
          │                │                   │
          ▼                ▼                   ▼
┌─────────────────────────────────────────────────────────────┐
│                    Next.js API Routes                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │  /api/auth   │  │ /api/profile │  │  /api/resumes    │   │
│  │  /api/analyzer│ │ /api/webhooks│  │  /api/payments   │   │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────────┘   │
└─────────┼────────────────┼───────────────────┼──────────────┘
          │                │                   │
          ▼                ▼                   ▼
┌─────────────────────────────────────────────────────────────┐
│                    External Services                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │   Supabase   │  │   Groq AI    │  │    Razorpay/     │   │
│  │  (DB + Auth) │  │  (LLaMA 3.3) │  │    Cashfree      │   │
│  └──────────────┘  └──────────────┘  └──────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### Authentication Flow (Google OAuth)
```
1. User clicks "Continue with Google"
2. Redirect to Google OAuth consent screen
3. Google redirects to /api/auth/callback with auth code
4. Exchange code for session
5. Create/update user, profile, subscription rows
6. Redirect to /dashboard
```

### Resume Analysis Flow
```
1. User pastes job description
2. User selects resume to compare
3. POST /api/analyzer with JD + resume_id
4. Fetch resume content from DB
5. Send to Groq AI for analysis
6. Return match score, skills, suggestions
7. Display results in UI
```

### Subscription Flow
```
1. User selects plan
2. Create Razorpay order via /api/payments/create-order
3. Open Razorpay checkout modal
4. User completes payment
5. Razorpay sends webhook to /api/webhooks/razorpay
6. Verify signature, update subscription status
7. User sees updated plan
```

## Folder Structure

```
src/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Auth pages (login, register)
│   ├── (dashboard)/         # Protected dashboard pages
│   └── api/                 # API routes
├── components/              # React components
│   ├── ui/                  # Base UI primitives
│   ├── forms/               # Form components
│   ├── layout/              # Layout components
│   └── dashboard/           # Dashboard-specific
├── lib/                     # Utilities & integrations
│   ├── supabase/           # Supabase client helpers
│   ├── payments/           # Payment gateway abstraction
│   ├── ai/                 # AI prompts & parsers
│   └── validations/        # Zod schemas
├── types/                   # TypeScript types
└── hooks/                   # React hooks
```

## Security Architecture

### Row Level Security (RLS)
All database tables have RLS policies enforcing:
- Users can only access their own data
- Admin role can access all data
- Service role bypasses RLS (for webhooks)

### API Security
- All routes validate authentication first
- Input validation with Zod (client + server)
- Rate limiting on auth endpoints
- CORS restricted to known origins

### Payment Security
- Webhook signatures verified cryptographically
- Subscription status only updated via webhooks
- All amounts stored in paise (smallest unit)

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI
GROQ_API_KEY=

# Payments
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
CASHFREE_APP_ID=
CASHFREE_SECRET_KEY=

# App
NEXT_PUBLIC_APP_URL=
```

---

*Last updated: 2026-03-05*

