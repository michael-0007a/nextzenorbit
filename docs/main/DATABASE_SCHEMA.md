# Database schema: Nextzen Orbit (main)

Last reviewed from code: 2026-10-16. Source of truth: `supabase/migrations/*.sql` and `src/types/database.ts`.

- **Project:** Supabase `nextzenorbit`, region Tokyo (`ap-northeast-1`). Main and beta share this one database.
- **Migrations:** main uses 001–041. 042–046 belong to beta (see [`../beta/BETA_OVERVIEW.md`](../beta/BETA_OVERVIEW.md)) but are **already applied** to the shared project. The next new migration is `047_*.sql`.
- **Applying:** there's no migration runner in npm. Apply with `npx supabase db push`, the Supabase MCP, or the SQL editor. Never rename a migration that has already been applied.

## Access model

- RLS is enabled on every table.
- **Owner policies** (`auth.uid() = user_id`) cover client-owned rows read through the cookie-bound client.
- **Restrictive paid-access policies** call `(select public.has_paid_service_access())` on the service tables and on resume storage (035), so an unpaid account can't read or write them even through PostgREST.
- **Server-only tables** have RLS enabled and no policies, so only the service role can touch them. That's intended, and the Supabase advisor flags them as "RLS enabled, no policies". Admin routes use the service role and authorize in code.
- **Sensitive writes** go through `SECURITY DEFINER` RPCs that are granted only to `service_role`.
- Migrations 005–030 were repeated fixes for RLS recursion. The lesson: never check a role inside a policy by querying the same table. Use the service role or a `SECURITY DEFINER` helper instead.

## Tables

### Identity, account and access

| Table | Key columns | Notes |
| --- | --- | --- |
| `users` | `id` (= auth uid), `email`, `role`, `is_suspended` | `role` is one of `user`, `admin`, `supervisor_admin`, `super_admin`, `sso_user`. Browser roles can't write it (033) |
| `profiles` | `user_id`, `full_name`, `phone`, `headline`, `location`, `linkedin_url`, `preferred_*`, `years_of_experience`, `has_agreed_to_terms`, `assigned_admin_id`, `application_details` (jsonb) | `assigned_admin_id` is a compatibility projection only (039) |
| `signup_applications` | `user_id`, `email`, `phone`, `status`, `profile` (snapshot), `resume_path`, `consent_version`, `reviewed_by`, `rejection_reason`, `legacy_account` | One per user. `status` is pending, approved or rejected (033) |
| `registration_blocks` | `kind` (email/phone), `value`, `created_at` | Written on rejection; survives account deletion |
| `request_limits` | `key` (hashed), `hits`, `expires_at` | Rate-limit counters (`consume_request_limit`) |
| `candidate_self_identification` | `user_id`, `answers` | Optional demographic answers; owner-only reads (036) |
| `candidate_work_authorization` | `user_id`, `country`, answers | Read only through a guarded admin endpoint (036) |

### Billing

| Table | Key columns | Notes |
| --- | --- | --- |
| `subscriptions` | `user_id`, `provider`, `plan_id` (`free`=Silver, `pro`=Gold, `elite`), `status`, `payu_subscription_id`, `amount_paise`, `current_period_start/end` | Trials and expired periods don't unlock service (035) |
| `payment_orders` | `txnid` (PK), `user_id`, `plan_id`, `amount_paise`, `currency`, `status`, `provider_payment_id`, `paid_at` | One immutable row per checkout; activation is idempotent |
| `webhook_events` | `provider`, `event_id`, `event_type`, `payload` | Legacy webhook audit log |
| `ai_usage` | `user_id`, `billing_period_start/end`, `tokens_used`, `tokens_limit` | Monthly token accounting; not enforced |

### Resumes and documents

| Table | Key columns | Notes |
| --- | --- | --- |
| `resumes` | `user_id`, `title`, `content` (jsonb, includes `layout.target_pages`, `resume_type`), `template_id`, `is_base`, `file_url`, `deleted_at` | Deletes are hard deletes with storage cleanup |
| `resume_versions` | `resume_id`, `user_id`, `version_number`, `content`, `change_summary` | Snapshots before every AI rewrite |
| `cover_letters` | `user_id`, `resume_id`, `content`, `company_name`, `job_title` | Exists but the client flow doesn't persist to it |
| `admin_resumes` | `user_id` (client), `admin_id`, `content`, `job_title`, `company`, `expires_at` | Per-client tailored resumes, 30-day expiry |
| `admin_cover_letters` | `user_id`, `admin_id`, `content`, `company_name`, `expires_at` | Per-client cover letters |
| `admin_documents` | `id`, admin owner, `kind`, `payload`, `assigned_document_id` | Private admin library (038) |
| `document_jobs` | `id`, owner, `operation`, `payload`, `attempts`, `lease_until`, status, result | Durable async generation (041) |

### Jobs and the apply queue

| Table | Key columns | Notes |
| --- | --- | --- |
| `jobs` | `company`, `title`, `description`, `location`, `apply_url`, `source`, `source_ref`, `country`, `tags` | Normalized catalog; timestamps refreshed on search (037) |
| `saved_job_searches` | `user_id`, `title`, `filters` | Private |
| `job_queue` | `user_id` (client), `catalog_id`, `title`, `company`, `job_url`, `status`, `resume_id`, `claimed_by/at`, `applied_by`, `applied_at`, `admin_notes` | The admin apply queue; unique client + job key. `screenshot_*` and `cover_letter_id` are leftovers from auto-apply |
| `client_admin_assignments` | `user_id`, `admin_id`, `assigned_at` | Shared client teams (039) |
| `client_assignment_history` | `actor_id`, change details | Audit of allocation changes |
| `applications` | `user_id`, `resume_id`, `company`, `position`, `status`, `applied_at`, `follow_up_at` | The client's own tracker |
| `autofill_telemetry` | `user_id`, `portal`, `fields_detected`, `status` | Extension coverage |
| `notifications` | `user_id`, `type`, `title`, `message`, `is_read`, `metadata` | Sent by admins |

### Career workspace (014)

`careers`, `roadmaps`, `roadmap_steps`, `interview_questions`, `youtube_resources` (reference data; seeded with `npm run seed:career-workspace`), `ai_notes` and `projects` (user-owned).

## RPCs (service role only unless noted)

| Function | Migration | Purpose |
| --- | --- | --- |
| `consume_request_limit` | 033 | Atomic rate-limit counter |
| `submit_signup_application`, `review_signup_application`, `reject_blocked_registration` | 033 / 036 | Signup and review, in one transaction |
| `has_paid_service_access()` | 035 | Used inside RLS (callable by `authenticated`) |
| `complete_payu_payment` | 035 | Verify the amount, record the payment, extend the period once |
| `store_job_results`, `enqueue_search_jobs`, `set_queue_job_key` | 037 / 039 | Catalog and queue |
| `save_admin_document` | 038 / 039 | Library save plus an optional client copy |
| `assign_client_admins`, `update_team_queue_job`, `client_target_report` | 039 | Allocation, claim/complete, targets |
| `performance_admin_stats`, `performance_admin_users`, `performance_admin_analytics`, `performance_applications`, `performance_queue_page`, `performance_resume_metadata` | 040 | Read models for slow pages |
| `claim_document_job` | 041 | Lease-based job claiming |
| `is_admin_or_super`, `is_super_admin`, `is_admin_user` | 022–031 | Legacy role helpers |

## Storage buckets

| Bucket | Access | Contents |
| --- | --- | --- |
| `resume-uploads` | Private, paid-access policy | Original resume files uploaded in the app |
| `signup-resumes` | Private, service role | Signup application originals (signed upload, max 10 MB); downloaded by reviewers via signed URL |

The old `screenshots` bucket from auto-apply is no longer used.

## Migration history

| # | Summary |
| --- | --- |
| 001 | Base schema: users, profiles, subscriptions, resumes, applications, ai_usage, webhook_events, RLS |
| 002 | Resume storage bucket |
| 003–004 | Profile fields (avatar, full name) |
| 005, 007 | RLS recursion fixes |
| 006 | `resumes.deleted_at` |
| 008 | `resume_versions`, `cover_letters` |
| 009 | Applications table pass |
| 010 | Storage buckets |
| 011 | Job-preference columns |
| 012–013 | `job_queue` and screenshot columns (auto-apply era) |
| 014 | Career workspace tables |
| 015 | Drop admin users policy |
| 016 | `resumes.file_url` |
| 017 | `autofill_telemetry` |
| 018 | Career RLS recursion fix |
| 019 | Admin roles and apply queue |
| 020 | Terms agreement |
| 021 | Drop legacy payment fields |
| 022, 025–030 | RLS recursion rounds and policy resets |
| 023 | `admin_resumes` |
| 024 | Admin overhaul: `notifications`, `admin_cover_letters` |
| 031 | `supervisor_admin` role |
| 032 | Assign admin profiles |
| 033 | Signup review, registration blocks, rate limits |
| 034 | User suspension |
| 035 | `payment_orders`, PayU activation, paid-access RLS |
| 036 | Expanded onboarding, private demographic and work-authorization tables |
| 037 | Job search workspace, catalog, saved searches |
| 038 | Admin document workspace |
| 039 | Shared client assignments, completion credit, targets |
| 040 | Performance read models |
| 041 | `document_jobs` |
| 042–046 | Beta only: security hardening, activity feed, messages, mock interviews, AI usage limits |

`003_enhanced_features.sql.bak` is an unused draft, kept for reference.
