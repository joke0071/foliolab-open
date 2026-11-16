# SW321: one measured Cross3 scheduling change

Base e272297ab1ba855a2922c1faa4010b83c558a796. Re-evaluates PR332 against current workflow, without carrying its old product state or merge decision forward.

| Successful integration phase | Cross1 s | Cross2 s | Cross3 s | Main test s | UI-quality block s | Estimated new critical path s | Estimated wait saved s |
|---|---:|---:|---:|---:|---:|---:|---:|
| PR347 / 43909694363 | 676 | 621 | 1383 | 1007 | 580.514 | 1201.514 | 181.486 |
| Main / 43929597892 | 611 | 507 | 1396 | 1042 | 592.520 | 1099.520 | 296.480 |

Job start/end timestamps measure complete jobs. UI-quality block uses first import marker through final WebKit suite PASS; command startup/teardown adds a small unmeasured boundary. Estimated critical path is max(Cross1, Cross2+block, Cross3-block, main test), not a claim of measured candidate improvement. Savings estimate: 3.0–4.9 minutes (13–21%); main test is a 16.8–17.4 minute lower bound. Queue time and any FAST prerequisite are separate from integration wall time. Total runner work is approximately conserved, not reduced by the wait saving.

The wrapper imports 21 modules sequentially; reference-management alone consumed 176.8/181.2 seconds. Moving the complete unchanged wrapper to the end of Cross2 balances independent work without altering its internals. Existing direct/wrapper overlap remains intact. Every current workflow entrypoint/engine invocation remains exactly once; no coverage, assertions, deadlines, engine sets, manifests, original sealed hashes, artifact upload steps or dependencies change. A strict inverse relocation lets existing historical seal tests verify the old bytes; omission, duplication, reduced-engine, historical and wrong-location counterexamples still fail.

Only one workflow line moves. Targeted 25 contract/canary tests pass. A regular candidate PR integration run provides measured follow-up; no extra full runs solely for timing. Product and SW bytes remain unchanged.

Interruption review: PR347's successful three-engine integration was retained for SW321; the later live-only reload failure was investigated using its original artifact, with targeted live evidence reused for 154 identical product files. No repeat of that full integration was necessary. The first Windows K4 attempt stopped on checkout CRLF hash mismatch before browser actions; the corrected exact-blob runner completed 11 cases. Its 11 originals are reused for K6 scope instead of rerun. Checkpoint updates must include exact head, run/attempt, last completed step and next inspectable step during candidate runs. Original logs and receipts are retained separately from this scheduling estimate.
