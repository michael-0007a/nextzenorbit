# Shared client assignments and targets

## Operations

Supervisors and super admins use **Allocate Clients > Manage team** to select multiple active admins and save the entire team atomically. Existing allocations are backfilled by migration 039. An empty selection unassigns the client. Ordinary admins cannot allocate clients.

Every member can find the client in My Clients, job search and the standalone document creators. Saving a standalone document to a shared client is permitted for every current member. Removing a member removes their client access without transferring completed work to someone else. Assignment changes are audited in `client_assignment_history`.

## Target rules

Targets come from `PLANS` in `src/lib/subscription.ts`: Silver 300, Gold 400, Elite 500 per calendar month. Only active, unexpired subscriptions or unexpired trials produce a target. Suspended clients and staff are excluded from active targets. SSO clients without a subscription have no plan target.

Monthly allowance is split equally across active assigned admins. Indivisible remainders are allocated one at a time by stable admin UUID order, so shares differ by at most one and always sum to the allowance. Weekly pace is `ceil(monthly share / 4)`, daily pace is `ceil(weekly / 5)`. For Silver with two admins this is 150 / month, 38 / week, 8 / working day each.

Reporting uses calendar months and Asia/Kolkata time, Monday-Friday, without a public-holiday calendar. Weekend daily goals are zero. Weekly actuals use the current Monday-based week, restricted to the report month. The below-pace threshold uses elapsed weekdays capped at 20, reflecting the requested four-week planning model. Rounded weekly/daily goals are guidance; they never increase the monthly allowance. Daily remaining is capped by personal and client remaining totals. Dashboard totals also cap each client's combined daily remainder.

Changing a team or plan recalculates current monthly shares immediately; it does not prorate by assignment date or rewrite historical credit. In-app explanations make this clear. The client total includes work by removed admins and older uncredited applications, so a fully completed client is not flagged as behind. The target panel presents current-month membership and targets, not historical assignment snapshots; assignment audits and per-admin application records remain available for history.

## Completion and reminders

Claim a job before applying. Other ordinary admins cannot change a claimed job until its owner releases it; supervisors can take ownership. Marking an application applied atomically stamps the authenticated actor in `applied_by` and the server time in `applied_at`. Repeat requests preserve both. Completed applications cannot be reopened through the queue API. The existing unique client/job key prevents duplicate queue entries.

Legacy `claimed_by` was previously rewritten on allocation and is not reliable evidence of the completing admin. Migration 039 intentionally leaves old applications uncredited to individuals. They still count toward the client total. Existing supervisor analytics now use verified `applied_by` credit, so individual historic counts can differ from the old, allocation-based figures.

My Clients shows in-app daily reminders, below-pace warnings and progress. Supervisor analytics show all shares and clients without a team; individual analytics filter to that admin. Panels refresh every minute while visible, on window focus, after completion and via Refresh. No email, push, external messages or scheduled service is required.

## Deployment and checks

Apply `supabase/migrations/039_shared_client_assignments.sql` after 038, then deploy the corresponding application changes together. The migration installs restricted service-role RPCs, membership/assignment-audit tables, completion attribution and current-month SQL aggregates. Existing `profiles.assigned_admin_id` remains a compatibility projection only. Avoid running old allocation code after applying the new application version; it does not write the membership table.

Do not revert this migration to the single-admin model after shared allocations have been saved without a separate data migration; doing so would lose the shared assignment model. No production migration or deployment was performed as part of the local implementation.

Verification:

- `node --test --test-isolation=none scripts/test-shared-client-assignments.cjs`
- `node --test --test-isolation=none scripts/test-admin-job-search.cjs`
- `node node_modules/typescript/bin/tsc --noEmit`
- Local browser fixtures exercise the actual allocation/target/queue components with mocked services: save multiple members, per-admin filtering, supervisor shares, refreshed progress and mobile layout.
