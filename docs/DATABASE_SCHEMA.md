# Database Schema — Nextzen Orbit

> All tables live in Supabase PostgreSQL with Row Level Security (RLS) enabled.

---

## Tables

### `profiles`
User profile and job preferences. Created on first login.

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | uuid | gen_random_uuid() | Primary key |
| `user_id` | uuid | — | FK → auth.users |
| `full_name` | text | '' | Display name |
| `phone` | text | null | Phone number |
| `location` | text | null | City/state |
| `linkedin_url` | text | null | LinkedIn profile |
| `avatar_url` | text | null | Profile picture |
| `preferred_role` | text | null | Target job title |
| `preferred_location` | text | null | Preferred work location |
| `preferred_salary_min` | integer | null | Min salary (INR) |
| `preferred_salary_max` | integer | null | Max salary (INR) |
| `preferred_work_type` | text | null | remote/onsite/hybrid |
| `years_of_experience` | integer | null | Years of experience |
| `preferred_portals` | text[] | {} | Job portals to target |
| `subscription_tier` | text | 'free' | free/pro/premium |
| `created_at` | timestamptz | now() | Created date |
| `updated_at` | timestamptz | now() | Last updated |

### `resumes`
User resumes stored as structured JSON.

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | uuid | gen_random_uuid() | Primary key |
| `user_id` | uuid | — | FK → auth.users |
| `title` | text | 'Untitled Resume' | Resume name |
| `content` | jsonb | {} | Structured resume data |
| `template_id` | text | null | Template used |
| `is_base` | boolean | false | Is base resume |
| `version` | integer | 1 | Version number |
| `deleted_at` | timestamptz | null | Soft delete |
| `created_at` | timestamptz | now() | — |
| `updated_at` | timestamptz | now() | — |

### `applications`
Job application tracking (Kanban board).

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | uuid | gen_random_uuid() | Primary key |
| `user_id` | uuid | — | FK → auth.users |
| `resume_id` | uuid | null | FK → resumes |
| `company` | text | — | Company name |
| `position` | text | — | Job title |
| `job_url` | text | null | Original listing URL |
| `status` | text | 'applied' | applied/screening/interview/offer/rejected |
| `notes` | text | null | User notes |
| `applied_at` | timestamptz | now() | When applied |
| `follow_up_at` | timestamptz | null | Follow-up reminder |
| `created_at` | timestamptz | now() | — |
| `updated_at` | timestamptz | now() | — |

### `job_queue`
Auto-apply queue. Worker processes jobs with status `pending`.

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | uuid | gen_random_uuid() | Primary key |
| `user_id` | uuid | — | FK → auth.users |
| `title` | text | — | Job title |
| `company` | text | — | Company name |
| `job_url` | text | — | Job listing URL (unique per user) |
| `location` | text | null | Location |
| `salary_text` | text | null | Formatted salary |
| `description` | text | null | Job description |
| `source` | text | 'adzuna' | adzuna/indeed/linkedin/manual |
| `status` | text | 'pending' | pending/processing/applied/failed/skipped |
| `error_message` | text | null | Error if failed |
| `cover_letter_id` | uuid | null | Generated cover letter |
| `resume_id` | uuid | null | FK → resumes |
| `applied_at` | timestamptz | null | When auto-applied |
| `screenshot_url` | text | null | Proof screenshot URL |
| `screenshot_expires_at` | timestamptz | null | 7-day expiry |
| `created_at` | timestamptz | now() | — |
| `updated_at` | timestamptz | now() | — |

### `ai_usage`
AI token tracking per billing period.

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | uuid | gen_random_uuid() | Primary key |
| `user_id` | uuid | — | FK → auth.users |
| `billing_period_start` | date | — | Period start |
| `billing_period_end` | date | — | Period end |
| `tokens_used` | integer | 0 | Tokens consumed |
| `tokens_limit` | integer | 50000 | Token quota |
| `last_used_at` | timestamptz | null | Last AI call |

### `webhook_events`
Payment webhook audit log.

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | uuid | gen_random_uuid() | Primary key |
| `provider` | text | — | razorpay/cashfree |
| `event_id` | text | — | Provider event ID |
| `event_type` | text | — | Event type |
| `payload` | jsonb | {} | Raw webhook payload |
| `created_at` | timestamptz | now() | — |

---

## Migrations

| # | File | Description |
|---|------|-------------|
| 001 | `001_users.sql` | Base profiles table |
| 002 | `002_resumes.sql` | Resumes table |
| 003 | `003_applications.sql` | Applications tracking |
| 004 | `004_ai_usage.sql` | AI token tracking |
| 005 | `005_rls_policies.sql` | Row Level Security |
| 006-010 | Various | Payments, webhooks, indexes |
| 011 | `011_job_preferences.sql` | Job preference columns on profiles |
| 012 | `012_job_queue.sql` | Job queue table |
| 013 | `013_screenshot_columns.sql` | Screenshot proof columns |

---

## Storage Buckets

| Bucket | Access | Contents |
|--------|--------|----------|
| `resumes` | Private | User resume PDF uploads |
| `screenshots` | Private | Auto-apply proof screenshots (7-day TTL) |

---

*Last updated: 2026-03-20*
