# Resume generation (main)

Last reviewed from code: 2026-10-16. Code: `src/lib/resume/*`, `src/lib/ai/prompts/*`, `src/lib/ai/model.ts`. Beta changes the template set (see the end).

## Page length

Client and recruiter generators offer Auto, one page, two pages, or a custom target of 3–10 pages. The choice is stored in `content.layout.target_pages`, so it travels with saved resumes and version history without a database migration. Existing resumes default to Auto.

## Sources

Uploads extract the full source regardless of the generation length. DOCX headers and footers are included because they can hold contact details. Originals that were condensed by the old parser should be re-uploaded, because exports can't recover facts that were discarded.

## Pipeline

Every whole-resume rewrite goes through `fitGeneratedResume` (`fit-generated-resume.ts`). That covers client improve/optimize, the admin per-client generator and the document workspace. The steps, in order:

1. **Write.** Kimi K2.5 (`AI_WRITER_MODEL`) drafts from the source, the JD and the selected length. The rules shared by every prompt are in `src/lib/ai/prompts/writing-rules.ts`. Tailoring **strength** (`conservative` / `moderate` / `aggressive`) changes what is allowed. Above conservative, implied competencies are allowed (for example "coordinated scheduling and labor" → project planning). Tools and domain nouns must always come from the role's own source bullets.
2. **Quality gate** (`quality-gate.ts`):
   - **Code checks:** titles, employers and dates always come from the source; listed skills must appear in the source; no repetition that the AI added; no Title-Case label prefixes on bullets; no job-posting terms in the summary that the resume never mentions.
   - **Reviewer:** DeepSeek V3.2 (`AI_REVIEW_MODEL`) flags lines that the source doesn't support.
   - **Line fixes:** the writer rewrites only the flagged lines.
   - **Restore:** pure code, run last. Anything still failing goes back to the candidate's own words, so invented work never ships even if an AI step fails or times out.
3. **Keywords.** The candidate's own skill terms that the job also asks for (plus job acronyms used in bullets) are chosen for **bold** before any measuring, because bold text is wider.
4. **Length.**
   - Pagination is measured with the real layout.
   - An overlong draft gets **one** bounded condensation retry, which goes through the same code-only fact checks. If the retry fails, the usable first draft is kept and its overflow warning stays visible.
   - Then `trimToPages` **guarantees** the selected page count. It removes the least important content first: long skill lists (keeping 3 items per category), the sidebar in two-column templates, then the last bullets of older roles (recent roles keep at least 3 bullets, older roles 2, dropping to 2 and 1 if needed).
   - Every removal is listed for the reviewer.
   - Finally, fact-checked bullets from the full draft are added back while the page still fits: one per role per round, most recent role first.
5. **Progress.** The server streams the current stage (`parse`, `write`, `review`, `fix`, `fit`), and `components/ui/ai-progress.tsx` estimates time left from measured Bedrock timings (write 13–25s, review 7–9s, fix 3–6s, fit about 35s).

**C2C (contract) resumes** only rewrite `summary`, which is a structural boundary in code. Contract history is never condensed or trimmed to force a page count.

Calls time out at 40 seconds with one retry. Routes set `maxDuration` 120.

## Layout and export

`src/lib/resume/layout.ts` produces one line plan, with shared field order, measured line wrapping (`font-widths.json`) and balanced page breaks. The browser preview, PDF and Word all render that plan:

- **Templates:** they may use `entryStyle: "split"` (dates right-aligned on the title line) or `sidebar` (two columns).
- **Text sizes:** body 10.5–12 pt, name 22 pt, margins at least half an inch. Text is never shrunk below 10.5 pt and never clipped.
- **Word:** Arial or Times New Roman, explicit page breaks, no layout tables or text boxes.
- **PDF:** rendered locally with `@react-pdf/renderer`, using the matching built-in fonts. Characters outside the PDF fonts are flagged for Word export.
- **LaTeX:** editable source with every field and the selected style. TeX paginates on its own, so it isn't the PDF renderer.
- **Precedence:** an explicit `template` parameter on export beats the saved preference.

## Templates on main

| Type | Templates |
| --- | --- |
| Corporate | Classic Professional, Modern Minimal, Creative, Jake's Resume (split), Deedy Two-Column (sidebar), Awesome CV (split) |
| C2C / Contract | Contract Consultant, Contract Classic, Contract Modern |

`templatesForType("corporate" | "c2c")` filters the list, and unknown ids fall back to the first template.

**On beta:** Harvard (the new default), FAANGPath and AltaCV replace Classic, Modern and Creative for corporate resumes. The old three remain only as the base of the C2C templates. See [`../beta/BETA_OVERVIEW.md`](../beta/BETA_OVERVIEW.md).

## ATS note

No ATS acceptance rate is promised. Parsing and employer screening are different processes. Standard section headings, a single reading column (except the opt-in sidebar templates), text URLs and contact details in the body all avoid known parser problems. Greenhouse documents issues with tables, headers, footers and text boxes: https://support.greenhouse.io/hc/en-us/articles/200989175-Unsuccessful-resume-parse

## Verification

- `npm run test:resumes` (`test-resume-layout.cjs`, `test-quality-gate.cjs`) and `npx tsc --noEmit`.
- Related suites in `npm run test:performance`: `test-tailoring-intensity.cjs`, `test-ai-progress.cjs`, `test-extract-json.cjs`, `test-cover-letter-export.cjs`.
- These cover authorization, template precedence, PDF/DOCX text recovery, page bounds and the guaranteed page count, balanced multi-page output, the gate's restore rules, intensity rules, and a mocked condensation retry.
- Regenerate font metrics after font or template changes: `node scripts/generate-resume-font-widths.cjs`.
- Not automated: native Word/LibreOffice visual pagination and live ATS parsers. Bedrock calls are mocked in tests. Live AI cost and timing are covered by `AI_COST_ESTIMATE.md` and `src/lib/ai/progress.ts`.
