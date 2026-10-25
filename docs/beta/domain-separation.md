# Domain separation plan - no infrastructure changes made

## Recommended first move

Keep one repository, one Next.js deployment and the existing Supabase database initially. Attach the three domains to the same Vercel project and route by an explicit hostname allowlist. This minimizes changes to the shared resume, payment and account logic. Vercel supports attaching custom domains in [project domain settings](https://vercel.com/docs/domains/working-with-domains/add-a-domain).

| Public host | Purpose | First-stage route behavior |
| --- | --- | --- |
| nextzenorbit.com | Marketing and public legal pages | Root remains the landing page; login/signup buttons link to the client host |
| app.nextzenorbit.com | Client application | Root redirects to the appropriate dashboard/onboarding/login page; existing client paths stay intact |
| admin.nextzenorbit.com | Staff portal | Root redirects to /admin; keep existing /admin/... paths for the initial migration |

A later migration can remove the visible /admin prefix through consistent rewrites and a shared URL builder. Do not combine that refactor with the first DNS/auth/payment cutover.

## Implementation sequence

1. Introduce explicit marketing, client and admin origin configuration. Inventory hardcoded Vercel URLs, emails, checkout URLs, navigation, metadata, sitemap and canonical links. The current middleware and OAuth callback use the current request URL, so origin-aware behavior needs deliberate tests.
2. Add host-aware routing before existing auth gates, preserving refreshed auth cookies in redirects. Restrict page surfaces by host. Keep API role/ownership checks on the server: a hostname is not authorization. Keep same-origin API calls on each application host to avoid a new cross-origin session design.
3. Use host-only sessions initially; staff and client logins stay independent. Make logout available on both hosts and describe it accurately as signing out of that host. If cross-subdomain single sign-on is later wanted, design a dedicated exchange flow instead of broadly sharing session cookies with the marketing site.
4. Set the primary Supabase Site URL to the client origin. Add exact client/admin OAuth, signup-confirmation and password-recovery redirect URLs. Audit every callback's default destination and role check. Supabase recommends exact production redirect paths in its [redirect URL guidance](https://supabase.com/docs/guides/auth/redirect-urls).
5. Update payment success/failure URLs, provider dashboard settings, email links and webhook configuration. Keep the existing webhook destination working until in-flight payments finish, or preserve POST methods/body through a tested internal rewrite. Never use a generic marketing redirect for webhooks or OAuth callbacks.
6. Add domains in Vercel, then use the DNS records Vercel provides for this project. Verify HTTPS and ownership before making them canonical. Redirect www to the chosen marketing apex. Preserve existing mail MX/TXT records.
7. Test on temporary subdomains first: fresh signup, approval, payment, payment reconciliation, OAuth, password reset, sign-out, staff role restrictions, client switching, resume upload/download/delete and job search. Check cookies, callback origins and redirect loops in fresh browser sessions.
8. Switch public links and canonical metadata. Redirect legacy Vercel page URLs to the appropriate host with path/query preservation; maintain API/callback compatibility separately. Monitor auth failures, payment callbacks and download errors. Roll back origin configuration and page redirects if needed; no data migration is required.

## When to split into separate deployments

Use separate Vercel projects only when marketing release independence or distinct deployment ownership justifies it. Shared packages can hold UI, validation and resume rendering; the same protected data services can remain in Supabase. Splitting immediately would add build configuration, duplicated environment management and cross-deployment coordination before there is a demonstrated need.

## Acceptance

Each hostname opens the intended experience; admin access still requires an authorized staff role; clients cannot access staff APIs; OAuth and payment callbacks return to the correct host; old emailed page links still work; all sessions can be signed out. No DNS, Vercel, Supabase Auth or payment-provider settings are changed by this plan.
