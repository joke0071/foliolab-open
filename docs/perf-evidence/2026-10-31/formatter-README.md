# PERF01 experiment: formatters and historical clearing index

Status: EXPERIMENT_ONLY_NOT_RELEASED. No production change or Android hardware acceptance.

Baseline source: ee7ee75f2b62d22452d503ae7b0779d51ad68056 / v236. Candidate changes only the three files and hashes listed in formatter-prototype-summary.json; apply formatter-prototype.patch to a separate baseline checkout. The intentionally unchanged SW236 is for isolated benchmark profiles only, never a deployment candidate.

Measured on Chromium 141 / Playwright 1.56.1 / Node 24.22.1 / Linux, CPU 4x. Five sequential fresh-process/warm/offline samples per variant, identical 19 positions, 10,000 bookings plus journal entries, 1,825 references synthetic fixture. Decompress formatter-fixture.json.gz; SHA256 of the 10,582,038-byte JSON must be 1df791bf0273a265679fe3dff09a84d25716ed2a1f0872a349a434ed9e7378ef. No private account data or credentials.

Copy formatter-benchmark.mjs into tests/ in each isolated checkout, install the repository-pinned Playwright/Chromium tools, serve each checkout at port 4173 serially, and run with BENCH_FIXTURE_FILE pointing at the decompressed JSON. BENCH_OUTPUT chooses the report directory; BENCH_SHA labels the tested variant. Do not run the two variants concurrently. Each run preserves and checks its exact saved IndexedDB record/settings/revision. The script hash must match across variants.

The contract reproducer accepts PERF_BASELINE_ROOT, PERF_CANDIDATE_ROOT, PERF_FIXTURE_FILE and optionally PERF_CONTRACT_OUTPUT. It checks 331 formatting cases and five exact historical projections, including past/future/multiple unresolved clearing entries and excluded assets, with no model mutation. The prototype passed 1008 existing unit tests and syntax checks.

Median results (baseline → candidate): cold 5446.1→4214.5ms (−22.61%); warm 5186.2→4019.9 (−22.49%); offline 4785.6→3643.4 (−23.87%). History navigation 1594→650ms; dashboard 1300→580ms. Other-tab navigation is included in the summary, including More 189→200ms, where no improvement is claimed. Raw samples and ranges are preserved. This is one ordered A/B pair, no statistical SLA; do not add these percentages to earlier release gains.

Prototype: reuse bounded currency formatters plus one quantity/date formatter; preselect unresolved-clearing entries once per pure historical portfolio projection. Full ledger validation and financial formulas remain unchanged. Actual integration still requires a current-main branch, SW bump, fresh full CI/three engines and production acceptance after the active UI release.
