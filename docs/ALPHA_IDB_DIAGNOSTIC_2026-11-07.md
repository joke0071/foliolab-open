# Alpha cache: bounded lifecycle evidence for the v294 release blocker

Main run [42378307203, attempt 1](https://github.com/joke0071/foliolab-open/actions/runs/42378307203)
on `43d4e7ad42ceb36b12ebd377d3a299173a421f93` failed in Firefox at
`tests/browser-alpha-vantage.mjs:63`, during the exhausted persisted-budget fixture.
The unchanged `alphaCache` open deadline rejected after 5000 ms. The cause of
that original pending native request remains **UNKNOWN**. There is no evidence
for an external HTTP failure, a funding regression, or a repaired harmless flake.

## Existing evidence retained

The main unit/Chromium job and cross-engine shards 1 and 3 completed successfully;
shard 2 failed. Deployment and production acceptance were skipped. All six
artifacts were downloaded and checked against API size/digest, upload logs,
local SHA256 and ZIP CRC; 190 JSON files were parsed and 1887 PNGs decoded.
Artifact integrity does not turn the failed job into a pass. The original failed
artifact is `13576188869`, 7432117 bytes, SHA256
`797dfb30b55cd2fb10be1ea6efcc24160b8903f00d18c22b4a5dd2b0f24a980b`.
No original run was retried or cancelled. PR313's prior financial and candidate
evidence remains valid in its own context; it does not replace a main/live gate.

## Controlled observations

A local synthetic Firefox 157 / Playwright 1.64.1 observation retained the exact
original gate's 33 assertions and all existing deadlines. Forty-eight market-cache
opens completed, the longest in 15 ms. The original failure was not reproduced.
The local container required `MOZ_DISABLE_CONTENT_SANDBOX=1`; this is diagnostic
evidence, not a production or standard-CI acceptance claim.

[Executable lifecycle matrix](repros/ALPHA_IDB_LIFECYCLE_2026-11-07.mjs), run from
the repository root with the matching Playwright installation:

```sh
node docs/repros/ALPHA_IDB_LIFECYCLE_2026-11-07.mjs
```

Four isolated native-Firefox scenarios passed:

| Scenario | Observation |
| --- | --- |
| Creation, write, read and clear | Upgrade, success, transactions and explicit closes recorded; exact synthetic value retained/cleared. |
| Retained v1 connection blocks an explicit v2 upgrade | The later Alpha v1 open queues silently, with no own blocked/upgrade/success/error event before the unchanged 5s rejection. Releasing the controlled blocker produces a late VersionError. |
| Retained connection blocks an explicit deletion | The later Alpha open queues silently and rejects at the unchanged 5s limit. Releasing the blocker permits a late create/success, which the unchanged Alpha handler explicitly closes without running the update callback. |
| Existing database v2 | Alpha's v1 open emits VersionError and rejects. |

The two deliberately induced queue delays measured 5001 ms and 5000 ms. These
prove distinguishable lifecycle mechanisms and the observer's operation; they
do **not** prove an upgrade/deletion/blocking connection existed in the original
CI run. No such operation has been identified in the ordinary Alpha fixture.

## Narrow diagnostic change

The existing Alpha browser gate now records bounded, metadata-only lifecycle
snapshots before reloads, before the exhausted-budget fixture, on failure and at
the end. Native request events, pending request states, versions, explicit and
event-driven connection closes, transaction outcomes, page visibility and a
heartbeat gap are retained. Only the fixed market-cache database is observed;
no record values, cache keys, key hashes, provider URLs, credentials or canonical
portfolio bytes enter the report. The standalone matrix uses isolated synthetic
profiles and no live provider requests.

All original assertions, fixture operations, error rethrows and gate deadlines
remain byte-reconstructible after removing the diagnostic additions. No app
asset, cache/budget algorithm, schema, source identity, financial path, workflow
command, engine or timeout changes. Diagnostic capture has its own bounded 1s
best-effort snapshot limit and cannot convert the original gate failure into a
pass. This is an observation change, **not a claimed root-cause correction**.

The new candidate requires its own regular integration and main gates. The
v294 release remains open until actual deployment, TLS/asset/SW identity and all
three production browser engines are fully accepted. Last accepted production
at this document's creation remains v293; do not reaccept it.
