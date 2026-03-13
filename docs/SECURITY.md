# Security Documentation — Nextzen Orbit

## Overview

This document outlines the security architecture, policies, and practices implemented in Nextzen Orbit.

## Authentication

### OAuth Flow (Google)
1. User initiates login via "Continue with Google" button
2. Redirect to Google OAuth consent screen
3. Google redirects back with authorization code
4. Server exchanges code for session via Supabase Auth
5. Session stored in HTTP-only cookies
6. JWT validated on each protected request

### Session Management
- Sessions managed by Supabase Auth
- JWT tokens with automatic refresh
- Session timeout: 1 hour (auto-refresh)
- Manual sign-out clears all session data

## Authorization

### Row Level Security (RLS)
All database tables have RLS enabled with the following policies:

```sql
-- Users can only access their own data
CREATE POLICY "user_own_data" ON table_name
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_insert_own" ON table_name
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_update_own" ON table_name
  FOR UPDATE USING (auth.uid() = user_id);
```

### ⚠️ Important: Avoiding RLS Infinite Recursion

**Never** create a policy on a table that queries the same table to check permissions.

```sql
-- ❌ BAD: This causes infinite recursion!
CREATE POLICY "admin_all_access" ON users
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- ✅ GOOD: Admin operations use service role key (bypasses RLS)
-- Use createAdminClient() in API routes for admin operations
```

### Admin Access Pattern
Admin operations should use the Supabase service role key, which bypasses RLS entirely:

```typescript
import { createAdminClient } from "@/lib/supabase/admin";

// Admin operations
const admin = createAdminClient();
const { data } = await admin.from("users").select("*"); // Bypasses RLS
```

### API Authorization
Every API route follows this sequence:
1. **Authentication** — Verify user is logged in
2. **Authorization** — Verify user can access resource
3. **Validation** — Validate input with Zod
4. **Rate Limiting** — Check request limits
5. **Execute** — Perform operation

## Input Validation

### Dual Validation Strategy
- **Client-side:** Zod schemas for immediate UX feedback
- **Server-side:** Same Zod schemas for security enforcement

### Validation Rules
- All string inputs sanitized
- URLs validated and sanitized
- Phone numbers validated for Indian format
- Email addresses validated via Zod email()
- Maximum lengths enforced on all text fields

## Data Protection

### Sensitive Data Handling
| Data Type | Protection |
|-----------|------------|
| Passwords | Not stored (OAuth only) |
| Resume content | Encrypted at rest (Supabase) |
| Payment info | Handled by Razorpay/Cashfree (PCI compliant) |
| Session tokens | HTTP-only cookies |

### PII Policy
- No PII in application logs
- User IDs used for logging, not emails/names
- GDPR-compliant data deletion available

## Payment Security

### Razorpay Integration
```typescript
// Webhook signature verification
import crypto from 'crypto';

function verifyRazorpayWebhook(body: string, signature: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(body)
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(signature)
  );
}
```

### Cashfree Integration
```typescript
function verifyCashfreeWebhook(
  body: string, 
  signature: string, 
  timestamp: string
): boolean {
  const payload = timestamp + body;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.CASHFREE_SECRET_KEY!)
    .update(payload)
    .digest('base64');
  return expectedSignature === signature;
}
```

### Payment Security Rules
- Never trust client-side payment status
- Always verify webhooks cryptographically
- Subscription status updated only via webhooks
- Idempotency keys prevent duplicate processing
- All amounts stored in paise (smallest unit)

## API Security

### Rate Limiting
| Endpoint | Limit |
|----------|-------|
| Auth endpoints | 10 requests / 15 min / IP |
| AI endpoints | 20 requests / min / user |
| General API | 100 requests / min / user |

### CORS Policy
- Only known origins allowed
- Credentials: include
- Methods: GET, POST, PATCH, DELETE

### Headers
```typescript
// Security headers (via Next.js config)
{
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
}
```

## AI Security

### Prompt Injection Prevention
- All prompts stored server-side only
- User input sanitized before LLM calls
- Output validated against input data
- No user-controlled system prompts

### Data Leakage Prevention
- Resume content never logged
- AI responses not stored permanently
- Token usage tracked, not content

## Environment Variables

### Required Secrets
```env
# Never commit these to version control
SUPABASE_SERVICE_ROLE_KEY=
GROQ_API_KEY=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
CASHFREE_SECRET_KEY=
```

### Public Variables
```env
# Safe to expose
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_APP_URL=
RAZORPAY_KEY_ID=
```

## Threat Model

### Identified Threats
| Threat | Mitigation |
|--------|------------|
| SQL Injection | Parameterized queries via Supabase |
| XSS | React escaping + CSP headers |
| CSRF | SameSite cookies + origin validation |
| Session hijacking | HTTP-only cookies + secure flag |
| Payment fraud | Webhook verification + idempotency |
| Data breach | RLS + encryption at rest |

## Incident Response

### Security Incident Steps
1. Identify and contain the incident
2. Revoke compromised credentials
3. Notify affected users (if required)
4. Document and analyze root cause
5. Implement preventive measures

## Compliance

### GDPR Readiness
- Data export available on request
- Data deletion cascades properly
- Consent tracked for marketing
- Privacy policy accessible

### SOC2 Considerations
- Access logging enabled
- Role-based access control
- Encryption in transit and at rest
- Regular security reviews

---

*Last updated: 2026-03-05*

