# Changelog: Nextzen Orbit (main)

Built from `git log origin/main`. Beta work not yet on main is listed under **Unreleased (beta)**. Versions are informal milestones; the app has no version tags.

## Unreleased (beta)

The full list is in [`../beta/BETA_OVERVIEW.md`](../beta/BETA_OVERVIEW.md):

- Security audit run-3 fixes (F2–F9, N3, N6) and migration 042.
- Site / app / admin domain split with separate staff and client sessions. Fixed client email sign-in.
- Five client features: progress feed (043), client–team messaging (044), LinkedIn optimizer, CTC and offer comparison, AI mock interviews (045).
- Daily AI allowances with supervisor approval (046).
- Harvard, FAANGPath and AltaCV templates replace Classic, Modern and Creative.
- Speed: functions move to `hnd1` (Tokyo, next to the database), fewer auth round trips, lighter cards, hover prefetch.

## 2026-10-15: Tailoring strength and keywords (`808c909`)
- The tailoring strength options (conservative / moderate / aggressive) now change the output. Added implied skills and bolded job keywords in exports.

## 2026-10-14: Bedrock AI and the quality gate (`103f8e1`)
- **AI moved from Groq to Amazon Bedrock:** Kimi K2.5 writes and parses, DeepSeek V3.2 reviews.
- **Resume quality gate:** code checks, a reviewer model, targeted line fixes, and restoring unsupported lines to the original.
- New community templates: Jake's Resume, Deedy Two-Column, Awesome CV. Split date layout and a sidebar layout.
- Exact page fit (`trimToPages`) with a report of what was removed. Stage-aware AI progress bars with time left.

## 2026-10-05: Performance and simplification (`a1b76e5`)
- The 21-task performance plan ([performance/](performance/)). Read models (040), durable document jobs (041), the signed access envelope, concurrent reads, loading boundaries, `Server-Timing`, and functions pinned to `bom1`.
- Removed obsolete code.

## 2026-09-30: Shared client assignments (`bebb6d1`)
- Multi-admin client teams, monthly target split, completion credit (`applied_by`), assignment audit (039).

## 2026-09-17 → 09-29: Admin document workspace
- Standalone Create Resume / Create Cover Letter, a private library, C2C contract templates (038). Redesigned admin resume studio, confirmed resume deletion, validated two-page layout.

## 2026-09-16 → 09-18: Signup review, paid access, job search
- Gated signup with supervisor review and registration blocks (033), user suspension (034).
- Paid access enforced; PayU orders with idempotent activation and reconciliation (035).
- Expanded country-specific onboarding (036). Job search workspace with catalog and saved searches (037).
- Groq standardized on `openai/gpt-oss-120b` (later replaced by Bedrock).

## 2026-08-10 → 09-12: Admin console
- Admin overhaul: roles, supervisor admin, apply queue, admin resumes and cover letters, notifications (019–032).
- Many rounds of RLS recursion fixes (022–030).

## 2026-08-01: Paywall
- Paywall and strict enforcement; middleware renamed to the Next 16 `proxy` export.

## 2026-06-17 → 06-29: PayU and multi-currency
- Migrated payments to PayU and removed Razorpay/Cashfree. Plan limits, active tier on the dashboard, INR/USD (+EUR/GBP/CAD/AUD) display prices.
- Career workspace expansion ("Career Orbit") and its seed data.

## 2026-06-05: Rehaul and the autofill extension
- Assisted autofill Chrome extension (MV3) replaced the Playwright auto-apply worker.

## 2026-05-22: UI upgrade
- New dark-first design system ([UI_PATTERNS.md](UI_PATTERNS.md)).

## 2026-03: Foundation (v0.1–v0.6)
- 03-02: Next.js 16 scaffold, Supabase, Google OAuth.
- 03-05 → 03-10: Dashboard, Kanban tracker, profile, resume builder with preview, AI analyzer.
- 03-14: AI resume improvement and JD optimization.
- 03-15 → 03-20: First payment integration (Razorpay), subscription tiers, job search (Adzuna), and an auto-apply queue with a Playwright worker. All of this was later replaced.
