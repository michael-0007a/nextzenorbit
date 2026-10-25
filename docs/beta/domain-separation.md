# Domain separation (beta)

Status: **built on beta** (commits `aa0191e`, `127b807`, `3ca571e`). It is off until all three host variables are set, so previews, localhost and the `*.vercel.app` URL keep working as a single site. The rollout steps (DNS, Vercel, Supabase) are in [your-tasks.html](your-tasks.html); the build plan is in [plan.html](plan.html).

## Hosts

One repository, one Next.js deployment, one Supabase database. Each host is a different surface:

| Variable | Example | Surface |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `https://nextzenorbit.com` | Marketing + legal pages: `/`, `/privacy`, `/terms`, `/refund`, `/compliance` |
| `NEXT_PUBLIC_APP_URL` | `https://app.nextzenorbit.com` | Client app (all existing client paths) |
| `NEXT_PUBLIC_ADMIN_URL` | `https://admin.nextzenorbit.com` | Staff console with clean URLs (`/users` instead of `/admin/users`) |
| `ORBIT_LEGACY_HOSTS` | `nextzenorbit.vercel.app` | Comma-separated old hosts whose pages redirect to the new ones (production only) |

For beta testing the same scheme runs on `beta.`, `app.beta.` and `admin.beta.nextzenorbit.com`, attached to the `beta` branch as Preview domains with branch-specific variables.

## Routing (`src/lib/hosts.ts`, applied first in `src/middleware.ts`)

`hostKind(host)` returns `site`, `app`, `admin`, `legacy` or `any`. When the three URLs aren't all set, everything is `any` and nothing changes. `routeForHost(kind, path)` is a pure function:

| Request on | Path | Result |
| --- | --- | --- |
| any host | `/api/*`, `/_next/*`, files with an extension | **Never moved**. Webhooks, the OAuth callback and the extension keep working on every host |
| site | Marketing page | Served |
| site | `/admin/...` | 308 → admin host, without the `/admin` prefix |
| site | Anything else (`/login`, `/dashboard`, ...) | 308 → same path on the app host |
| app | `/admin/...` | 308 → admin host |
| app | Anything else | Served. `/` redirects to `/dashboard` or `/login` |
| admin | `/admin/...` | 308 → the clean path (one hop, because in-app links still say `/admin/...`) |
| admin | `/x` | Rewrite to `/admin/x`; `/` → `/admin`. Client pages 404 here |
| legacy | Marketing page → site; `/admin/...` → admin; else → app | 308, keeping path and query |

On the app and admin hosts, responses carry `X-Robots-Tag: noindex, nofollow`. `appHref(path)` builds absolute app links (for example, the marketing site's login buttons).

**A hostname is never authorization.** Role, approval and payment checks are unchanged and run on every host.

## Sessions (`sessionCookieOptions`)

| Host | Supabase auth cookie |
| --- | --- |
| site + app | Shared cookie on the parent domain (`.nextzenorbit.com`), so being signed in on the marketing site carries to the app |
| admin | A separately **named** cookie (`sb-orbit-admin`) on that host only, so a client session never counts on the staff host and the reverse |
| any / legacy | Supabase default (host-only) |

Staff and client logins are therefore independent. Signing out signs you out of that side only. The server, browser and middleware Supabase clients all pass `sessionCookieOptions(host)`.

## Sign-in on beta

- **Clients:** Google, or email and password through the `signInWithEmail` server action (rate limited: 30 per IP and 10 per email per 15 minutes). This fixes main's form, which posted to a missing `/api/auth/login`.
- **Staff:** `admin.<domain>/login` (rewritten to `/admin/login`). Staff sign-in creates the admin-named cookie.
- **OAuth:** the Google redirect URI stays Supabase's own `…supabase.co/auth/v1/callback`. Supabase → Auth → URL configuration needs the app (and admin) origins in Redirect URLs, with the Site URL set to the app origin. Add the new origins to the Google client's Authorized JavaScript origins if it lists any.

## Payments and webhooks

Payment return URLs follow `NEXT_PUBLIC_APP_URL`. `/api/webhooks/payu` is never redirected, so the old callback address keeps working. Update PayU's dashboard to `https://app.nextzenorbit.com/api/webhooks/payu` when convenient.

## Extension

The extension's default App URL on beta is `https://app.nextzenorbit.com`; main's default is localhost. Its `host_permissions` already include `*.nextzenorbit.com` on both branches. Users sign in on the app host.

## Rollback

Unset `NEXT_PUBLIC_SITE_URL` (or either of the other two). Routing turns off, and the deployment behaves as one site again. No data migration is involved. Sessions on the parent-domain cookie may need one fresh sign-in.

## Tests

`scripts/test-domain-split.cjs` covers:

- routing staying off until all three URLs are set;
- host classification and per-host routing;
- the shared site/app session and the separate staff cookie;
- middleware applying host routing before auth and never redirecting webhooks;
- unconfigured deployments keeping the old single-host behavior.

## Why one deployment

Separate Vercel projects would add duplicate environment management and coordination across deployments without a demonstrated need. Split later only if marketing needs independent releases or ownership. Shared UI, validation and resume rendering could then move into packages.
