# Deployment Guide — Nextzen Orbit

## Prerequisites

- Node.js 20+
- npm or pnpm
- Vercel account
- Supabase project
- Groq API key
- Razorpay account (for payments)

## Environment Variables

### Required Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI
GROQ_API_KEY=gsk_your_groq_api_key

# Payments
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=your_razorpay_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# App
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

### Optional Variables

```env
# Cashfree (secondary payment provider)
CASHFREE_APP_ID=
CASHFREE_SECRET_KEY=

# Feature flags
PAYMENT_PROVIDER=razorpay
```

## Local Development

### 1. Clone Repository
```bash
git clone https://github.com/your-org/jobsearchai.git
cd jobsearchai
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
```bash
cp .env.example .env.local
# Edit .env.local with your values
```

### 4. Run Development Server
```bash
npm run dev
```

### 5. Access Application
Open http://localhost:3000

## Supabase Setup

### 1. Create Project
1. Go to https://supabase.com
2. Create new project
3. Note the URL and keys

### 2. Run Migrations
```bash
# Using Supabase CLI
supabase db push

# Or manually via SQL editor
# Copy contents from supabase/migrations/*.sql
```

### 3. Configure Auth
1. Go to Authentication > Providers
2. Enable Google OAuth
3. Add OAuth credentials from Google Cloud Console
4. Set redirect URL: `https://your-domain.vercel.app/api/auth/callback`

### 4. Storage Setup
1. Go to Storage
2. Create bucket: `resumes` (private)
3. Set up RLS policies

## Google OAuth Setup

### 1. Google Cloud Console
1. Go to https://console.cloud.google.com
2. Create new project or select existing
3. Enable Google+ API

### 2. OAuth Credentials
1. Go to APIs & Services > Credentials
2. Create OAuth 2.0 Client ID
3. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback` (dev)
   - `https://your-domain.vercel.app/api/auth/callback` (prod)

### 3. Configure Supabase
1. Go to Supabase Auth settings
2. Add Google provider
3. Enter Client ID and Client Secret

## Vercel Deployment

### 1. Connect Repository
```bash
vercel link
```

### 2. Add Environment Variables
```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add GROQ_API_KEY
vercel env add RAZORPAY_KEY_ID
vercel env add RAZORPAY_KEY_SECRET
vercel env add RAZORPAY_WEBHOOK_SECRET
vercel env add NEXT_PUBLIC_APP_URL
```

### 3. Deploy
```bash
vercel --prod
```

## Razorpay Setup

### 1. Create Account
1. Go to https://razorpay.com
2. Sign up for test/live account
3. Complete KYC (for live mode)

### 2. Get API Keys
1. Go to Settings > API Keys
2. Generate Key ID and Secret
3. Add to environment variables

### 3. Configure Webhooks
1. Go to Settings > Webhooks
2. Add endpoint: `https://your-domain.vercel.app/api/webhooks/razorpay`
3. Select events:
   - payment.captured
   - payment.failed
   - subscription.activated
   - subscription.charged
   - subscription.cancelled
4. Copy webhook secret to environment

## Post-Deployment Checklist

- [ ] Verify Google OAuth flow works
- [ ] Check Supabase connection
- [ ] Test profile creation/update
- [ ] Verify AI analyzer endpoint
- [ ] Check webhook endpoint accessibility
- [ ] Test error handling
- [ ] Monitor logs for issues

## Monitoring

### Vercel Analytics
- Enable in Vercel dashboard
- Monitor Core Web Vitals
- Track error rates

### Supabase Dashboard
- Monitor database performance
- Check auth logs
- Review storage usage

## Troubleshooting

### OAuth Redirect Issues
- Verify redirect URLs match exactly
- Check Supabase auth settings
- Ensure NEXT_PUBLIC_APP_URL is correct

### Database Connection Errors
- Verify Supabase URL and keys
- Check RLS policies
- Review Supabase logs

### AI API Errors
- Verify GROQ_API_KEY is valid
- Check rate limits
- Review API response errors

---

*Last updated: 2026-03-05*

