# FLH02 work checkpoint

Specification: Library folder `FolioLab Open - Work-Auftraege`, exact FLH02 filename, version 11, read 2026-10-25. Do not use earlier copies. No other open PR found at initial audit.

## Repository identity

- Verified main: `fccbcc39fdc5bd8ff92e3475ac21df813e2a3473` (PWA v169).
- Work branch: `feature/flh02-position-value-foundation` (stacked on A branch `feature/flh02-bittr-wallet-evidence`).
- Current commit: this checkpoint's containing commit (resolve branch HEAD); foundation PR #144: https://github.com/joke0071/foliolab-open/pull/144; previous foundation commit `29cecbe7d89897c9f58c4d47e563ae911a099d4e`; Draft PR #143: https://github.com/joke0071/foliolab-open/pull/143. First remote commit `cb7457371e2fab36d6d85c721bae2e4ebce7320f`.
- A merged via PR #143 after all PR CI gates succeeded (run 40213142311). Merge main SHA `8e12ae1ad1a0b517eab3404a2dacbe9b31ab61db`. Productive main CI/deployment 40213713241 succeeded. PWA v171 live acceptance passed: 100 exact asset hashes, 18 axe scans, UI backups/restore and offline; dedicated live purchase-evidence E2E passed too. v173 in this foundation branch is a candidate only; A uses v171.

## Package status

| Package | Status |
|---|---|
| A | IN PROGRESS: strict local allowlist Bittr adapter, exact satoshi/fee validation, stable receipt fingerprints, additive canonical provenance, confirmed own-output group matching, explicit manual selection and undo, reorg revalidation, wallet dialog preview implemented. A-only 639 tests, full Chromium suite, Firefox/WebKit CI all passed; PR #143 merged. Production v171 independently accepted. |
| B | IN PROGRESS: pure historical quantity/price/FX projection and conservative capability helper, raw-close CSV guard, EUR default in booking-history dialog with value/price/quantity/transaction views, explicit existing API load, dated opening restore. Chromium E2E + existing FLH01 regression pass. Shared chart now supports disjoint path segments; valid journal-based position cards use the same internal EUR value projection. Not complete: wallet integration, full range controls, persistent cache retention/provider capability integration, FX fetching and complete corporate-action coverage. |
| C1 | IN PROGRESS: conservative journal/cash aggregation and independent snapshot reconciliation pure functions. No UI connection. No wallet/staking, interest projection or historical identity recovery yet; these deliberately produce missing coverage, not totals. |
| C2 | NOT STARTED |
| C3 | NOT STARTED |
| D | NOT STARTED |
| E | NOT STARTED (including 7.14 optional connections consolidation) |
| Google Drive | NOT STARTED |

## Evidence and limitations

- `npm run check` passed after initial core implementation; rerun after UI integration.
- Six synthetic purchase-evidence unit cases passed: exact amount invariants, 1:N/N:1/N:M, duplicate/reused txids, proposal/ambiguity, confirmation/undo/reorg, no mutation, encrypted/ordinary backup roundtrip and invalid input.
- Private Bittr parser totals checked locally against the specification; raw CSV, private quantities/sums, identifiers and fixtures are NOT committed. Private wallet text read: it contains no TxIDs/output identities and only an initially rendered subset. Exact real-world matching cannot be verified from that text; do not fabricate match counts. This does not block synthetic/core validation.
- Full npm suite passed: 650/650 (latest foundation suite; A-only was 639/639). New Chromium E2E passed: preview/confirm/undo/reload, IDB, encrypted full restore, six widths, axe, private-field/XSS exclusion and multitab CAS. Firefox/WebKit local execution is not yet verified (system dependencies unavailable; package install failed). CI must verify both engines. Browser tests are wired into both existing CI jobs. Foundation CI 40213758581 failed at UI07 because it implicitly assumed the former transaction default; the audit now explicitly verifies the new EUR default, then selects Transactions before testing metadata. This retains all metadata assertions. Corrected Chromium UI07 actually rerun: 66 scans, 0 findings, six widths, keyboard/focus, reduced motion and 200% CSS zoom passed. Full replacement CI remains required. A PR CI 40213142311: test job (including Chromium suite) succeeded; cross-engine job succeeded too. Full A PR workflow succeeded. Main release workflow 40213713241 succeeded; release and live evidence are in docs/FLH02_A_RELEASE_AND_LIVE_ACCEPTANCE.md.
- Additive `purchaseEvidence` is validated by safeImport and kept by existing backup model. No journal, position, snapshot or performance writes. Existing storage/CAS used via wallet dialog commit.
- Conservative matching requires verified stored Bitcoin incoming vout events; unknown opening/partial scans do not become verified acquisitions. Group UI currently offers at most 1000 incoming outputs for manual selection. Exact duplicate normalized receipts cannot establish separate identical purchases without a distinct external identity.
- Git HTTPS push lacks shell credentials; authenticated GitHub connector is used for remote tree/commit/ref checkpoints.

## Next safe actions

1. Verify A PR #143 CI on head `a0d0257175339daa83003681014e400182d149e2`. Finish A browser tests (preview/confirmation/undo/reload, revision conflicts, IDB/full encrypted restore, 320/390/430/768/1024/1440 and Chromium/Firefox/WebKit); strengthen any uncovered invariants. Verify private wallet reference locally without publishing raw data.
2. On this foundation branch, finish B and C1 gaps listed above, including source/FX/calendar identity and shared wallet projections. Then C2/C3, D/E/Drive. Separate stacked PR must remain draft until complete; do not merge incomplete B/C UI as final FLH02.
3. Final all-engine regression, main CI, Pages deployment and real live acceptance. No final release is claimed by this checkpoint.

## Exact resumption instruction

> Continue FolioLab Open FLH02 from `docs/FLH02_WORK_CHECKPOINT.md` on branch `feature/flh02-position-value-foundation` and its stacked PR. Read the current Library specification version 11, inspect current main and open PRs, preserve existing work, and verify A PR #143 gates first, check replacement PR #144 CI (UI07 mode change fixed), then finish the documented B/C1 gaps. Do not repeat FLH01/IndexedDB Phase B; B/C1 are partial and C2/C3/D/E/Drive remain open. Use synthetic repository tests only; private reference data stays local. Checkpoint each safe increment remotely. Merge and deploy only fully tested conflict-free changes under the existing explicit user authorization, then verify the actual Pages version/service worker and live E2E.
