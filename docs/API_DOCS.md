# API Documentation — Nextzen Orbit

## Base URL
```
Production: https://jobsearchai.vercel.app
Development: http://localhost:3000
```

## Authentication
All protected endpoints require a valid Supabase session cookie. Authentication is handled via Supabase Auth (Google OAuth).

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": { ... }
  }
}
```

## Error Codes
| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | User not authenticated |
| `FORBIDDEN` | 403 | User lacks permission |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid input data |
| `INTERNAL_ERROR` | 500 | Server error |

---

## Auth Endpoints

### GET /api/auth/callback
OAuth callback handler for Google authentication.

**Query Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| code | string | Yes | OAuth authorization code |
| next | string | No | Redirect URL after auth (default: /dashboard) |

**Response:** Redirects to dashboard or login page

---

## Profile Endpoints

### GET /api/profile
Get the authenticated user's profile.

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "full_name": "Arjun Sharma",
    "phone": "+91 98765 43210",
    "headline": "Senior Software Engineer",
    "location": "Bengaluru, Karnataka",
    "linkedin_url": "https://linkedin.com/in/arjun",
    "avatar_url": "https://...",
    "created_at": "2026-03-01T00:00:00Z",
    "updated_at": "2026-03-01T00:00:00Z"
  }
}
```

### PATCH /api/profile
Update the authenticated user's profile.

**Authentication:** Required

**Request Body:**
```json
{
  "full_name": "Arjun Sharma",
  "phone": "+91 98765 43210",
  "headline": "Senior Software Engineer",
  "location": "Bengaluru, Karnataka",
  "linkedin_url": "https://linkedin.com/in/arjun"
}
```

**Response:**
```json
{
  "success": true,
  "data": { ... }
}
```

---

## Resume Endpoints

### GET /api/resumes
List all resumes for the authenticated user.

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Software Engineer Resume",
      "is_base": true,
      "version": 1,
      "template_id": "modern",
      "created_at": "2026-03-01T00:00:00Z",
      "updated_at": "2026-03-01T00:00:00Z"
    }
  ]
}
```

### POST /api/resumes
Create a new resume.

**Authentication:** Required

**Request Body:**
```json
{
  "title": "Software Engineer Resume",
  "content": { ... },
  "template_id": "modern",
  "is_base": false
}
```

### GET /api/resumes/[id]
Get a specific resume by ID.

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Software Engineer Resume",
    "content": { ... },
    "template_id": "modern",
    "is_base": true,
    "version": 1
  }
}
```

### PATCH /api/resumes/[id]
Update a resume.

**Authentication:** Required

**Request Body:**
```json
{
  "title": "Updated Title",
  "content": { ... }
}
```

### DELETE /api/resumes/[id]
Soft delete a resume.

**Authentication:** Required

---

## Analyzer Endpoints

### POST /api/analyzer
Analyze a job description against a resume.

**Authentication:** Required

**Request Body:**
```json
{
  "job_description": "Full job description text...",
  "resume_id": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "score": 78,
    "matchedSkills": ["React", "TypeScript", "Node.js"],
    "missingSkills": ["AWS", "Docker"],
    "suggestions": [
      "Add cloud experience to your resume",
      "Highlight any containerization projects"
    ]
  }
}
```

---

## Resume Export Endpoints

### GET /api/resumes/[id]/export
Export resume as PDF.

**Authentication:** Required

**Query Parameters:**
| Name | Type | Description |
|------|------|-------------|
| format | string | Export format (currently only "pdf") |
| template | string | Template ID (default: "classic") |

**Response:** Binary PDF file with `Content-Disposition: attachment`

---

## Resume Enhancement Endpoints

### POST /api/resumes/[id]/enhance
Enhance resume content with AI.

**Authentication:** Required

**Request Body (Rewrite Bullets):**
```json
{
  "action": "rewrite_bullets",
  "bullets": ["Managed team of 5", "Increased sales"],
  "context": {
    "jobTitle": "Software Engineer",
    "company": "Google",
    "targetRole": "Senior Engineer"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "bullets": ["Led cross-functional team of 5...", "Drove 25% increase in sales..."],
    "tokensUsed": 250
  }
}
```

**Request Body (Generate Summary):**
```json
{
  "action": "generate_summary",
  "experience": [{ "position": "...", "company": "...", "bullets": [...] }],
  "skills": [{ "category": "...", "items": [...] }],
  "targetRole": "Senior Software Engineer"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": "Results-driven software engineer with 5+ years...",
    "tokensUsed": 150
  }
}
```

---

## Resume Version Endpoints

### GET /api/resumes/[id]/versions
List all versions of a resume.

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "version_number": 3,
      "title": "Resume Title",
      "change_summary": "Updated experience",
      "created_at": "2026-03-10T10:00:00Z"
    }
  ]
}
```

### POST /api/resumes/[id]/versions
Create a version snapshot.

**Authentication:** Required

**Request Body:**
```json
{
  "changeSummary": "Manual snapshot before major edits"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "version_number": 4,
    "created_at": "2026-03-10T10:00:00Z"
  }
}
```

### POST /api/resumes/[id]/versions/[versionId]/restore
Restore resume to a previous version.

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "data": { "id": "...", "title": "...", "content": {...} }
}
```

---

## Cover Letter Endpoints

### POST /api/cover-letter/generate
Generate AI-powered cover letter.

**Authentication:** Required

**Request Body:**
```json
{
  "resumeId": "uuid",
  "companyName": "Google",
  "jobTitle": "Senior Software Engineer",
  "hiringManager": "Ms. Smith",
  "jobDescription": "We are looking for..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "coverLetter": "Dear Ms. Smith,\n\nI am excited to apply...",
    "tokensUsed": 500
  }
}
```

---

## Payment Endpoints

### POST /api/payments/create-order
Create a payment order for subscription upgrade.

**Authentication:** Required

**Request Body:**
```json
{
  "plan_id": "pro",
  "billing_cycle": "monthly"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "order_id": "order_xxx",
    "amount": 49900,
    "currency": "INR",
    "key_id": "rzp_xxx"
  }
}
```

---

## Webhook Endpoints

### POST /api/webhooks/razorpay
Handle Razorpay webhook events.

**Headers:**
| Name | Description |
|------|-------------|
| x-razorpay-signature | Webhook signature for verification |

**Events Handled:**
- `payment.captured`
- `payment.failed`
- `subscription.activated`
- `subscription.charged`
- `subscription.cancelled`
- `subscription.halted`

### POST /api/webhooks/cashfree
Handle Cashfree webhook events.

**Headers:**
| Name | Description |
|------|-------------|
| x-cashfree-signature | Webhook signature |
| x-cashfree-timestamp | Request timestamp |

---

*Last updated: 2026-03-10*

