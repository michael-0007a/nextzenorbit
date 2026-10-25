# Nextzen Orbit: app overview (main)

Last reviewed from code: 2026-10-16. For what beta adds, see [`../beta/BETA_OVERVIEW.md`](../beta/BETA_OVERVIEW.md).

## Purpose

Nextzen Orbit is a done-for-you job search service. Clients apply and are reviewed. After paying for a plan, a team of recruiters applies to jobs for them each month with tailored resumes and cover letters. Clients also get self-serve AI tools to build resumes, check them against job descriptions, write cover letters, learn about careers and track applications. A Chrome extension helps fill application forms; the user always submits.

## What the product does

**For clients:**

- Sign in with Google, then apply with a profile and resume.
- After approval, pay for a plan: Silver, Gold or Elite.
- Build, upload, AI-improve, tailor and export resumes, using six templates plus three contract (C2C) templates, at an exact page count.
- Analyze a resume against a job description; generate cover letters.
- Track applications on a Kanban board or table.
- Search jobs (Adzuna, many countries) and save searches.
- Use career pages: roadmaps, interview questions, videos, AI notes, projects.
- Use the assisted autofill extension.

**For staff:**

- Review signup applications (supervisors).
- Allocate clients to admin teams, with monthly application targets per plan.
- Search jobs for a client, queue them, claim them, apply, and mark them applied (with credit).
- Generate tailored resumes and cover letters per client, or in the standalone workspace.
- See analytics, manage the team, SSO users and notifications.

## Primary journeys

1. **Client onboarding:** Google sign-in → onboarding form + resume → pending → approved → pay → dashboard.
2. **Done-for-you loop:** supervisor allocates → admin searches → queues → tailors documents → applies → marks applied → target progress.
3. **Self-serve resume:** upload → AI parse → edit → improve or optimize against a JD (quality-checked) → export PDF/DOCX/LaTeX.

## Architecture at a glance

```mermaid
graph TD
  A[Client / staff browser] --> B[Next.js 16 on Vercel bom1<br/>proxy: session, approval 403, payment 402]
  X[Chrome extension] --> B
  B --> C[Supabase Tokyo<br/>Auth, Postgres + RLS, Storage]
  B --> D[Amazon Bedrock<br/>Kimi K2.5 writer, DeepSeek V3.2 reviewer]
  B --> E[PayU INR]
  B --> F[Adzuna jobs]
```

## Main UI areas

| Area | Paths |
| --- | --- |
| Marketing | `/`, `/compliance`, `/privacy`, `/refund`, `/terms` |
| Auth and onboarding | `/login`, `/register`, `/verify`, `/onboarding`, `/onboarding/terms` |
| Client app | `/dashboard`, `/profile`, `/resumes`, `/resumes/[id]`, `/analyzer`, `/cover-letter`, `/applications`, `/job-search`, `/career`, `/career/[slug]`, `/subscription`, `/settings` |
| Staff | `/admin/login`, `/admin`, `/admin/users`, `/admin/apply-queue`, `/admin/job-search`, `/admin/create-resume`, `/admin/create-cover-letter`, `/admin/signup-applications`, `/admin/team`, `/admin/analytics`, `/admin/sso-users`, `/admin/settings` |

## Data at a glance

Accounts (`users`, `profiles`, `signup_applications`, `subscriptions`, `payment_orders`), documents (`resumes`, `resume_versions`, `admin_resumes`, `admin_cover_letters`, `admin_documents`, `document_jobs`), jobs (`jobs`, `job_queue`, `saved_job_searches`, `client_admin_assignments`, `applications`), and the career workspace. Full detail: [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md).

## Status and known gaps (main)

- Client email/password sign-in is broken (fixed on beta).
- Some admin routes don't check client assignment (fixed on beta). See [SECURITY.md](SECURITY.md).
- No daily AI allowances (on beta).
- Slow requests from the Mumbai functions talking to the Tokyo database (fixed on beta).
- USD checkout is a placeholder. Client cover letters aren't saved.

## Where to read next

[APP_DOCUMENTATION.md](APP_DOCUMENTATION.md) for every flow and file, [ARCHITECTURE.md](ARCHITECTURE.md) for design, and [`../README.md`](../README.md) for the full map.
