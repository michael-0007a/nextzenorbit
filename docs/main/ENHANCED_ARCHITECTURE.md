# Enhanced architecture: feature guide

Last reviewed from code: 2026-10-16. This was the 2026 planning doc for the career workspace and the extension. It now describes what was built. The repo layout and services are in [CAREER_WORKSPACE_ARCHITECTURE.md](CAREER_WORKSPACE_ARCHITECTURE.md).

## Principles that held

- **User-controlled:** assisted autofill only, with no autonomous submission. The Playwright auto-apply worker was removed.
- **Modular services:** route handlers are thin and call `src/services/*`.
- **Type-safe end to end:** Zod validates every boundary, and `src/types/database.ts` mirrors the schema.
- **Database-driven content:** careers, roadmaps, questions and resources are seeded rows, not hardcoded.
- **RLS plus paid access:** user-owned rows are owner-only and gated by `has_paid_service_access()`.

## Features

### 1. Career pages `/career/[slug]`

- **Data:** the career by slug, its roadmap and steps, interview questions and YouTube resources for the role, related catalog jobs, the user's AI notes and projects. Independent sections load concurrently.
- **UI:** `components/career/*`: hero, roadmap, resources, interview prep, related jobs, AI notes panel, projects.
- **Caching:** reference data is cached under the `career-reference` tag. A super admin invalidates it with `POST /api/admin/reference-cache`.

### 2. AI notes

1. The user enters a topic in the AI notes panel.
2. `POST /api/ai/generate-notes` calls Bedrock (`AI_WRITER_MODEL`, Kimi K2.5).
3. `notes-service.upsertNote` saves the result per user and topic, so asking again for the same topic updates that note.
4. Notes can be read, edited and deleted through `/api/ai-notes` and `/api/ai-notes/[id]`.

### 3. Job catalog

There is no scheduled crawl. The catalog fills as people search: `POST /api/jobs/search` → Adzuna → `store_job_results` normalizes and refreshes the `jobs` rows. Career pages read related jobs through `GET /api/jobs` (`jobs-service.listJobs`). Queuing requires a catalog row less than 24 hours old (037). See [job-search-improvement-plan.md](job-search-improvement-plan.md).

### 4. Roadmaps

`roadmaps` → ordered `roadmap_steps` (`order_index`, `level`). They're rendered as a linear, sectioned view. Branching paths are not modeled.

### 5. Interview questions

Filter by role, company, difficulty and topic (`use-interview-filter`), on expandable cards with answers. Bookmarking isn't built.

### 6. YouTube resources

Seeded rows in `youtube_resources`, filterable by topic and difficulty. The unused live `GET /api/youtube/search` route was removed (audit N6).

### 7. User projects

`projects`: title, GitHub URL, description, tech stack tags and screenshot URLs. Plain CRUD; no AI features.

### 8. Assisted autofill extension

Package: `extensions/nextzen-orbit-autofill` (MV3, built with esbuild into `build/`).

```
src/
  background/index.ts, auth.ts     # message routing; fetch /api/autofill/profile with the session cookie
  content/index.ts                 # entry: detect portal, scan fields, mount panel
  content/detectors/               # base + workday, greenhouse, lever, linkedin, microsoft
  content/handlers/autofill.ts     # fill detected fields on user click
  content/ui/panel.ts              # in-page assist panel
  popup/popup.{html,ts}            # settings: app URL, enable toggle, refresh status
  shared/messages.ts, profile.ts,  # zod message + profile schemas, supported sites,
         sites.ts, storage.ts      # settings storage (default app URL)
```

- **Supported portals:** Workday (`*.myworkdayjobs.com`), Greenhouse, Lever, LinkedIn, Microsoft Careers.
- **Profile mapping:** full name, email, phone, LinkedIn, GitHub, portfolio, education entries (institution, degree, field, dates, GPA) and experience entries (company, position, dates, bullets).
- **Never automated:** file inputs (they're flagged for manual upload) and submission.
- **Telemetry:** field counts per portal go to `POST /api/autofill/telemetry`. The route writes them with the service role.
- **Default app URL:** `https://app.nextzenorbit.com`, changeable in the popup. It only resolves once the domain split is live.

### 9. Application tracking

- Kanban (drag and drop, optimistic) and a table (search, status filter).
- Statuses: `applied`, `screening`, `interview`, `offer`, `rejected`.
- Fields: company, position, URL, resume, notes, applied and follow-up dates.

## API routes (career and extension)

| Route | Methods | Purpose |
| --- | --- | --- |
| `/api/careers`, `/api/careers/[slug]` | GET | Career list and page |
| `/api/roadmaps`, `/api/roadmaps/[id]` | GET | Roadmaps |
| `/api/interview-questions` | GET | Questions |
| `/api/youtube` | GET | Stored resources |
| `/api/ai/generate-notes` | POST | AI notes |
| `/api/ai-notes`, `/api/ai-notes/[id]` | CRUD | Notes |
| `/api/projects`, `/api/projects/[id]` | CRUD | Projects |
| `/api/jobs` | GET | Catalog for related jobs |
| `/api/autofill/profile` | GET | Extension profile |
| `/api/applications`, `/api/applications/[id]` | CRUD | Tracker |

## Not built (from the original plan)

Personalized recommendations, roadmap progress tracking, question bookmarks, README extraction for projects, extension error reporting, and Chrome Web Store distribution.
