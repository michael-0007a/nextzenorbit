# Changelog: Nextzen Orbit

Built from `git log origin/main`. Versions are informal milestones; the app has no version tags. Work on the `beta` branch that isn't merged yet is described in [`../beta/`](../beta/README.md).

## 2026-10-26: Beta merged into main (`b9b0678`)

19 beta commits, released together.

- **Security (audit run 3, `aacec9d`):**
  - Admin routes enforce client assignment with `denyUnassignedClient` (F2/F3), and unknown roles fail closed.
  - Migration 042 locks down `resume_versions`, `job_queue`, `autofill_telemetry` and `saved_job_searches` (F4–F7). Extension telemetry is stored again, written with the service role.
  - SSO-user removal only demotes `sso_user` accounts (F8).
  - DOCX zip-bomb guard (N3). The unused public `/api/youtube/search` was removed (N6).
- **Sign-in:** client email/password sign-in works through the rate-limited `signInWithEmail` server action. Before this, the form posted to a missing `/api/auth/login`.
- **Domain split** (site / app / admin, separate staff session, clean admin URLs). It's built but **off** until the three host variables are set. See [domain-separation.md](domain-separation.md).
- **Five client features** ([client-features.md](client-features.md)):
  - progress feed (043);
  - client–team messaging (044);
  - LinkedIn profile optimizer;
  - CTC and offer comparison;
  - AI mock interviews (045).
- **Daily AI allowances** with supervisor approval for extra (046); mock interview answers count too (`1d95703`). See [ai-usage-limits.md](ai-usage-limits.md).
- **Templates:** Harvard (the new default), FAANGPath and AltaCV replace Classic, Modern and Creative. Saved resumes map to the closest new design.
- **Speed:**
  - functions moved from `bom1` to `hnd1` (Tokyo, next to the database);
  - local JWT check with `getClaims`;
  - solid card surface instead of blur;
  - hover prefetch.
- **Docs:** split into `docs/main` and `docs/beta`, rewritten from the code. Launch pages are in [plans/](plans/).

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
