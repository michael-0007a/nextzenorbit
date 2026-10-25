# Resume categories and standalone admin documents

Two resume categories are available in the client editor, the existing client-specific admin generator, and the standalone admin resume workspace:

- **Corporate / Full-time** keeps the existing three layouts and full-resume tailoring behavior.
- **C-to-C / Contract** adds Contract Consultant, Contract Classic, and Contract Modern. The supplied Anirudh Word document informed the detailed bulleted summary, grouped skills before experience, uppercase headings, and complete employment history. Its personal details and appended job advertisement are not template defaults. Layouts are reference-inspired rather than exact Word replicas; PDF-safe Arial/Times equivalents are used consistently across previews and exports.

C-to-C AI improvement and optimization replace only `summary`. Contact details, experience, skills, education, projects, certifications and other sections come from the original structured source. The fitting stage cannot condense contract history to force a page count. Manual edits remain possible. Existing resumes without `resume_type` retain corporate behavior.

## Standalone workflow

All admin roles see **Create Resume** and **Create Cover Letter** in the sidebar. Existing per-client generators remain available.

1. Upload a text PDF/DOCX up to 4 MB or enter source details manually. Files are parsed in memory, without uploading to Storage or creating a resume row. The limit keeps multipart requests below the hosting platform's request-body limit.
2. Generate, edit and review drafts. Draft state stays in the current tab. Downloads are generated from the current draft and do not save it.
3. Explicitly save to the admin's private library. Optionally select a client to create/update a client copy. Ordinary recruiters can select only assigned clients; supervisor and super admins can select other clients. The database verifies this again.
4. Reopen saved documents or start a new draft for another creation. Deleting a library document requires two confirmations and does not delete already assigned client copies.

Library saves and client copies are atomic. Saving/retrying the same document to the same client updates the existing copy rather than creating duplicates. Client copies follow the existing 30-day expiry; private-library documents remain until deleted.

## Deployment

Apply `supabase/migrations/038_admin_document_workspace.sql` before deploying. No production migration or deployment was performed in this task. This adds the private library and a service-only save/assignment function. Category metadata lives inside existing resume content JSON and needs no separate data backfill.

## Validation

`node --test --test-isolation=none scripts/test-admin-document-workspace.cjs` covers summary-only enforcement, templates, stateless upload/generation/PDF/Word exports, real migration execution, ownership isolation, client assignment, retries and deletion behavior. Existing layout tests cover all six templates. Browser fixtures exercise editing, saving, downloads, reopening, new drafts, cover letters and mobile layout without live writes.
