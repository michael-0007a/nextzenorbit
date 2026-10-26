# Beta: work not yet on main

As of 2026-10-26 `beta` matches `main` (`b9b0678`, the beta merge), so nothing here is beta-only. Production docs are in [`../main/`](../main/).

When new work lands on `beta` before main:

1. Describe it here, one file per feature, and say which commits and migrations it needs.
2. Note any migration that is applied to the shared database before main uses it. Both branches use one Supabase project.
3. When beta merges, fold these notes into the matching `docs/main/` files and the CHANGELOG, then empty this folder again (keep this README).
