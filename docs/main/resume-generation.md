# Resume generation

Client and recruiter generators offer Auto, one page, two pages, or a custom target of 3–10 pages. The choice lives in `content.layout.target_pages`, so it travels with saved resumes and version history without a database migration. Existing resumes default to Auto.

Uploads extract the full source independently of generation length. DOCX headers and footers are included because they can contain contact details. Re-upload originals previously condensed by the old parser: exports cannot recover discarded facts.

AI generation receives the selected length. Auto preserves detail; explicit lengths permit consolidation and prioritization. Longer writing must remain grounded in the source. Actual pagination is measured after generation. An overlong draft gets one bounded condensation retry; unsuccessful fitting is reported in the preview, never hidden by clipping text or shrinking below 10.5 pt. A longer target cannot guarantee full pages when the source lacks enough substantive material.

`src/lib/resume/layout.ts` provides the shared field order, measured line wrapping and balanced page breaks for browser preview, PDF and Word. All supported fields are exported. Standard section headings, a single reading column, text URLs and body contact information avoid common parsing problems. Body type is 10.5–12 pt; name type is 22 pt; margins are at least half an inch. Word uses Arial or Times New Roman with explicit page breaks and no layout tables or text boxes. Word processors may substitute fonts; review after editing. PDF uses the corresponding built-in standard fonts. Characters outside the PDF font repertoire are flagged for Word export.

Selected templates now apply to every export format. Explicit export template parameters take precedence over saved preferences. PDF generation is local to the application server. Editable LaTeX retains all fields and the selected style, but TeX engines paginate independently; it is not the PDF export renderer.

No ATS acceptance rate is promised. Parsing and employer screening are different processes; job requirements and each employer's configuration affect outcomes. Greenhouse explicitly documents parsing problems with complex tables, headers, footers and contact details in text boxes: https://support.greenhouse.io/hc/en-us/articles/200989175-Unsuccessful-resume-parse

## Verification

Run `npm run test:resumes` and `npx tsc --noEmit`. Tests cover authorization, template precedence, PDF and DOCX text recovery, page bounds, balanced multi-page output, long resumes, length persistence, a mocked AI condensation retry, and DOCX header extraction. Font metrics can be regenerated with `node scripts/generate-resume-font-widths.cjs`.

Six pages of PDF samples (all three layouts) were visually inspected during this change. DOCX text extraction passes, but native Word/LibreOffice visual pagination could not be verified in the development runtime because its LibreOffice executable is missing. No live Workday/Greenhouse parser or live AI-provider acceptance test has been performed.
