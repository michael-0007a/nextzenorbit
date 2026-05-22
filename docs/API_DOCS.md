# API Documentation — Nextzen Orbit

> All API routes are under `/api/`. Authentication uses Supabase session cookies (auto-sent by the browser).

---

## Authentication

### `GET /api/auth/callback`
Handles OAuth callback from Supabase Auth (Google sign-in).

---

## Profile

### `GET /api/profile`
Get the authenticated user's profile.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "full_name": "John Doe",
    "preferred_role": "Full Stack Developer",
    "preferred_location": "Bangalore",
    "preferred_salary_min": 1000000,
    "preferred_salary_max": 2000000,
    "preferred_work_type": "remote",
    "years_of_experience": 5,
    "preferred_portals": ["indeed", "naukri"]
  }
}
```

### `PATCH /api/profile`
Update profile fields. Validates with Zod schema.

**Body:** Any subset of profile fields.

---

## Resumes

### `GET /api/resumes`
List all user's resumes (excluding soft-deleted).

### `POST /api/resumes`
Create a new resume.

### `GET /api/resumes/[id]`
Get a specific resume with full content.

### `PATCH /api/resumes/[id]`
Update resume fields (title, content, template).

### `DELETE /api/resumes/[id]`
Soft-delete a resume (sets `deleted_at`).

---

## AI

### `POST /api/ai/analyze`
Analyze a resume and provide AI-powered suggestions.

**Body:**
```json
{
  "resume_id": "uuid",
  "job_description": "optional JD for tailoring"
}
```

### `POST /api/ai/cover-letter`
Generate a cover letter for a job application.

---

## Job Search

### `POST /api/jobs/search`
Search for jobs using the Adzuna API.

**Body:**
```json
{
  "query": "React Developer",
  "location": "Bangalore",
  "page": 1,
  "resultsPerPage": 20,
  "salaryMin": 500000,
  "salaryMax": 2000000,
  "fullTime": true,
  "sortBy": "date"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "jobs": [
      {
        "id": "12345",
        "title": "Senior React Developer",
        "company": "TechCorp",
        "location": "Bangalore, Karnataka",
        "salary_text": "₹12,00,000 - ₹18,00,000",
        "description": "We are looking for...",
        "job_url": "https://...",
        "created": "2026-03-18T10:00:00Z"
      }
    ],
    "totalResults": 342,
    "page": 1,
    "resultsPerPage": 20
  }
}
```

### `GET /api/jobs/queue`
Get the authenticated user's job queue (last 100 jobs).

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "React Developer",
      "company": "TechCorp",
      "status": "applied",
      "screenshot_url": "https://signed-url...",
      "applied_at": "2026-03-20T10:00:00Z"
    }
  ]
}
```

### `POST /api/jobs/queue`
Add jobs to the auto-apply queue. Deduplicates by `job_url`.

**Body:**
```json
{
  "jobs": [
    {
      "title": "React Developer",
      "company": "TechCorp",
      "job_url": "https://...",
      "location": "Bangalore",
      "salary_text": "₹12L - ₹18L",
      "description": "...",
      "source": "adzuna"
    }
  ],
  "resume_id": "uuid-or-null"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "added": 3,
    "skipped": 1,
    "jobs": [...]
  }
}
```

---

## Cron Jobs

### `POST /api/cron/cleanup`
Delete expired screenshots (7-day TTL) from Supabase Storage and clear DB columns.

**Auth:** `Authorization: Bearer CRON_SECRET` header (optional if `CRON_SECRET` not set).

**Response:**
```json
{
  "success": true,
  "data": { "deleted": 5, "total_expired": 5 }
}
```

---

## Webhooks

### `POST /api/webhooks/razorpay`
Handles Razorpay payment events (payment.captured, subscription events).

---

## Error Format

All errors follow this structure:
```json
{
  "success": false,
  "error": {
    "message": "Human-readable error description",
    "code": "OPTIONAL_ERROR_CODE"
  }
}
```

---

*Last updated: 2026-03-20*
