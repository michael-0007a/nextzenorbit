# Job search implementation and rollout

Implemented in the shared client and admin workspace:

- Keyword/location/country search, exclusions, posting age, employment type, full-time status, salary bounds, sorting and pagination.
- Country-specific salary currency; estimated salaries labeled. Work-arrangement mentions are hints, with unknown values kept explicit.
- Search cancellation, URL filter restoration, private saved searches, and previous results retained when a provider fails.
- Job details, source links and attribution, transparent title/skill/location/work-arrangement match evidence, optional ranking of the current page, and session dismissal.
- A reviewed shortlist with saved or recruiter-generated resume selection. Adding to a queue does not submit an application.
- Shared Adzuna adapter and normalized catalog. Search results refresh catalog timestamps; results older than 24 hours cannot be queued without a fresh search. This checks catalog freshness, not whether an employer has independently closed a vacancy.
- Server-side approval, service access and recruiter assignment checks. The queue reads canonical listings from storage rather than accepting edited client job details.
- Atomic per-client queuing, URL uniqueness, explicit generated-resume references, and resume ownership checks. Existing duplicate history is preserved.

## Deployment

Apply `036_expanded_onboarding.sql` and then `037_job_search_workspace.sql` before deploying this application version. Both rely on earlier migrations. Migration 036 changes the signup consent version, so deploy during a controlled rollout: older open signup forms should refresh before submitting. Neither migration has been applied to production by this task.

Keep `ADZUNA_APP_ID` and `ADZUNA_APP_KEY` server-side. Verify a real search in each supported market after deployment. Provider requests are bounded, cached for five minutes, and retry temporary HTTP failures once. Search API calls are rate limited per account.

## Validation

Automated tests exercise filters/currencies, provider retries, canonical catalog values, stale results, entitlement and assignment checks, private onboarding data, migration execution, duplicate preservation, retry idempotency and resume ownership. Browser fixtures use the real components with mocked APIs and sample data. Live credentials, production migrations and real employer availability require deployment smoke checks.

## Further improvements requiring evidence or external setup

Additional licensed providers, semantic ranking and scheduled digests are not enabled. First measure relevant jobs in the top 10, stale/duplicate rates, time to shortlist, latency and cost by country/role. Choose another provider from measured coverage gaps and its licensing/credentials. Use semantic ranking only after a recruiter-reviewed evaluation. Saved searches are available; email digests need an explicit notification preference and delivery setup.

No automated eligibility rejection uses demographics or immigration information. Full requirements, sponsorship and work authorization remain explicit human-review items.

Provider reference: [Adzuna search documentation](https://developer.adzuna.com/docs/search).
