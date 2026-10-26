# Nextzen Orbit: team and leadership brief

Last updated: 2026-10-26
Owner: Product + Engineering

## 1. What we are building

Nextzen Orbit is a **done-for-you job application service** with a client workspace.

- Clients apply to join, we review them, and they pay a monthly plan.
- Our recruiters apply to jobs for each client every month (300, 400 or 500 applications depending on the plan), each with a resume and cover letter tailored by AI.
- Clients also get self-serve tools: an AI resume builder, a job-description analyzer, cover letters, career learning pages, a job tracker, and a browser extension that fills application forms.

In one line: we apply for you, with better documents, and you can see the work.

## 2. Where things stand (production, `main`)

### Working today

- Signup with review: clients apply, and supervisors approve or reject.
- Payments in INR through PayU, with self-service recovery if a payment confirmation is lost.
- Team allocation: supervisors assign each client to one or more recruiters, and monthly targets split automatically.
- The recruiter workflow: search jobs for a client, queue, claim, apply, mark applied. Each application is credited to the recruiter who did it.
- AI resume and cover letter generation. A second AI checks the first one's work, and anything it can't verify goes back to the client's original wording. Resumes come out at exactly the page count asked for.
- The client resume builder, analyzer, cover letters, tracker, career pages and job search.
- Analytics for supervisors.

- Since 26 Oct 2026 (the beta release):
  - a progress feed showing what the team did for the client this week;
  - messaging between the client and their team;
  - a LinkedIn profile optimizer;
  - an offer comparison tool (CTC to in-hand pay);
  - AI mock interviews.
- New resume designs: Harvard (the default), FAANGPath and AltaCV.
- Daily AI allowances. Clients get 10, 15 or 20 resume generations a day (Silver, Gold, Elite), 30 cover letters and 50 other AI actions. Recruiters can ask a supervisor for more.

### Fixed in the 26 Oct release

- Email/password (SSO) clients can sign in through the normal login form.
- Recruiters can only open clients assigned to them.
- The servers now run in Tokyo next to the database, so pages load faster.
- AI cost is capped by the daily allowances.

### Still open

- Payment in USD isn't available yet.
- Separate addresses (nextzenorbit.com for marketing, app. for clients, admin. for staff) are built but not switched on. Launch steps: [plans/your-tasks.html](plans/your-tasks.html).

## 3. Beta

The `beta` branch is where new work is tested before production. Right now it matches production; anything new on it is described in [`../beta/`](../beta/README.md).

## 4. What it costs to run

AI is roughly 3–7¢ per resume rewrite and about 1¢ per cover letter, so about 7–15¢ for a typical client's set of documents. See `AI_COST_ESTIMATE.md` in the repo root. Hosting (Vercel) and the database (Supabase) are fixed monthly costs.

## 5. Decisions needed from leadership

1. **Switch on the separate addresses** (app. and admin.) when convenient.
2. **USD payments:** pick a provider (Airwallex or Stripe) if non-India clients are a priority.
3. **Extension distribution:** publish to the Chrome Web Store or keep installing it manually.
4. **Next features** from the backlog ([plans/feature-ideas.html](plans/feature-ideas.html)): for example WhatsApp notifications, approve-before-apply, saved-search alerts.

## 6. Success metrics to track

- Applications delivered vs plan target per client per month.
- Time from signup to approval to payment.
- Payment recovery rate (confirmations recovered with "Check payment status").
- Client-reported interview callbacks.
- AI cost per client per month.
- Autofill fields filled vs corrected, by portal.

## 7. One-sentence status

Production runs the full done-for-you workflow end to end. Since the 26 Oct release it is also faster and more secure, has daily AI cost controls, and gives clients five new features.
