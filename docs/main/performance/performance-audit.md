# Performance audit and AWS decision

Date: 2026-09-29. Scope: source review across routing, shared authentication, representative admin and client pages, API queries, SQL migrations, resume generation/export, assets, and hosting. Inventory: 38 page files, 72 API route files, 2 loading boundaries. This is not an authenticated benchmark of every route. Runtime behavior may differ from this local checkout.

The user reports Vercel hosting and Supabase in Mumbai and is considering replacing the backend with AWS. No application code, infrastructure, database, or production settings were changed by this audit.

## Live observations

Read-only, unauthenticated HTTP GETs to https://nextzenorbit.vercel.app/ from this workstation:

| Page | Time to first byte | Total HTML transfer | Observation |
| --- | --- | --- | --- |
| `/`, sample 1 | 608 ms | 794 ms | `X-Vercel-Id: bom1::iad1::...`, cache MISS, private/no-store |
| `/`, sample 2 | 786 ms | 999 ms | Same regions and cache behavior |
| `/admin/login` | 642 ms | 642 ms | Prerendered response, `bom1` |
| `/terms` | 630 ms | 640 ms | Prerendered response, `bom1` |

These include connection/TLS time and are too few samples to establish percentiles. They do not measure JavaScript, image delivery, authenticated database queries, or visual completion. An initial sandbox proxy connection failure was excluded.

The homepage headers indicate Mumbai ingress and Washington, D.C. function execution. With the user-reported Mumbai database, region mismatch is a strong candidate for amplified latency on authenticated requests with repeated queries. Confirm the runtime region for representative API routes in Vercel settings/logs; public homepage headers do not prove every function uses that region. Vercel documents `x-vercel-id` and the region codes in its [headers reference](https://vercel.com/docs/headers/request-headers) and [region reference](https://vercel.com/docs/regions).

First infrastructure experiment: configure applicable Vercel functions in Mumbai (`bom1`), redeploy, and compare equivalent authenticated requests. This does not require replacing Supabase. See [function region configuration](https://vercel.com/docs/functions/configuring-functions/region).

## Confirmed source patterns and their remedies

Priorities are implementation order, not measured attribution of seconds.

| Priority | Area and evidence | Recommended change |
| --- | --- | --- |
| 1 | `src/middleware.ts` and dashboard layout repeat approval/payment checks. `onboarding.ts` performs three sequential queries for ordinary users; `service-access.ts` performs two more. | Consolidate the access lookup and reuse results within the request. Keep authoritative checks at data access and mutation boundaries, and keep RLS. React request memoization does not automatically share state between middleware and rendering. |
| 1 | `requireAdmin()` independently calls Auth and queries the role in layout and pages. Several client pages also call `getUser()` instead of the existing cached helper. | Deduplicate authentication and role reads within server rendering. Keep fresh authorization for separate API requests. Do not cache privileged decisions globally. |
| 1 | `api/admin/users/[id]/route.ts` reads user, resumes, queue, generated resumes, letters, and notifications sequentially. | After access validation, parallelize independent reads or use a carefully scoped database function. Stream optional panels separately. |
| 1 | `api/admin/stats/route.ts` runs six initial queries and three more per admin. Ten admins means 36 data queries, before auth/middleware overhead. | Replace per-admin query loops with grouped database aggregation. Parallel requests still consume database and connection capacity. |
| 1 | Apply queue downloads all matching users with nested jobs, then filters assignments/status and sorts in application code. | Filter assignment/status in SQL and paginate users and jobs. Fetch detailed jobs when expanded. Compute overall counts separately so pagination does not change count semantics. |
| 1 | Admin Users includes nested queue rows merely to calculate counts. Assignment filtering happens after database pagination. | Aggregate job counts in SQL and apply assignment filtering before pagination. This also avoids sparse pages and misleading totals. |
| 2 | Admin Users, Team, Analytics, and User Details fetch initial data in browser effects after the page loads. Users adds a 300 ms timer even for its initial fetch. | Supply initial server data to interactive components; retain browser requests for filters and refresh. Debounce typing only. Cancel obsolete searches and prevent stale responses overwriting newer results. |
| 2 | User Details selects full resume content and spreads it into the JSON response, although its list UI primarily uses metadata and a `has_export_content` flag. | Return list metadata and the derived flag; fetch full content only for editing/export. Avoid returning the base resume body twice. |
| 2 | Applications reads all columns from two unbounded collections sequentially; Resumes performs two independent queries sequentially. Detailed analytics returns all historical jobs. | Parallelize independent work, select only displayed fields, paginate histories, and use a bounded time window for analytics. |
| 2 | Only career routes have `loading.tsx`. Dashboard layout itself waits for several checks before returning its shell. | Add loading boundaries and targeted prefetching. Use nested Suspense for independent panels. A loading file below a blocking layout cannot eliminate the layout's wait. |
| 2 | Career detail waits for multiple sections and then roadmap detail and projects before returning. Roadmap detail itself reads metadata and steps separately. | Start independent project work earlier; combine related reads where appropriate; stream sections so the slowest optional panel does not delay the whole page. |
| 2 | Homepage reads cookies/auth and search parameters server-side. Live HTML is private/no-store. | Separate public marketing rendering from authenticated app entry, preserving login error handling and the intended signed-in redirect experience. Public content can then be statically served. Never make personalized HTML publicly cacheable. |
| 2 | Career/reference services use cookie-bound clients and uncached reads even when content changes infrequently. | Separate permission checks from shared reference content. Cache only approved shared content, invalidate on edits, and keep personal projects/notes private. Removing `force-dynamic` alone is insufficient. |
| 2 | Sidebar fetches subscription again through `useSubscription()` after server-side access and dashboard subscription queries. | Pass the initial subscription into a shared client provider and refresh on relevant changes. The hook's per-instance ref is not a shared cache. |
| 2 | Resume upload performs storage upload, a local reference-file write, extraction, AI parsing, usage updates, and database persistence during one request. | Use direct signed object-storage uploads where appropriate; run parsing in a durable job; expose progress and a retryable job ID. Reassess production local-file mirroring, which may fail on ephemeral/read-only hosts. |
| 2 | Generation waits for a complete Groq JSON response. `fitGeneratedResume()` may make a second full AI call. Model is shared `openai/gpt-oss-120b`, with low reasoning effort. | Measure auth, initial generation, length revision, and save separately. Evaluate task-specific model/output budgets against factuality and formatting fixtures. Keep length/quality checks; use progress or validated draft stages rather than exposing incomplete JSON. |
| 2 | PDF and Word exports render inside request handlers; the workspace export imports both format libraries. | Measure cold initialization and rendering separately; conditionally import the chosen format if beneficial. Store reusable exports keyed by content/template/renderer version. Use isolated workers for heavy or batch jobs. |
| 3 | Admin document editor watches the entire form, serializes the draft, and computes preview layout as content changes. | Profile long resumes on modest devices. Defer/debounce preview work, memoize stable sections, and move layout computation to a Web Worker if it causes long tasks. Measure before changing layout algorithms. |
| 3 | `public/hero-clean.png` is 3,609,166 bytes. It already uses Next Image and priority, but lacks a responsive `sizes` prop. | Measure actual optimized bytes in the browser; the original file size is not the delivered size. Resize/re-encode the source and specify accurate responsive sizes. Verify visual quality. |
| 3 | Large blurs, backdrop filters, and continuous decorative animations appear throughout the UI. | Profile paint/compositing on mobile; reduce large animated effects if costly. This primarily affects rendering/interaction smoothness, not database response time. |
| 3 | No application-level Web Vitals or Server-Timing instrumentation found in the inspected source. | Add route metrics and timed server spans before judging provider changes. Hosting-level telemetry may exist outside the repository. |

Existing positives: dashboard counts already run in parallel; resumes list already uses a metadata projection; exports are server-side rather than universally loaded in browser pages; job-provider fetching already has a five-minute cache and bounded HTTP retry; fonts use Next Font. Avoid replacing these with blanket rewrites.

## Database work that requires measurements

Inspect slow-query statistics and EXPLAIN plans using representative data and authenticated roles. Migration files show intended schema, not necessarily the live indexes and policies.

- Existing indexes include user IDs and several status columns. Review composite indexes matching actual filters and ordering, such as job queue `(claimed_by, status)` and `(user_id, created_at)`. The existing `(assigned_to, status)` index does not serve a different `claimed_by` key. Confirm live indexes and write overhead before adding any.
- Migration 035 installs `has_paid_service_access()` in restrictive RLS policies across many tables. Test whether the planner evaluates this row-independent function repeatedly. Consider `(select public.has_paid_service_access())` where semantics permit; validate both allow/deny behavior and execution plans. This concerns RLS-scoped queries, not service-role queries that bypass RLS. [Supabase RLS guidance](https://supabase.com/docs/guides/database/postgres/row-level-security)
- Replace repeated REST round trips with scoped database functions for access lookup and aggregate counts where justified. This can help without changing providers.
- Check CPU, memory, disk IO, active connections, lock waits, slow queries, and table growth before increasing database compute. [Supabase performance guide](https://supabase.com/docs/guides/platform/performance)
- Keep connection pools bounded if moving to direct PostgreSQL access. More web-server instances can otherwise overload the database.

## What AWS would and would not change

AWS can help when it provides correctly located compute, sustained capacity, isolated workers, or a better database access pattern. It does not automatically eliminate repeated queries, delayed browser fetching, large payloads, expensive previews, or external model latency. Moving only the database while Vercel stays in a distant region can preserve the problem.

Two different migrations are possible:

1. Host Supabase yourself on AWS: retain much of the API surface, but take on operations for its services, upgrades, backups, monitoring, and availability. This alone is not a speed improvement.
2. Replace Supabase with AWS-native services: use PostgreSQL on RDS, Cognito or another auth system, and S3 storage. Replace Supabase SDK data calls, identity integration, storage URLs, and policy assumptions. This is a backend migration, not an environment-variable swap.

A reasonable candidate architecture for an AWS-native migration is CloudFront for cacheable public content/assets, a load balancer with a continuously running Next.js ECS/Fargate service in Mumbai, RDS PostgreSQL in the same region, S3 for files, and SQS plus separate workers for durable AI/parsing/export jobs. Size from measurements. ECS maintains the configured desired task count; multiple healthy tasks improve availability, while burst scale-out still has startup time. [ECS service behavior](https://docs.aws.amazon.com/AmazonECS/latest/APIReference/API_CreateService.html)

Do not add Redis, Kubernetes, microservices, or multi-region databases without a measured need. Account for load balancer, networking, logs, backups, and operational costs before choosing AWS over the current managed setup. No cost estimate is defensible yet because traffic and workload volume are unknown.

Replacing Supabase Auth requires preserving the relationship between existing user UUIDs and new identities, migrating Google login configuration, and planning existing password-user migration/session transitions. Cognito migration supports a just-in-time flow, subject to the source authentication system and login flow. [AWS migration reference](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-import-using-lambda.html)

Current SQL relies on Supabase concepts such as `auth.uid()`, service roles, and storage policies. A plain RDS database does not supply the entire Supabase environment. Preserve equivalent ownership, approval, subscription, and suspension enforcement during migration.

Self-hosted Next.js needs correct streaming behavior through proxies and consistent caches/builds across replicas. Also review trusted client-IP headers used by this app's rate limiting. [Next.js self-hosting guide](https://nextjs.org/docs/app/guides/self-hosting)

## Measurement and execution order

1. Baseline production from intended user locations. Cover cold and repeat visits, normal users and each admin role, small and large accounts. Record TTFB, content-ready time, LCP, INP, payload bytes, query count, and p50/p95 request duration. Measure generation separately from normal navigation.
2. Confirm and align runtime/database regions, then remeasure the same flows.
3. Deduplicate shared checks, remove admin query loops, parallelize independent reads, and narrow/paginate data.
4. Improve initial data delivery, streaming, cache strategy, and browser request reuse.
5. Profile editor/rendering, image delivery, and third-party work. Add durable background work for expensive tasks where warranted.
6. Build an AWS staging comparison if migration remains desired. Use the same app version, dataset, access policies, traffic shape, and geography. Compare p95 latency, errors, and full cost before cutover. Retain rollback until identity, payment, and file flows are verified.

Suggested initial product budgets, to refine after baseline: navigation feedback within 100 ms, common warm reads within 500 ms server time, and useful dashboard content within roughly one second on a good connection. These are proposed goals, not current measurements or promises. Track Core Web Vitals separately; good LCP is at most 2.5 seconds at the 75th percentile. [LCP reference](https://web.dev/articles/lcp)
