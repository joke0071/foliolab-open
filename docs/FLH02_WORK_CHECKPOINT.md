# FLH02 work checkpoint — merged, production gate pending

Specification: exact Library FLH02 document, version 11. Existing accepted A / FLH01 / IndexedDB work is not repeated.

- Verified main: `8e12ae1ad1a0b517eab3404a2dacbe9b31ab61db`, A released/accepted as v171.
- Branch: `feature/flh02-position-value-foundation`, PR https://github.com/joke0071/foliolab-open/pull/144.
- Previous remote checkpoint: `7bb3ebf32d029b1941a569102407ce802a3009de`. Current commit: this checkpoint's containing commit; resolve branch HEAD.
- PR #144 merged at `cb2e6d1d23b2fcac29b609306c0bf8954679bb86`; all PR gates passed: https://github.com/joke0071/foliolab-open/actions/runs/40217442188.
- Main gate/deployment: https://github.com/joke0071/foliolab-open/actions/runs/40217903807, in progress. Candidate shell v175; not yet live-accepted.
- Documentation/acceptance branch: `docs/flh02-v175-release`; PR to be linked after creation.

| Package | Implementation / acceptance |
|---|---|
| A | DONE, merged/live v171. Private rendered wallet text lacks output identities; no fabricated real matching counts. |
| B | Implemented/merged; final live gate pending: EOD journal/chain quantities, exact close/FX projection, EUR default and value/price/quantity/transaction views, shared mini-card projection, disjoint segments, 6M/3J/5J/Max presets, explicit rights-confirmed retention in existing priceHistories with source/identity conflicts blocked. |
| C1 | Implemented/merged; final live gate pending: cash/journal/chain aggregation; sold positions retained under existing deletion guard; excluded economic representations not counted twice, liabilities signed, overlapping wallets and unresolved cash clearing block full claims. No present holdings backfilled. |
| C2 | Implemented/merged; final live gate pending: overview/history share one pure projection; observations stay separate, explicit partial portfolio label, manual controls secondary. |
| C3 | Implemented/merged; final live gate pending: read-only coverage and snapshot discrepancies, no correcting writes; synthetic integrated browser checks. |
| D | Implemented/merged; final live gate pending: legacy migration disclosure is conditional global recovery entry, existing safety retained; precision audit appears only in relevant data-quality review. |
| E | Implemented/merged; final live gate pending: main history has no optional green plus, secondary disclosures, dynamic source status; optional services consolidated with one shared save and unchanged fields/validation. |
| Drive | Implemented/merged; final live gate pending: OAuth in manual mode explicitly offers enabled encrypted backup; session-only schedule wording, no closed-app promise; password/full restore retained. |

## Actually executed

- Syntax check passed. Latest complete unit run: 657/657, zero skipped/failing.
- New Chromium FLH02 integration passed: 999/1059 total with no snapshots, observed/partial separation, six widths, axe, preserved optional endpoints/token and zero financial writes.
- Updated BTC/ETH/SOL/SPL history UI suite passed, including encrypted restore, exact raw-token display, multitab and backup preference persistence. Purchase matching implementation untouched.
- Existing Chromium suites passed from smoke through CSV/Flatex/dialog/position/history suites. Continued full local run still needs completion; remaining failures found were superseded UI contracts (manual button priority, period count, precision-review location); original financial/safety assertions retained.
- Replacement PR CI 40217442188 PASSED Chromium, Firefox and WebKit. Full main CI/deployment 40217903807 is in progress. Local WebKit lacks libraries and local Firefox page creation hangs; CI is the supported cross-engine gate here. No unexecuted tests claimed.
- Previous v171 live evidence remains in docs/FLH02_A_RELEASE_AND_LIVE_ACCEPTANCE.md. No combined FLH02 live release claimed yet.

## Financial/provider boundaries

- Unknown/undated opening balances, bank histories or unsupported chain/staking facts remain explicit gaps. Only actual journal interest credits count as cash; forecasts are not actual historical wealth. No new tax/performance release.
- Chain evidence uses the existing validated replay/day engine and explicit account/asset scope. Overlap/reorg/partial coverage never becomes a verified full total. Very large calculations fail with a clear bounded-calculation message rather than locking UI or inventing zeros.
- API entitlements/CORS without a real test account remain unverified; 401/403/429/offline retain local evidence. Keys and CSV stay local. Provider cache requires explicit storage-right confirmation; no cross-provider silent merge. Existing priceHistories/backup/quota contract, no parallel persistent store.
- Twelve requests explicitly use adjust=none; FMP uses the documented non-split-adjusted endpoint. CoinGecko midnight UTC observations map to the preceding EOD for valuation; unaligned intraday observations remain usable price observations but do not become EOD values. No provider-free multi-year promise.

## First remaining actions

1. PR #144 is merged with all gates green. Local Chromium workflow suites passed in sequential segments through PWA/offline/scale, including precision repair and configured worker compatibility. Full current CI (replacement of run 40216424171) remains authoritative; fix genuine errors and adapt old navigation contracts without weakening their financial/security assertions.
2. Verify main workflow 40217903807 including Pages deployment; run browser-live-acceptance.mjs, browser-live-purchase-evidence.mjs and browser-live-flh02.mjs against actual production v175.
3. Record actual production evidence, finalize documentation PR, merge only after its green gates; verify final main and deployment. Application bytes must remain unchanged for documentation closeout.

## Exact resumption

> Continue FLH02 specification v11 from docs/flh02-v175-release. PR #144 is merged as cb2e6d1d23b2fcac29b609306c0bf8954679bb86; PR CI 40217442188 passed all engines. A was v171/live. Verify main CI/deployment 40217903807 and actual v175 live acceptance, then finalize and merge release documentation under existing authorization. Never replay accepted A/FLH01/IndexedDB work or replace unknown financial values with zero. Keep every next safe increment remote and update this checkpoint.

Latest fixes after initial candidate: precision discrepancies now create a data-quality review entry; exact decimals beyond supported scale remain explicit gaps, economic representation needs dated same-scope proof; partial-series scope changes break the line; FX retains actual reference date; price-only view remains usable without holdings; async quote retention is identity/revision bound. Unit suite 657/657; affected Chromium suites passed.
