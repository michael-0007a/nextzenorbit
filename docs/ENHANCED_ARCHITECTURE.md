# Enhanced Architecture: Nextzen Orbit

## Overview

Nextzen Orbit is an AI-powered career workspace focused on the Indian job market, combining job discovery, interview preparation, and assisted application tools.

## Core Principles

- **User-controlled**: No autonomous auto-apply; assisted autofill only
- **Modular services**: Clean separation of concerns
- **Type-safe**: TypeScript everywhere
- **Scalable**: Database-driven, not hardcoded
- **Production-ready**: Proper error handling, loading states, RLS

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Next.js App Router                       │
├─────────────────────────────────────────────────────────────┤
│  Pages                                                       │
│  ├── /career/[slug]      Dynamic career pages               │
│  ├── /jobs               Job search & aggregation           │
│  ├── /applications       Kanban + table tracker             │
│  ├── /roadmaps           Career roadmaps                    │
│  ├── /interview          Question bank                      │
│  ├── /notes              AI-generated notes                 │
│  └── /projects           User project showcase              │
├─────────────────────────────────────────────────────────────┤
│  Services Layer                                              │
│  ├── JobService          Adzuna API aggregation             │
│  ├── AIService           Groq API notes generation          │
│  ├── YouTubeService      Video search & caching            │
│  ├── RoadmapService      Dynamic roadmap rendering          │
│  ├── QuestionService     Interview questions                │
│  └── ProfileService      User data for autofill             │
├─────────────────────────────────────────────────────────────┤
│  Data Layer (Supabase)                                       │
│  ├── PostgreSQL          Relational data                    │
│  ├── RLS Policies        Row-level security                 │
│  └── Storage             Resume & project files             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│           Chrome Extension (Manifest V3)                     │
├─────────────────────────────────────────────────────────────┤
│  ├── Background Worker   Message routing, API calls         │
│  ├── Content Scripts     Portal detection & DOM injection   │
│  ├── Portal Adapters     Workday, Greenhouse, Lever, LI     │
│  ├── Field Mappers       Profile → form field mapping       │
│  └── Popup UI            Settings & status                  │
└─────────────────────────────────────────────────────────────┘
```

## Database Schema Enhancements

### careers
Primary career paths (SWE, Data Science, Product Management, etc.)

### jobs
Aggregated from Adzuna + manual additions

### youtube_resources
Cached video results by role/topic

### roadmaps + roadmap_steps
Dynamic multi-step career progression

### interview_questions
Filterable by role, company, difficulty, topic

### ai_notes
Generated content cached per topic to reduce API usage

### projects
User GitHub repos + screenshots + tech stack

### applications
Job application tracker with status workflow

## Feature Implementation Guide

### 1. Dynamic Career Pages `/career/[slug]`

**Data fetching:**
- Fetch career by slug
- Load related roadmap
- Load interview questions (filtered by role)
- Load YouTube resources (filtered by role)
- Load related jobs (filtered by tags)
- Load cached AI notes (if any)

**UI sections:**
- Hero with career overview
- Roadmap visualization
- Learning resources grid
- Interview prep section
- Job listings
- AI notes panel

### 2. AI Notes Generation

**Flow:**
1. User enters topic (e.g., "React Hooks")
2. Check cache in ai_notes table
3. If not found, call Groq API
4. Parse and structure response
5. Save to database
6. Return to user

**Prompt template:**
```
Generate interview-focused notes for: {topic}

Include:
- Concise explanation (2-3 paragraphs)
- Key concepts (bullet points)
- Common interview questions (3-5)
- Code examples (if applicable)
- Quick revision summary
```

### 3. Job Aggregation

**Adzuna API integration:**
- Scheduled cron job (daily/hourly)
- Fetch jobs by role categories
- Normalize response to jobs table schema
- Deduplicate by title + company
- Tag by skills/tech stack

**Search & filter:**
- Full-text search on title, description
- Filter by location, company, tags
- Sort by relevance, date

### 4. Roadmap System

**Structure:**
- roadmaps: high-level career path
- roadmap_steps: ordered steps with descriptions

**UI patterns:**
- Linear step-by-step view
- Progress indicator
- Expandable sections
- Link to related resources

**Future-ready:**
- JSON field for graph coordinates
- Support for branching paths

### 5. Interview Question System

**Features:**
- Multi-filter sidebar (role, company, difficulty, topic)
- Expandable card UI
- Answer reveals
- Bookmark/save functionality
- Search within questions

### 6. YouTube Resources

**YouTube Data API v3:**
- Search by topic + role keywords
- Extract: title, url, thumbnail, channel
- Cache in database
- Categorize by difficulty (manual tagging)

**Display:**
- Grid of video cards
- Filter by topic, difficulty
- External links to YouTube

### 7. User Projects

**Fields:**
- GitHub URL (validate format)
- Title, description
- Tech stack (tags)
- Screenshots (Supabase Storage)

**Future AI features:**
- Auto-extract README
- Suggest improvements
- Match to job requirements

### 8. Assisted Autofill Extension

**Architecture:**
```
Extension Components:
├── manifest.json          Permissions, content scripts
├── background/worker.ts   Message router, API bridge
├── content/
│   ├── detector.ts        Portal detection logic
│   ├── injector.ts        In-page assist panel
│   └── adapters/
│       ├── workday.ts
│       ├── greenhouse.ts
│       ├── lever.ts
│       └── linkedin.ts
├── popup/                 Settings UI
└── shared/
    ├── fieldMapper.ts     Profile → form field mapping
    └── types.ts           Shared interfaces
```

**Field mapping:**
```typescript
{
  firstName: profile.first_name,
  lastName: profile.last_name,
  email: profile.email,
  phone: profile.phone,
  linkedin: profile.linkedin_url,
  github: profile.github_url,
  portfolio: profile.portfolio_url,
  // Resume: flag for manual upload only
}
```

**Portal adapters:**
Each adapter exports:
- `detect()`: returns true if portal detected
- `getFields()`: returns array of fillable fields
- `fillField()`: fills a specific field

### 9. Application Tracking

**Views:**
- Kanban: columns by status
- Table: sortable, filterable list

**Statuses:**
- Saved
- Applied
- Interview
- Rejected
- Offer

**Features:**
- Drag-and-drop (kanban)
- Quick status change
- Notes field
- Date tracking

## API Routes

```
/api/jobs/aggregate          POST   Trigger job fetch
/api/jobs/search             GET    Search jobs
/api/ai/generate-notes       POST   Generate AI notes
/api/youtube/search          GET    Search videos
/api/autofill/profile        GET    Profile data for extension
/api/applications/[id]       PATCH  Update application
```

## Environment Variables

```env
# Existing
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GROQ_API_KEY=

# New
ADZUNA_APP_ID=
ADZUNA_APP_KEY=
YOUTUBE_API_KEY=
NEXT_PUBLIC_APP_URL=
```

## Implementation Phases

### Phase 1: Foundation
- ✅ Auth, DB, payments (existing)
- 🔲 Profile system enhancement
- 🔲 Job aggregation service
- 🔲 Application tracking (kanban + table)
- 🔲 Autofill extension MVP

### Phase 2: Career Content
- 🔲 Careers table & pages
- 🔲 Roadmap system
- 🔲 Interview questions
- 🔲 YouTube integration

### Phase 3: AI & Intelligence
- 🔲 AI notes generation
- 🔲 Project showcase
- 🔲 Personalized recommendations
- 🔲 Extension enhancements

## Security Considerations

- RLS on all user-owned data
- API key rotation for external services
- Extension communicates via secure origin checks
- No sensitive data in extension storage
- Rate limiting on AI generation

## Performance Optimizations

- Cache AI-generated notes
- Cache YouTube search results
- Debounce job search
- Lazy load career page sections
- Virtual scrolling for large lists
- ISR for career pages

## Monitoring & Observability

- Track AI API usage (cost management)
- Monitor job aggregation failures
- Extension error reporting
- Application tracking analytics
