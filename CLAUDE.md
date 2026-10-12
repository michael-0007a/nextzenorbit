# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npx tsc --noEmit       # typecheck (no script; strict mode)

# Tests are node:test scripts in scripts/, not a framework. Run one file:
node --test --test-isolation=none scripts/test-onboarding.cjs
npm run test:signup        # onboarding/signup/payment-access group
npm run test:resumes       # resume layout
npm run test:performance   # the full suite (lists every test-*.cjs except security/rls)
node scripts/test-security-hardening.cjs   # not in any npm script; run directly

npm run seed:career-workspace   # tsx scripts/seed/index.ts
npm run wipe:client-data
```

- Tests do **not** hit a live server. They load source files with `loadSource(path, mocks)` (exported from `scripts/test-admin-resume-exports.cjs`), which compiles a `src/` file with its imports (`@/lib/supabase/admin`, `next/headers`, ...) replaced by mocks. Some (`test-performance.cjs`) run migrations 040/041 against in-memory PGlite. When a source file adds a new import, the mocks in these tests usually need updating.
- `scripts/test-rls.ts`, `seed-admins.js`, `create-super-admin.ts` etc. talk to a real Supabase project and need `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`. Other env: `GROQ_API_KEY`, PayU keys, `NEXT_PUBLIC_APP_URL`.
- The Chrome autofill extension is a separate package: `cd extensions/nextzen-orbit-autofill && npm run build` (esbuild, `scripts/build.mjs`; `dev` watches). See `docs/AUTOFILL_EXTENSION_TESTING.md`.
- Database schema lives in numbered SQL files in `supabase/migrations/` (latest 045); there is no migration runner in npm scripts — apply via Supabase CLI/MCP/SQL editor. Add new changes as the next number.

## Architecture

Next.js 16 App Router + React 19 (React Compiler enabled), TypeScript strict, Tailwind v4, Supabase (Postgres/Auth/Storage), Groq for LLM calls (`src/lib/ai`), PayU and USD-gateway payments (`src/lib/payments`), deployed on Vercel (region `hnd1` (Tokyo), same as the Supabase project; was `bom1`). Path alias `@/` → `src/`. `README.md` is partly stale (phase table, Google-OAuth-only framing); `docs/APP_DOCUMENTATION.md` and `docs/ARCHITECTURE.md` are more current.

### Access control is the core cross-cutting concern

The file is `src/middleware.ts` but its default export is named `proxy` (Next 16 convention) — it does three things that other code depends on:

1. Refreshes the Supabase session (`src/lib/supabase/middleware.ts`).
2. Gates **every `/api/*` call** (except `/api/auth`, `/api/webhooks`, `/api/onboarding`, `/api/performance`, `/api/internal/jobs`) on account state: signup application must be `approved` (403 `APPROVAL_REQUIRED`) and the user must have an active service/subscription (402 `PAYMENT_REQUIRED`, except checkout paths). Dashboard pages redirect to `/onboarding` or `/subscription` the same way.
3. Computes `AccountAccess` once (`src/lib/account-access.ts`, one joined query on `users` + `signup_applications` + `subscriptions` using the service-role client) and forwards it as an HMAC-signed, 30s, path-bound header (`src/lib/access-envelope.ts`, signed with `SUPABASE_SERVICE_ROLE_KEY`). Server code reads it via `getRequestAccess` (`src/lib/request-access.ts`), falling back to a DB lookup. Never expose that header in responses.

Roles: `user`, `admin`, `supervisor_admin`, `super_admin`, `sso_user` (the last four are "privileged" and bypass payment). Admin API routes call `requireAdmin` / related guards from `src/lib/admin/guards.ts`; they use `createAdminClient` (service role, bypasses RLS) so authorization must be enforced in code, not relied on from RLS. Admins work on clients through assignments (`src/lib/admin/assignments.ts`, migration 039 shared client assignments).

### Layout

- `src/app/(auth)`, `(admin-auth)`, `(marketing)`, `(dashboard)` (end-user app), `(admin)/admin` (admin console) — route groups with separate layouts.
- `src/app/api/**` — route handlers; admin ones under `api/admin/*`. Responses use the `apiError`/`ERROR_CODES` helpers from `src/types/api.ts` (`{ success, error: { code, message } }`). Long-running routes set `maxDuration`.
- `src/services/*` — data-access/service modules; `src/lib/supabase/{client,server,admin}.ts` are the three Supabase clients (browser / cookie-bound / service-role). Types in `src/types/database.ts`.
- `src/lib/resume/*` — resume rendering/export pipeline (PDF via `@react-pdf/renderer`, Word via `docx`, LaTeX templates, layout fitting using precomputed `font-widths.json`; regenerate with `scripts/generate-resume-font-widths.cjs`). `src/lib/admin/documents/*` — admin document workspace (upload/parse/generate with async jobs, migration 041, API under `api/admin/document-workspace`).
- `src/features/career` and `scripts/seed/` — the career/roadmap workspace and its seed data (`docs/CAREER_WORKSPACE_ARCHITECTURE.md`).
- `extensions/nextzen-orbit-autofill` — MV3 Chrome extension (background/content/popup, zod message schemas in `src/shared`) that autofills job portals; talks to `api/autofill/*`.

### Conventions worth knowing

- Repo root contains many one-off seed/fix scripts (`seed-*.js`, `fix-types.js`, `expand-roadmaps.js`) and output dumps (`*-output.txt`); they are not part of the app.
- `docs/` holds per-feature design notes (security, performance, shared-client-assignments, signup-review-rollout) — check the relevant one before changing those areas. `docs/performance-*.json` are benchmark artifacts.
