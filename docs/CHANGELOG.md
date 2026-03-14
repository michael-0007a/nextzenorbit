# Changelog — Nextzen Orbit

All notable changes to this project will be documented in this file.
Format: [Semantic Versioning](https://semver.org/)

---

## [0.10.0] — 2026-03-14

### Added — **AI Resume Optimization Features**

#### General Resume Improvement
- **Improve Button**: One-click AI optimization for ATS compatibility and professional impact
- **Full Resume Rewrite**: AI rewrites all sections with stronger action verbs, better metrics, and cleaner structure
- **Automatic Versioning**: Original resume saved as backup before improvement

#### JD-Based Optimization with Embellishment Levels
- **Optimize for JD Button**: Available in both resume editor AND job analyzer page
- **Three Optimization Modes**:
  - **Keep it Factual** (Conservative): Only rephrase existing content — Target: 85-90% match
  - **Enhance Strategically** (Moderate): Add implied skills, quantify achievements — Target: 90-95% match
  - **Maximize Match** (Aggressive): Full optimization with user acknowledgment — Target: 95-100% match
- **Match Score**: Returns estimated match percentage after optimization
- **Changes Applied**: Lists all modifications made for transparency

#### Job Analyzer Integration
- **Post-Analysis Optimization**: After analyzing JD, immediately optimize resume from same page
- **Seamless Flow**: Analyze → Choose optimization level → Optimize → View results
- **Direct Links**: Quick navigation to view optimized resume

#### Version Control Integration
- Automatic backup before any AI modification
- Clear version labels: "AI-optimized for ATS", "JD-tailored (factual)", etc.
- One-click restore to any previous version

### Improved — **AI Prompts v2.0**
- Significantly improved optimization prompts for all three levels
- Aggressive mode now properly targets 95-100% match score
- Better keyword injection and JD alignment strategies
- Specific quantification guidelines per experience level
- Higher creativity (temperature) for aggressive mode

### UI Fixes
- Fixed modal vertical overflow — now properly scrollable with max-height
- All modals now have `max-h-[90vh]` and scrollable body

### New Files
- `src/lib/ai/prompts/resume-improver.ts` — AI prompts for improvement and JD optimization
- `src/app/api/resumes/[id]/improve/route.ts` — General improvement endpoint
- `src/app/api/resumes/[id]/optimize/route.ts` — JD-based optimization endpoint

### UI Changes
- Added "Improve" button to resume editor top bar
- Added "Optimize for JD" button to resume editor top bar
- Added "Optimize Resume" section to job analyzer results
- New optimization modal with embellishment level selector
- User acknowledgment checkbox for aggressive optimization mode

---

## [0.9.1] — 2026-03-12

### Improved — **Resume System Enhancements**

#### Preview/Download Consistency (FIXED)
- **Unified LaTeX Template**: All templates now use a single unified format that matches the Live Preview exactly
- **Same Section Names**: "About Me", "Education", "Experience", "Projects", "Technical Skills", "Certifications", "Languages"
- **Same Layout**: Centered header, black section underlines, consistent spacing
- **Same Typography**: Times New Roman / Latin Modern fonts throughout
- **Word Document Updated**: Now uses Times New Roman and black section borders to match preview

#### LaTeX-based PDF Export
- **Simplified Template**: Removed complex multi-template system for consistency
- **Standard LaTeX Packages**: Uses lmodern, titlesec, enumitem for reliable compilation
- **Clean Output**: No fancy fonts that might fail on compilation service

#### Live Preview
- **Instant Updates**: Preview refreshes immediately when content changes
- **Multi-page Support**: Content flows naturally beyond single page
- **Accurate Representation**: What you see is what you get in the PDF

#### Download Options
- **PDF (Professional)**: LaTeX-compiled PDF matching preview exactly
- **Word Document (.docx)**: Editable format with same styling as preview
- **LaTeX Source (.tex)**: Raw LaTeX for custom editing
- **PDF (Basic)**: React-PDF fallback option

### Technical Changes
- Completely rewrote `latex-templates.ts` with unified template matching preview
- Updated `word-document.ts` to use Times New Roman and black borders
- Simplified `generateLatex()` to always use the unified template
- All templates now produce identical output for consistency

---

## [0.9.0] — 2026-03-10

### Added — **Phase 6: Application Tracker with Kanban Board**

#### Kanban Board
- **5 Status Columns**: Applied → Screening → Interview → Offer → Rejected
- **Drag & Drop**: Move applications between columns with instant status updates
- **Card Design**: Company, position, applied date, job link, notes preview
- **Follow-up Indicators**: Visual alerts for pending follow-up dates
- **Color-coded Columns**: Each status has distinct colors and icons

#### Application Management
- **Add Application Modal**: Quick add with company, position, URL, status, notes
- **Edit Application**: In-place editing with all fields
- **Delete Application**: Confirmation dialog with soft delete
- **Notes & Follow-ups**: Track additional details and reminders

#### View Toggle
- **Kanban View**: Default drag-and-drop board
- **Table View**: Traditional list with filters (preserved from Phase 2)
- **Smooth Toggle**: Seamless switch between views

#### Stats Dashboard
- **Total Count**: All applications at a glance
- **Interview Count**: Active interview pipeline
- **Offer Count**: Success metrics
- **Pending Follow-ups**: Upcoming action items

### Technical Changes
- New API routes: `/api/applications`, `/api/applications/[id]`
- New migration: `009_applications_table.sql`
- New components: `ApplicationsKanban`, `ApplicationsView`

---

## [0.8.0] — 2026-03-10

### Added — **Phase 5: Smart Resume Rebuilder**

#### AI-Powered Tailoring
- **Resume Tailor API**: `/api/resumes/[id]/tailor`
- **Context-Aware Suggestions**: Based on job analysis results
- **Anti-Hallucination**: Only suggests rephrasing existing content

#### Tailoring Suggestions
- **Section Order**: Recommended section prioritization
- **Keywords to Add**: Job description keywords to include
- **Bullet Rewrites**: Original vs. improved bullet comparisons
- **Skills to Highlight**: Which existing skills to emphasize
- **Summary Rewrite**: Tailored professional summary
- **Overall Tips**: Actionable improvement recommendations

#### Apply Changes UI
- **One-Click Apply**: Apply individual suggestions
- **Applied Tracking**: Visual indicators for applied changes
- **Regenerate**: Get fresh suggestions

### Technical Changes
- New AI prompt: `RESUME_TAILOR_PROMPT_V1`
- New API route: `/api/resumes/[id]/tailor`
- New component: `ResumeTailorPanel`

---

## [0.7.0] — 2026-03-10

### Added — **Phase 4: Enhanced Job Description Analyzer**

#### Detailed Keyword Extraction
- **Categorized Keywords**: Technical, Soft Skills, Tools, Certifications, Domain
- **Importance Levels**: Required, Preferred, Bonus keywords
- **Match Detection**: Automatic matching against resume content
- **Keyword Heatmap Component**: Visual color-coded keyword display

#### Score Breakdown System
- **Multi-dimensional Scoring**: Technical Skills (40%), Experience (30%), Education (15%), Soft Skills (15%)
- **Radar Chart Visualization**: SVG-based interactive radar chart
- **Animated Score Bar**: Smooth progress animations

#### Gap Analysis
- **Critical Gap Detection**: Identifies must-have missing skills
- **Prioritized Recommendations**: Ranked by importance (critical/important/nice-to-have)
- **Actionable Suggestions**: Specific tips to improve match score

#### Job Summary Extraction
- **Auto-detect Job Details**: Title, company, seniority level, employment type
- **Key Requirements Summary**: Bulleted list of main requirements

#### UI Improvements
- **Enhanced Results Display**: Grid layout with score card and radar chart
- **Animated Results**: Framer Motion entrance animations
- **Responsive Design**: Mobile-friendly layout

### Technical Changes
- New AI prompt (`JOB_ANALYZER_PROMPT_V2`) with structured output format
- New components: `RadarChart`, `KeywordHeatmap`
- AI usage tracking for analyzer requests
- Backward-compatible response format

---

## [0.6.0] — 2026-03-10

### Added — **Phase 3: Resume Templates, PDF Export & AI Enhancement**

#### Resume Templates System
- **6 Professional Templates**: Classic, Modern Minimal, Executive, Creative, ATS-Optimized, Compact
- **Template Categories**: Professional, Modern, Creative, Minimal
- **Pro Templates**: Executive, Creative, Compact (requires paid subscription)
- **Visual Template Selector**: Grid view with mini previews and Pro badges

#### PDF Generation
- **Server-side PDF Export**: Using @react-pdf/renderer
- **Template-aware Styling**: Each template has unique colors, fonts, layouts
- **Download Button**: One-click PDF download with sanitized filename
- **A4 Format**: Standard resume dimensions

#### AI Enhancement Features
- **AI Bullet Rewriter**: Enhance resume bullet points for impact and ATS
- **AI Summary Generator**: Generate professional summary from experience
- **Cover Letter Generator**: AI-powered cover letters based on resume + JD
  - Company and job title inputs
  - Optional hiring manager personalization
  - Copy to clipboard and download options

#### Version Control
- **Resume Versions Table**: Track historical snapshots
- **Save Version**: Manual version snapshots with change summaries
- **Restore Version**: One-click restore to previous versions
- **Version History Panel**: Slide-out drawer showing all versions

#### Split-Pane Editor
- **Live Preview**: Real-time resume preview while editing
- **Toggle Preview**: Show/hide preview panel
- **Scaled Preview**: 55% scale A4 preview with template styling
- **Actions Bar**: Export, Template, History buttons in top bar

### Database Changes
- Added `resume_versions` table for version control
- Added `cover_letters` table for generated cover letters
- Created `update_updated_at()` trigger function if missing

### UI Improvements
- Cover Letter page added to sidebar navigation
- Wider editor layout for split-pane view
- Dynamic force-refresh on profile/dashboard pages

---

## [0.5.0] — 2026-03-05

### Changed — **Rebranding: JobSearch AI → Nextzen Orbit**
- Updated app name across all files and documentation
- New branding in sidebar, auth pages, landing page, and metadata
- Updated all documentation headers to reflect new name

### Added — **Phase 2: Resume System Completion**

#### Resume Features
- **Profile Pre-fill**: New resumes auto-populate contact info from user profile
- **AI Resume Parsing**: Upload PDF/DOCX → AI extracts structured data (Groq LLaMA 3.3 70B)
- **Manual Entry Forms**: Complete section-based editor for all resume fields
  - Contact Information (name, email, phone, location, LinkedIn, GitHub, Portfolio)
  - Professional Summary with character counter
  - Work Experience with bullet points and "Currently here" toggle
  - Education with GPA/percentage support
  - Skills with categorized groups and tag-style input
  - Projects with technologies and description
  - Certifications with issuer and credential URL
  - Languages with proficiency levels
- **Auto-save**: Debounced 2-second auto-save on all form changes
- **Inline Title Editing**: Click-to-edit resume title

#### Validation & Data
- Complete Zod schemas for all resume content types
- JSON normalization for AI-parsed content
- Empty state handling with skeleton fallback on parse failure
- AI token usage tracking per billing period

### Fixed
- Resume creation now properly fetches profile data for pre-fill
- ESLint warnings (unused imports, empty interfaces)

---

## [0.4.0] — 2026-03-05

### Added — **Phase 1 & 2: Core Features**

#### Authentication
- Google OAuth-only authentication (LinkedIn coming later)
- Automatic name extraction from Google profile
- Profile sync on each login (updates name/avatar if missing)

#### Dashboard Pages
- `/dashboard` — Main dashboard with metrics and quick actions
- `/profile` — Edit profile (name, phone, headline, location, LinkedIn)
- `/resumes` — Resume listing and management
- `/resumes/[id]` — Resume editor with section-based editing
- `/applications` — Job application tracker with status filters
- `/analyzer` — AI-powered job description analyzer
- `/subscription` — Subscription management and plan cards
- `/settings` — Account settings and session management

#### API Routes
- `POST /api/analyzer` — AI job match analysis using Groq (LLaMA 3.3 70B)
- `GET/PATCH /api/profile` — Profile CRUD
- `GET/POST /api/resumes` — Resume listing and creation
- `GET/PATCH/DELETE /api/resumes/[id]` — Individual resume operations
- `POST /api/payments/create-order` — Razorpay order creation
- `POST /api/webhooks/razorpay` — Razorpay webhook handler
- `POST /api/webhooks/cashfree` — Cashfree webhook handler

#### Components
- `ApplicationsTable` — Filterable job applications table
- `NewApplicationButton` — Modal form to add applications
- `JobAnalyzerForm` — AI analysis input and results display
- `SubscriptionDetails` — Current plan and usage meters
- `PlanCards` — Plan comparison grid (Free/Pro/Elite)
- `SettingsForm` — Account and session management

#### Documentation
- `ARCHITECTURE.md` — System design and data flow
- `DATABASE_SCHEMA.md` — Full schema with RLS policies
- `API_DOCS.md` — API endpoint documentation
- `SECURITY.md` — Security architecture
- `ASSUMPTIONS.md` — Engineering decisions
- `DEPLOYMENT.md` — Deployment guide
- `PAYMENTS.md` — Payment integration details

### Changed
- Auth pages now Google-only (removed email/password forms)
- OAuth callback syncs name/avatar for returning users
- Dashboard layout uses Google metadata as name fallback
- Added `lh3.googleusercontent.com` to Next.js image domains

### Fixed
- Profile page redirect loop when profile doesn't exist
- Google profile picture not loading (image domain config)
- Name showing as email prefix instead of real name

---

## [0.3.0] — 2026-03-02

### Changed — **CRITICAL: Yeldra Aesthetic Overhaul**
- **globals.css**: Complete rewrite with exact 5-color palette (Tropical Mint, Mint Leaf, Granite, Shadow Grey, Midnight Violet)
- **Light mode**: Pure white (#ffffff) background, Midnight Violet (#2a1f2d) typography
- **Dark mode**: Pure black (#050505) background, white typography, Shadow Grey (#3b2c35) elevated surfaces
- **All components**: Replaced indigo/violet gradients with strict B/W + 5-color system
- **Border radius**: Changed from `rounded-lg`/`rounded-xl` to `rounded-sm` across all components
- **Borders**: Replaced `border-border` with `border-granite` (1px solid #5b6c5d) everywhere
- **Button primary**: Light = `bg-midnight text-white`, Dark = `bg-mint text-midnight`
- **Button secondary**: Transparent + granite border, hover darkens border
- **Cards**: Transparent surface + granite border. Elevated gets Shadow Grey in dark
- **Inputs/Textarea**: Transparent bg, granite border, mint focus ring
- **Badges**: Border-only style with semantic color tints, no background fills
- **Modal/Sheet**: bg-background (light) / bg-shadow (dark), granite borders
- **Sidebar**: bg-background, granite borders, mint active indicator, midnight/mint logo
- **TopNav**: bg-background/80 backdrop-blur, granite borders, granite text actions
- **Toasts**: bg-background with granite border
- **Demo page**: Complete rewrite showcasing Yeldra aesthetic with color palette, all components

### Removed
- All indigo/violet gradient colors (`primary-50` through `primary-950`, `accent-*`)
- Warm gray scale (`gray-50` through `gray-900`)
- Noise/grain background overlays
- Mesh gradient backgrounds
- `rounded-lg`, `rounded-xl`, `rounded-2xl` from components
- Generic purple glow effects

### Documentation
- **UI_PATTERNS.md**: Complete rewrite documenting B/W + 5-color system, surface rules, component specs

---

## [0.1.0] — 2026-03-01

### Added — Phase 0: Design System Setup
- Next.js 15 project with TypeScript strict mode
- TailwindCSS v4 with custom theme tokens
- Base UI components: Button, Card, Input, Textarea, Badge, Avatar, Skeleton, Modal, Sheet, ThemeToggle
- Layout components: Sidebar, TopNav, PageHeader
- Providers: ThemeProvider (next-themes), Sonner toast
- Framer Motion animation utilities
- Dark mode support (system preference default)
- Barrel exports for all component libraries
- Demo page showcasing all components

