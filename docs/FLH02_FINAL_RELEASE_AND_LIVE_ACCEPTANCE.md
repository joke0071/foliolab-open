> Historical v175 acceptance record. The final targeted v176 FX action/mini-chart correction is tracked in PR #146 and the current work checkpoint; v175 does not prove that subsequent action.

# FLH02 final release and live acceptance

Specification: Library document FLH02 version 11, including A–E and 7.11–7.14. A was accepted separately as v171 in PR #143. PR #144 completes B/C1, C2/C3, D/E and Drive UX using the existing local data model, journal, wallet replay, provider transports and backup contracts.

## Release identity

Production v175 is released and live accepted. Implementation [PR #144](https://github.com/joke0071/foliolab-open/pull/144) merged at `cb2e6d1d23b2fcac29b609306c0bf8954679bb86`; checkpoint [PR #145](https://github.com/joke0071/foliolab-open/pull/145) merged at `eb737df8979c7708d678de8045bd2b48db9e8e2f`, the actual tested/deployed/live-accepted main SHA. [Main CI and Pages deployment 40218777354](https://github.com/joke0071/foliolab-open/actions/runs/40218777354): all jobs PASS. [Live URL](https://joke0071.github.io/foliolab-open/), active `foliolab-open-v175`. Later documentation closeout commits do not change application bytes.

## Delivered behavior

- Bittr purchase evidence remains attached to reconstructed wallet outputs without additional balances, purchases or cash flows; the accepted A implementation is retained.
- Position history defaults to evidenced historical EUR value, with price, quantity and transactions available. Journal trade-day EOD and blockchain UTC EOD are explicit. The same projection supplies eligible miniature charts.
- Raw close and historical FX are applied to the quantity evidenced on that date. Adjusted-only CSV is rejected for this valuation. Twelve uses `adjust=none`, FMP the non-split-adjusted endpoint. Original FX reference dates and crypto midnight/EOD semantics remain traceable.
- Dashboard and History share one read-only portfolio projection. Unknown components and wallet overlap prevent a verified full-total claim. Partial portfolio values are labeled; changing constituent scopes and missing dates break the curve. Manual observations never silently alternate with reconstructed totals. Snapshot differences are review information, with no automatic writes.
- Existing local history has priority. New provider history requires explicit storage-right confirmation and identity/provenance validation before retention in existing `priceHistories`; conflicting source/data replacement is explicit. No parallel database or backend.
- Period controls include 6M and 3J. Manual control points and raw records are secondary closed disclosures. Optional service setup is consolidated behind one closed “Weitere Verbindungen (optional)” entry and one save action, retaining both independent endpoints and tokens. Normal API-key setup stays primary.
- Legacy precision repair is reachable through relevant quality review; migration/recovery remains available only when applicable. Existing IndexedDB consent, recovery, backups and storage semantics remain intact.
- Drive manual connection offers an immediate encrypted backup action, or password configuration when necessary. Automatic scheduling is described as session-only; closed-app background operation is not promised. Existing encryption, full backup and restore paths remain intact.

## Actual verification

- `npm run check`: PASS. `npm test`: 657/657 PASS, zero skipped.
- Full local Chromium workflow suites completed in sequential segments through offline, PWA updates and scale. Tests updated for intentional new navigation/preset contracts retain financial, privacy and storage assertions.
- Latest affected Chromium rerun: quality review; historical position default/alternates and miniature values; integrated 999/1059 total without snapshots, partial/observed separation, six-width axe, retained endpoints/tokens and zero financial mutation: PASS.
- BTC/ETH/SOL/SPL history UI, encrypted restore, exact tiny-token display, multitab and backup preference persistence: PASS.
- Earlier candidate run [40216424171](https://github.com/joke0071/foliolab-open/actions/runs/40216424171): Firefox/WebKit PASS; Chromium failed on the then-missing precision-review entry. That defect is fixed and replacement CI is required.
- Current release gate: [40217442188](https://github.com/joke0071/foliolab-open/actions/runs/40217442188), PASS: Chromium and Firefox/WebKit. Main CI/deployment and independent actual production acceptance also PASS (see below).

## Independent actual production evidence

On 2026-10-25, `RELEASE_SHA=eb737df8979c7708d678de8045bd2b48db9e8e2f node tests/browser-live-acceptance.mjs` passed against actual Pages: 103 exact SHA-256 app/SW matches, actual loaded app/CSS matches, 18 axe scans with zero violations, real UI creation/edit/reload, plain and encrypted backup download/fresh-profile restore, SW control/cache and offline save/reload; zero page errors. [Machine report](release-evidence/flh02-v175-live.json).

`node tests/browser-live-purchase-evidence.mjs` passed actual production Bittr preview/confirmation/undo/reload, IDB, complete encrypted restore, multitab, six widths/axe and private-field/XSS checks. `node tests/browser-live-flh02.mjs` passed actual 999/1059 EUR reconstructed total without snapshots, partial/observed basis separation, six-width axe, optional settings/token preservation and zero financial writes. [Extended evidence](release-evidence/flh02-v175-extended.json). Production live browser was Chromium; Firefox/WebKit were fully exercised in CI on the identical application sources, not falsely claimed as live-browser runs.

The earlier main runner stalled during browser-dependency installation and was cancelled by a new main run after green checkpoint PR #145. No test gate was skipped or weakened. Documentation-only closeout requires green PR/main CI and unchanged v175 deployment; its exact final main/run links are in the closeout PR description.

## User workflow

1. Import actual transactions or reconstruct and accept the supported wallet history. An undated opening quantity cannot prove earlier holdings.
2. Import local raw daily-close CSV, or configure an existing API key and fetch a confirmed instrument/listing. Retain provider data only when permitted. Currency/FX and actual date coverage remain required.
3. Open a position’s history for EUR value; choose price, holdings or transactions when needed. Unknown value periods show the missing evidence rather than zero.
4. Use Overview/History for reconstructed portfolio evidence. Review coverage or compare independent manual control points without altering the journal.
5. Configure a backup password; connect Drive and choose the offered backup action. Keep local encrypted backups as needed. Scheduling requires an open active session and valid authorization.

## Deliberate evidence boundaries

Missing/undated cash or holdings, unsupported chain/staking ownership, unproven economic-representation links, reorgs, unresolved clearing and excessive decimal precision remain explicit gaps. Actual booked interest is included; speculative interest forecasts are not historical cash. Existing performance gates are preserved; no tax, TWR or XIRR claims are invented.

No user test accounts/keys were supplied for paid-provider entitlements or real Drive OAuth. These paths use synthetic contracts/regression tests; CORS, tariff, listing rights and live user authorization remain unconfirmed per account. No provider-free multi-year availability is promised. Yahoo/RapidAPI, CoinMarketCap and new worker/backend deployment are outside this release.

All committed test data is synthetic. No private financial CSV, wallet references, credentials or real API tokens are committed. Live acceptance uses isolated browser profiles and actual production assets, with external market requests blocked. The local execution environment’s HTTPS inspection certificate exception, if used, is recorded in machine evidence; certificate validation is not claimed as part of that browser acceptance.
