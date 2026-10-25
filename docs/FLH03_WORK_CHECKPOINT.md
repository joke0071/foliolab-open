# FLH03 work checkpoint — 00/01

## Authority and start gate

User specification: Library `FLH03_Broker_Exchange_Import_Historien_Rekonstruktion_2026-10-25.md`, Version 4 / Library revision 3 (63,276 bytes); read current contents, including 00–17. Issue #148 tracks FLH03. The user's subsequent explicit instruction authorizes controlled merge/deploy of **completed 00/01 only**, after CI/regression/review gates. Earlier no-merge language is superseded for this increment; 02–17 remain outside this release.

- Starting `main`: `b51304ae9d6a2904308bb5b4123d232617d5f76b`.
- Original workflow [40217903807](https://github.com/joke0071/foliolab-open/actions/runs/40217903807): cancelled, not a passing test claim.
- #145 merged `eb737df8979c7708d678de8045bd2b48db9e8e2f`; followed by #146 FX correction and #147 final closure. Latest main [40222166104](https://github.com/joke0071/foliolab-open/actions/runs/40222166104): test/cross-engine/deploy all success.
- FLH02 final live report: `docs/FLH02_FINAL_RELEASE_AND_LIVE_ACCEPTANCE.md`, machine evidence in `docs/release-evidence/flh02-v176-*`. Direct fresh production GET confirmed service worker v176. FLH02 closed, no reimplementation.
- No open PR or FLH03 issue/branch at initial inspection. All existing audit branches preserved. This branch limits shared-file edits to CSV import/event wiring, one hidden undo action, SW assets and exact CI entries. No styles, layout or audit fixes changed.

## Delta audit against starting main

| Package | Existing verified code / delta | Status and next safe action |
|---|---|---|
| 00 | Existing financial/storage/backup/FLH02 modules inspected, gate passed; provider matrix, checkpoint and purely synthetic fixtures added | Implemented; finish feature PR checks and release evidence below |
| 01 | `csv-import.js` already has pure preview, stable account/source IDs, owned snapshots, duplicate/manual correction protection, atomic `importCSV`, journal reconciliation and stale baseline. flatex already has multi-file parsing and reference-based settlement review; `transactions.js` has transfer matching | Implemented generic delta: multi-document chronological preview with preserved original file identities; duplicate/new/conflict/unresolved counts, exact position/cash impacts and honest event-date range, review/skip, revision-protected session undo; existing save/CAS/restore. Release gates below |
| 02 | No native Trade Republic adapter | OPEN; actual sanitized regional format/economic-event proof required. No unsupported option enabled |
| 03 | No native Kraken Trades/Ledgers/Balances adapter | OPEN; official export semantics evidenced in matrix; next provider implementation only after header/ID gate |
| 04 | No Bitpanda native CSV/new API | BLOCKED for productive adapter on missing real header/CORS/rights evidence; safe local adapter planning possible |
| 05 | Existing flatex Beta, settlement/cash audit and reconciled backfill reused; no duplicated engine | PARTIAL; complete regional cash/fees/taxes proof under #127 before new automatic cash postings |
| 06 | No Bitpanda/Kraken authenticated browser integration | BLOCKED pending real origin CORS, read-only permissions, secret/nonce/rights tests. No new Worker |
| 07 | FLH02 historical-position/portfolio-value, retained raw prices/FX, booking/wallet-history UI implemented | PARTIAL; reuse projection for later provider events; no complete history claim from CSV event ranges |
| 08 | `portfolio-edit-actions.js` safe single deletion rejects journal/booking references; no selection/bulk delete | OPEN; impact preview + stable model-ID selection + atomic safe bulk subset first; no delete feature released here |
| 09 | `staking-catalog.js` explicitly says P-Chain native staking not covered; C-Chain/sAVAX present | OPEN; official public ownership/address/stake/transfer evidence before implementation |
| 10 | `staking-discovery.js` has Sonic SFC delegation, explicitly no pending withdrawal discovery | PARTIAL; official event/request proof required for unbonding/withdrawals, no doubled S/stS |
| 11 | Existing CoinGecko/fallback/security price transports; no Yahoo/RapidAPI or CMC new adapter | OPEN/evidence-gated; preserve FMP/Twelve until proven replacement, no new provider enabled |
| 12 | #52 rejects unsupported mixed cash-in-lieu; existing annual booked-income overview and AT03-B transfer matcher | BLOCKED for tax/corporate-action automation without approved broker/OeKB evidence and independent financial validation; #52/#127/#129 canonical |
| 13 | Existing IndexedDB-only/CAS/crash/recovery/plain/encrypted complete-backup tests | PARTIAL; real Drive account, physical Android/TalkBack/Safari/eviction/large archives not supplied; #44 remains open |
| 14 | No archive flag or archive workflow in current model | OPEN; preserve valuation/journal/import identity when designing archival |
| 15 | `position-icons.js` + `position-icons.test.mjs` already distinguish classes and fixed cash; `complete-backup.js` supports encrypted settings opt-in and credential-free plain export; FLH02 FX/history entry fixed | Existing icon/backup/history deltas DONE at baseline; no duplicate implementation; archive data compatibility awaits 14 |
| 16 | Existing position-quality/valuation/coverage and reconciliation projections, no unified actionable per-account completeness summary | PARTIAL; derive summary read-only after provider groundwork; no artificial percent completeness |
| 17 | User screenshot-based recovery concern and full UX audit remain separate; code has loadFailure/blank-model fallback | OPEN / separate UI audit; do not claim reproduced corruption or hide warning. No broad UX work in this increment; coordinate before touching those paths |

## 00/01 financial and implementation contract

- `prepareCSVBatch` handles **already mapped generic booking documents**, not native TR/Kraken/Bitpanda formats. Same header set, original per-file provenance, same original source identity when a single file later appears within another batch, 20-file/5,000-row/2-MB-per-file bounds.
- Preview sorts events globally via existing transaction engine, not file-selection order. Same scoped source ID and unchanged payload is duplicate; same ID with changed payload or manual edits blocks. Identical independent explicit IDs survive. Equal no-ID rows in the same original file survive; equal rows in other documents require explicit review. Split/aggregate variants cannot auto-match by amount/date; conflicting reference data stays blocked. Existing flatex N:M settlement review remains read-only and unchanged. Provider-specific economic pairing is 02–05, not a fabricated universal matcher.
- Common preview shows new/already present/conflict/unresolved/skipped, exact per-position and cash quantity impacts, account, event-date range and missing opening/price/FX coverage caveat. No current-price backfill or fake total/performance. Only confirmed new events commit, never replace-all.
- One canonical save after `importCSV`/snapshot; existing revisioned IndexedDB CAS and rollback-on-save-error retained. No schema change, migration, second data store, network/API import or secret persistence.
- Undo is an in-memory receipt valid only while the entire post-import model is unchanged. Explicit confirmation/cancel; `assertCurrent()` before one regular CAS save. Includes the import's generated snapshot and restores exact baseline. Reload/later edits invalidate undo; regular existing backups remain the recovery route. No persistent shadow copy or unsafe per-booking cascade.
- Async file selection guarded by selection generation and dialog identity; late reads cannot restore an obsolete selection into another dialog.

## Actual verification so far

- Baseline regression after implementation: `npm test` **668/668 pass**, including ten new independent-reference batch tests. `npm run check` passed again with the final event identity guard.
- New Chromium browser test: actual fresh IndexedDB initialization, 3 events + 1 overlap, exact `90.123456789012345678`, pure preview, one revision commit, undo cancellation, exact undo including snapshot, reimport/reload and competing CAS (one winner); all six widths and full axe including contrast passed; existing palette unchanged.
- First local browser launch used incompatible preinstalled Playwright; installed CI-pinned 1.56.1. First server attempt was unavailable across tool sessions; corrected with server/test in same shell. First axe injection hit CSP; corrected by evaluating test code through automation without changing app CSP. These were test setup failures, not waived gates.
- Existing Chromium CSV review/focus, p0 import quota/abort/CAS/restore, flatex custody/atomic replay/backfill, concurrent backup import, settings backup and PWA update regressions passed. Ten new unit tests include independent 999/1058 EUR FLH02 projection reference values and encrypted full-backup identity/secret-opt-in restore. A new test initially omitted required empty Drive preferences; the fixture was corrected without application changes.
- Local Firefox launch did not complete in this environment; no local Firefox/WebKit pass claimed. The dedicated Firefox/WebKit PR CI is the engine gate. PR [#150](https://github.com/joke0071/foliolab-open/pull/150), initial head `99c26e1d0879068323ca09924db4709f24efca76`, [CI 40226240637](https://github.com/joke0071/foliolab-open/actions/runs/40226240637). Final-head CI/review/merge/deployment and live checks still pending. No release success inferred.

## Resume / exact next safe action

Read this checkpoint, #148, this feature PR and latest remote HEAD/CI; check current main/open PRs before changing shared files. Finish new Firefox/WebKit and existing CSV/flatex/storage/backup/PWA/financial regressions, review boundary/failure paths separately, push evidence. Merge only after all required checks pass on current main and review is clear. Then verify deployment and actual live v177 imports/undo/core app. Record exact commits/runs/results in the final PR/issue checkpoint. Continue 02 with evidence gates only after 00/01 release acceptance; do not restart FLH02 or touch 08–17 in this run.


## Release evidence handoff

Final exact tested/merged main, CI/deployment URLs, live version/hash/core-function results and next stage are appended to canonical issue #148 and the release PR #150 after actual execution. Those post-release records supersede the pre-release pending status above; consult them before resuming. This avoids a self-referential documentation-only release loop.
