# Deployment: Nextzen Orbit

Last reviewed from code: 2026-10-26 (beta merged). Production is the Vercel project `nextzenorbit` deploying the `main` branch. The `beta` branch deploys as a Vercel preview (`beta.nextzenorbit.com`, behind Vercel Deployment Protection). The domain-split launch steps are in [plans/your-tasks.html](plans/your-tasks.html).

## Topology

| Piece | Where | Notes |
| --- | --- | --- |
| Next.js app (pages + API) | Vercel, functions in `hnd1` (Tokyo) | Set in `vercel.json`, next to the database (was `bom1` before 2026-10-26) |
| Database, Auth, Storage | Supabase project `nextzenorbit`, Tokyo `ap-northeast-1` | Shared by production and beta previews |
| AI | Amazon Bedrock, region from `AWS_REGION` | Kimi K2.5 + DeepSeek V3.2 |
| Payments | PayU | Callback `/api/webhooks/payu` |
| Chrome extension | Loaded unpacked; Web Store publishing isn't set up | `extensions/nextzen-orbit-autofill` |

There is no worker server, Docker image or Fly.io app any more. The Playwright auto-apply worker is gone. Long AI work runs inside Vercel functions (`maxDuration` up to 120 seconds) and `after()` background jobs.

Functions and the database are both in Tokyo, so each query is a few milliseconds. Before the move, `bom1` functions added about 150 ms per query (see [plans/speed.html](plans/speed.html)). If you ever move the database, move the function region with it.

## Environment variables

Set these in Vercel → Settings → Environment Variables, for Production and Preview.

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Browser key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Service role. Also signs the access envelope. Server only |
| `AWS_BEARER_TOKEN_BEDROCK` | Yes | Bedrock API key for all AI |
| `AWS_REGION` | Yes | Bedrock region (defaults to `us-east-1` if unset) |
| `NEXT_PUBLIC_APP_URL` | Yes | Public app origin, used for payment returns and links |
| `PAYU_MERCHANT_KEY`, `PAYU_MERCHANT_SALT` | Yes | PayU credentials (same environment) |
| `NEXT_PUBLIC_PAYU_URL` | Yes | PayU test or production payment URL |
| `ADZUNA_APP_ID`, `ADZUNA_APP_KEY` | Yes | Job search |
| `CRON_SECRET` | Optional | Only if you call `/api/internal/jobs` |
| `RAZORPAY_KEY_ID` | No | Leftover read; not needed |
| `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_ADMIN_URL` | Optional | With `NEXT_PUBLIC_APP_URL`, turn on the site/app/admin domain split. Off unless all three are set. See [domain-separation.md](domain-separation.md) |
| `ORBIT_LEGACY_HOSTS` | Optional | Production only: old hosts (e.g. `nextzenorbit.vercel.app`) that redirect to the new domains |

`GROQ_API_KEY`, `YOUTUBE_API_KEY`, the Razorpay/Cashfree secrets and the worker variables (`POLL_INTERVAL_MS`, `HEADLESS`, ...) are obsolete and can be deleted.

Scripts that talk to the real database (`scripts/test-rls.ts`, `seed-admins.js`, `create-super-admin.ts`) need the three Supabase variables in `.env.local`.

## Supabase setup (new environment)

1. Create the project and note the URL, anon key and service-role key.
2. Apply `supabase/migrations/001…046` in order with `npx supabase db push` (or the SQL editor).
3. Buckets: migrations create `resume-uploads` and `signup-resumes` (both private). No public buckets are needed.
4. Auth → Providers → Google: add the OAuth client from Google Cloud Console.
5. Auth → URL configuration: set the Site URL to the app origin, and add `https://<app>/api/auth/callback` to the redirect URLs.
6. Keep Supabase Auth's own rate limits enabled.
7. Create the first super admin with `scripts/create-super-admin.ts`.
8. Optionally, seed the career workspace with `npm run seed:career-workspace`.

## Release process (main)

1. Merge to `main`. Vercel builds and deploys automatically.
2. Apply any new migration **before** the code that needs it goes live. Migrations are written to be additive and idempotent.
3. Run the post-deploy checks below.
4. Roll back by promoting the previous deployment in Vercel. Migrations are additive, so the old code keeps working.

## Local checks before merging

```bash
npx tsc --noEmit
npm run test:performance      # the full node:test suite (mocks, PGlite; no live services)
npm run test:signup           # onboarding / signup / payment access
npm run test:resumes          # layout + quality gate
npm run test:features         # domain split, messages, salary, AI features
node scripts/test-security-hardening.cjs
```

## Post-deployment checklist

- [ ] Google sign-in works and returns to `/onboarding` (new user) or `/dashboard`.
- [ ] Staff login at `/admin/login` works.
- [ ] A pending account gets 403 from `/api/subscription/create`.
- [ ] A PayU sandbox payment activates the plan. **Check payment status** recovers a lost callback.
- [ ] Resume upload parses. Improve and optimize finish and show stage progress.
- [ ] Export works as PDF, DOCX and LaTeX.
- [ ] Job search returns results. Queue → claim → applied updates the targets.
- [ ] The admin document workspace finishes a generation job.
- [ ] Email/password client sign-in works.
- [ ] An ordinary admin gets "not assigned to you" on a client outside their team.
- [ ] Messages, LinkedIn, Offer Compare and Mock Interview open; a message reaches the team.
- [ ] `GET /api/ai-quota` shows today's allowance; `/admin/ai-limits` lists requests for supervisors.
- [ ] The deployment's functions run in `hnd1`.

## Troubleshooting

- **AI calls fail or time out:** check `AWS_BEARER_TOKEN_BEDROCK` and `AWS_REGION`, and that both models are enabled in that Bedrock region. Calls time out at 40 seconds with one retry.
- **Payments never activate:** the key and salt come from different PayU environments, or the PayU callback URL is wrong. Users can still recover with **Check payment status**.
- **OAuth redirect mismatch:** the redirect URL in Supabase and Google must match the app origin exactly.
- **Everything is slow:** check function placement in the `x-vercel-id` header. It should be `hnd1`; anything else means a cross-region trip on every query.
