# FLH02 final release and live acceptance — v176

FLH02 specification version 11, including A–E and 7.11–7.14, is implemented, integrated and live accepted. Production: [FolioLab Open](https://joke0071.github.io/foliolab-open/), active service worker `foliolab-open-v176`.

## Release identity

- A accepted as v171 in [PR #143](https://github.com/joke0071/foliolab-open/pull/143); existing accepted financial/storage components reused.
- B/C1/C2/C3/D/E/Drive implemented in [PR #144](https://github.com/joke0071/foliolab-open/pull/144), merge `cb2e6d1d23b2fcac29b609306c0bf8954679bb86`.
- Resumable pre-live checkpoint [PR #145](https://github.com/joke0071/foliolab-open/pull/145), merge `eb737df8979c7708d678de8045bd2b48db9e8e2f`, v175 live accepted.
- Final keyless foreign-currency CSV/retained-history FX and mini-chart correction [PR #146](https://github.com/joke0071/foliolab-open/pull/146), merge `25f5dcade24b54caf567e05db698c013c777a637`.
- Actual v176 tested/deployed/live-accepted main SHA: `25f5dcade24b54caf567e05db698c013c777a637`. [Main workflow 40220923062](https://github.com/joke0071/foliolab-open/actions/runs/40220923062): test, cross-engine and Pages deployment ALL PASS.
- Final documentation [PR #147](https://github.com/joke0071/foliolab-open/pull/147), branch `docs/flh02-v176-acceptance`, changes only this report, checkpoint and public-hash/synthetic evidence. Its merge/main CI must be green; final exact main SHA/run are recorded in its PR description. Application bytes remain the accepted v176 bytes.

## Delivered behavior

| Package | Accepted behavior |
|---|---|
| A | Local Bittr receipt preview/validation/confirmation, satoshi/output/TxID identity, duplicates/conflicts/undo retained. No additional stock, invented purchase, cash flow or cost basis. |
| B | Historical journal trade-day / chain UTC EOD quantity × compatible raw close × historical FX. EUR value default; price, quantity and transactions available. Shared eligible mini charts; disjoint gaps and provenance; 6M/3J/5J/Max within actual coverage. Local non-EUR histories have a direct keyless dated-FX load-and-keep action; values survive canonical save, reload and full backup/restore. Histories with a CSV or dated opening are accessible without purchase bookings. |
| C1 | Read-only cash/journal/chain aggregation, actual booked interest and signed liabilities. Wallet overlap, missing scope/opening/clearing and unproved economic representation block full-total claims. Present holdings are never backfilled. |
| C2 | Dashboard and History share one projection. Reconstructed, partial and manual observed bases stay separate. Missing periods/scope changes break the curve. No invented full totals or performance results. |
| C3 | Coverage and independent snapshot differences are inspectable, with no correcting journal/snapshot writes. Integrated financial/browser/live evidence confirms the projection. |
| D | Legacy precision review is contextual; migration/recovery is conditional. Existing IndexedDB consent, safety, recovery and full backups remain intact. |
| E | Common periods and chart patterns, secondary closed control-point/raw-record disclosures, dynamic evidence labels. One closed “Weitere Verbindungen (optional)” section with two closed service rows, one save, unchanged endpoints/tokens/validation. Primary API-key setup and existing design retained. |
| Drive | Manual OAuth connection immediately offers encrypted backup or required password setup. Honest active-session scheduling; no closed-app promise. Existing full encrypted backup and restore paths retained. |

## Architecture and financial contract

Existing journal, wallet replay/day engine, price/provider transports and `priceHistories` are reused. Provider retention adds validated provenance, exact instrument/listing identity and explicit storage-right confirmation; incompatible providers or conflicting prices require explicit replacement. Local history stays primary. CSV raw-close histories can retain validated dated Frankfurter FX in the same record. Old CSV/backup formats remain compatible. No parallel store, mandatory backend, database or new worker.

Twelve explicitly requests `adjust=none`; FMP uses its documented non-split-adjusted EOD endpoint. Adjusted-only CSV cannot masquerade as actual historical position value. FX retains its actual reference date with bounded holiday carry. Midnight crypto observations map to the preceding UTC EOD; unaligned intraday quotes remain price observations only. CoinGecko/CoinPaprika and existing optional worker transports/settings remain intact. Provider failures retain local evidence; no free multi-year/Xetra guarantee or silent cross-provider merge.

## Actual verification

- `npm run check`: PASS. `npm test`: **658/658 PASS**, zero skipped/failing.
- [PR #144 CI 40217442188](https://github.com/joke0071/foliolab-open/actions/runs/40217442188): Chromium, Firefox/WebKit PASS.
- [PR #145 CI 40218196233](https://github.com/joke0071/foliolab-open/actions/runs/40218196233): Chromium, Firefox/WebKit PASS.
- [PR #146 current CI 40220378935](https://github.com/joke0071/foliolab-open/actions/runs/40220378935): Chromium, Firefox/WebKit PASS, including canonical USD CSV FX save/reload and dashboard integration; wallet checks PASS.
- [Main v176 CI/deployment 40220923062](https://github.com/joke0071/foliolab-open/actions/runs/40220923062): ALL PASS. Earlier v175 main 40218777354 also passed. One older runner stalled in dependency installation and was replaced; no test gate was bypassed or weakened.
- Executed relevant suites cover financial invariants, CSV/Bittr/transfer matching, historical quantities/raw prices/FX/aggregation, BTC/ETH/SOL/SPL replay and exact tiny-token display, IndexedDB migration/crash/recovery/concurrent/multitab, encrypted complete backup/restore, key privacy/security, PWA update/offline and scale. Existing visual dialog references passed. Responsive/A11y widths: 320/390/430/768/1024/1440. Additional local FX-dialog six-width axe/overflow pass, zero findings.

### Independent actual production acceptance

On 2026-10-25, from the matching release checkout:

- `RELEASE_SHA=25f5dcade24b54caf567e05db698c013c777a637 node tests/browser-live-acceptance.mjs`: PASS, **103 exact SHA-256 app/SW matches**, actual loaded app/CSS matches, active SW v176, 18 general axe scans with zero violations, real UI creation/edit/IndexedDB reload, plain/encrypted backup download and fresh-profile restore, offline navigation/save/reload, zero page errors. [Machine evidence](release-evidence/flh02-v176-live.json).
- `node tests/browser-live-purchase-evidence.mjs`: PASS, actual Pages Bittr preview/confirmation/undo/reload, IDB, encrypted complete restore, multitab, six widths/axe and private-field/XSS exclusion.
- `node tests/browser-live-flh02.mjs`: PASS, actual Pages 999/1059 EUR total without snapshots, partial/observed separation, six-width axe, optional controls/token preservation, zero financial writes. Also actual application USD CSV -> keyless dated FX load/keep -> canonical save -> reload -> 180/168 EUR history/dashboard; prices, holdings, journal and openings unchanged. [Extended evidence](release-evidence/flh02-v176-extended.json).

Live browser was Chromium. Firefox/WebKit were exercised in full CI on the identical application sources, not falsely described as live-browser runs. All live profiles/data were isolated and synthetic; external market traffic was blocked except explicitly mocked FX responses. Actual external provider availability is not inferred from those mocks. The environment's HTTPS inspection certificate exception is recorded in machine evidence; certificate validation is not claimed.

## User workflow

1. Import actual transactions or reconstruct/accept supported wallet history. Date an evidenced opening; undated present holdings cannot prove earlier ownership.
2. Import raw daily-close CSV or use an existing key and confirmed listing/provider. Retain provider data only when permitted. For a non-EUR local history, choose “EUR-Wechselkurse laden & behalten”; missing FX dates remain gaps.
3. Open history for EUR value, or select price/holdings/transactions. Overview and History show reconstructed evidence, a labeled partial portfolio or separate manual observations. Review coverage/control-point differences without changing the journal.
4. Keep manual control points as optional observations. Configure a backup password; connect Drive and use the offered backup action. Scheduling requires an active open session and valid authorization; local encrypted backups remain available.

## Evidence boundaries and remaining work

No FLH02 feature implementation or release blocker remains. Only the documentation closeout PR/main CI confirmation is required at creation of this record; once merged and green, closure is complete. Do not start another documentation-only loop to record a self-referential commit SHA.

Missing/undated holdings/cash, unsupported chain/staking ownership, unproven economic links, reorgs, unresolved clearing and excessive precision remain explicit gaps. Actual booked interest counts; forecasts do not. Existing performance gates remain; no invented TWR/XIRR, tax lot or return.

No real paid-provider keys or Drive test account were supplied. Provider entitlements/CORS/listing/storage rights and actual Drive account OAuth are account-specific and remain unconfirmed; synthetic authorization/API contracts and real local backup flows were tested. Yahoo/RapidAPI and CoinMarketCap remain separate optional future work, not release dependencies.

Private reference files stay local. No real financial CSV, names, wallet history, keys or encryption material is committed. Accepted A's private wallet text lacks output identities; no fabricated real matching counts are supplied. Earlier v175 evidence is preserved in `docs/release-evidence/flh02-v175-*.json`.
