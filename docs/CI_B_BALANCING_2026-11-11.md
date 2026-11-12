# P-CI-B: bounded Cross3 to Cross2 balancing against accepted v310

Base ae0778fa31f035516b6da82de4084c757c0481ed, tree b57812513269c1c62918709c323e976bb75be9f7. v310 fully LIVE_ACCEPTED with protected V149/pinned readback/182-file actual incremental restore. Reconciles preserved preparation466be00d49d3a5308cb28075dd7572e4d0ce596b; no historical checkpoint merge.

## Exact scope

Move exactly one unchanged UI_QUALITY_ENGINES=firefox,webkit node tests/browser-ui-quality.mjs invocation from the start of Cross3 to the end of Cross2, immediately after the existing position-removal invocation. Every other workflow byte stays identical. No product, SW, financial/storage/identity, browser version/cache, deadline, deployment, live, FAST or artifact contract changes. The two modified CI tests retain every current-main Ubuntu mirror/probe and historical sealed body assertion; a narrowly bounded normalizer reconstructs only the reviewed scheduling delta. Original manifest files and sealed hashes stay identical.

## Isolation and evidence

Three separate GitHub runners retain serial execution within each shard. UI entrypoint uses awaited dynamic imports and isolated browser contexts, sharing only its job-local static server. There are no production writes in PR tests. Imported Flatex UI/commit suites also remain explicitly invoked in Cross3; their independently retained duplicate outputs are expected. Preserve and qualify every required engine/report union and per-shard relocation rather than comparing archive sizes alone. Six committed identical ui-visual01 reference PNGs and per-job install logs are legitimate shared paths. No generic test-reordering exception.

Current v310 regular Main run43177468857/attempt1 original jobs: Chromium1007s, Cross1507s, Cross2530s, Cross31437s. The new regular PR supplies the next after observation; approved regular Main supplies the second. Historical v308 preparation measured a754.289376s UI block; this is only a scheduling hypothesis on the newer v310 test set. No new duplicate CI for statistics, no guaranteed saving/credit estimate, no DONE before actual comparisons and final production/backup gates. Full PR/Wallet tests are mandatory. Main/production are required only after concrete workflow merge approval under #229.

## Local verification

28 current-main CI contract tests PASS/0failures/0skips, including omissions, duplicates, reduced engine sets, missing shard, arbitrary placement, deployment dependency, deadlines, versioned caches, FAST selection, and seven isolated Ubuntu network simulations. Initial local staging added one trailing newline to the workflow and omitted the Python simulation dependency; strict historical seal and dependency test caught both. Exact original workflow bytes restored and helper fetched unchanged; all28 passed. Assertions and historical hashes were never changed.

## Required completion

Freeze one candidate; fully qualify original PR/Wallet/Chromium/three Cross engine artifacts, unit/syntax/canary/financial/UNKNOWN/journal/CAS/restore/offline/A11y gates and direct images. Secure immutable PR originals with pinned readback and actual required incremental restore. Then obtain the user's concrete approval for this exact workflow candidate under #229. The general product authorization does not authorize this workflow merge. Keep runtime v310 for this scheduling-only change; after approval all unchanged Main/deploy/actual production and backup gates remain mandatory. P-CI-C/live parallelization is outside this candidate.
