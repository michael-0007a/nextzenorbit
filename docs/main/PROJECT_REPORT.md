# Project report: Nextzen Orbit

Date: 2026-10-26. Branch `main` at `b9b0678` (beta merged).

## 1. Executive summary

Nextzen Orbit is a done-for-you job application service with a client workspace. The production app covers the whole loop: gated signup, PayU payment, allocating clients to recruiter teams, job search and the apply queue, and AI-generated resumes and cover letters checked by a second model. It also has client self-serve tools and an assisted autofill extension.

The 2026-10-26 release (the beta merge) closed the main open items: the admin client-assignment gap, client email sign-in, region latency and AI cost caps. It also added five client features (progress feed, messaging, LinkedIn optimizer, offer comparison, mock interviews). See [CHANGELOG.md](CHANGELOG.md).

## 2. Business context

- **Audience:** job seekers (India first, plus the US, UK, CA, AU, NZ, SG, ZA and others), the recruiters who apply for them, and supervisors who run the teams.
- **Revenue:** monthly plans: Silver ₹13,999, Gold ₹18,999, Elite ₹23,999. Each plan sets a monthly application target (300, 400 or 500).
- **Cost drivers:** recruiter time, then AI (about 7–15¢ per client document set; see `AI_COST_ESTIMATE.md`), then Vercel and Supabase.

## 3. Tech stack

| Area | Choice |
| --- | --- |
| Framework | Next.js 16.1 App Router, React 19.2, React Compiler, TypeScript 5.9 strict |
| UI | Tailwind CSS v4, custom components, next-themes (dark default), sonner, lucide-react, Framer Motion, Sora + Space Grotesk |
| Forms and validation | react-hook-form, Zod 4 |
| Data | Supabase Postgres + Auth + Storage (`@supabase/ssr`, `@supabase/supabase-js`) |
| AI | Amazon Bedrock (Kimi K2.5, DeepSeek V3.2) through `groq-sdk` |
| Documents | `@react-pdf/renderer`, `docx`, LaTeX source; parsing with `unpdf`, `mammoth`, `jszip` |
| Payments | PayU |
| Jobs | Adzuna |
| Hosting | Vercel (`hnd1`, Tokyo); Supabase in Tokyo |
| Tests | `node:test` scripts with module mocks and PGlite |

## 4. Repository structure

| Folder | Contents |
| --- | --- |
| `src/app` | Route groups `(marketing)`, `(auth)`, `(dashboard)`, `(admin-auth)`, `(admin)`, plus `api/**` |
| `src/components` | `ui/` primitives, layout, forms, resume, admin, applications, analyzer, career |
| `src/lib` | Supabase clients, access gate, admin guards, AI, resume pipeline, payments, jobs, rate limit, validations |
| `src/services` | Data services (careers, jobs, notes, projects, roadmaps, interview, youtube, users, subscription, autofill) |
| `src/types` | `database.ts`, `api.ts`, `domain/*` |
| `supabase/migrations` | 001–046, all applied |
| `scripts` | `test-*.cjs` suites, `seed/`, benchmarks, admin and maintenance scripts |
| `extensions/nextzen-orbit-autofill` | Chrome MV3 extension |
| `docs` | This documentation (`main/` for production, `beta/` for unmerged beta work) |

The repo root also holds one-off scripts (`seed-*.js`, `fix-types.js`, `expand-roadmaps.js`) and output dumps (`*-output.txt`); they aren't part of the app. The `worker/` folder (Playwright auto-apply) has been removed.

## 5. Layout, SEO and performance

- The root layout sets the metadata template, loads fonts with `next/font`, and wraps providers (theme, toasts).
- App and admin pages aren't for search engines. With the domain split on, the app and admin hosts send `X-Robots-Tag: noindex`.
- Performance (2026-10): read models, a durable job queue, the signed access envelope, concurrent reads, loading boundaries, and `Server-Timing` headers. Since 2026-10-26 also hover prefetch, a local JWT check in the proxy, and functions in the database's region. See [performance/](performance/).

## 6. Route inventory

See [APP_OVERVIEW.md](APP_OVERVIEW.md#main-ui-areas) for pages and [API_DOCS.md](API_DOCS.md) for all of roughly 80 API routes.

## 7. Data model

About 35 tables in five groups: accounts and access, billing, documents, jobs and queue, and the career workspace. See [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md).

## 8. Resume and AI pipeline

Upload → parse (Kimi K2.5) → edit → improve/optimize (Kimi) → reviewer (DeepSeek) → line fixes → restore unsupported lines → exact page fit → export (PDF, DOCX, LaTeX from one layout plan). See [resume-generation.md](resume-generation.md).

## 9. Deployment

Vercel builds `main` automatically. Migrations are applied by hand, before the code that needs them. See [DEPLOYMENT.md](DEPLOYMENT.md).

## 10. Environment variables

`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `AWS_BEARER_TOKEN_BEDROCK`, `AWS_REGION`, `NEXT_PUBLIC_APP_URL`, `PAYU_MERCHANT_KEY`, `PAYU_MERCHANT_SALT`, `NEXT_PUBLIC_PAYU_URL`, `ADZUNA_APP_ID`, `ADZUNA_APP_KEY`; optional `CRON_SECRET`, plus `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_ADMIN_URL` and `ORBIT_LEGACY_HOSTS` for the domain split.

## 11. Accounts checklist (fill in privately; never commit secrets)

Keep the actual values in a password manager. This list is just the inventory of accounts the business depends on.

| Service | What to record |
| --- | --- |
| Vercel | Owner account, team, project `nextzenorbit`, 2FA on |
| Supabase | Organization, project `nextzenorbit` (Tokyo), billing owner, 2FA on |
| AWS (Bedrock) | Account, region, Bedrock API key owner, model access for Kimi K2.5 and DeepSeek V3.2 |
| Google Cloud | OAuth client for Supabase sign-in, consent screen owner |
| PayU | Merchant account (test and live), callback URL |
| Adzuna | Developer account, app id |
| Domains / DNS | Registrar (GoDaddy), DNS records for the site, app and admin hosts (and their `beta.` versions), mail MX/TXT |
| GitHub | Repo `michael-0007a/nextzenorbit`, branch protections |
| Chrome Web Store | Publisher account, if the extension is published |

## 12. Scripts and maintenance

| Command | Purpose |
| --- | --- |
| `npx tsc --noEmit` | Typecheck |
| `npm run test:performance` | Full test suite (no live services) |
| `npm run test:signup`, `npm run test:resumes` | Focused suites |
| `npm run seed:career-workspace` | Seed career reference data |
| `npm run wipe:client-data` | Wipe client data (destructive; non-production only) |
| `npm run benchmark:performance`, `npm run benchmark:resume` | Benchmarks; outputs go to `docs/main/performance/` |
| `node scripts/generate-resume-font-widths.cjs` | Regenerate `font-widths.json` after font or template changes |
| `scripts/create-super-admin.ts`, `seed-admins.js` | Bootstrap staff accounts (real database) |

## 13. Risks and recommendations

1. **Turn on the domain split** when ready ([plans/your-tasks.html](plans/your-tasks.html)). The extension's default App URL already points at `app.nextzenorbit.com`.
2. **Tune the daily AI limits** (`src/lib/ai/quota.ts`) once real usage is visible.
3. **Watch latency** after the `hnd1` move with `scripts/measure-latency.cjs`.
4. **USD payments.** Integrate a real provider before selling outside India.
5. **Docs drift.** Keep `docs/main` in step with main; describe unmerged beta work in `docs/beta` and fold it in on merge.
