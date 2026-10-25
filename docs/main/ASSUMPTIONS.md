# Assumptions — Nextzen Orbit

This document tracks engineering decisions made where the PRD was unclear or incomplete.

---

## Authentication

### A001: Google OAuth Only (Initial Release)
**Context:** PRD mentions email/password + Google OAuth, but for MVP simplicity.  
**Decision:** Launch with Google OAuth only. LinkedIn OAuth will be added later.  
**Rationale:** Reduces complexity, faster onboarding, most users prefer OAuth.  
**Date:** 2026-03-05

### A002: No Email Verification Required
**Context:** PRD mentions email verification for password-based auth.  
**Decision:** Not needed since we're Google OAuth only.  
**Rationale:** Google already verifies emails.  
**Date:** 2026-03-05

---

## AI Integration

### A003: Groq API Instead of OpenAI/Anthropic
**Context:** PRD mentions Claude Opus 4.6, but doesn't specify provider.  
**Decision:** Use Groq API with LLaMA 3.3 70B Versatile model.  
**Rationale:** Cost-effective, fast inference, good quality for resume analysis.  
**Date:** 2026-03-05

### A004: AI Token Limits Not Enforced Yet
**Context:** PRD specifies token budgets per plan.  
**Decision:** Token tracking implemented but limits not enforced in Phase 1.  
**Rationale:** Focus on core features first, enforcement in Phase 2.  
**Date:** 2026-03-05

---

## Payments

### A005: Razorpay Primary, Cashfree Secondary
**Context:** PRD mentions both payment gateways.  
**Decision:** Razorpay as primary implementation, Cashfree infrastructure ready but not active.  
**Rationale:** Razorpay has better market share in India, simpler integration.  
**Date:** 2026-03-02

### A006: Payment Integration Deferred
**Context:** Full payment flow requires business entity setup.  
**Decision:** Payment UI and routes created, actual Razorpay integration pending.  
**Rationale:** Can't process payments without business verification.  
**Date:** 2026-03-05

---

## Resume Features

### A007: PDF/DOCX Export Deferred to Phase 3
**Context:** PRD mentions resume export.  
**Decision:** Resume viewing/editing in Phase 2, export in Phase 3.  
**Rationale:** Core functionality first, export is enhancement.  
**Date:** 2026-03-05

### A008: Single Resume Template Initially
**Context:** PRD mentions multiple ATS-optimized templates.  
**Decision:** Start with one template, add more in Phase 3.  
**Rationale:** Faster MVP, template system architecture allows easy addition.  
**Date:** 2026-03-05

---

## UI/UX

### A009: Yeldra-Inspired Design Over PRD Spec
**Context:** PRD specified indigo/violet gradient design system.  
**Decision:** Changed to Yeldra-inspired B/W + 5-color system.  
**Rationale:** User preference for cleaner, more professional aesthetic.  
**Date:** 2026-03-02

### A010: Landing Page Deferred
**Context:** PRD includes marketing pages (landing, pricing, blog).  
**Decision:** Dashboard-first approach, landing page in later phase.  
**Rationale:** Focus on core product, marketing pages after feature complete.  
**Date:** 2026-03-05

---

## Database

### A011: Soft Deletes for Resumes Only
**Context:** PRD mentions soft deletes.  
**Decision:** Implemented for resumes table, hard deletes for others.  
**Rationale:** Resume history valuable, other data can be hard deleted.  
**Date:** 2026-03-02

### A012: Application Status Values
**Context:** PRD mentions Kanban but doesn't specify exact statuses.  
**Decision:** Using: applied, screening, interview, offer, rejected.  
**Rationale:** Common application tracking workflow.  
**Date:** 2026-03-05

---

## Branding

### A013: Rebranding to Nextzen Orbit
**Context:** PRD originally named product "JobSearch AI".  
**Decision:** Rebranded to "Nextzen Orbit" as per user direction.  
**Rationale:** User preference for unique, memorable brand name.  
**Date:** 2026-03-05

---

## Chrome Extension

### A014: Extension Deferred to Phase 7
**Context:** PRD includes Chrome Extension for auto-fill.  
**Decision:** Completely deferred until post-PMF validation.  
**Rationale:** Core web app must be solid first.  
**Date:** 2026-03-02

---

## Phase 2 Completion

### A015: Resume Pre-fill from Profile
**Context:** PRD doesn't specify how new resumes should be initialized.  
**Decision:** New resumes auto-populate contact info from user profile.  
**Rationale:** Better UX - users don't re-enter same data.  
**Date:** 2026-03-05

### A016: AI Resume Parser with Groq
**Context:** PRD specifies Claude for AI tasks.  
**Decision:** Using Groq (LLaMA 3.3 70B) for resume parsing.  
**Rationale:** Cost-effective, fast inference, sufficient quality for structured extraction.  
**Date:** 2026-03-05

---

## Format

Each assumption follows this template:

```
### A[XXX]: [Brief Title]
**Context:** What the PRD says or doesn't say  
**Decision:** What we decided to do  
**Rationale:** Why we made this decision  
**Date:** When the decision was made
```

---

*Last updated: 2026-03-05*

