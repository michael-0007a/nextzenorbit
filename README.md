# Nextzen Orbit

> AI-powered resume optimization, job description analysis, and application tracking for the Indian job market.

## Features

- 🔐 **Google OAuth** — One-click sign in with Google
- 📝 **Resume Builder** — Create and manage multiple resumes
- 🤖 **AI Analyzer** — Match your resume against job descriptions using Groq AI
- 📊 **Application Tracker** — Track job applications with status filters
- 💳 **Subscription Plans** — Free, Pro, and Elite tiers with Razorpay
- 🌙 **Dark Mode** — System preference + manual toggle

## Tech Stack

- **Framework:** Next.js 16 (App Router, TypeScript strict)
- **Database:** Supabase (PostgreSQL + Auth + Storage)
- **AI:** Groq API (LLaMA 3.3 70B Versatile)
- **Payments:** Razorpay (primary), Cashfree (secondary)
- **Styling:** TailwindCSS v4 + custom design tokens
- **Animations:** Framer Motion
- **Forms:** react-hook-form + Zod

## Getting Started

### Prerequisites

- Node.js 20+
- npm or pnpm
- Supabase account
- Groq API key

### Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI
GROQ_API_KEY=

# Payments (optional for dev)
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd nextzenorbit

# Install dependencies
npm install

# Run database migrations
# (copy SQL from supabase/migrations/ to Supabase SQL editor)

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/
│   ├── (auth)/             # Login, Register pages
│   ├── (dashboard)/        # Protected dashboard pages
│   │   ├── dashboard/      # Main dashboard
│   │   ├── profile/        # User profile
│   │   ├── resumes/        # Resume management
│   │   ├── applications/   # Application tracker
│   │   ├── analyzer/       # AI job analyzer
│   │   ├── subscription/   # Subscription management
│   │   └── settings/       # Account settings
│   └── api/                # API routes
├── components/
│   ├── ui/                 # Base UI components
│   ├── forms/              # Form components
│   ├── layout/             # Layout components
│   └── dashboard/          # Dashboard components
├── lib/
│   ├── supabase/           # Supabase client helpers
│   ├── payments/           # Payment gateway abstraction
│   ├── ai/                 # AI prompts and parsers
│   └── validations/        # Zod schemas
├── types/                  # TypeScript types
└── hooks/                  # React hooks
```

## Documentation

| Document | Description |
|----------|-------------|
| [TEAM_CONTEXT_BRIEF.md](docs/TEAM_CONTEXT_BRIEF.md) | Non-technical context for leadership and cross-functional team members |
| [APP_DOCUMENTATION.md](docs/APP_DOCUMENTATION.md) | Code-grounded whole-app documentation (scope, implementation, file map, and gaps) |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | System design and data flow |
| [DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md) | Database schema and RLS |
| [API_DOCS.md](docs/API_DOCS.md) | API endpoint documentation |
| [SECURITY.md](docs/SECURITY.md) | Security architecture |
| [DEPLOYMENT.md](docs/DEPLOYMENT.md) | Deployment guide |
| [PAYMENTS.md](docs/PAYMENTS.md) | Payment integration |
| [UI_PATTERNS.md](docs/UI_PATTERNS.md) | Design system patterns |
| [CHANGELOG.md](docs/CHANGELOG.md) | Version history |
| [ASSUMPTIONS.md](docs/ASSUMPTIONS.md) | Engineering decisions |

## Phase Status

| Phase | Status | Description |
|-------|--------|-------------|
| 0 | ✅ Complete | Design system setup |
| 1 | ✅ Complete | Auth, DB, payments infrastructure |
| 2 | ✅ Complete | Profile, resume CRUD, AI analyzer |
| 3 | 🔲 Pending | Resume templates, PDF export |
| 4 | 🔲 Pending | JD analysis, keyword matching |
| 5 | 🔲 Pending | Smart resume tailoring |
| 6 | 🔲 Pending | Application tracker enhancements |
| 7 | 🔲 Pending | Chrome extension |

## License

Private — All rights reserved.

---

*Built for the Indian job market 🇮🇳*
