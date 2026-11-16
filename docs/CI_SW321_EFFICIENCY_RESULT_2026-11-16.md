# SW321 CI scheduling and interruption audit

Candidate PR349, exact head411821d884d2a8df7a4be44bddb85bb62259ff2c; accepted basee272297ab1ba855a2922c1faa4010b83c558a796. One identical UI-quality Firefox/WebKit invocation moves from start of Cross3 to end of Cross2. No product/SW change, no removed test, no weakened assertion/deadline, no browser or artifact-step change. Strict inverse relocation preserves original sealed workflow hashes and historical manifests.25 targeted contract/counterexample tests and pinned TypeScript5.8.3 static name/syntax preflight passed; all six remote candidate files equal qualified local bytes. Whitespace and exact one-line relocation/multiset checks passed. Existing wrapper/direct overlap remains; multiplicity is preserved, not deduplicated.

## Timing basis before candidate completion

| Phase | Cross1 s | Cross2 s | Cross3 s | Main s | Movable UI block s | Estimated all-required-jobs path s | Estimated wait saved s |
|---|---:|---:|---:|---:|---:|---:|---:|
| PR347 /43909694363 |676|621|1383|1007|580.514|1201.514|181.486|
| Main /43929597892 |611|507|1396|1042|592.520|1099.520|296.480|

Measured originals: full job start/end timestamps; UI block from first imported-module marker through last primary-suite WebKit PASS. Small command startup/teardown unmeasured. Estimated new path=max(Cross1,Cross2+UI,Cross3−UI,main). Thus estimated wait reduction3.0–4.9min (13–21%); main test16.8–17.4min is the next lower bound. This is not a claim of reduced runner work. The wrapper imports21 modules; reference-management alone takes176.8/181.2s, followed by additional primary UI checks. Runner work is approximately conserved by relocation.

PR332 is useful preparation, not current approval. Its v310 candidate run43256977609 completed the balanced shards but failed the Chromium test after328s; the other shards ran667/1088/767s. Full phase took1089s and four integration jobs consumed2850s=47.5runner-minutes. That failure cannot establish a fully qualified timing win, and its old assumptions are not copied into SW321. The current candidate gets one regular complete qualification run; no extra full timing runs.

## Repeated live failures and useful evidence reuse

Original all-attempt job metadata can repeat prior successful jobs with new API job IDs and identical name/start/end timestamps. Those are retained successes, not actual new executions; deduplicate by name/start/end before adding runner time. This avoids falsely reporting multiple whole integrations.

- SW319/run43814956980: first live attempt177s failed with captured module429; one targeted live retry2989s succeeded. Prior integration and deployment were reused. The successful retry itself cost49m49s; rerunning all integration would have added another21m52s critical path and56m20s integration runner work. That avoided work is counterfactual, not a measured stopwatch saving. Independent original restore/receipt1883 files documented in existing acceptance.
- SW320/run43866338423: first live attempt167s; extra live attempts61+133=194s (3.23runner-minutes) failed with distinct recorded429/503 contexts. No complete integration rerun: original four integration jobs total3835s and remained reused. Isolation run43872461222 then consumed3473s=57.88runner-minutes across19jobs (8success/2fail/9cancelled), over402s active wall time. The isolation did not fix delivery failures and was stopped; no further identical retry sequence is proposed.
- SW321/run43929597892: integration test1042s + cross611/507/1396s=3556s (59.27runner-minutes), critical path23m16s. Live failed167s; exact original artifact explained module429 on reload. Targeted original-assertion diagnosis plus54 unchanged live assignments and one CSS-anchored measurement completed acceptance across154 identical product paths, without another full integration. Original failed logs, successful source evidence and actual saved-copy restore receipts remain preserved.
- Windows K4/run43946067928: initial36s runner attempt failed on CRLF checkout/SW hash before browser actions; corrected exact-blob checkout run43946304983 succeeded. Its11cases are reused for K6, not regenerated. New bounded Windows run43952605296 independently passed Bitpanda/UI and K6 and retained originals.

No inference of a common root cause merely from timeouts. HTTP429/503 delivery observations are distinct from synthetic provider429 fixtures; changing test assertions or deadlines would not diagnose them. Current checkpoints record head/run/attempt, last completed step and next inspectable step during long jobs, allowing immediate takeover without reruns.

Candidate measured result is recorded after this regular run finishes, separately from the estimates above. No product merge until the exact qualified head is approved.


## Measured regular candidate result

Run43952358302/attempt1 SUCCESS; wallet43952358338 SUCCESS.1507unit tests/0failures; Chromium and all three Cross-Engine jobs passed; FAST contract canary passed. PR deploy/live correctly skipped. Exact tested merge8504e6ecdcfad4c4238fc3bfd4a7b463184d3f1d has candidate tree47674d62c54c06a67e347bc73faef127ae33ee76 and parents accepted main e272297 / exact head411821d884d2a8df7a4be44bddb85bb62259ff2c. Main unchanged; PR clean/mergeable, no comments/reviews outstanding.

| Required integration job | Measured seconds | Minutes |
|---|---:|---:|
| Main test |1052|17.53|
| Cross1 |633|10.55|
| Cross2 |1076|17.93|
| Cross3 |897|14.95|

All-required integration span:1076s=17m56s, earliest start20:41:38Z to final completion20:59:34Z. Earlier PR347 complete phase1384s (one-second launch skew beyond its1383s longest job), Main1396s. Observed wait reduction308/320s =5.13/5.33min (22.3/22.9%). This is measured comparison of these three phases, not a guarantee or isolated causal A/B measurement. Earlier timing-based estimate3.0–4.9min remains labeled an estimate. Candidate main is now only24s below critical Cross2, so further redistribution has little demonstrated headroom; no second intervention or extra full run.

Candidate UI-quality block553.644s; all original21 imports and final two-engine primary suite completed in Cross2. Sum of four integration job runtimes3658s=60.97runner-min; earlier PR3687s=61.45min and Main3556s=59.27min. Thus observed runner work varies−0.48/+1.70min; **no runner-minute reduction claimed**. Queue time/plan prerequisites remain separate. UI block and setup differences explain why cross-run wall time must not be presented as exact causal acceleration.

Artifact preservation: all7candidate original ZIPs secured with API size/digest and full CRC. Across all three Cross-Engine artifacts the normalized union is exactly1514paths before/after; no missing or added path. Only existing storage-fixture engine filenames with13digit capture timestamps are normalized. Raw members and per-artifact provenance remain in the receipt, including duplicates moved between artifacts; no original is rewritten. Static command/engine multiplicity and all other workflow bytes remain exact. Original baseline artifacts are already durably retained in the SW321 closure archive and were read/verified for this comparison; no tests rerun.

Recommendation: merge PR349 only at exact qualified head411821d884d2a8df7a4be44bddb85bb62259ff2c after Jochen's decision. Do not merge QA350 or the whole checkpoint branch into main. SW321 live acceptance is unchanged.


## Durable original copy and independent readback

[Qualified original package](https://chatgpt.com/library?file_id=libfile_fde3_f-cfbed2be21108191a4e502d157ce5935_54e45e8130348191808d9aaa710cf372&account_id=personal), version0, pinned file_000000004d808210b4f2c305fe916fd6:230236160bytes, SHA2567429a89dd8abf63d451dc1ac3f73283e3aef93eaf55158bb25824426f859c85a. Actual saved copy independently downloaded:38archive members,37manifest entries with exact lengths/hashes,7original candidate ZIPs and2525ZIP members/CRC PASS. The archive predates this subsequent readback receipt; [machine acceptance/readback receipt](release-evidence/ci-sw321-balance-qualified-2026-11-16.json) preserves that later observation. Original baseline main proof package remains unchanged; newly downloaded baseline originals were checked against API digests for artifact-path comparison, without rerunning their tests.
