# Nextzen Orbit - Team and Leadership Context Brief

Last updated: 2026-04-10
Owner: Product + Engineering

## 1. What We Are Building

Nextzen Orbit is a job search execution platform for candidates.

The business goal is simple:
- help users create strong resumes quickly
- help users apply faster with better quality
- reduce manual tracking work
- eventually automate large parts of repetitive application work

In one line: resume quality + application speed + tracking clarity.

## 2. Current Product Status (Leadership View)

### Working well today

- User login and account setup
- Resume creation, upload, editing, and export
- AI support for resume improvement and job-description matching
- Cover letter generation and export
- Application tracking board (kanban/table)
- External job search and queueing jobs for auto-apply

### Working, but not production-ready

- Subscription and paid upgrade flow
- Auto-apply reliability across different employer portals

### Not complete yet

- Full checkout-to-upgrade user journey
- Strong portal-by-portal automation reliability
- Clean activity/insight layer for managers and users

## 3. Key Blocker Right Now

Auto-apply is not reliably completing end-to-end across career portals.

Current reason:
- every employer portal has a different flow
- many have multi-step navigation before the real form
- some include dynamic elements, redirects, or anti-bot checks
- current worker logic handles only a limited set of navigation patterns

Business impact:
- queue-to-application conversion is lower than expected
- users still need manual intervention
- trust in the "auto-apply" promise is affected

## 4. What Has Been Done So Far

- Built a separate worker service for browser automation
- Implemented queue polling, processing states, and proof screenshots
- Added site-specific handling for Indeed
- Added generic AI-assisted form filling for non-Indeed pages
- Added screenshot access and cleanup flows

This means the foundation exists, but reliability work is still required.

## 5. Next 2 Sprint Focus (Recommended)

### Priority 1: Auto-apply completion reliability

- Add robust multi-step navigation handling
- Add portal-specific adapters for top target portals
- Add safer retries and better failure categorization
- Capture step-level evidence (where exactly it failed)

### Priority 2: User-facing confidence

- Show precise failure reason in UI (not just "failed")
- Offer fallback action when automation cannot continue
- Improve queue status visibility

### Priority 3: Monetization readiness

- Complete checkout-to-upgrade UX
- Align plan logic with actual limits
- Re-enable real subscription enforcement

## 6. Success Metrics To Track

- Auto-apply completion rate
- Queue success vs failure by portal
- Manual intervention rate
- Time saved per user per week
- Upgrade conversion after reliability improvements

## 7. Decision Requests for Leadership

1. Approve top 3-5 portals to prioritize first.
2. Confirm whether reliability or monetization is sprint priority #1.
3. Decide acceptable MVP definition for "auto-apply working" (for launch messaging).

## 8. One-Sentence Status

Nextzen Orbit already delivers strong resume and tracking value, but auto-apply needs focused portal reliability work before it can be positioned as fully dependable at scale.
