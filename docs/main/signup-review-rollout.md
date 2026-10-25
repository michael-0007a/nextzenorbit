# Signup review rollout

## Deployment order

1. Apply `supabase/migrations/033_signup_review.sql` to the target Supabase project before deploying the application. It creates the review tables, private resume bucket, atomic rate-limit counters, and service-only submission/review functions. It also removes direct user-table writes from browser roles so users cannot promote themselves.
2. Keep the existing Google OAuth provider configured and require email confirmation for any enabled email/password registration.
3. Keep Supabase Auth's own rate limits enabled: requests made directly to Supabase do not pass through this application's counters. SMS setup is not required.
4. Deploy application code with the existing Supabase service-role credentials. Do not expose them to the browser. Groq parsing is optional during signup: applications retain their original uploaded document when parsing fails or times out.
5. Run the acceptance checks below using test accounts and payment sandbox credentials.

The migration explicitly marks all existing public user accounts as approved legacy accounts. New normal users have no access until their application is approved. Admin and SSO accounts retain their intended access; suspended accounts are denied.

## Flow

### Recovering from the duplicate 033 version error

If the push applied `033_signup_review.sql` and then failed on `033_user_suspension.sql` with `schema_migrations_pkey`, use the corrected filename `034_user_suspension.sql` and rerun `npx supabase db push`. Keep the applied signup migration at version 033. The suspension statements use `IF NOT EXISTS` and can safely run again. Do not delete migration history or mark the signup migration reverted for this error.

- Google registration/sign-in sends new users to `/onboarding`.
- Required fields: name, phone with country code, professional headline, location, preferred role/location/work arrangement, years of experience; LinkedIn, salary range and preferred portals are optional.
- Phone numbers are entered by the applicant, without SMS or OTP verification. A PDF or DOCX under 5 MB must be uploaded. Consent is captured with version and timestamp. Scanned documents and AI outages do not block submission; admins can review the original file.
- Submission stores a snapshot of the reviewed profile, a private original resume, and a parsed base resume in one database transaction.
- Supervisors and super admins review `/admin/signup-applications`. Ordinary admins cannot make review decisions or download the original application file from the review endpoint.
- Pending/rejected users cannot enter the dashboard or call protected app APIs. Both checkout endpoints and manual subscription activation explicitly require approval.
- Rejection permanently records the normalized email and submitted phone independently of the account. Deleting the account does not remove those records. A different email with the same submitted phone cannot complete registration. Phone ownership is unverified; a different number can evade matching, and an incorrectly entered number can affect someone else. Reviewers should inspect contact details before rejecting. There is no claim of identifying someone who changes both identifiers.
- Review decisions are final in this workflow. Reversal and block removal are not exposed in the UI.

## Limits

| Operation | Limit |
| --- | --- |
| Google sign-in start | 20 per IP / 15 minutes |
| Admin password sign-in | 30 per IP / 15 minutes; 10 per email / 15 minutes |
| Submit application | 5 per user / 15 minutes |
| Create checkout | 5 per user / 5 minutes, shared between checkout endpoints |
| Review decisions | 60 per reviewer / minute |
| Admin AI resume or cover-letter generation | 10 per admin / minute for each operation |

IP identification uses Vercel's trusted client header, then `x-real-ip`. For other deployments, the reverse proxy must overwrite `x-real-ip` rather than pass a client-supplied value. Without either header, requests share a conservative fallback bucket. Keys are hashed; expired counters are cleaned up. Counter/storage failures fail closed.

## Verification

`npm ci` then `npm run test:signup` runs API/authorization tests and real local PostgreSQL tests through PGlite, without touching a live database. The PostgreSQL test creates a minimal Supabase-compatible schema; it does not replace a staging migration against the complete production schema.

Staging acceptance:

1. New Google account: complete profile and phone, upload resume, submit, and see pending status without any SMS step.
2. Confirm pending account gets 403 from both `/api/subscription/create` and `/api/payments/create-order`, and cannot open dashboard features.
3. Supervisor: open original resume, inspect details, approve. Applicant refreshes status and can reach payment.
4. Another applicant: reject with a reason; verify same email and another email using the same submitted phone cannot complete registration.
5. Confirm ordinary admin cannot review, concurrent decisions cannot overwrite each other, and rate-limit errors display correctly.
6. Admin: create a cover letter and a tailored resume; download PDFs as admin, supervisor and super admin.

No live database migration, Google OAuth, payment, or AI generation is performed by the automated tests.

## Paid access and payment migration (035)

Apply `035_payment_orders_and_access.sql` with `supabase db push` before deploying the matching app changes. It adds immutable checkout transaction records, atomic/idempotent PayU activation, and restrictive paid-access policies on service tables and resume storage. It preserves known historical PayU transaction IDs from subscriptions. Do not rename an already-applied migration.

- Approved regular accounts can only choose/pay for a plan until payment is confirmed. Trials, missing billing end dates and expired subscriptions do not unlock services. Existing admin and SSO role exceptions remain; suspended accounts are blocked.
- Checkout now supports monthly INR PayU payments. The USD provider is a placeholder and is rejected by checkout until a real provider is integrated.
- A new checkout never pauses/overwrites an active subscription. Each payment uses a separate random transaction ID. Repeated callbacks do not add duplicate billing periods.
- Invalid PayU response hashes are rejected. Activation verifies the original order amount and commits the payment and subscription together. No email fallback is used.
- The plan page has **Check payment status**, which reconciles the user's five latest pending transactions with PayU and can activate a payment whose callback was lost. Users and admins can enter an exact transaction reference to recover older payments. Admins use Verify payment & sync plan on the client page; this verifies PayU rather than granting unpaid access.
- Set `PAYU_MERCHANT_KEY`, `PAYU_MERCHANT_SALT`, `NEXT_PUBLIC_APP_URL` and the matching test/production `NEXT_PUBLIC_PAYU_URL`. Merchant key/salt must belong to the same PayU environment. Configure PayU callbacks to `/api/webhooks/payu`.
- Before production rollout, complete a PayU sandbox payment, reload `/subscription`, simulate a lost browser return and use Check payment status. Confirm a second checkout does not interrupt an existing paid plan. Local tests mock PayU and cannot verify the merchant account configuration.

Admin resume generation now offers a saved-source selector and PDF/DOCX upload/parsing. The source is retained as a client resume and original private file; optimization saves a separate admin draft. Scanned/empty documents show an actionable error. When AI parsing fails or times out, readable documents are imported as extracted-text sources with an explicit review notice; the complete original is retained. Text previews are limited to 15,000 characters with a truncation notice. AI optimization still requires the production Groq configuration to be working.

Validation: `npm run test:signup` includes local PostgreSQL payment/access tests and admin upload/middleware checks. No live accounts, payments or storage files are changed by those tests.

PayU implementation references: https://docs.payu.in/docs/hashing-request-and-response and https://docs.payu.in/reference/verify_payment_api.

### Recovering from the missing PayU column in migration 035

If migration 035 fails with `column "payu_subscription_id" does not exist`, use the corrected local `035_payment_orders_and_access.sql` and rerun `npx supabase db push`. The migration now adds the PayU transaction column before the backfill and updates the original Razorpay/Cashfree provider constraint to permit PayU. Existing provider records are preserved. Retry-safe DDL also handles objects left by an interrupted/manual attempt. Do not mark this failed migration applied or delete migration history.

Regression tests use the actual `subscriptions` table definition from migration 001, including its provider constraint, and cover installations where PayU was already configured. They verify activation and repeated migration execution without duplicating payment records or extending billing periods.

## Groq model selection

All application text generation uses `openai/gpt-oss-120b`, selected from the enabled Groq model list. The shared model/settings live in `src/lib/ai/model.ts`; resume parsing, optimization, cover letters, job analysis and notes use it. There is no fallback to unavailable Llama models. Redeploy the app after changing this configuration; no database migration is required. Groq reference: https://console.groq.com/docs/model/openai/gpt-oss-120b.
