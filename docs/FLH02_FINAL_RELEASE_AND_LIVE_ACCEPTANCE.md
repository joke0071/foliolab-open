# FLH02 final release and live acceptance

Specification: Library document FLH02 version 11, including A–E and 7.11–7.14. A was accepted separately as v171 in PR #143. PR #144 completes B/C1, C2/C3, D/E and Drive UX using the existing local data model, journal, wallet replay, provider transports and backup contracts.

## Release identity

PR #144 merged at `cb2e6d1d23b2fcac29b609306c0bf8954679bb86`. Main CI/deployment [40217903807](https://github.com/joke0071/foliolab-open/actions/runs/40217903807) and live gate pending. Candidate v175, tested source head `7e1bb914bc66c3783e447b4cb34d2f8b2c7a4948`; verified base main `8e12ae1ad1a0b517eab3404a2dacbe9b31ab61db`.

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
- Current release gate: [40217442188](https://github.com/joke0071/foliolab-open/actions/runs/40217442188), PASS: Chromium and Firefox/WebKit. Main CI/deployment and live acceptance remain pending at this checkpoint.

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
