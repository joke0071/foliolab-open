# P0 / WP01: Release gates

Baseline: `ffec7c8dbb1ddbdb72303dbbb248ea77098d928b`, 2026-10-24.
`npm test`: 430 passed, 0 failed. This is the pre-change baseline, not evidence for future commits.

| Risk | Existing evidence / mandatory gate | Gap / action |
|---|---|---|
| Financial corruption | financial-precision, ledger-reference-arithmetic, ledger-multistep-fx-corporate, transactions, performance-integration, capital-flows | WP02: ambiguous XIRR and unknown input audit |
| Import duplicates / edits | phase3-csv-wallet-defi, flatex-*, browser-flatex-import/backfill, browser-csv-review-a11y | WP04/05: source identity and cross-file conflicts |
| Lost data / migrations | portfolio-storage, accounts-migration, backup-references, model, encrypted-backup; browser-atomic-storage, idb-*, multitab-integrity, corrupt-backup-restore | WP03: fail-closed record validation and concurrency audit |
| Provider / wallet regressions | market, wallet-*, blockchain-adapters, staking-*, worker tests; browser provider tests | Run whole Node suite for every P0 PR |
| UI / accessibility | browser smoke 320–1440, dialog/a11y suites, pixel references | Required Chromium CI |
| PWA / secrets | security-privacy, privacy-dataflow, service-worker; browser-key-privacy, offline-mobile, pwa-updates | Required Chromium CI + cache revision gate |
| Browser storage semantics | browser-cross-engine and browser-atomic-storage-cross-engine | Required Firefox and WebKit CI |

## Commands and evidence

Run `npm test` and `npm run check` for every PR. Install pinned tools as in `.github/workflows/import.yml`, serve on `127.0.0.1:4173`, then execute the workflow browser scripts. The full test and cross-engine jobs are mandatory for finance, import and storage PRs; targeted local runs do not replace them. The workflow is the canonical command list. No new test framework. Existing v1/v2/v3 restore fixtures remain mandatory.

CI checks out the same event SHA in both jobs. Logs include tested SHA; artifacts retain Node results, and existing dialog artifacts remain retained on failure. A PR tests its synthetic merge SHA: record both PR head and tested merge SHA. Re-run after integration or base changes. Stacked `p0/**` PR bases now trigger the same gates. Deploy requires both jobs and main; PRs never deploy. Deploy permissions are limited to the deploy job.

Observed main is unprotected (`protected=false`): workflow gates prevent workflow deployment on test failure, but cannot prevent an administrator merging a failing PR. Repository rules must require test and cross-engine checks operationally. No protection change is claimed. No merge/deploy is authorized by this work order.

## Manual gate

Android real-device installation, TalkBack, low-storage behavior and OS process termination remain manual; browser emulation is not a device test. Use `DIALOG_AUDIT_ANDROID_TALKBACK_CHECKLIST.md` and `INDEXEDDB_STAGED_MIGRATION_2026-10-23.md`. Do not label these complete without device evidence.

Local browser installation initially failed: apt cannot change user/group in this runtime; Chromium CDN returned an invalid archive. CI results must supply missing browser evidence if local installation stays unavailable.
