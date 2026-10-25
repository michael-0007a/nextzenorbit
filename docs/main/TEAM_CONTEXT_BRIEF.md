# Nextzen Orbit: team and leadership brief

Last updated: 2026-10-16
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

### Known problems on production

- Clients with email/password accounts (SSO clients) can't sign in through the normal login form. **Fixed in beta.**
- Some recruiter screens don't check whether the recruiter is assigned to that client, so a recruiter could reach another client's documents if they had the link. **Fixed in beta. This is the main reason to ship beta soon.**
- The app is slower than it should be because the servers (Mumbai) and the database (Tokyo) are in different countries. **Fixed in beta.**
- There are no daily limits on AI use, so cost isn't capped. **Added in beta.**
- Payment in USD isn't available yet.

## 3. What beta adds (ready to launch)

- **Separate addresses:** nextzenorbit.com (marketing), app.nextzenorbit.com (clients), admin.nextzenorbit.com (staff), with separate logins.
- **Five client features:**
  - a progress feed showing what the team did for the client this week;
  - messaging between the client and their team;
  - a LinkedIn profile optimizer;
  - an offer comparison tool (CTC to in-hand pay);
  - AI mock interviews.
- **Daily AI allowances:** clients get 10–20 resume generations a day depending on plan. Recruiters can ask a supervisor for more.
- **New resume designs:** Harvard, FAANGPath and AltaCV.
- The security fixes and speed improvements above.

Launch steps: [`../beta/your-tasks.html`](../beta/your-tasks.html).

## 4. What it costs to run

AI is roughly 3–7¢ per resume rewrite and about 1¢ per cover letter, so about 7–15¢ for a typical client's set of documents. See `AI_COST_ESTIMATE.md` in the repo root. Hosting (Vercel) and the database (Supabase) are fixed monthly costs.

## 5. Decisions needed from leadership

1. **Merge beta into production** soon, mainly for the recruiter access fix.
2. **USD payments:** pick a provider (Airwallex or Stripe) if non-India clients are a priority.
3. **Extension distribution:** publish to the Chrome Web Store or keep installing it manually.
4. **Next features** from the backlog ([`../beta/feature-ideas.html`](../beta/feature-ideas.html)): for example WhatsApp notifications, approve-before-apply, saved-search alerts.

## 6. Success metrics to track

- Applications delivered vs plan target per client per month.
- Time from signup to approval to payment.
- Payment recovery rate (confirmations recovered with "Check payment status").
- Client-reported interview callbacks.
- AI cost per client per month.
- Autofill fields filled vs corrected, by portal.

## 7. One-sentence status

Production runs the full done-for-you workflow end to end. Beta closes a recruiter-access security gap and makes the app faster. It also adds cost controls and five client-facing features, and it is ready to launch once the beta checklist is done.
