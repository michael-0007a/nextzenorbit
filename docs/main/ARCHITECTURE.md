# Architecture: Nextzen Orbit

Last reviewed from code: 2026-10-26, branch `main` (beta merged).

## System overview

One Next.js deployment serves the marketing pages, the client app, the admin console and every API route. Supabase holds auth, data and files. Amazon Bedrock runs all AI. PayU takes payments. A Chrome extension assists with form filling on employer portals.

```
                 Client browser            Staff browser            Chrome extension (MV3)
                       │                        │                    fills fields on click
                       └──────────┬─────────────┘                            │
                                  ▼                                          │ /api/autofill/*
┌─────────────────────────────────────────────────────────────────────────────┴───┐
│ Vercel (region hnd1) — Next.js 16 App Router, React 19                           │
│                                                                                  │
│  src/middleware.ts (proxy)                                                       │
│   0. route by host (site / app / admin) when the domain split is on              │
│   1. refresh Supabase session                                                    │
│   2. gate /api/* and dashboard pages on approval (403) and payment (402)         │
│   3. compute AccountAccess once → signed 30s path-bound header                   │
│                                                                                  │
│  Pages: (marketing) (auth) (dashboard) (admin-auth) (admin)                      │
│  API:   resumes · ai · analyzer · cover-letter · jobs · applications · career    │
│         admin/* · payments · webhooks/payu · onboarding · autofill · internal    │
└───────┬──────────────────────┬──────────────────────┬──────────────────┬─────────┘
        ▼                      ▼                      ▼                  ▼
  Supabase (Tokyo)       Amazon Bedrock          PayU (INR)          Adzuna, YouTube
  Auth · Postgres ·      Kimi K2.5 writer/       checkout +          job search,
  Storage · RPCs         parser, DeepSeek V3.2   callback            resources
                         reviewer
```

## Tech stack

| Layer | Technology | Where |
| --- | --- | --- |
| Framework | Next.js 16.1 App Router, React 19.2, React Compiler | `next.config.ts` (`reactCompiler`, hover prefetch with `dynamicOnHover`) |
| Language | TypeScript 5.9, strict | `tsconfig.json`, alias `@/` → `src/` |
| Styling | Tailwind CSS v4, CSS tokens, next-themes (dark default) | `src/app/globals.css`, `src/components/ui` |
| Auth | Supabase Auth: Google OAuth for clients, email/password for staff and SSO accounts | `src/app/(auth)`, `src/app/(admin-auth)` |
| Database | Supabase Postgres with RLS, service-role RPCs, read models | `supabase/migrations` |
| Storage | Supabase Storage: `resume-uploads`, `signup-resumes` (private) | `src/lib/resume/delete.ts`, onboarding |
| AI | Amazon Bedrock, OpenAI-compatible endpoint, called through `groq-sdk` | `src/lib/ai/model.ts` |
| Documents | `@react-pdf/renderer`, `docx`, LaTeX source, measured font widths | `src/lib/resume/*` |
| Payments | PayU (INR); USD gateway placeholder | `src/lib/payments` |
| Jobs | Adzuna API with a normalized catalog | `src/lib/jobs` |
| Extension | Chrome MV3, esbuild, zod message schemas | `extensions/nextzen-orbit-autofill` |
| Hosting | Vercel, functions pinned to `hnd1` (Tokyo, same region as the database) | `vercel.json` |

## Request gate (the core cross-cutting concern)

`src/middleware.ts` exports `proxy` (the Next 16 convention). Every page and API request goes through it:

0. **Host routing:** when the three host variables are set, `src/lib/hosts.ts` sends each host its own pages (site, client app, admin with clean URLs). Off otherwise. See [domain-separation.md](domain-separation.md).
1. **Session:** `updateSession` refreshes the Supabase cookies, and every redirect keeps them. The JWT is verified locally with `auth.getClaims()`, so the per-request check needs no Supabase round trip.
2. **API gate:** for a signed-in user, any `/api/*` call outside `/api/auth`, `/api/webhooks`, `/api/onboarding`, `/api/performance` and `/api/internal/jobs` needs:
   - an approved signup application, or it gets `403 APPROVAL_REQUIRED`;
   - active service, or it gets `402 PAYMENT_REQUIRED`. The checkout routes are exempt (`/api/subscription`, `/api/subscription/create`, `/api/payments/create-order`, `/api/payments/reconcile`).
3. **Page gate:** dashboard pages send anonymous users to `/login`, unapproved users to `/onboarding`, and unpaid users to `/subscription`. `/admin/*` needs a session, and the admin layout checks the role.
4. **Access envelope:** `AccountAccess` (role, application status, subscription) comes from one joined query using the service-role client. It is forwarded as an HMAC-signed header that is valid for 30 seconds on one path, signed with `SUPABASE_SERVICE_ROLE_KEY`. Route handlers call `getRequestAccess()` and fall back to a database lookup. The proxy strips any incoming copy, and the header is never returned to the browser.

Privileged roles (`admin`, `supervisor_admin`, `super_admin`, `sso_user`) count as having service.

## Authorization model

- **Client data:** client routes use the cookie-bound client (RLS applies) or the service role with an explicit `user_id = session user` filter.
- **Admin routes:** they call `requireAdmin` / `requireSuperAdmin` (`src/lib/admin/guards.ts`) and then use `createAdminClient()`, which **bypasses RLS**. Authorization therefore has to be enforced in code. Client access is checked against `client_admin_assignments` (`src/lib/admin/assignments.ts`), and supervisors and super admins see all clients. Per-client admin routes call `denyUnassignedClient`, which fails closed for unknown roles.
- **Paid tables:** restrictive RLS policies call `has_paid_service_access()` (migration 035), so a direct PostgREST call can't bypass payment either.
- **RPCs:** the sensitive writes are `SECURITY DEFINER` functions granted only to `service_role`. They include signup submit/review, PayU activation, client assignment, document save, queue updates and document job claims.

## AI pipeline

```
upload ─► parse (Kimi K2.5, JSON schema) ─► resume JSON
rewrite request ─► writer (Kimi K2.5, shared writing rules + intensity)
                ─► code checks ─► reviewer (DeepSeek V3.2: unsupported claims?)
                ─► targeted line fixes (Kimi) ─► restore anything still unsupported
                ─► fitGeneratedResume / trimToPages (exact page count, reports removals)
                ─► stage progress streamed to the UI (parse/write/review/fix/fit)
```

- Every whole-resume rewrite (improve, optimize, admin generator, document workspace) goes through `fitGeneratedResume` → `src/lib/resume/quality-gate.ts`.
- Calls time out at 40 seconds with one retry. Long routes set `maxDuration` (60–120 seconds).
- Document workspace generation runs as a durable `document_jobs` row, executed with `after()` and resumed by the owner's polling (migration 041).

## Rendering and export

`src/lib/resume/layout.ts` builds one line plan from the resume JSON, the template and precomputed font widths (`font-widths.json`). The browser preview, the PDF (`pdf-document.tsx`) and Word (`word-document.ts`) all render that same plan, so pagination matches. Templates can opt into `entryStyle: "split"` (right-aligned dates) or a `sidebar` (two columns).

## Data flow: done-for-you applications

```
Client approved + paid
   │
   ├─ supervisor allocates admins (assign_client_admins) ─► monthly target split
   │
admin searches jobs for client (Adzuna → jobs catalog)
   │
   ├─ shortlist → enqueue_search_jobs (fresh catalog rows only)
   │
admin claims job → tailors resume/cover letter → applies on employer site
   │
   └─ marks applied → applied_by/applied_at stamped → targets + analytics update
```

## Data flow: assisted autofill

```
Client opens a supported portal ─► content script detects fields
   ─► background worker GET /api/autofill/profile (session cookie)
   ─► assist panel shows mapped values ─► user clicks Fill
   ─► user uploads files and submits manually
```

## Key design decisions

1. **One deployment, one database.** Splitting into separate apps would add coordination before any need is proven. The domain split keeps one deployment for all three domains.
2. **The service role plus code checks for staff.** This avoids RLS recursion on role checks, which caused migrations 005–030. Every admin route must authorize explicitly.
3. **Atomic RPCs for anything money- or credit-related.** This covers payment activation, signup review, assignments, completion credit and document saves.
4. **AI output is checked, not trusted.** A second model reviews the writer's output, and anything unsupported is restored to the original.
5. **Assisted autofill only.** The extension never submits. The old Playwright auto-apply worker is gone, and `job_queue` is now the admin apply queue.
6. **Adzuna over scraping.** It is licensed, structured data, held in a catalog with a 24-hour freshness rule.
