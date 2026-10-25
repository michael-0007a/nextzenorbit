# Nextzen Orbit documentation

Last reviewed against the code: 2026-10-16.

The docs are split by git branch:

| Folder | Describes | Branch state |
| --- | --- | --- |
| [`main/`](main/) | The production app: what is live today | `origin/main` at `808c909` (2026-10-15) |
| [`beta/`](beta/) | Everything on `beta` that is **not yet on main** | `beta` at `a36b706` (17 commits ahead) |

Beta is a superset of main, so read the main docs first and then the beta notes on top. When beta is merged into main, fold the beta notes into the matching main docs and empty `beta/` again.

Both branches share **one Supabase project** (`nextzenorbit`, Tokyo `ap-northeast-1`). Every migration up to 046 is already applied there, including the beta-only ones (042–046). The live main app doesn't use the beta tables yet.

## main/: production

Start here:

- [APP_OVERVIEW.md](main/APP_OVERVIEW.md): one-page summary of the product and its parts.
- [APP_DOCUMENTATION.md](main/APP_DOCUMENTATION.md): code-grounded tour of every flow, with a file map and known gaps.
- [TEAM_CONTEXT_BRIEF.md](main/TEAM_CONTEXT_BRIEF.md): non-technical brief for leadership and operations.

Reference:

| Doc | Covers |
| --- | --- |
| [ARCHITECTURE.md](main/ARCHITECTURE.md) | System design, the request gate, data flow, key decisions |
| [API_DOCS.md](main/API_DOCS.md) | Every API route, its guard and its error format |
| [DATABASE_SCHEMA.md](main/DATABASE_SCHEMA.md) | Tables, RPCs, storage buckets, migration history |
| [SECURITY.md](main/SECURITY.md) | Auth, roles, RLS vs service role, rate limits, payment security |
| [PAYMENTS.md](main/PAYMENTS.md) | Plans, PayU checkout, activation and reconciliation |
| [DEPLOYMENT.md](main/DEPLOYMENT.md) | Vercel + Supabase setup, environment variables, release checklist |
| [UI_PATTERNS.md](main/UI_PATTERNS.md) | Design tokens and component patterns |
| [CAREER_WORKSPACE_ARCHITECTURE.md](main/CAREER_WORKSPACE_ARCHITECTURE.md) | Career pages, roadmaps, interview questions, notes, projects |
| [ENHANCED_ARCHITECTURE.md](main/ENHANCED_ARCHITECTURE.md) | Feature-by-feature guide to the career workspace and autofill |
| [AUTOFILL_EXTENSION_TESTING.md](main/AUTOFILL_EXTENSION_TESTING.md) | Building and testing the Chrome extension |
| [PROJECT_REPORT.md](main/PROJECT_REPORT.md) | Stack, structure, accounts checklist, maintenance |
| [ASSUMPTIONS.md](main/ASSUMPTIONS.md) | Engineering decisions, including which ones were superseded |
| [CHANGELOG.md](main/CHANGELOG.md) | Release history of main |

Feature design notes (read the relevant one before changing that area):

- [signup-review-rollout.md](main/signup-review-rollout.md): application review, paid access, PayU (migrations 033–035)
- [expanded-onboarding.md](main/expanded-onboarding.md): country-specific onboarding and private demographic data (036)
- [job-search-improvement-plan.md](main/job-search-improvement-plan.md): job search workspace and catalog (037)
- [admin-document-workspace.md](main/admin-document-workspace.md): resume categories and standalone admin documents (038, 041)
- [shared-client-assignments.md](main/shared-client-assignments.md): team allocation, targets, completion credit (039)
- [resume-generation.md](main/resume-generation.md): the AI pipeline, quality gate, layout, templates and page fitting
- [performance/](main/performance/): the 2026-10 performance audit, task list, implementation report and benchmark JSON (040, 041)

## beta/: not yet on main

- [BETA_OVERVIEW.md](beta/BETA_OVERVIEW.md): **start here**. Everything beta changes compared to main, migration status, and what to check before merging.
- [domain-separation.md](beta/domain-separation.md): the site / app / admin domain split as built.
- [client-features.md](beta/client-features.md): progress feed, messaging, LinkedIn optimizer, offer comparison, mock interviews.
- [ai-usage-limits.md](beta/ai-usage-limits.md): daily AI allowances and supervisor approval for extra.
- Planning pages (open in a browser): [plan.html](beta/plan.html) (build plan), [your-tasks.html](beta/your-tasks.html) (beta and launch checklist), [speed.html](beta/speed.html) (speed fixes and the Tokyo move), [feature-ideas.html](beta/feature-ideas.html) (idea backlog).

## Ground rules

- Code is the source of truth. If a doc disagrees with the code, fix the doc.
- New database changes go in the next numbered file in `supabase/migrations/` (next is 047), and get noted in `main/DATABASE_SCHEMA.md` (or `beta/BETA_OVERVIEW.md` while they're beta-only).
- `README.md` in the repo root is a short entry point; it links here.
