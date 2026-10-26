# FLH03-08a — transient selection and read-only dependency preview

This is an independently tested foundation, **not the complete bulk-delete feature**. No new UI action, database write, schema, cascade, archive, persisted draft or selection is introduced. No apply/delete/commit API exists. The existing single-delete engine is unchanged. Production remains accepted v178 from #153; this follow-up has no merge/deployment approval.

## Contracts

`updatePositionSelection(model, ids, action)` returns a new stable-ID array. Toggle, clear and explicit full-filter selection are separate actions; all-position selection requires `confirmed: true`. Matching IDs must be the complete existing UI search/filter result **before** `slice(0, positionLimit)`, never rendered DOM checkboxes. Reuse `searchAndSortPositions` and the existing provider/account/quality filters during later UI integration; do not implement a parallel filter engine.

`positionSelectionSummary(model, ids, matchingIds)` keeps hidden selection stable, reports current/in-filter/hidden/stale counts, and never automatically selects new filter matches. Duplicate selected IDs are deduplicated; ambiguous model IDs fail closed. Stale selection is explicitly reported and cannot be used for a removal preview until refreshed or cleared.

`previewPositionRemoval(model, ids, limits)` is read-only. It reuses `assertPositionDeletable` for direct bookings, journals and DeFi links, then also walks persisted JSON-compatible data for external references. Snapshots (including byPosition keys), cash settlement fields, wallet sessions, documentary evidence, serialized provenance and unknown future links are not silently discarded. Enabled wallet discovery is blocked pending its ownership/reimport contract. References from another selected position are still blocked: selecting both does not consent to cascading a shared financial link.

Own position/opening/price-history impacts are listed, never applied. An `unreferenced` classification means only that this bounded scan found no external blocker; it is **not** a complete financial model validation or deletion clearance. Every result has `writeEnabled: false`. Malformed opaque JSON produces conservative review blockers; unsupported structures, cycles, stale IDs and incomplete required collections fail closed. Default limits are 200,000 walked nodes, 8 MB and depth 64; exceeding them returns no partial clearance. False-positive/opaque references require human review rather than automatic interpretation.

The model digest uses the existing source hash implementation and returns no raw model or keys. It detects later model changes, including an unselected quote; it is **not** an IndexedDB revision, authorization token or replacement for CAS. A later commit must validate the current model, recompute the exact impact, check storage freshness and obtain explicit consent under the existing atomic writer. No such commit is implemented here.

## Actual tests

15 independent unit scenarios cover same ISIN in two accounts; full search selection of 201 out of 401 model positions including unrendered matches; hidden/stale selections; explicit all intent; duplicate/invalid IDs; original guard reuse; retained snapshots/cash links; wallets/purchase evidence; serialized/future links; no inferred multi-selection cascade; cycles/limits; preview invalidation; frozen model immutability and secret exclusion.

`npm run check`, the complete **686-test** suite and targeted native Chromium/Firefox module tests pass locally. Browser checks preserve the exact IDB record and model, use a fresh offline realm to import the precached module/dependencies, and assert the same 201/401 membership and snapshot blocker. Synthetic setup disables background refresh before the no-write baseline. The first intercepted Firefox fixture did not obtain service-worker control; the final fixture uses ordinary unintercepted SW traffic, as the existing history-worker tests do. No controller/offline/data assertion was waived. The isolated local Firefox runner needs `MOZ_DISABLE_CONTENT_SANDBOX=1`; CI uses its normal environment.

First remote CI 40286348945 completed the Chromium/686-test job and the Firefox module/offline case successfully; WebKit reported an internal driver error on offline page.reload. The corrected native location.reload fixture adds a fresh-realm marker assertion, retains actual SW control/offline/IDB requirements and does not accept an unexecuted pass. Final corrected source 4e5f908, CI 40288031484, still FAILED cross-engine: Firefox fresh offline case passed; WebKit native offline reload timed out waiting 30 seconds for DOMContentLoaded at line 43. Its fresh-realm/import/final IDB checks and later cross-engine commands were not reached. Chromium/686-test and wallet jobs passed; deploy skipped. This does not establish browser/driver/product root cause. Preserve all strict assertions; next investigation must capture failure URL/request/controller/cache evidence and compare the existing accepted offline suite before another hypothesis-driven change. No follow-up merge or release.

All prior CI commands remain. The additional module test is added to Chromium and Firefox/WebKit; actual final CI outcomes are recorded in #148/the draft PR. This does not claim UI/keyboard/confirmation/physical-device or actual bulk-delete acceptance. Cache v179 is reserved only on this unmerged branch so the new module can be tested offline; production is v178.

## Exact remaining 08 stage

1. Integrate the full existing filtered query before pagination, accessible selection controls/counts and explicit hidden/stale state, using the established visual design.
2. Review complete financial impacts and field ownership. Keep unresolved/shared/snapshot/wallet/import cases blocked; do not loop current single deletes or silently cascade journals.
3. Build an accessible explicit confirmation plus one validated atomic safe-subset commit using existing CAS/backup/rollback. Revalidate both preview and storage revision; no partial removal.
4. Prove cancellation/Escape/focus, stale-tab/Quota rollback, financial/history invariants, encrypted/full restore, scanner/reimport behavior and all required browser/mobile/A11y cases.
5. Only after the entire intended subset is complete, obtain the user's separate productive release decision. Never treat the #153 A/B/C/E approval as approval for this package.
