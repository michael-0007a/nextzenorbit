# Expanded onboarding

US: basic/professional details, the requested conditional immigration questions, then voluntary self-identification. India: basic/professional details and voluntary self-identification; the immigration step is omitted. UK, Canada, Australia, New Zealand, Singapore, South Africa and other countries: basic details, neutral work authorization/sponsorship questions with optional permit restrictions/expiry, then voluntary self-identification.

Other-country questions are product intake questions, not a claim that every government mandates these fields. Country-specific document verification remains the employer's responsibility. A three-letter currency code is required when a candidate enters a salary for an unlisted country.

The approach follows the distinction between candidate declarations and employer verification in the [UK right-to-work guidance](https://www.gov.uk/check-job-applicant-right-to-work) and [Australian visa-holder workplace guidance](https://www.fairwork.gov.au/find-help-for/visa-holders-migrants). The [UK discrimination guidance](https://www.gov.uk/government/consultations/amendments-to-the-home-office-code-of-practice-for-employers/code-of-practice-for-employers-avoiding-unlawful-discrimination-while-preventing-illegal-working) also informs using consistent questions rather than assumptions based on nationality or appearance.

All demographic answers are optional, including leaving every field blank. Acknowledgment and processing consent are required. US race/veteran terminology is disclosed in the form. Demographic answers are stored separately with owner-only authenticated reads and are excluded from recruiter review and matching. Work-authorization answers are also separate, accessible through a guarded admin endpoint only to assigned recruiters and supervisory roles. No sensitive form state is saved to browser local storage.

Required PDF/DOC/DOCX resumes support up to 10 MB. The server issues a signed upload ticket, the browser uploads directly into private Supabase Storage, and final submission verifies the path, ownership, actual size and file signature. Legacy DOC originals are preserved even when text extraction is unavailable. Upload failure keeps the form answers for retry.

Direct uploads and signed downloads avoid the [Vercel function payload limit](https://vercel.com/docs/errors/function_payload_too_large). See [Supabase signed upload documentation](https://supabase.com/docs/reference/javascript/storage-from-uploadtosignedurl).

Migration 036 must precede deployment. Existing accounts retain access. New profile details are saved in `profiles.application_details`; private demographic and work-authorization tables are not part of that JSON.

Additional official references reviewed for the general authorization step:

- [Canada employer-specific permits](https://www.canada.ca/en/immigration-refugees-citizenship/services/work-canada/employer-specific.html): permission can be limited by employer and other conditions until expiry; this supports collecting relevant restrictions without assuming any visa category.
- [New Zealand employer checks](https://www.immigration.govt.nz/work/for-employers/hiring-people-from-overseas/check-if-someone-can-legally-work-for-you/): employers verify work rights, including through VisaView.
- [Singapore work passes](https://www.mom.gov.sg/passes-and-permits): foreign workers generally need the appropriate valid pass before starting work.
- [South Africa Home Affairs work-visa review](https://www.dha.gov.za/images/PDFs/Report-of-the-Work-Visa-Review-2023.pdf): visa categories have different conditions. This historical background is not used to encode current eligibility thresholds or a mandatory questionnaire.
