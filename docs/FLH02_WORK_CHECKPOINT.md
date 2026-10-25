# FLH02 work checkpoint

Specification: Library folder `FolioLab Open - Work-Auftraege`, exact FLH02 filename, version 11, read 2026-10-25. Do not use earlier copies. No other open PR found at initial audit.

## Repository identity

- Verified main: `fccbcc39fdc5bd8ff92e3475ac21df813e2a3473` (PWA v169).
- Work branch: `feature/flh02-bittr-wallet-evidence`.
- Current commit: this checkpoint's containing commit (resolve branch HEAD); Draft PR #143: https://github.com/joke0071/foliolab-open/pull/143. First remote commit `cb7457371e2fab36d6d85c721bae2e4ebce7320f`.
- No merge or productive deployment performed. v170 in this branch is a candidate only.

## Package status

| Package | Status |
|---|---|
| A | IN PROGRESS: strict local allowlist Bittr adapter, exact satoshi/fee validation, stable receipt fingerprints, additive canonical provenance, confirmed own-output group matching, explicit manual selection and undo, reorg revalidation, wallet dialog preview implemented. Core tests pass; browser/CI gates pending. |
| B | NOT STARTED |
| C1 | NOT STARTED |
| C2 | NOT STARTED |
| C3 | NOT STARTED |
| D | NOT STARTED |
| E | NOT STARTED (including 7.14 optional connections consolidation) |
| Google Drive | NOT STARTED |

## Evidence and limitations

- `npm run check` passed after initial core implementation; rerun after UI integration.
- Six synthetic purchase-evidence unit cases passed: exact amount invariants, 1:N/N:1/N:M, duplicate/reused txids, proposal/ambiguity, confirmation/undo/reorg, no mutation, encrypted/ordinary backup roundtrip and invalid input.
- Private Bittr parser totals checked locally against the specification; raw CSV, private quantities/sums, identifiers and fixtures are NOT committed. Wallet reference matching not yet verified.
- Full npm suite passed: 639/639. New Chromium E2E passed: preview/confirm/undo/reload, IDB, encrypted full restore, six widths, axe, private-field/XSS exclusion and multitab CAS. Firefox/WebKit local execution is not yet verified (system dependencies unavailable; package install failed). CI must verify both engines. Browser test is wired into both existing CI jobs. Initial PR workflow 40212788892 in progress at last check.
- Additive `purchaseEvidence` is validated by safeImport and kept by existing backup model. No journal, position, snapshot or performance writes. Existing storage/CAS used via wallet dialog commit.
- Conservative matching requires verified stored Bitcoin incoming vout events; unknown opening/partial scans do not become verified acquisitions. Group UI currently offers at most 1000 incoming outputs for manual selection. Exact duplicate normalized receipts cannot establish separate identical purchases without a distinct external identity.
- Git HTTPS push lacks shell credentials; authenticated GitHub connector is used for remote tree/commit/ref checkpoints.

## Next safe actions

1. Finish A browser tests (preview/confirmation/undo/reload, revision conflicts, IDB/full encrypted restore, 320/390/430/768/1024/1440 and Chromium/Firefox/WebKit); strengthen any uncovered invariants. Verify private wallet reference locally without publishing raw data.
2. Finish A CI; integrate only after appropriate gates. Implement B using existing historical quote/chart components, then C1/C2/C3, D/E/Drive in specified sequence, with small remote checkpoints.
3. Final all-engine regression, main CI, Pages deployment and real live acceptance. No final release is claimed by this checkpoint.

## Exact resumption instruction

> Continue FolioLab Open FLH02 from `docs/FLH02_WORK_CHECKPOINT.md` on branch `feature/flh02-bittr-wallet-evidence`. Read the current Library specification version 11, inspect current main and open PRs, preserve existing work, and begin with the first incomplete A test/invariant. Do not repeat FLH01/IndexedDB Phase B or claim B/C/D/E/Drive complete. Use synthetic repository tests only; private reference data stays local. Checkpoint each safe increment remotely. Merge and deploy only fully tested conflict-free changes under the existing explicit user authorization, then verify the actual Pages version/service worker and live E2E.
