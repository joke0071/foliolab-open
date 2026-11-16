# PR349 Main43956969224 · end state: integration/deploy passed, live delivery blocked

Main **494ed8f0f6b627d8be972a5ceb886005e5064b31**, approved PR349 head411821d884d2a8df7a4be44bddb85bb62259ff2c, tree47674d62c54c06a67e347bc73faef127ae33ee76 unchanged. [Run43956969224](https://github.com/joke0071/foliolab-open/actions/runs/43956969224) ended **completed/failure, attempt3**. No jobs remain active. All integration gates and deployment passed. The existing SW321 product LIVE_ACCEPTED evidence remains valid for unchanged product bytes; **no new complete regular Main live success is claimed**.

## Original installation failure and controlled recovery

Original job133614229345 and artifact14271463119 are preserved. Failed job38s, actual installation step10s, browser portfolio step skipped. Image ubuntu-24.04/20261111.127.1; APT fetched only Microsoft indexes and had no candidates for many Ubuntu browser libraries. Concurrent successful Cross1 used20261111.370.1 and fetched Ubuntu archive/update/backports/security indexes. Same provisioning version20261103.629, same pinned Playwright1.64.1.

After attempt1 finished, one rerun-failed request retained the successful main test/Cross1/Cross3 and executed Cross2 again as133627209482. It passed18m37s. **The successful fresh runner used the same20261111.127.1 image as the failed one**, with normal Ubuntu indexes and dependencies. Hence image version alone is not a cause. Exact first-run APT source configuration/state was not captured; no deterministic image bug or product regression asserted. No repeated installation error, source/test/workflow change or additional integration run.

The failed artifact's six PNGs are byte-identical tracked UI-visual01 references, not newly executed Cross2 tests. Full first-failure log, successful Cross1 comparison, original artifact and all other successful attempt1 originals are secured. Recovered Cross2 all837 report paths match the qualified PR; retained Chromium/Cross1/Cross3/Dialog paths likewise unchanged after only existing13digit storage-fixture capture-timestamp normalization.

## Timing: actual wait and runner work remain separate

| Measurement | Recorded duration | Meaning |
|---|---:|---|
| Qualified PR integration |17:56|Measured; previous comparable PR/Main23:04/23:16, observed5.1–5.3min shorter there |
| Failed Main Cross2 job / installation step |0:38 /0:10|Before tests;38s parallel in the first window, not another serial38s |
| First incomplete Main parallel window |18:41|21:08:48Z–21:27:29Z; Cross2 result still missing |
| Gap after first window to fresh job start |2:58|21:27:29Z–21:30:27Z |
| Fresh Cross2 job |18:37|21:30:27Z–21:49:04Z; installation63s, browser step1033s |
| **Actual complete integration wait** |**40:16**|18:41+2:58+18:37; not an uninterrupted18minute Main phase |
| Successful integration runner work |62:50|Sum3770s across four actual successful jobs |
| Integration runner work including failed setup |63:28|Successful3770s + failed38s |
| First live / bounded live restart |2:50 /0:48|170+48=218s actual live runner work, both failed |

Main successful individual jobs: test1121s, Cross1627s, Cross3905s, recovered Cross21117s. Longest18:41, only4s above Cross2; this cross-attempt maximum is not an observed uninterrupted successful phase. Main's actual40:16 cannot be presented as a measured speedup. PR improvement remains a PR result; environment/recovery effects remain visible. Full observed job window21:08:22Z–21:56:49Z=48:27; nine unique non-skipped actual executions4069s=67:49 runner work (including plan/deploy/live). The24 API rows repeat retained success jobs under new IDs; identical name/start/end windows are counted once.

## Deployment and actual live failures

Deployment133638102686 SUCCESS21:49:08Z–21:49:27Z. Pages artifact14273898961 contains154 exact source-file matches to main494ed8f0. Both failed live executions independently recorded155 matching published asset hashes before their later failure; this is byte identity evidence, not full behavioral acceptance.

1. Live133638326346 (attempt2) failed at FX **seven-days-boundary**, case6/8, reload ready() browser-fx-age.mjs78. Five earlier complete refresh/reopen cases passed. Case6 refresh accepted USD0.85 with seven-day source date and correct success/completion/journal/flow assertions before reload. At reopen document/CSS/app.js200, then **72same-origin module429 responses in35ms**, Varnish headers,text/html MIME,Retry-After0,ERR_ABORTED. SW blocked, controller null, no registrations/versions. Original FX pageerror/console array is not persisted on failure; no absence claim. This is independently observed delivery429 class, different case/count from olderSW321; synthetic external provider429 is separate. Artifact14274454228/10916862bytes/SHA2560acde8ac1ac5d357292c138d8d6ca55d196cadd929ee37aa971b6544937a01a7/107members/CRC PASS.
2. After preserving originals, three sequential low-load resource probes returned200/exact source. This established current single-resource availability, not same-edge burst stability. One bounded live-only fresh-runner restart was performed; all successful integration/deploy reused. Live133642045451 (attempt3) then failed earlier in core startup: **market.js HTTP503**, Varnish headers,text/html MIME, document/CSS/app.js200,ERR_ABORTED. Report records155 exact earlier asset responses200,0Axe scans, startup message “FolioLab konnte nicht vollständig gestartet werden.”,readyAt null, navigation0buttons and no SW control/registration. Captured report errors=[]; that does not negate the recorded failed script/startup. Artifact14276395300/324684bytes/SHA2560546c4856e6f9e82ba1c9981287233a8110ed3b11f8ccc78079e7cc4f73be7f6/10members/CRC PASS.

These are different observed HTTP statuses/points of failure within the resource-delivery class, not a proven identical upstream cause. Exact origin/edge limiter configuration, responsible backend and trigger remain unproven. Diagnostic preload can affect timing. **No further unchanged retry is started.** Before another full live run, delivery/traffic cause needs bounded investigation and a demonstrated mitigation; neither relaxed assertions/deadlines nor a new product regression is justified by these records. Main lifecycle is finished; new regular live completion remains blocked on delivery reliability.

## Durable originals and independently verified saved copies

- [Complete attempt1 originals](https://chatgpt.com/library?file_id=libfile_fde3_f-a7b5f88075348191a226d1a569f34f52_54e45e8130348191808d9aaa710cf372&account_id=personal), version0,153384960bytes,SHA256e4c32fd63be9d9bcd103afa3a5e96b2947879a78b69869d382cd53fc4a4ad7b3:17members/16manifest entries,6original ZIPs/1668members, actual saved-copy lengths/hashes/CRCs PASS.
- [Attempt2 recovery/deploy/live-failure originals](https://chatgpt.com/library?file_id=libfile_fde3_f-e855f5010a50819198d11603d8437ae0_54e45e8130348191808d9aaa710cf372&account_id=personal), version0,83527680bytes,SHA256055c22f2e080c9e7f70f99136b3d848eed99a2c2d0658921681b410dfd585a57:14members/13manifest entries,3original ZIPs/945members, actual saved-copy lengths/hashes/CRCs PASS.
- [Final attempt3 originals and endpoint metadata](https://chatgpt.com/library?file_id=libfile_fde3_f-8a07eebe14b88191ba143d5920ce4f23_54e45e8130348191808d9aaa710cf372&account_id=personal), version0,345328bytes,SHA2562b6e311eb46f96a5003c537ca2a050e9b3fee4952a436efa04c472f867146e76:11members/10manifest entries,1original ZIP/10members, actual saved-copy lengths/hashes/CRCs PASS.

All10original GitHub artifacts are thus retained by exact ID/digest,2623ZIP members verified, plus original decoded logs/raw attempt/job metadata and diagnoses. Later readback observations and final timing are in the [machine end-state receipt](release-evidence/pr349-main-final-2026-11-16.json); original archives predate those later receipts, no circular selfhash. No private portfolio, transaction IDs, financial originals or user secrets introduced.
