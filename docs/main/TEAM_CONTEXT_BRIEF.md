# Nextzen Orbit - Team and Leadership Context Brief

Last updated: 2026-04-10
Owner: Product + Engineering

## 1. What We Are Building

Nextzen Orbit is a job search execution platform for candidates.

The business goal is simple:
- help users create strong resumes quickly
- help users apply faster with better quality
- reduce manual tracking work
- accelerate manual applications with assisted autofill (no auto-submit)

In one line: resume quality + application speed + tracking clarity.

## 2. Current Product Status (Leadership View)

### Working well today

- User login and account setup
- Resume creation, upload, editing, and export
- AI support for resume improvement and job-description matching
- Cover letter generation and export
- Application tracking board (kanban/table)
- External job search (Adzuna) and application tracking

### Working, but not production-ready

- Subscription and paid upgrade flow
- Assisted autofill coverage across different employer portals

### Not complete yet

- Full checkout-to-upgrade user journey
- Strong portal-by-portal automation reliability
- Clean activity/insight layer for managers and users

## 3. Key Blocker Right Now

Assisted autofill is not yet reliable across career portals.

Current reason:
- every employer portal has different field structures and naming
- many forms are multi-step with dynamic renders
- some include anti-bot checks or iframe-based inputs
- field detection and mapping logic is not yet fully implemented

Business impact:
- users still spend time correcting autofill
- trust in the "application copilot" promise is affected

## 4. What Has Been Done So Far

- Job search + application tracking foundation
- Legacy queue + worker exist (deprecated)
- Assisted autofill extension architecture and portal targets defined

This means the product direction is clear, but the extension still needs full implementation.

## 5. Next 2 Sprint Focus (Recommended)

### Priority 1: Assisted autofill reliability

- Build portal-specific adapters for top target portals
- Improve field detection and mapping accuracy
- Add a clear review UI before filling
- Track portal-level coverage and failure reasons

### Priority 2: User-facing confidence

- Show precise field mapping status in the UI
- Offer guided fallback when a field cannot be detected
- Make it clear that submission remains manual

### Priority 3: Monetization readiness

- Complete checkout-to-upgrade UX
- Align plan logic with actual limits
- Re-enable real subscription enforcement

## 6. Success Metrics To Track

- Assisted autofill completion rate
- Autofill success vs correction rate by portal
- Manual correction rate
- Time saved per user per week
- Upgrade conversion after reliability improvements

## 7. Decision Requests for Leadership

1. Approve top 3-5 portals to prioritize first.
2. Confirm whether reliability or monetization is sprint priority #1.
3. Decide acceptable MVP definition for "assisted autofill working" (for launch messaging).

## 8. One-Sentence Status

Nextzen Orbit already delivers strong resume and tracking value, but assisted autofill needs focused portal coverage and field-mapping reliability work before it can be positioned as fully dependable at scale.
