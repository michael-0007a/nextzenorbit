# Deployment Guide — Nextzen Orbit

## Architecture Overview

> Note: The Playwright worker is deprecated in favor of the assisted autofill Chrome extension.

```
┌───────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   Next.js App     │     │ Chrome Extension │     │  Supabase        │
│  (Fly.io/Vercel)  │◀────│  (MV3, user)     │────▶│  (Cloud)         │
│                   │     │  - Autofill UI   │     │  - Auth           │
│  - Dashboard      │     │  - Field Detect  │     │  - Database       │
│  - Job Search     │     │  - User-Control  │     │  - Storage        │
│  - Resume Builder │     │                  │     │                   │
└───────────────────┘     └──────────────────┘     └──────────────────┘
```

## Prerequisites

- Node.js 20+
- [Fly.io CLI](https://fly.io/docs/flyctl/install/) (`flyctl`)
- Supabase project
- Groq API key
- Adzuna API keys (free at [developer.adzuna.com](https://developer.adzuna.com/))

---

## Part 1: Supabase Setup

### 1.1 Create Project
1. Go to [supabase.com](https://supabase.com) → New Project
2. Note: **Project URL**, **Anon Key**, **Service Role Key**

### 1.2 Run Migrations
```bash
# Run all migrations in order via SQL Editor
# supabase/migrations/001_users.sql  through  013_screenshot_columns.sql
```

Or with the CLI:
```bash
supabase db push
```

### 1.3 Storage Buckets
Create two buckets in **Supabase → Storage**:

| Bucket | Public | Purpose |
|--------|--------|---------|
| `resumes` | No | User resume PDFs |
| `screenshots` | No | Auto-apply proof screenshots |

### 1.4 Auth Provider
1. **Authentication → Providers → Google**
2. Add your OAuth credentials from [Google Cloud Console](https://console.cloud.google.com)
3. Redirect URL: `https://your-domain.fly.dev/api/auth/callback`

---

## Part 2: Next.js App (Fly.io)

### 2.1 Initialize Fly App
```bash
cd nextzenorbit
flyctl launch --name nextzen-orbit --region maa
# Region "maa" = Mumbai (closest to India users)
# Select: No to Postgres, No to Redis
```

### 2.2 Create `Dockerfile` (root)
```dockerfile
FROM node:20-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
```

### 2.3 Update `next.config.ts`
```typescript
// Add to your next.config.ts
const nextConfig = {
  output: "standalone", // Required for Docker deployment
  // ... existing config
};
```

### 2.4 Set Environment Variables
```bash
flyctl secrets set \
  NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co \
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key \
  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key \
  GROQ_API_KEY=your-groq-key \
  ADZUNA_APP_ID=your-adzuna-id \
  ADZUNA_APP_KEY=your-adzuna-key \
  NEXT_PUBLIC_APP_URL=https://nextzen-orbit.fly.dev \
  RAZORPAY_KEY_ID=rzp_test_xxx \
  RAZORPAY_KEY_SECRET=your-secret \
  RAZORPAY_WEBHOOK_SECRET=your-webhook-secret
```

### 2.5 Deploy
```bash
flyctl deploy
```

### 2.6 Verify
```bash
flyctl open  # Opens your app in browser
flyctl logs  # Check logs
```

---

## Part 3: Worker (legacy, deprecated)

The Playwright worker is deprecated. New deployments should skip this section.

### 3.1 Initialize Worker App
```bash
cd worker
flyctl launch --name nextzen-orbit-worker --region maa
```

### 3.2 Create `worker/Dockerfile`
```dockerfile
FROM node:20-alpine

# Install Chromium for Playwright
RUN apk add --no-cache chromium nss freetype freetype-dev harfbuzz ca-certificates ttf-freefont

WORKDIR /app
COPY package*.json ./
RUN npm ci

# Install Playwright with system Chromium
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
ENV PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser

COPY . .

CMD ["npx", "tsx", "src/index.ts"]
```

### 3.3 Create `worker/fly.toml`
```toml
app = "nextzen-orbit-worker"
primary_region = "maa"

[build]

# No HTTP services — this is a background worker
[processes]
  worker = "npx tsx src/index.ts"

[[vm]]
  memory = "1gb"
  cpu_kind = "shared"
  cpus = 1
```

### 3.4 Set Worker Secrets
```bash
cd worker
flyctl secrets set \
  NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co \
  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key \
  GROQ_API_KEY=your-groq-key \
  POLL_INTERVAL_MS=5000 \
  MAX_RETRIES=3 \
  HEADLESS=true
```

### 3.5 Deploy Worker
```bash
flyctl deploy
```

### 3.6 Monitor Worker
```bash
flyctl logs -a nextzen-orbit-worker  # Live logs
flyctl status -a nextzen-orbit-worker  # Health check
```

---

## Part 4: Cron Jobs

### Screenshot Cleanup (daily)
Option A — Fly.io cron (recommended):
```bash
# Add to fly.toml of the main app:
# [[services]]
#   [services.concurrency]
#     type = "requests"
#     hard_limit = 25
#     soft_limit = 20

# Then set up a scheduled machine:
flyctl machine run --schedule daily --command "curl -X POST https://nextzen-orbit.fly.dev/api/cron/cleanup"
```

Option B — External cron service (e.g., cron-job.org):
- URL: `POST https://nextzen-orbit.fly.dev/api/cron/cleanup`
- Schedule: Daily at midnight
- Header: `Authorization: Bearer YOUR_CRON_SECRET`

---

## Part 5: Environment Variables Reference

| Variable | Required | Used By | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | App + Worker | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | App | Supabase anon key (client-side) |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | App + Worker | Admin key (bypasses RLS) |
| `GROQ_API_KEY` | ✅ | App + Worker | Groq AI for resume parsing + form detection |
| `ADZUNA_APP_ID` | ✅ | App | Adzuna job search API |
| `ADZUNA_APP_KEY` | ✅ | App | Adzuna job search API |
| `NEXT_PUBLIC_APP_URL` | ✅ | App | Public app URL |
| `RAZORPAY_KEY_ID` | ⚡ | App | Razorpay (payments) |
| `RAZORPAY_KEY_SECRET` | ⚡ | App | Razorpay (payments) |
| `RAZORPAY_WEBHOOK_SECRET` | ⚡ | App | Razorpay webhooks |
| `CRON_SECRET` | Optional | App | Secures cleanup cron endpoint |
| `POLL_INTERVAL_MS` | Optional | Worker | Queue poll interval (default: 5000ms) |
| `MAX_RETRIES` | Optional | Worker | Max retry attempts (default: 3) |
| `HEADLESS` | Optional | Worker | Run browser headless (default: true) |

---

## Post-Deployment Checklist

- [ ] Google OAuth works (login + redirect)
- [ ] Supabase connection verified (profile loads)
- [ ] Resume builder + AI analyzer works
- [ ] Job search returns results (Adzuna API)
- [ ] Worker starts and polls queue
- [ ] Worker captures screenshots on apply
- [ ] Screenshots visible in queue panel
- [ ] Cleanup cron runs without errors
- [ ] Razorpay webhooks configured

---

## Troubleshooting

### Worker crashes on Fly.io
- Check memory: Chromium needs 512MB+. Use `memory = "1gb"` in fly.toml
- Check logs: `flyctl logs -a nextzen-orbit-worker`

### Screenshots not uploading
- Verify `screenshots` bucket exists in Supabase Storage
- Check `SUPABASE_SERVICE_ROLE_KEY` is correct in worker secrets

### Adzuna API 400 errors
- Verify `ADZUNA_APP_ID` and `ADZUNA_APP_KEY` are real keys
- Check if the API is up at [api.adzuna.com](https://api.adzuna.com)

### OAuth redirect mismatch
- Ensure redirect URL in Google Cloud Console matches `NEXT_PUBLIC_APP_URL`
- For Fly.io: use `https://your-app.fly.dev/api/auth/callback`

---

*Last updated: 2026-03-20*
