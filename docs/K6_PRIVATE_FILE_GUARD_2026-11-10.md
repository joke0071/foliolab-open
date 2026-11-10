# K6-TRUST: prevent accidental addition of local exports and backups

Baseline: main a21db8a92f488820114f3b86fc3d5a4ad96be1b2, tree c6afbfe49152cbc29fa2722bf6bc3b16b01ad062, v304 LIVE_ACCEPTED. Owner 74f8b54eb065, 10 November 2026.

The existing .gitignore only covers dependencies, environment files, logs and selected keys. A real git check-ignore reproduction confirms ordinary account.csv, backup.json, nested/a.tar.xz and private/data.json are eligible for accidental addition. This is a missing preventive guard, not evidence of a disclosure.

The bounded change ignores common CSV/TSV/spreadsheet exports, archive and database payloads, backup-named JSON/encrypted JSON, and private/backups/exports/originals directories. Exactly the two existing reviewed synthetic CSV fixtures and existing synthetic performance gzip are exempted by rooted paths. New fixtures require explicit review; no directory-wide exception.

Validation uses an isolated temporary Git repository with the exact candidate .gitignore and all 1089 blob paths from the frozen GitHub main tree. Actual git check-ignore --no-index --stdin: 30 protected paths ignored, nine representative legitimate paths allowed, zero current main paths newly ignored. Baseline negative control exposes 26 of the protected paths, including all four named reproductions. No private source file was used.

This is a repository hygiene measure. Ignore rules do not untrack existing files, remove history, inspect content, prevent forced additions, or cover every possible filename/capitalization. Keep private originals outside the checkout and inspect staged changes. No automatic historical privacy clearance is claimed.

Only .gitignore and this document change. No runtime asset, financial value, schema, restore policy, source provider, workflow, CI gate or service-worker cache revision changes. Existing product/finance/UNKNOWN-FX evidence is reusable for unchanged blobs. Mandatory candidate/integration/release gates remain binding; the candidate is not integrated or released merely because local path validation passes. No new private original class or backup payload is produced by this local check.
