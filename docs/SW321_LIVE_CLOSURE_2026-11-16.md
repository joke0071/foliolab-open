# SW321 release closure · 16 November 2026

Owner: `hnd01-sw321-reload-20261116-4672ea147672-root`. Main: `e272297ab1ba855a2922c1faa4010b83c558a796`, tree `c787469e711f7303842a471bed2ff37a780f0059`.

## Original failed job and diagnosis

[Main run43929597892](https://github.com/joke0071/foliolab-open/actions/runs/43929597892), job133532895493, remains **FAILURE**. It is not relabeled and was not rerun. [Original ZIP14259683307](https://github.com/joke0071/foliolab-open/actions/runs/43929597892/artifacts/14259683307):10920751bytes, SHA256 `ebfe10a78f85cf9bf2b4e7c6955ed0460e9df3801f69676e98fde00238456eac`; CRC PASS.

The failing fixture is **old-known-other-fx-saved**, the seventh of eight FX-age cases. The first six passed their original complete refresh/reopen assertions. In case7, SEEDED and REFRESHED were recorded; all subsequent pre-reload assertions completed: rejected USD position unchanged in every field, GBP rate saved at1.1, GBP completion recorded while USD remained incomplete, failure/backoff state preserved, journal and externalCashFlows unchanged. RESULT was never recorded because line78 waited for IndexedDB readiness after reload.

Original context6 diagnostics show document `/?page=positions`, CSS and app.js HTTP200 followed by **71 same-origin module HTTP429** responses, each HTML from Varnish with Retry-After0 and ERR_ABORTED request failure. The first is format.js. The blocked module graph explains why app readiness was not reached. The status supports rate limiting, but its exact upstream trigger, duration and frequency are not established. No generic product startup defect is inferred.

ServiceWorkers were explicitly blocked; registration/version arrays were empty, document controllers and active/installing/waiting workers null. This is not a service-worker reload failure. Original page errors were collected only in the FX test's in-memory array; the failure bypassed result persistence, and the diagnostic preload did not subscribe to pageerror or console. Absence of original page errors is **not** claimed.

Earlier artifact14234782956 recorded a503 on valuation-status.js;14237998679 recorded a503 on dialog-discard.js. These support the broader module-delivery failure class but differ in status and extent. Earlier market-fixture429 responses were mocked provider APIs, not same-origin module failures. Equal timeouts alone were not used to equate causes. Original comparison logs are included.

## Targeted closure

Two synthetic actual-origin Chromium cases ran using the original Playwright1.56.1 pin: old-known-other-fx-saved and old-unknown-other-fx-saved. All original assertions were retained. A temporary diagnostic copy selected these two cases, logged full native records and refresh state before/after reopening, and configured the environment's inherited proxy/certificate exception. No application response was substituted; only the original Frankfurter fixture responses were mocked.

Both cases **PASS**. App readiness follows reload; full native IndexedDB records compare exactly, including raw/revision/settings and all stored metadata; complete auto-refresh state compares exactly. Known rejected USD is unchanged, rejected UNKNOWN stays null/UNKNOWN, accepted GBP is1.1. No page errors; expected USD/GBP request set. **856 responses, all HTTP200, zero request failures.** The original CDP diagnostic preload affects timing; no universal timing or TLS certificate-chain validation claim is made. Earlier local launch attempts lacking proxy/proxy CA failed before testing app behavior and remain preserved as transport setup failures.

No product or tracked test correction is required; no new merge decision is needed.

## Acceptance assignment

| Criterion | Evidence / result |
| --- | --- |
| Approved PR347 / exact main | merged approved headda9b6455; maine272297a/treec787469e |
| Unit/integration |1505/1505,0fail/cancel/skip; all3cross-engine jobs SUCCESS |
| Deployment | job133532720270 SUCCESS |
| New-main published identity/core | original live/report.json PASS,155exact asset hashes,6groups/18Axe scans |
| Product equivalence |154product paths byte-identical to29f2a1c8; rechecked against source and original published hashes |
| Live coverage |55unique retained assignments:54unchanged originals +1CSS-anchored WebKit measurement; all9contracts hash-verified |
| Original live FX partial | first6cases original PASS; case7pre-reload checks pass; case7reloadFAIL retained |
| Remaining FX reload gate | two targeted cases PASS, exact complete record/state equality |
| Subsequent live gates | existing source-equivalent completed originals retained, not counted again or claimed newly run |
| Final current SW | freshly fetched sw.js byte-equal to source, SHA2565f0db36b3be4b4f53d8d51b4a75556d76e6147b2a6e0f16a5bd6950512b58548 |

Release result: **LIVE_ACCEPTED**, based on the combined evidence. The aggregate GitHub run remains FAILURE; skipped downstream live steps are not claimed as newly completed.

## Saved originals

[Complete closure package](https://chatgpt.com/library?file_id=libfile_fde3_f-2bde27d95d3c819191486284d332a03b_54e45e8130348191808d9aaa710cf372&account_id=personal), version0, pinned `file_00000000dbfc8210bb925d76d56a067e`:264433290bytes, SHA256 `c01de8212d02de82cc21c292be613012138f8f59ea6109094352edf0e256c98a`. Contains all8original main ZIPs (including deployment and failed live artifact), metadata/logs, source, original comparison diagnostics, target adapter/original script, complete targeted records/network logs, prior qualification/restoration receipts, all9contract reports,159manifest entries and2530original ZIP members. Original ZIP digests, lengths and CRCs verified.

The prior qualification package remains separately saved; its independent restoration80manifest entries/35ZIPs/4885files and55unique mappings is inherited rather than claimed as newly executed. This package's cut precedes its own save/readback; the machine acceptance receipt records the actual subsequent restoration.

Physical-device gates remain DEFERRED. Private finance anchors, ownership and original ETH cursor sequence remain externally open. No global1.0 completion claim. EFF03/UNKNOWN/identity/journal/IDB/CAS/backup/restore/offline/PWA protections retained; parked PR332/161/157 unchanged.

