# Beta overview: what beta changes compared to main

Last reviewed from code: 2026-10-16. `beta` at `a36b706` is **17 commits ahead** of `origin/main` (`808c909`).

Beta is a superset of main. Main later received squashed copies of beta's Bedrock / quality gate / AI progress / tailoring work (`103f8e1`, `808c909`), so those are already live. Everything below is **beta only**. Read the main docs first ([`../main/`](../main/)), then this file.

## At a glance

| Area | Change | Detail |
| --- | --- | --- |
| Security | Audit run-3 fixes F2–F9, N3, N6 + migration 042 | [below](#security-fixes-aacec9d) |
| Domains | site / app / admin split, separate staff session, clean admin URLs | [domain-separation.md](domain-separation.md) |
| Sign-in | Client email/password sign-in fixed | [domain-separation.md](domain-separation.md#sign-in-on-beta) |
| Client features | Progress feed, messaging, LinkedIn optimizer, offer comparison, mock interviews | [client-features.md](client-features.md) |
| AI cost | Daily AI allowances + supervisor approval for extra | [ai-usage-limits.md](ai-usage-limits.md) |
| Templates | Harvard, FAANGPath, AltaCV replace Classic, Modern, Creative | [below](#resume-templates-e033669) |
| Speed | Functions to Tokyo (`hnd1`), local JWT check, no card blur, hover prefetch | [speed.html](speed.html) |
| Docs and tooling | `CLAUDE.md`, plan and checklist pages, `test:features` script | [plan.html](plan.html), [your-tasks.html](your-tasks.html) |

## Commits (oldest first)

| Commit | Date | What |
| --- | --- | --- |
| `aacec9d` | 10-11 | Fix security audit run-3 findings (F2–F9, N3, N6) |
| `aa0191e` | 10-11 | Domain split + five client features + migrations 043–045 + tests |
| `0cf2508` | 10-11 | CLAUDE.md, feature ideas, domain-split plan |
| `a23a0c4` | 10-11 | Beta testing and launch checklist |
| `127b807` | 10-12 | Clean URLs on the admin host |
| `3ca571e` | 10-12 | Fix client email sign-in |
| `34c6366` | 10-12 | Restyle the new feature pages to match the app |
| `b4ca50f` | 10-13 | Speed: run next to the database, fewer auth trips, lighter cards |
| `15867c0` | 10-13 | Speed audit page |
| `b00c09d` | 10-13 | Prefetch pages on link hover |
| `b0f09dc` | 10-13 | CLAUDE.md refresh |
| `00391ec`, `9f930f7`, `34a0691`, `3aa1fec` | 10-13 → 10-15 | Bedrock, quality gate, page fit, AI progress, tailoring strength (**already on main** as `103f8e1` / `808c909`) |
| `e033669` | 10-15 | Harvard, FAANGPath, AltaCV templates |
| `a36b706` | 10-15 | Daily AI allowances with supervisor approval |

## Database

| Migration | Adds | Applied to the shared DB? |
| --- | --- | --- |
| 042 `security_hardening` | F4–F7 policies (see below) | Yes |
| 043 `client_activity_feed` | `client_activity`, `client_activity_summary`, 3 indexes | Yes |
| 044 `client_messages` | `client_messages` | Yes |
| 045 `mock_interviews` | `mock_interviews` | Yes |
| 046 `ai_usage_limits` | `ai_usage_events`, `ai_quota_requests` | Yes |

Checked on 2026-10-16 against `supabase_migrations.schema_migrations`. All are additive, so the live main app is unaffected, with one exception: 042 revoked client inserts on `autofill_telemetry`, so main's telemetry route now drops rows (beta writes with the service role). The tables added in 044–046 show "RLS enabled, no policies" in the Supabase advisor. That's intended, because only the server touches them.

## Security fixes (`aacec9d`)

| Finding | Fix |
| --- | --- |
| F2/F3 | `denyUnassignedClient` (`src/lib/admin/assignments.ts`) enforces client assignment on admin files, resumes, upload, optimize, cover letters, notifications, subscription activate, resume export, `export-admin`, and the per-client generator pages. Unknown roles fail closed |
| F4 | `resume_versions` insert only for a resume you own (042) |
| F5 | Clients can no longer insert or update `job_queue` directly (042) |
| F6 | No anonymous/client telemetry inserts (042). The route writes with the service role, with size caps |
| F7 | `saved_job_searches` gated by paid access; `filters` limited to 4,000 chars (042) |
| F8 | `DELETE /api/admin/sso-users` only demotes `sso_user` accounts and blocks demoting yourself |
| F9 | `supabase/.temp` untracked |
| F1/N1 | Scripts read the DB URL and seed passwords from env |
| N3 | DOCX zip bombs and oversized archives rejected before extraction |
| N6 | Unused public `/api/youtube/search` removed |

Test: `node scripts/test-security-hardening.cjs`.

## Resume templates (`e033669`)

| Corporate templates on beta | Style |
| --- | --- |
| **Harvard** (default for new resumes and unknown ids) | Serif, centered, ruled sections: the finance and consulting standard |
| Jake's Resume | Centered header, ruled sections, dates right-aligned |
| Deedy Two-Column | Education and skills in a sidebar |
| Awesome CV | Colored headings, right-aligned dates |
| **FAANGPath** | Clean sans-serif single column, bold job keywords |
| **AltaCV** | Two columns: experience first, skills sidebar on the right |

Classic, Modern and Creative are no longer offered for corporate resumes. They remain only as the base of the three C2C templates (`LEGACY` in `templates.ts`). `layout.ts`, `pdf-document.tsx` and `word-document.ts` gained the serif and right-sidebar handling. Saved resumes keep rendering because `getTemplate` maps retired ids to the closest current design: `classic` → Harvard, `modern` → FAANGPath, `creative` → Awesome CV, plus older aliases. Unknown ids fall back to Harvard.

## Speed (`b4ca50f`, `b00c09d`)

| Change | File |
| --- | --- |
| Functions `bom1` → **`hnd1`** (Tokyo, the same region as Supabase). Each DB trip drops from about 150 ms to a few ms | `vercel.json` |
| The JWT is verified locally with `auth.getClaims()` (ES256 signing keys) in the per-request proxy check: one less Supabase trip per request. Pages still confirm the user with Supabase | `src/lib/supabase/middleware.ts` |
| `.glass-card` uses a solid 96% surface instead of `backdrop-filter` blur | `src/app/globals.css` |
| Large background shapes stopped pulsing | `dashboard/page.tsx`, `sidebar.tsx` |
| Hover prefetch (`dynamicOnHover`), with hover-loaded pages kept at most 30s (`staleTimes.static`) | `next.config.ts` |
| Repeatable latency measurement | `scripts/measure-latency.cjs` |

Measured on production before the change: `/dashboard` 3.4–5.5s and `/resumes` 3.7–6.4s. Every request makes about 6 sequential Mumbai↔Tokyo trips. Optional next step, not done: move the database to Mumbai (a new Supabase project with 30–60 minutes of downtime) and return to `bom1`.

## New environment variables

| Variable | Needed for |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_ADMIN_URL` | Domain split (with `NEXT_PUBLIC_APP_URL`). Routing stays off unless all three are set |
| `ORBIT_LEGACY_HOSTS` | Production only: the old `*.vercel.app` host redirects to the new domains |

No new secrets. Bedrock, PayU and Supabase variables are unchanged. Make sure they're enabled for **Preview** so the beta deployment works; the old `GROQ_API_KEY` isn't needed.

## Tests

- `npm run test:features` runs `test-domain-split`, `test-client-feed-messages`, `test-salary` and `test-ai-features`.
- `npm run test:performance` now also runs `test-ai-quota` and those four.
- `node scripts/test-security-hardening.cjs` runs separately.

## Before merging beta into main

1. Run the full checklist in [your-tasks.html](your-tasks.html): beta domains, Preview env vars, and the test table.
2. `npx tsc --noEmit`, `npm run test:performance`, `node scripts/test-security-hardening.cjs`.
3. Decide when to turn on the domain split in production (set the three URLs plus `ORBIT_LEGACY_HOSTS`), and update the Supabase redirect URLs and the PayU callback (see [domain-separation.md](domain-separation.md)).
4. After merging, move this folder's content into `docs/main/`:
   - add the beta tables to `DATABASE_SCHEMA.md` and the beta routes to `API_DOCS.md`;
   - mark the beta fixes as fixed in `SECURITY.md`, and change the region in `DEPLOYMENT.md` to `hnd1`;
   - update the templates in `resume-generation.md`, and fold this list into `CHANGELOG.md`.

   Then empty `docs/beta/` except the plan pages you want to keep.
