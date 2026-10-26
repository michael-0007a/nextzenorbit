# Nextzen Orbit documentation

Last reviewed against the code: 2026-10-26.

The docs are split by git branch:

| Folder | Describes | Branch state |
| --- | --- | --- |
| [`main/`](main/) | The production app: what is live today | `main` at `b9b0678` (2026-10-26, beta merged) |
| [`beta/`](beta/README.md) | Work on `beta` that is **not yet on main** | Empty: `beta` matches `main` |

Both branches share **one Supabase project** (`nextzenorbit`, Tokyo `ap-northeast-1`). Every migration up to 046 is applied.

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
- [domain-separation.md](main/domain-separation.md): the site / app / admin domain split (built, off until configured)
- [client-features.md](main/client-features.md): progress feed, messaging, LinkedIn optimizer, offer comparison, mock interviews (043–045)
- [ai-usage-limits.md](main/ai-usage-limits.md): daily AI allowances and supervisor approval for extra (046)

Planning pages (open in a browser), in [main/plans/](main/plans/): [your-tasks.html](main/plans/your-tasks.html) (launch checklist, including the domain-split steps), [plan.html](main/plans/plan.html) (build plan for the client features), [speed.html](main/plans/speed.html) (speed fixes and the Tokyo move), [feature-ideas.html](main/plans/feature-ideas.html) (idea backlog).

## beta/: not yet on main

[beta/README.md](beta/README.md) explains how to document beta-only work. It's empty right now.

## Ground rules

- Code is the source of truth. If a doc disagrees with the code, fix the doc.
- New database changes go in the next numbered file in `supabase/migrations/` (next is 047), and get noted in `main/DATABASE_SCHEMA.md` (or a note in `beta/` while they're beta-only).
- `README.md` in the repo root is a short entry point; it links here.
