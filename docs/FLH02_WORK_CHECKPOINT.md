# FLH02 work checkpoint — v175 accepted; v176 FX completion candidate

Specification: exact Library FLH02 document version 11, including A–E and 7.11–7.14. No accepted FLH01 or IndexedDB work was reimplemented.

A final audit identified that local foreign-currency CSV had no direct keyless FX-loading action and mini charts discarded retained FX. Candidate v176 fixes this safely before final closeout. All earlier v175 evidence below remains historical and valid.

## Identity and remote state

- Implementation branch: `feature/flh02-position-value-foundation`, [PR #144](https://github.com/joke0071/foliolab-open/pull/144), merged as `cb2e6d1d23b2fcac29b609306c0bf8954679bb86`.
- Pre-live checkpoint and manual live test: [PR #145](https://github.com/joke0071/foliolab-open/pull/145), merged as `eb737df8979c7708d678de8045bd2b48db9e8e2f`.
- Actually tested/deployed/live-accepted main SHA: `eb737df8979c7708d678de8045bd2b48db9e8e2f`. App implementation bytes are unchanged by the documentation closeout.
- Current closeout branch: `docs/flh02-v175-acceptance`, [PR #146](https://github.com/joke0071/foliolab-open/pull/146); commit is this file's containing commit. Its PR now also contains the targeted v176 FX fix; final PR/main CI links are recorded in its GitHub description. Resolve final main with `git ls-remote origin refs/heads/main`.
- Production: [FolioLab Open](https://joke0071.github.io/foliolab-open/), active `foliolab-open-v175`.

| Package | Final status |
|---|---|
| A | DONE: accepted v171, preserved; actual v175 Bittr UI/IDB/backup/multitab regression PASS. No duplicate stock/cash/cost basis. |
| B | v176 candidate, not yet released: local non-EUR CSV/provider histories can load and keep dated historical FX without a security API key; mini charts retain FX. Existing v175 scope: evidenced EOD quantities × raw close × historical FX, EUR default, price/holdings/transactions, shared miniature charts, gaps/provenance, 6M/3J/5J/Max within actual data coverage; explicit rights-confirmed retention in existing history store. |
| C1 | DONE: read-only journal/cash/chain aggregation, actual booked interest and signed liabilities; missing ownership, opening facts, clearing and wallet overlap block full-total claims. |
| C2 | DONE: dashboard/history share the projection; actual 999/1059 EUR synthetic live result without snapshots. Separate observation/partial bases and optional control points. |
| C3 | DONE: coverage, explicit gaps, independent snapshot differences, no automatic corrections; integrated unit/all-engine/browser/live gates. |
| D | DONE: contextual precision review and conditional recovery/migration entry, existing migration and backup safety retained. |
| E | DONE: secondary control-point/raw-record disclosures; consistent periods/charts; one closed optional connections entry, independent preserved endpoints/tokens, one save, primary API-key setup. |
| Drive | DONE: manual OAuth connection offers encrypted backup or password setup immediately; honest open-session scheduling; existing full encrypted backup/restore retained. Real account authorization remains account-specific, untested without supplied test account. |

## Actually passed

- `npm run check`; `npm test`: latest 658/658, zero skipped/failing.
- [PR #144 gate 40217442188](https://github.com/joke0071/foliolab-open/actions/runs/40217442188): Chromium and Firefox/WebKit PASS, wallet checks and informational wallet audit also successful.
- [PR #145 gate 40218196233](https://github.com/joke0071/foliolab-open/actions/runs/40218196233): Chromium and Firefox/WebKit PASS.
- [Main release/deployment 40218777354](https://github.com/joke0071/foliolab-open/actions/runs/40218777354): test, cross-engine and Pages deploy ALL PASS. Earlier main run 40217903807 was cancelled after a runner stalled during browser-dependency installation; no gate was weakened or bypassed.
- Relevant executed suites include financial invariants, CSV/Bittr/transfers, historical quantities/raw prices/FX/aggregation, BTC/ETH/SOL/SPL histories, exact tiny-token display, IndexedDB migration/crash/recovery/concurrent/multitab, encrypted full backup/restore, privacy/security, PWA update/offline and scale. Existing visual dialog references passed. Six required widths: 320/390/430/768/1024/1440.
- Actual production acceptance: 103/103 exact SHA-256 file matches including SW, actual loaded app/CSS match, active SW v175, 18 general axe scans with zero findings, actual UI creation/edit/reload, plain/encrypted downloads and fresh-profile restore, offline save/reload, zero page errors.
- Additional actual production tests: purchase evidence preview/confirm/undo/reload, encrypted restore, multitab, six-width axe and private-field/XSS checks PASS; total-value/partial/observed/settings six-width axe E2E PASS with zero financial writes.
- Machine evidence: [general live report](release-evidence/flh02-v175-live.json), [extended live report](release-evidence/flh02-v175-extended.json). Detailed behavior and user workflow: [final release report](FLH02_FINAL_RELEASE_AND_LIVE_ACCEPTANCE.md).

## Known evidence boundaries

Unknown/undated openings, unsupported chain/staking ownership, unproven economic representations, reorg/overlap/clearing and excessive precision remain explicit gaps. Actual interest credits count; forecasts do not. No invented totals, returns, tax lots or historical ownership. No new backend, database, worker or mandatory proxy.

Paid-provider live entitlements/CORS and real Drive OAuth were not asserted without supplied test accounts/keys. Synthetic API/authorization contracts and real local UI/backup flows were tested. No free multi-year promise, silent provider mixing or closed-app backup promise. Existing optional workers/settings remain compatible. The HTTPS inspection certificate exception used by the local browser runtime is recorded in machine evidence; certificate validation is not claimed.

Private reference files stay local; only synthetic fixtures and public app hashes enter git. Accepted A's private wallet text lacks output identities; no fabricated real matching counts.

## Remaining safe closeout

First finish PR #146 v176: current unit suite 658/658 and affected Chromium history/mini/FX + portfolio integration passed. Actual-app canonical USD CSV FX save/reload and dashboard value passed locally too. Histories with CSV/dated opening are reachable without purchase bookings. This case is included in both Chromium and Firefox/WebKit CI. Required current all-engine CI remains pending. Merge only green/conflict-free; verify full main CI/deployment and actual v176 live acceptance including USD CSV FX and mini values. Then record final v176 evidence and merge the documentation closeout. Do not claim v175 proves the new v176 action. Preserve the live evidence; do not repeat accepted A/FLH01/IndexedDB implementation or a full audit.

## Exact resumption if interrupted during documentation closeout

> Continue FLH02 v11 from docs/FLH02_WORK_CHECKPOINT.md and PR #146 on docs/flh02-v175-acceptance. Existing A/B/C1/C2/C3/D/E/Drive v175 release is live accepted at eb737df8979c7708d678de8045bd2b48db9e8e2f, workflow 40218777354 green. A final B fix in v176 adds keyless dated FX loading/retention for foreign-currency local histories and preserves FX in mini charts. Local check, 658 unit tests and affected Chromium suites pass; finish current all-engine PR CI, merge under existing authorization, verify main deployment and v176 live including FX, then finalize evidence. Do not repeat prior feature audits.
