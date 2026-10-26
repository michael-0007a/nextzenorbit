# Security: Nextzen Orbit

Last reviewed from code: 2026-10-26, branch `main` (beta merged). Audit history is in the security-audit tracker; run 3 is the latest and is fixed, see [Audit run 3](#audit-run-3-fixed-released-2026-10-26).

## Authentication

| Who | Method | Code |
| --- | --- | --- |
| Clients | Google OAuth through Supabase. The code exchange happens at `/api/auth/callback` | `src/app/(auth)/actions.ts` |
| Staff | Email and password at `/admin/login` | `src/app/(admin-auth)/actions.ts` |
| SSO clients | Email and password accounts created by a super admin (`/admin/sso-users`) | `src/app/api/admin/sso-users/route.ts` |

- Sessions are Supabase JWTs stored in HTTP-only cookies and refreshed by the proxy on every request.
- The client login page's email/password form uses the `signInWithEmail` server action, rate limited to 30 per IP and 10 per email per 15 minutes.
- With the domain split on, staff use a separately named session cookie (`sb-orbit-admin`) on the admin host. See [domain-separation.md](domain-separation.md).
- Signup needs an approved application (033). Rejection permanently blocks the email and the submitted phone (`registration_blocks`). Suspended users (`users.is_suspended`, 034) are denied.

## Authorization

### Layers

1. **Proxy gate** (`src/middleware.ts`): approval gives 403 and payment gives 402 for `/api/*`, and dashboard pages redirect. Any failure fails closed (503).
2. **Route checks:** every route resolves the session user itself. Admin routes call `requireAdmin` / `requireSuperAdmin` (`src/lib/admin/guards.ts`, memoized per request).
3. **Database:** RLS on every table, restrictive `has_paid_service_access()` policies on paid tables and storage, and `SECURITY DEFINER` RPCs granted only to `service_role` for sensitive writes.

### Roles

| Role | Can |
| --- | --- |
| `user` | Own data, after approval and payment |
| `sso_user` | Same, without payment |
| `admin` | Assigned clients only |
| `supervisor_admin` | All clients, signup review, allocation, analytics |
| `super_admin` | Everything, including team actions (suspend, reset password), SSO users and cache invalidation |

### Service role means checks in code

`createAdminClient()` bypasses RLS. Any route that uses it must:

- take the user id from the session (or the signed access envelope), never from the request body;
- for admins, verify the client assignment (`isAssignedToClient` / `assignedClientIds`) unless the role is supervisory;
- never return the service-role key or the access-envelope header.

### Access envelope

`AccountAccess` is computed once per request and forwarded to route handlers as `x-orbit-access` (see `ACCESS_HEADER`). It is signed with HMAC-SHA256 using `SUPABASE_SERVICE_ROLE_KEY`, bound to the user id and path, and valid for 30 seconds. The proxy deletes any incoming copy. `getRequestAccess` falls back to a database read if the header is missing or invalid.

## Input validation and uploads

- Zod schemas validate request bodies (`src/lib/validations/*`, plus per-route schemas).
- Resume uploads accept PDF/DOCX. Signup resumes accept PDF/DOC/DOCX up to 10 MB through a signed direct upload. The server checks the stored path, owner, real size and file signature.
- The admin document workspace parses up to 4 MB in memory and never stores the file.

## Rate limits

Atomic Postgres counters (`rateLimit` → `consume_request_limit`). Keys are SHA-256 hashed. A limiter failure returns 503 (fails closed). The IP comes from `x-vercel-forwarded-for`, then `x-real-ip`.

| Scope | Limit |
| --- | --- |
| `oauth-start` (per IP) | 20 / 15 min |
| `admin-login-ip` / `admin-login-email` | 30 / 15 min per IP, 10 / 15 min per email |
| `application-submit` | 5 / 15 min per user |
| `onboarding-upload` | 10 / 15 min per user |
| `application-review` | 60 / min per reviewer |
| `checkout` (both checkout routes) | 5 / 5 min per user |
| `payment-reconcile` / `admin-payment-reconcile` | 6 / 5 min / 10 / 5 min |
| `job-search` | 60 / min per user or admin |
| `admin-resume-optimize`, `admin-cover-letter` | 10 / min per admin |
| `admin-resume-upload` | 10 / 5 min per admin |
| `performance` beacon | 60 / min per hashed IP |

Daily AI allowances cap cost per user (migration 046, reset at 00:00 UTC). Over the limit, AI routes return 429 `AI_QUOTA_EXCEEDED`. See [ai-usage-limits.md](ai-usage-limits.md).

## Payment security

- PayU response hashes are verified with the merchant salt before anything happens.
- Activation runs inside `complete_payu_payment`, which checks the amount in paise against the original `payment_orders` row and is idempotent.
- Reconciliation asks PayU's verify API and never trusts the client.
- See [PAYMENTS.md](PAYMENTS.md).

## AI safety

- Prompts live on the server. The model's output is never trusted: the quality gate's reviewer flags unsupported claims, and anything still unsupported is restored to the candidate's original text.
- C2C resumes may only change their summary; that's a code boundary, not just a prompt.
- Logs hold no resume text, account ids or query strings (performance logging, 040).

## Data protection and privacy

- Demographic answers (`candidate_self_identification`) are owner-only, excluded from recruiter review and matching, and never stored in the browser.
- Work-authorization answers are visible only to assigned recruiters and supervisory roles, through a guarded endpoint.
- Admin-generated client documents expire after 30 days. Private-library documents remain until deleted.
- Secrets live only in Vercel environment variables. `supabase/.temp` must not be committed (it's untracked).

## Gaps and non-goals

- There are no custom security headers or CSP in `next.config.ts`. Vercel defaults apply.
- Some older routes return non-standard error bodies.
- Phone numbers aren't verified, so a rejection block keyed on phone can be evaded or can hit the wrong person. Reviewers should check contact details before rejecting.

## Audit run 3 (fixed, released 2026-10-26)

Fixed in `aacec9d` and released to main with the beta merge (`b9b0678`). The database part is migration 042.

| Finding | Issue before | Fix |
| --- | --- | --- |
| F2/F3 | Several admin routes and generator pages didn't check that an ordinary admin is assigned to the client: files, resumes, upload, optimize, cover letters, notifications, subscription activate, resume export, `export-admin` | `denyUnassignedClient` in `src/lib/admin/assignments.ts`; fails closed for unknown roles |
| F4/F5/F7 | Clients could insert `resume_versions` for other resumes, write `job_queue` directly, and save unbounded `saved_job_searches` | 042 policies: owner-only versions, no client queue writes, paid-access gate plus a 4,000-character `filters` cap |
| F6 | Anonymous and client telemetry inserts | 042 revokes them; the route writes with the service role, with size caps |
| F8 | `DELETE /api/admin/sso-users` could demote more than `sso_user` accounts, and an admin could demote themselves | Only demotes `sso_user`; blocks demoting yourself |
| N3 | DOCX parsing had no zip-bomb or oversize-archive guard | Rejected before extraction |
| N6 | Public `/api/youtube/search` (unused) spent the YouTube quota | Route removed |
| F1/N1 | Some scripts hardcoded the DB URL and seed passwords | Read from env |
| F9 | `supabase/.temp` tracked | Untracked |

`node scripts/test-security-hardening.cjs` covers the fixes.

New code that uses `createAdminClient()` bypasses RLS, so it must call the right guard itself. For admin routes acting on a client, that's `requireAdmin` plus `denyUnassignedClient`.
