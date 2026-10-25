# Current handoff: UI corrections A–E after accepted 00/01

00/01 CLOSED and live v177 via #150, main `c23519bd1c473e602aa08e8753019de3537b9a6b`, main CI/deploy [40227044608](https://github.com/joke0071/foliolab-open/actions/runs/40227044608) ALL SUCCESS. Actual live: 104 exact asset hashes, active v177, 18 Axe scans, core create/edit, plain/encrypted fresh-profile restore and offline save/reload PASS; new multi-file/undo/replay/CAS at six widths PASS. Machine evidence: `docs/release-evidence/flh03-v177-live.json`. Final closure: #148 comment 6402346637. Historical pre-release notes below are superseded by this section.

User explicitly expanded implementation/merge/deploy authorization to A–E from #149, handoff #148 comment 6402194376. No restart or foreign branch edit. Current branch `feature/flh03-ui-a-e` starts at the accepted main above. Only these five UI fixes are in this increment; 02–16 stay outside release scope.

| Fix | Status / actual evidence | Next safe action |
|---|---|---|
| A Recovery/status | IMPLEMENTED locally: failed read never renders zero/onboarding/data lists; only safe rescue/restore and navigation reachable; global/mobile status follows saving/read failure/conflict. Existing storage/CAS/recovery engine unchanged. Chromium new seven-geometry full-axe/byte-preservation/original-download/controlled-restore PASS, existing marked/unmarked IDB recovery and stale-tab regressions PASS | Remote checkpoint then full combined engine gates |
| B Historical change tile | IMPLEMENTED: same `wealthView()` passed to chart/tile; exact difference from contiguous comparable proven samples, explicit inclusive cashflows/no return; partial/missing/gap values stay unknown. Unit + actual Chromium 999→1059/60 EUR and partial state pass | Full combined engine/release gate |
| C Expanded settings contrast | IMPLEMENTED: only `.source-detail .field small` and Drive footer use existing #4d6756. Seven visible nodes checked; all related nested disclosures expanded in full Chromium Axe at mobile/desktop/small heights pass | Full combined engine/release gate |
| D Dirty navigation | IMPLEMENTED: shared guard temporarily registers beforeunload for dirty open dialogs; no draft persistence/history trap. Actual Chromium denied reload retains provider/wizard/CSV preview; Back denied/accepted, clean/saved no warning, Escape/cancel/focus pass. First wizard test exposed listener-order microtask timing; fixed by syncing after dirty listeners in window bubble phase | Full combined engine/release gate |
| E Empty history | IMPLEMENTED: stable page description, one compact contextual missing-history message; existing add-asset or positions action, no zero curve, proven charts/periods preserved. Chromium empty/existing-unproven states + actions/geometry/Axe pass | Full combined engine/release gate |

A checkpoint: `3e7058f5aee085aa44fa418ed91b0764cf1f09c6`, PR #151. Local 671/671 unit tests and syntax pass. B–E are now implemented/tested locally; next remote checkpoint captures them. Next: run actual financial/storage/backup/offline and full three-engine CI, review, then merge only if green and perform actual v178 live acceptance. No new provider, migration, archival or deletion feature. Real hardware/OAuth remain outside supplied resources.

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

## Navigation boundary

The native beforeunload guard protects browser Reload/Back/document departure while an edited dialog is open and the browser honors a prior user gesture. It is removed on clean/closed/successfully saved flows; no new persisted draft, custom browser-history entry, unload telemetry or automatic secret saving. Native text is browser-owned. Mobile app-manager/process kill, browser suppression, unsupported embedded browsers and same-document navigation that does not unload cannot be guaranteed by this hook. FolioLab currently replaces its tab URL, not a new modal routing/history stack. Actual browser behavior is tested per engine below; no hardware claim. Reference checked 2026-10-25: https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeunload_event.

Final post-merge UI deployment/live evidence and exact next action are appended to #148/#151 (as with the completed v177 checkpoint). Do not repeat earlier packages based on historical pending notes.

## Combined gate findings and fixes

Initial combined PR run 40228423889 was correctly NOT merged: old smoke expected to enter a write form during recovery, which A now deliberately blocks. Smoke was updated to assert the stronger disabled-form/no-dialog/no-onboarding/status gate while retaining exact corrupted-byte preservation; no storage invariant assertion was removed. A separate key-privacy regression exposed the hidden dashboard placeholder remaining unknown when a valid empty portfolio starts directly on More. `syncPortfolioState()` now updates the known total only after a successful read, retaining unknown recovery values. Existing key-privacy/all-data deletion, PWA update and the entire new A–E Chromium suite passed again after that correction. Final-head CI must pass before merge.

The first Firefox combined run passed A/B/C but its automation `page.reload()` emitted no native warning despite the dirty-handler signal. The navigation test now invokes the actual document `location.reload()` / `history.back()` path and still requires a native dialog, rejected-navigation draft retention and explicit accepted navigation; no warning assertion is relaxed. Final engine results remain pending.

Separate failure-path review additionally covered an already-open modal when a later failed save/reload makes storage unavailable. Close/cancel and rescue must remain reachable; writers and inputs stay disabled. The central recovery gate now explicitly permits only those safe exit controls, and submit completion cannot re-enable Save in a failed-read state. A synthetic runtime-corrupt-record test retains exact bytes, closes the draft by explicit confirmation and reaches original export; this complements the startup recovery case.

Existing responsive-actions regression also retained the calendar even with no history. E now hides only unavailable period buttons, preserving the independent calendar/manual-control entry. The established date-selection assertions remain unchanged; the new empty-state test explicitly checks both hidden empty periods and retained calendar.

Firefox subsequently passed native Reload and denied Back but timed out loading the accepted Back target while all app requests were intercepted. The harness now blocks only external origins and leaves same-origin app/document requests unintercepted, avoiding the documented Playwright route/native-dialog stall (https://github.com/microsoft/playwright/issues/38731). Strict native dialog, retained-draft and exact accepted-navigation target assertions remain. Product navigation code is unchanged; final engine validation is still required.

Further isolated Firefox reproduction identified the exact Back-target fixture problem: the existing service worker serves the app shell for *all in-scope navigation requests*, including a direct manifest/SVG navigation. The supposedly preceding static document was therefore another app instance, whose URL the app rewrote. Back tests now use a user-interacted synthetic `about:blank` document outside the SW scope, retaining the exact accepted target assertion and every native warning/retained-draft assertion. No product service worker or history behavior is changed. External-only request blocking remains a test-isolation improvement, not a claimed product fix.

Final local Firefox A–E PASS, including actual native provider/wizard/CSV denied Reload, rejected Back preserving the draft, independently accepted Back to an exact preceding document, clean/saved no warning, recovery startup/runtime and full expanded-settings Axe. Firefox was launched locally with `MOZ_DISABLE_CONTENT_SANDBOX=1` solely for the isolated runner's browser process; app protections were unchanged. Back acceptance/rejection use independent fresh tabs because the runner's cancelled Gecko traversal cannot reliably be retried in the same history. The previous document is an interacted normal HTML document on an isolated origin/outside the app SW shell; the live harness uses the public origin root outside the `/foliolab-open/` scope. Every native warning, retained-draft and exact accepted-target assertion remains. Chromium is rerun on this final harness; final full CI/WebKit and live acceptance remain required.

Final B copy review labels both the first and last proven comparison dates (not an implied through-today interval). The independent 999→1059 test now explicitly asserts the full 2023-01-02–2023-01-03 interval; no amount or calculation changed. Final CI is rerun on that exact copy/source.

WebKit's first new expanded-settings pass found horizontal overflow at 320 px (A startup/restore passed). The scoped expanded-settings safety button rule now permits wrapping within its existing card; no global button/font/palette change. The geometry gate retains its strict zero-overflow assertion and now reports exact offending bounds if it fails. Final WebKit validation is required; do not merge based on Chromium/Firefox alone.
