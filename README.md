# Nextzen Orbit

> A done-for-you job application service with a client workspace. Recruiters apply to jobs for each client using AI-tailored, fact-checked resumes and cover letters. Clients get a resume builder, JD analyzer, career pages, a tracker and an autofill extension.

## Features

- **Gated signup:** Google sign-in, an application with a resume, supervisor approval, then a paid plan (PayU, INR).
- **Done-for-you applications:** client teams, monthly targets (300/400/500 by plan), job search, the apply queue and completion credit.
- **AI documents:** resumes and cover letters written by Kimi K2.5 and fact-checked by DeepSeek V3.2 (Amazon Bedrock), at an exact page count, exported as PDF, DOCX or LaTeX.
- **Client tools:** resume builder, JD analyzer, cover letters, application tracker, job search, career pages (roadmaps, interview questions, AI notes).
- **Admin console:** client management, signup review, the document workspace, analytics, team and SSO users.
- **Assisted autofill:** a Chrome extension for Workday, Greenhouse, Lever, LinkedIn and Microsoft Careers. It never submits forms.
- **On beta:** site/app/admin domains, a progress feed, messaging, the LinkedIn optimizer, offer comparison, mock interviews and daily AI allowances.

## Tech stack

Next.js 16 (App Router, React 19, React Compiler) · TypeScript strict · Tailwind CSS v4 · Supabase (Postgres, Auth, Storage) · Amazon Bedrock · PayU · Adzuna · Vercel

## Getting started

Prerequisites: Node.js 20+, a Supabase project, a Bedrock API key, Adzuna keys, and PayU test credentials.

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
AWS_BEARER_TOKEN_BEDROCK=
AWS_REGION=
ADZUNA_APP_ID=
ADZUNA_APP_KEY=
PAYU_MERCHANT_KEY=
PAYU_MERCHANT_SALT=
NEXT_PUBLIC_PAYU_URL=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

```bash
npm install
# apply supabase/migrations/*.sql in order (npx supabase db push, or the SQL editor)
npm run dev
npx tsc --noEmit && npm run test:performance   # typecheck + full test suite
```

The full variable list and setup steps are in [docs/main/DEPLOYMENT.md](docs/main/DEPLOYMENT.md).

## Documentation

All docs live in [`docs/`](docs/README.md) and are split by branch:

- [`docs/main/`](docs/main/): production. Start with [APP_OVERVIEW](docs/main/APP_OVERVIEW.md), [APP_DOCUMENTATION](docs/main/APP_DOCUMENTATION.md), [ARCHITECTURE](docs/main/ARCHITECTURE.md), [API_DOCS](docs/main/API_DOCS.md), [DATABASE_SCHEMA](docs/main/DATABASE_SCHEMA.md), [SECURITY](docs/main/SECURITY.md), [PAYMENTS](docs/main/PAYMENTS.md) and [DEPLOYMENT](docs/main/DEPLOYMENT.md).
- [`docs/beta/`](docs/beta/): what beta adds before it is merged. Start with [BETA_OVERVIEW](docs/beta/BETA_OVERVIEW.md).

For leadership: [TEAM_CONTEXT_BRIEF](docs/main/TEAM_CONTEXT_BRIEF.md). AI running costs: [AI_COST_ESTIMATE.md](AI_COST_ESTIMATE.md).

## License

Private. All rights reserved.
