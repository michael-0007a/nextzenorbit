# Security: Nextzen Orbit (main)

Last reviewed from code: 2026-10-16, branch `main`. Audit history is in the security-audit tracker (run 3 is the latest). Its fixes are on beta; see [Open on main, fixed on beta](#open-on-main-fixed-on-beta).

## Authentication

| Who | Method | Code |
| --- | --- | --- |
| Clients | Google OAuth through Supabase. The code exchange happens at `/api/auth/callback` | `src/app/(auth)/actions.ts` |
| Staff | Email and password at `/admin/login` | `src/app/(admin-auth)/actions.ts` |
| SSO clients | Email and password accounts created by a super admin (`/admin/sso-users`) | `src/app/api/admin/sso-users/route.ts` |

- Sessions are Supabase JWTs stored in HTTP-only cookies and refreshed by the proxy on every request.
- On main, the client login page's email/password form posts to a missing `/api/auth/login`, so SSO clients can't sign in through it. Beta fixes this with a rate-limited `signInWithEmail` server action.
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

Main has no daily AI allowance. That's added on beta (migration 046).

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
- Secrets live only in Vercel environment variables. `supabase/.temp` must not be committed (it's untracked on beta).

## Gaps and non-goals

- There are no custom security headers or CSP in `next.config.ts`. Vercel defaults apply.
- Some older routes return non-standard error bodies.
- Phone numbers aren't verified, so a rejection block keyed on phone can be evaded or can hit the wrong person. Reviewers should check contact details before rejecting.

## Open on main, fixed on beta

Security audit run 3 was fixed in commit `aacec9d`, which is on beta only. The database part (migration 042) is **already applied** to the shared database, so these findings are open in main's **app code**:

| Finding | Issue on main | Fix on beta |
| --- | --- | --- |
| F2/F3 | Several admin routes and generator pages don't check that an ordinary admin is assigned to the client: files, resumes, upload, optimize, cover letters, notifications, subscription activate, resume export, `export-admin` | `denyUnassignedClient` in `src/lib/admin/assignments.ts`; fails closed for unknown roles |
| F6 | Telemetry route inserts with the user client. Since 042 revoked that, telemetry is silently lost | Writes with the service role, with size caps |
| F8 | `DELETE /api/admin/sso-users` can demote more than `sso_user` accounts, and an admin can demote themselves | Only demotes `sso_user`; blocks demoting yourself |
| N3 | DOCX parsing has no zip-bomb or oversize-archive guard | Rejected before extraction |
| N6 | Public `/api/youtube/search` (unused) spends the YouTube quota | Route removed |
| F1/N1 | Some scripts hardcode the DB URL and seed passwords | Read from env |

Until beta is merged, avoid giving ordinary admins access they shouldn't have on main, and prioritize this merge. `scripts/test-security-hardening.cjs` (beta) covers the fixes.
