# FLH02 work checkpoint — completion candidate

Specification: exact Library FLH02 document, version 11. Existing accepted A / FLH01 / IndexedDB work is not repeated.

- Verified main: `8e12ae1ad1a0b517eab3404a2dacbe9b31ab61db`, A released/accepted as v171.
- Branch: `feature/flh02-position-value-foundation`, PR https://github.com/joke0071/foliolab-open/pull/144.
- Previous remote checkpoint: `7bb3ebf32d029b1941a569102407ce802a3009de`. Current commit: this checkpoint's containing commit; resolve branch HEAD.
- Candidate shell: v175. NOT merged/released yet.

| Package | Implementation / acceptance |
|---|---|
| A | DONE, merged/live v171. Private rendered wallet text lacks output identities; no fabricated real matching counts. |
| B | Implemented candidate: EOD journal/chain quantities, exact close/FX projection, EUR default and value/price/quantity/transaction views, shared mini-card projection, disjoint segments, 6M/3J/5J/Max presets, explicit rights-confirmed retention in existing priceHistories with source/identity conflicts blocked. |
| C1 | Implemented candidate: cash/journal/chain aggregation; sold positions retained under existing deletion guard; excluded economic representations not counted twice, liabilities signed, overlapping wallets and unresolved cash clearing block full claims. No present holdings backfilled. |
| C2 | Implemented candidate: overview/history share one pure projection; observations stay separate, explicit partial portfolio label, manual controls secondary. |
| C3 | Implemented candidate: read-only coverage and snapshot discrepancies, no correcting writes; synthetic integrated browser checks. |
| D | Implemented candidate: legacy migration disclosure is conditional global recovery entry, existing safety retained; precision audit appears only in relevant data-quality review. |
| E | Implemented candidate: main history has no optional green plus, secondary disclosures, dynamic source status; optional services consolidated with one shared save and unchanged fields/validation. |
| Drive | Implemented candidate: OAuth in manual mode explicitly offers enabled encrypted backup; session-only schedule wording, no closed-app promise; password/full restore retained. |

## Actually executed

- Syntax check passed. Latest complete unit run: 657/657, zero skipped/failing.
- New Chromium FLH02 integration passed: 999/1059 total with no snapshots, observed/partial separation, six widths, axe, preserved optional endpoints/token and zero financial writes.
- Updated BTC/ETH/SOL/SPL history UI suite passed, including encrypted restore, exact raw-token display, multitab and backup preference persistence. Purchase matching implementation untouched.
- Existing Chromium suites passed from smoke through CSV/Flatex/dialog/position/history suites. Continued full local run still needs completion; remaining failures found were superseded UI contracts (manual button priority, period count, precision-review location); original financial/safety assertions retained.
- Full replacement PR CI including Firefox/WebKit REQUIRED. Local WebKit lacks libraries and local Firefox page creation hangs; CI is the supported cross-engine gate here. No unexecuted tests claimed.
- Previous v171 live evidence remains in docs/FLH02_A_RELEASE_AND_LIVE_ACCEPTANCE.md. No combined FLH02 live release claimed yet.

## Financial/provider boundaries

- Unknown/undated opening balances, bank histories or unsupported chain/staking facts remain explicit gaps. Only actual journal interest credits count as cash; forecasts are not actual historical wealth. No new tax/performance release.
- Chain evidence uses the existing validated replay/day engine and explicit account/asset scope. Overlap/reorg/partial coverage never becomes a verified full total. Very large calculations fail with a clear bounded-calculation message rather than locking UI or inventing zeros.
- API entitlements/CORS without a real test account remain unverified; 401/403/429/offline retain local evidence. Keys and CSV stay local. Provider cache requires explicit storage-right confirmation; no cross-provider silent merge. Existing priceHistories/backup/quota contract, no parallel persistent store.
- Twelve requests explicitly use adjust=none; FMP uses the documented non-split-adjusted endpoint. CoinGecko midnight UTC observations map to the preceding EOD for valuation; unaligned intraday observations remain usable price observations but do not become EOD values. No provider-free multi-year promise.

## First remaining actions

1. Local Chromium workflow suites passed in sequential segments through PWA/offline/scale, including precision repair and configured worker compatibility. Full current CI (replacement of run 40216424171) remains authoritative; fix genuine errors and adapt old navigation contracts without weakening their financial/security assertions.
2. Verify full current PR CI, including new FLH02 suite on Firefox/WebKit; inspect failed job logs and fix reproducible defects.
3. Update release report, integrate only green conflict-free PR #144 on current main, verify main CI/Pages and actual production assets/SW + synthetic live tests.

## Exact resumption

> Continue FLH02 PR #144 on feature/flh02-position-value-foundation from this checkpoint and specification v11. A is already v171/live. B/C1/C2/C3/D/E/Drive code is a completion candidate, not yet accepted. Finish remaining Chromium and all-engine CI gates, address failures, then merge under existing explicit authorization, verify main deployment and actual live acceptance. Never replay accepted A/FLH01/IndexedDB work or replace unknown financial values with zero. Keep every next safe increment remote and update this checkpoint.

Latest fixes after initial candidate: precision discrepancies now create a data-quality review entry; exact decimals beyond supported scale remain explicit gaps, economic representation needs dated same-scope proof; partial-series scope changes break the line; FX retains actual reference date; price-only view remains usable without holdings; async quote retention is identity/revision bound. Unit suite 657/657; affected Chromium suites passed.
