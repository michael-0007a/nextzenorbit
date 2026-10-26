# Career workspace architecture

Last reviewed from code: 2026-10-16. This describes what is **built**. The original vNext proposal from 2026-05 (folder sketch, Groq, extension tokens) has been replaced by this as-built version.

## Scope

The career workspace gives clients self-serve learning for a target role:

- a career list and a page per career;
- roadmaps, interview questions and YouTube resources;
- AI notes per topic;
- a portfolio of their own projects;
- related jobs.

It sits beside the done-for-you application service and doesn't depend on it.

## Layout in the repo

```
src/
  app/(dashboard)/career/page.tsx            # career list (CareerExplorer)
  app/(dashboard)/career/[slug]/page.tsx     # career page: sections loaded concurrently
  app/api/careers/, careers/[slug]/          # career list / page data
  app/api/roadmaps/, roadmaps/[id]/          # roadmaps + ordered steps
  app/api/interview-questions/               # filter by career/role/company/difficulty/topic
  app/api/youtube/                           # stored resources (the live youtube/search route was removed, N6)
  app/api/ai-notes/, ai-notes/[id]/          # user notes CRUD
  app/api/ai/generate-notes/                 # AI notes (Bedrock, AI_WRITER_MODEL)
  app/api/projects/, projects/[id]/          # user projects CRUD
  app/api/jobs/                              # catalog listing for "related jobs"
  components/career/*                        # hero, explorer, card, roadmap, interview, resources,
                                             # ai-notes panel, projects, related jobs
  features/career/{metadata,icons,index}.ts  # display metadata per career
  hooks/use-ai-notes.ts, use-career-filter.ts, use-interview-filter.ts
  lib/api/career-workspace.ts, request.ts    # typed client fetch helpers
  lib/validations/{careers,roadmaps,interview,youtube,jobs,projects}.ts
  services/{careers,roadmaps,interview,youtube,notes,projects,jobs}-service.ts
  types/domain/*.ts
scripts/seed/                                # seed data + runner (npm run seed:career-workspace)
supabase/migrations/014_career_workspace.sql (+ 018 RLS fix)
```

## Data model

| Table | Owner | Notes |
| --- | --- | --- |
| `careers` | Reference | `title`, `slug`, `description`, `icon` |
| `roadmaps`, `roadmap_steps` | Reference | Steps ordered by `order_index`, with a `level` |
| `interview_questions` | Reference | `role`, `company`, `difficulty`, `topic`, `question`, `answer` |
| `youtube_resources` | Reference | `career_id`, `role`, `url`, `channel`, `topic`, `difficulty` |
| `jobs` | Catalog | Shared with job search (037) |
| `ai_notes` | User | `role`, `topic`, `generated_content` |
| `projects` | User | `title`, `github_url`, `description`, `tech_stack`, `screenshots` |

Reference tables are readable by everyone (`*_select_all` policies). They're written by the seed script (service role) or by admins (`*_admin_all`). User tables use owner RLS plus the paid-access policy.

## Services

Route handlers stay thin and call `src/services/*`:

| Service | Responsibility |
| --- | --- |
| `careers-service` | List careers; assemble a career page |
| `roadmaps-service` | Roadmap and steps, fetched concurrently (P04) |
| `interview-service` | Filtered questions |
| `youtube-service` | Stored resources |
| `notes-service` | Notes CRUD; generation calls Bedrock |
| `projects-service` | Projects CRUD |
| `jobs-service` | `listJobs` with filters for related jobs |

Reference reads are cached under the `career-reference` tag. A super admin can clear the cache with `POST /api/admin/reference-cache` (P15).

## Seeding

`npm run seed:career-workspace` runs `scripts/seed/index.ts` with `tsx`. It upserts careers, roadmaps, steps, interview questions and YouTube resources from `scripts/seed/data`, using stable ids (`seedId`), so it can be run again safely. It needs the Supabase service-role variables.

## Environment

Only the shared app variables (Supabase and Bedrock). `YOUTUBE_API_KEY` is no longer used. No extension token secret exists: the extension uses the normal session cookie.

## Relationship to the autofill extension

The extension is a separate package. It reads `GET /api/autofill/profile` and doesn't use the career services. See [ENHANCED_ARCHITECTURE.md](ENHANCED_ARCHITECTURE.md#8-assisted-autofill-extension) and [AUTOFILL_EXTENSION_TESTING.md](AUTOFILL_EXTENSION_TESTING.md).
