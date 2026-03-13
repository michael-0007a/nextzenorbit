# Database Schema — Nextzen Orbit

## Overview

PostgreSQL database hosted on Supabase with Row Level Security (RLS) enabled on all tables.

## Tables

### users
Core user identity table linked to Supabase Auth.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_insert_own" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Note: Admin operations use service role key (bypasses RLS)
-- Do NOT add a policy that queries the users table itself
-- as this causes infinite recursion.
```

### profiles
Extended user profile data.

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  headline TEXT,
  location TEXT,
  linkedin_url TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_own_row" ON profiles
  FOR ALL USING (auth.uid() = user_id);
```

### subscriptions
User subscription and billing data.

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  
  -- Provider
  provider TEXT NOT NULL DEFAULT 'razorpay' CHECK (provider IN ('razorpay', 'cashfree')),
  plan_id TEXT NOT NULL DEFAULT 'free' CHECK (plan_id IN ('free', 'pro', 'elite')),
  status TEXT NOT NULL DEFAULT 'trialing' 
    CHECK (status IN ('trialing', 'active', 'past_due', 'cancelled', 'paused')),
  
  -- Razorpay fields
  razorpay_customer_id TEXT,
  razorpay_subscription_id TEXT,
  razorpay_plan_id TEXT,
  
  -- Cashfree fields
  cashfree_customer_id TEXT,
  cashfree_subscription_id TEXT,
  
  -- Billing
  currency TEXT DEFAULT 'INR',
  amount_paise INTEGER,
  gst_amount_paise INTEGER,
  
  -- Trial period
  trial_starts_at TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,
  
  -- Subscription period
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  
  -- Cancellation
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  cancelled_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subscriptions_own_row" ON subscriptions
  FOR ALL USING (auth.uid() = user_id);
```

### resumes
User resumes with structured JSON content.

```sql
CREATE TABLE resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled Resume',
  content JSONB NOT NULL DEFAULT '{}',
  template_id TEXT,
  is_base BOOLEAN DEFAULT FALSE,
  version INTEGER DEFAULT 1,
  file_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ  -- Soft delete
);

-- RLS Policies
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "resumes_own_row" ON resumes
  FOR ALL USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_resumes_user_id ON resumes(user_id);
CREATE INDEX idx_resumes_deleted_at ON resumes(deleted_at) WHERE deleted_at IS NULL;
```

### applications
Job application tracking.

```sql
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  resume_id UUID REFERENCES resumes(id) ON DELETE SET NULL,
  company TEXT NOT NULL,
  position TEXT NOT NULL,
  job_url TEXT,
  status TEXT NOT NULL DEFAULT 'applied' 
    CHECK (status IN ('applied', 'screening', 'interview', 'offer', 'rejected')),
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  follow_up_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "applications_own_row" ON applications
  FOR ALL USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_applications_user_id ON applications(user_id);
CREATE INDEX idx_applications_status ON applications(status);
```

### ai_usage
Track AI token consumption per billing period.

```sql
CREATE TABLE ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  billing_period_start TIMESTAMPTZ NOT NULL,
  billing_period_end TIMESTAMPTZ NOT NULL,
  tokens_used INTEGER DEFAULT 0,
  tokens_limit INTEGER NOT NULL,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_usage_own_row" ON ai_usage
  FOR ALL USING (auth.uid() = user_id);
```

### webhook_events
Idempotent webhook event log.

```sql
CREATE TABLE webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL CHECK (provider IN ('razorpay', 'cashfree')),
  event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB DEFAULT '{}',
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(provider, event_id)
);

-- No RLS - only accessed by service role via webhooks
```

## Entity Relationship Diagram

```
┌─────────────┐       ┌──────────────┐       ┌──────────────┐
│    users    │───────│   profiles   │       │ subscriptions│
│             │  1:1  │              │       │              │
│ id (PK)     │       │ user_id (FK) │       │ user_id (FK) │
│ email       │       │ full_name    │       │ plan_id      │
│ role        │       │ phone        │       │ status       │
└──────┬──────┘       │ headline     │       │ trial_ends_at│
       │              │ location     │       └──────────────┘
       │              │ linkedin_url │
       │              │ avatar_url   │
       │              └──────────────┘
       │
       │ 1:N
       │
┌──────┴──────┐       ┌──────────────┐
│   resumes   │───────│ applications │
│             │  1:N  │              │
│ id (PK)     │       │ resume_id(FK)│
│ user_id(FK) │       │ user_id (FK) │
│ title       │       │ company      │
│ content     │       │ position     │
│ template_id │       │ status       │
│ is_base     │       │ applied_at   │
└─────────────┘       └──────────────┘
```

## Resume Content JSON Schema

```typescript
interface ResumeContent {
  contact: {
    full_name: string;
    email: string;
    phone: string;
    location: string;
    linkedin_url?: string;
    portfolio_url?: string;
    github_url?: string;
  };
  summary: {
    text: string;
  };
  experience: Array<{
    id: string;
    company: string;
    title: string;
    location: string;
    start_date: string;
    end_date: string | null;
    is_current: boolean;
    bullets: string[];
  }>;
  education: Array<{
    id: string;
    institution: string;
    degree: string;
    field: string;
    location: string;
    start_date: string;
    end_date: string | null;
    gpa?: string;
    achievements: string[];
  }>;
  skills: {
    technical: string[];
    soft: string[];
    languages: string[];
    tools: string[];
  };
  certifications: Array<{
    id: string;
    name: string;
    issuer: string;
    date: string;
    url?: string;
  }>;
  projects: Array<{
    id: string;
    name: string;
    description: string;
    technologies: string[];
    url?: string;
    start_date?: string;
    end_date?: string;
  }>;
  languages: Array<{
    name: string;
    proficiency: 'native' | 'fluent' | 'professional' | 'conversational' | 'basic';
  }>;
}
```

---

*Last updated: 2026-03-05*

