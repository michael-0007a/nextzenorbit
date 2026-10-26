# Assumptions and decisions: Nextzen Orbit

This file records engineering decisions made where requirements were unclear. Decisions are never deleted. When one is overturned it is marked **Superseded** and points to its replacement, so the history stays readable.

Last reviewed: 2026-10-16.

## Status summary

| Id | Decision | Status |
| --- | --- | --- |
| A001 | Google OAuth only | Superseded by A017 |
| A002 | No email verification | Still holds for Google; email accounts are staff-created |
| A003 | Groq (LLaMA 3.3 70B) for AI | Superseded by A018 |
| A004 | AI token limits not enforced | Superseded by A024 (2026-10-26) |
| A005 | Razorpay primary, Cashfree secondary | Superseded by A019 |
| A006 | Payment integration deferred | Superseded by A019 |
| A007 | Export deferred to Phase 3 | Superseded: PDF/DOCX/LaTeX export is live |
| A008 | Single template initially | Superseded: 6 corporate + 3 C2C templates |
| A009 | Yeldra B/W design | Superseded by A021 |
| A010 | Landing page deferred | Superseded: marketing pages are live |
| A011 | Soft deletes for resumes | Superseded by A022 |
| A012 | Application statuses | Holds |
| A013 | Rebrand to Nextzen Orbit | Holds |
| A014 | Extension deferred to Phase 7 | Superseded by A020 |
| A015 | Prefill new resumes from profile | Holds |
| A016 | Groq for resume parsing | Superseded by A018 |

## Original decisions (2026-03)

### A001: Google OAuth only (initial release). **Superseded by A017**
**Decision:** Launch with Google OAuth only.
**Rationale:** Simpler, faster onboarding.

### A002: No email verification required
**Decision:** Not needed for Google accounts. Still true: email/password accounts exist only for staff and SSO clients, and staff create them with `email_confirm: true`.

### A003: Groq API instead of OpenAI/Anthropic. **Superseded by A018**
**Decision:** Groq with LLaMA 3.3 70B, later `openai/gpt-oss-120b`.

### A004: AI token limits not enforced yet
**Decision:** Track tokens (`ai_usage`) but don't enforce them. **Superseded** by the daily allowances in A024.

### A005: Razorpay primary, Cashfree secondary. **Superseded by A019**

### A006: Payment integration deferred. **Superseded by A019**

### A007: PDF/DOCX export deferred. **Superseded**
Export to PDF, DOCX and LaTeX is live, from one shared layout plan.

### A008: Single resume template initially. **Superseded**
There are six corporate templates (Harvard, Jake's, Deedy, Awesome CV, FAANGPath, AltaCV) plus three C2C templates. Classic, Modern and Creative were retired on 2026-10-26; saved resumes map to the closest current design.

### A009: Yeldra-inspired B/W design. **Superseded by A021**

### A010: Landing page deferred. **Superseded**
`(marketing)` has the landing page and the legal pages.

### A011: Soft deletes for resumes only. **Superseded by A022**

### A012: Application status values
**Decision:** `applied`, `screening`, `interview`, `offer`, `rejected`. Still in use.

### A013: Rebrand to Nextzen Orbit
**Decision:** The product was renamed from "JobSearch AI". Still in use.

### A014: Chrome extension deferred to Phase 7. **Superseded by A020**

### A015: Resume prefill from profile
**Decision:** New resumes copy contact info from the profile. Still in use.

### A016: AI resume parser with Groq. **Superseded by A018**

## Later decisions

### A017: Gated signup with human review (2026-09)
**Context:** The service is done-for-you, so every client costs recruiter time.
**Decision:** Google sign-in creates an account, but access needs a submitted application that a supervisor approves (migration 033). Staff and SSO clients use email/password.
**Rationale:** Quality control and fraud prevention before payment.

### A018: Amazon Bedrock with a reviewer model (2026-10-13)
**Context:** Groq rate limits and quality.
**Decision:** All AI runs on Bedrock through its OpenAI-compatible endpoint (still called through `groq-sdk`). Kimi K2.5 writes and parses, and DeepSeek V3.2 fact-checks. Every whole-resume rewrite goes through the quality gate.
**Rationale:** In a blind bake-off, Kimi wrote the best tailored copy and parsed fastest (~14s vs ~41s), and DeepSeek was the most literal reviewer.

### A019: PayU, INR, paid access required (2026-09)
**Decision:** PayU monthly INR checkout. Trials don't unlock service, and activation is an idempotent RPC (035). USD stays a placeholder until a provider is chosen.

### A020: Assisted autofill extension, no auto-apply (2026-06)
**Decision:** Build the MV3 extension now, and remove the Playwright auto-apply worker. Recruiters apply manually through the apply queue.
**Rationale:** Auto-apply was unreliable and risky. The user (or recruiter) stays in control of submission.

### A021: Dark-first glass design system
**Decision:** Red primary (`#FF003D`), cyan accent, Sora / Space Grotesk, dark by default. See [UI_PATTERNS.md](UI_PATTERNS.md).

### A022: Hard delete resumes with file cleanup
**Decision:** Deleting a resume removes the row and its stored files (`src/lib/resume/delete.ts`). `deleted_at` remains but isn't used.
**Rationale:** Privacy. Users expect "delete" to remove their documents.

### A023: One deployment, service role plus code checks for staff
**Decision:** A single Next.js deployment serves every surface. Admin routes use the service role and authorize in code; RLS role checks caused recursion (migrations 005–030).

### A024: Daily AI allowances (2026-10)
**Decision:** Per-day caps by role and plan, reset at 00:00 GMT. Only successful runs are recorded, and admins can request extra from a supervisor (migration 046). See [ai-usage-limits.md](ai-usage-limits.md).

### A025: Region alignment (2026-10)
**Decision:** Move the Vercel functions from `bom1` to `hnd1` to sit next to the Tokyo Supabase project, instead of migrating to AWS. See [plans/speed.html](plans/speed.html) and [performance/performance-audit.md](performance/performance-audit.md).

## Format

```
### A[XXX]: [Brief title]
**Context:** What was unclear
**Decision:** What we decided
**Rationale:** Why
```
