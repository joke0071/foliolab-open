# FLH03 A/B/C/E release split — D remains blocked in PR #151

**Authority:** the user's explicit 2026-10-26 split instruction authorizes a separate independently verified A/B/C/E release, with D kept open and its complete tests/diagnosis preserved in #151. Earlier statements that all progress must await #151 are superseded only by this explicit scope split. Existing merge/deployment authorization for completed A–E covers this completed subset after all applicable gates pass. No 02–17 follow-up merge/deployment approval is inferred.

Base/current main: `c23519bd1c473e602aa08e8753019de3537b9a6b`, accepted v177 / FLH03-00/01. Fresh branch **feature/flh03-ui-abce-release** was created from that main. The original #151 branch remains untouched at `6611a425d7868050ef4227443fd07b964eae9a7e`; it remains draft and D remains FAILED/BLOCKED. Its strict tests, Linux/macOS diagnostics, cases, commits and full checkpoint are retained there, not rewritten or marked green. There was no competing open UI PR at the split.

## Exact release contract and dependency review

| Scope | Included change | Evidence / remaining gate |
|---|---|---|
| A | Unknown/read failure never displayed as valid zero/onboarding, safe writer gating, truthful desktop/mobile save/conflict state, safe original export and controlled restore | Original A byte-preservation/restore and runtime failure cases reused; multi-tab status assertions added; full final CI/live required |
| B | Existing FLH02 wealth projection drives change tile, exact comparable dates and decimal difference, partial/gap unknown, includes cashflows and explicitly no return claim | Three pure reference tests including 999→1059 / 60 EUR; browser reconstructed/partial cases; full CI/live |
| C | Seven reported expanded settings helper colors use existing dark secondary tone; established bounded native-select style for 320px WebKit | Expanded Axe plus actual geometry in every engine; no global palette/typography change |
| E | Single contextual compact empty history, existing add/positions actions, independent calendar retained, no fabricated curve | Valid-empty and missing-evidence states, full Axe and small heights in every engine |
| D | **EXCLUDED; still blocked in #151**. No new native beforeunload guard, navigation listener/history stack or persisted draft | `src/dialog-discard.js` and `src/asset-wizard.js` exactly equal accepted main; original D failures remain meaningful and unchanged on #151 |

`src/app.js` delta was reviewed hunk by hunk: save/render/status and recovery controls are A, existing wealth input is B, history empty state/actions are E; none adds native unload/back behavior. Both `go()` and `initNav()` functions are byte-identical to v177. Eight critical modules (dialog guard, wizard, model, atomic/browser storage, generic import, transactions, complete backup) independently compared byte-for-byte to v177. Finance/storage/CAS algorithms and schema are unchanged. Scope hashes are recorded in release evidence. SW cache advances to **v178** for these actual shipped assets; this is not the unmerged D release. Future D integration must rebase and choose a fresh cache revision after v178.

No current-main gate is removed: workflow change only **adds** `browser-flh03-abce.mjs` to Chromium and Firefox/WebKit. D diagnostic files/workflows exist only on #151, not on main, and are not imported into this scope. This is an explicitly different release contract, not a claim that D passed. Existing local dirty Escape/cancel/confirmation/focus is preserved; dirty native Reload/Back remains the known v177 limitation and is not advertised as fixed. New independent tests exercise provider/wizard/CSV local rejected discard with zero writes and saved clean Reload/Back/Forward with exact retained IndexedDB bytes. Their synthetic preceding document is fulfilled outside production SW scope, so root-domain live tests cannot accidentally target the app as their predecessor.

Local syntax and **671/671 unit tests PASS**. Full targeted Chromium A/B/C/E plus independent local-discard/saved-native-navigation suite PASS. An initial test fixture lacked a manual position after recovery and correctly could not open CSV import; the test now explicitly reinstates the same valid B fixture before CSV assertions, without changing product behavior or dropping the check. Firefox/WebKit and full regression CI are not yet claimed. Hardware/native Safari/Android keyboards/AT and real OAuth remain unavailable and separate.

## Package states 00–17 and next step

| Package | Current state / next evidence |
|---|---|
| 00/01 | DONE/live v177 via #150; do not repeat |
| 02 | OPEN / format gate: no explicitly approved anonymized regional TR original export supplied; candidate headers are not sufficient proof |
| 03 | OPEN; concrete Kraken cross-file dialect/reference evidence required |
| 04 | BLOCKED on confirmed Bitpanda CSV header; no supported-adapter claim |
| 05 | PARTIAL existing flatex Beta; AT depot/cash/fees/tax/FX original reconciliation #127 |
| 06 | BLOCKED optional browser-CORS/read-only/secret gates; no Worker workaround |
| 07 | PARTIAL existing FLH02 projection reused; provider inputs/account reconciliation pending |
| 08 | OPEN, independent safe next candidate if provider evidence is absent; selection/impact and atomic safe subset, no unsafe linked-data cascade |
| 09 | OPEN P-Chain ownership/stake/transfer evidence |
| 10 | PARTIAL Sonic delegation exists, withdrawal event proof missing |
| 11 | OPEN/evidence-gated optional price providers, preserve existing sources |
| 12 | BLOCKED original corporate/AT/OeKB evidence + independent financial validation |
| 13 | PARTIAL synthetic IDB/full restore passes; real Drive/device #44 still external |
| 14 | OPEN archive/model/import/valuation compatibility |
| 15 | Existing icon/full-backup/history deltas DONE; archive portion awaits 14 |
| 16 | PARTIAL existing quality/coverage; account completeness summary open |
| 17 | A/B/C/E isolated for this release; D remains BLOCKED in #151; other UI17 items remain #149 |

**Remote checkpoint:** PR #153, initial source f412804e35770a5940f81d54f42ee07947239df3; CI 40281290677 completed test/Chromium SUCCESS, cross-engine FAILURE, deploy SKIPPED; wallet 40281290681 SUCCESS. Firefox A/B/C/E and runtime recovery passed, then the new synthetic predecessor navigation helper chose the desktop selector before the asynchronously initialized mobile app was ready. The test now waits for actual IndexedDB-ready status and built mobile navigation after entry; every warning/local-discard/persistence/target assertion is unchanged. Product code is unchanged; this is a startup-order fixture correction, not a waived gate. Both new main status assertions in the existing multi-tab suite passed locally.

A further isolated saved-navigation probe measured Firefox history length increasing 3→4 across the automation Reload. Combining Reload and one Back in the same history therefore targeted another app entry, not the intended predecessor. Reload and Back/Forward are now independent fresh-history cases: Reload still requires exact saved record and no warning; the fresh Back history still requires the exact independent preceding URL, Forward and exact saved record, plus no unexpected warning. Actual document history.back()/forward() is used, with no product history changes, loops or skipped entries. Full corrected targeted Firefox suite PASS locally (isolated runner requires MOZ_DISABLE_CONTENT_SANDBOX=1; CI uses its normal browser environment). The first local draft test needs a real manual-position fixture for CSV, as noted above. All assertions remain; only invalid setup/order assumptions were corrected. Source a7689ef's workflow 40282307242 was started after the readiness fix; its outcome is not inferred. Product code and all eight critical baseline hashes are unchanged.

**Next safe action:** inspect new A/B/C/E PR full final-head CI. Only green scope gates plus independent isolation review permit merge and actual v178 deployment/live acceptance on https://foliolab.unperfekt.at/ . Check exact published asset hashes/SW/core, synthetic A/B/C/E and batch/undo/CAS; document real results. Then evaluate 02's original-format gate and implement the next evidence-independent safe package in a separate PR, without productive approval for that follow-up. Do not rerun identical D diagnostics. Keep #151 as blocked reference and record source/PR/CI/live IDs here as they become available.

---

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
