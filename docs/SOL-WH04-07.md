# Integrated WH04–WH07 work log

Base main: 875806c10c2834fd76654c97a9ab55db5cfc4485; WH01–03 merged, no open PRs at intake; main CI 40135229240 green. Read issue #119, consolidated comment 6389893552 and all four original comments. One branch, sequential gates; no main merge/deployment.

## A — WH04 storage and backup

Accepted canonical events, explicit streams/openings/coverage and acceptance decisions live in optional walletHistory schema 1 inside the EXISTING v3 portfolio record. No new DB/store/storage-mode engine. PortfolioStorage local WebLocks/source comparison and IndexedDB CAS/tombstone paths are reused unchanged in behavior. No journals, snapshots, Flatex or returns are rewritten. safeImport validates the optional history, all old versions remain readable, and corrupt histories fail closed.

Provider pages remain transient; persistent pending metadata is public, source-sanitized and always marked re-fetch-needed. No raw provider payload or secret-bearing RPC path is put in portable history. If memory cache is lost, resume requires re-fetching and revalidation rather than trusting an unverifiable cursor. This conservative restart is explicit; durable raw-page caching is deliberately excluded. One accepted preview is one validated atomic chunk; idempotent replacement never merges reorg revisions blindly. Reorg invalidation preserves evidence/decision while demoting coverage. No automatic history acceptance.

Open JSON exports omit history by default. Internal IDB serialization explicitly preserves it. A separate opt-in checkbox adds accepted histories (without pending/cache) only to the existing encrypted complete-backup payload, including Drive's existing encrypted backend. OAuth tokens/device vault secrets remain excluded. Existing restore prompts and CAS apply. Old complete backups without history stay valid.

Gate A evidence: 20 targeted Node tests initially green (including real AES encrypted roundtrip plus existing Drive/Vault simulations); added reorg invalidation test green. Full Node baseline after storage changes: 516/516; syntax check green. New browser-history-storage passed Chromium and Firefox: local + IDB roundtrip, stale writer blocked, simulated quota leaves committed history byte-identical, pending metadata restore and no open-export history. Existing browser-idb-migration-resilience, corrupt-backup-restore, multitab-integrity and settings-backup passed. WebKit also passed the same storage/restore/CAS/quota gate. Gate A passed before B. Node fixture-only prototype assertion failure fixed by comparing original serialized model bytes (structuredClone normalizes null prototypes); no existing tests weakened.

Real Google-account, physical hardware, browser OS eviction and power-cut tests are not simulated success claims. Existing Drive tests use mocked Google requests; quota/crash/blocked-upgrade tests use explicit fault injection. Provider eviction cannot erase accepted history because no provider cache is its canonical store.

## B — WH05

Gate B passed before C: existing Positionen → wallet row → Historie rekonstruieren. BTC/HD and Ethereum adapters are wired, wallet/period/from-date selection, provider progress, cancel/resume, privacy text, explicit preview/discard/accept, saved read-only event list with chain links and UTC daily balances within evidenced dates. Partial quantities remain unknown; no zero backfill or portfolio return integration. Pending metadata is persisted only on incomplete/aborted fetch; raw pages are memory-only and safely re-fetched after reload. Reorg observations invalidate historical claims through the existing save path without deleting evidence.

33 targeted Node tests passed (existing BTC/ETH adapters plus state/day checkpoints). Chromium, Firefox and WebKit UI E2E passed: real mocked adapter HTTP flow, preview does not persist, discard, acceptance, reload, unchanged financial journal/positions/snapshots, abort/resume, widths 320/390/430/768/1440 and axe WCAG2A/AA/2.1AA with zero violations. Native dialog traps keyboard focus; close restores entry focus after app re-render. Hidden-action CSS bug found by E2E was fixed. Fixture CSP respected by serving axe from the test origin. Browser HTTP fixtures run with Service Workers blocked and context routing (WebKit otherwise bypassed interception and hit the real public BTC address); actual PWA behavior is tested separately, not simulated by this UI fixture. Display is bounded to 365 daily checkpoints between evidenced transaction dates and paginated events; all accepted facts stay persisted.

## C — WH06

Gate C passed before D: existing Solana/Helius URL validation is reused; historical RPC methods require an explicit history=true option and a narrow read-only whitelist. Mainnet genesis is verified against the official Solana full genesis hash (https://solana.com/docs/payments/agentic-payments/x402). Same configured archive is retained throughout a session, without silently switching private endpoints. Secrets are not placed in checkpoint scope: configuration is SHA-256 bound; accepted source is hostname only.

SOL uses exact pre/post native deltas with separately applied fee, failed fee-only, observed prebalance anchors, canonical finalized slot/block proof and fixed finalized snapshot native scanner reconciliation. v0 loaded addresses and signature block ordering are handled. SPL tracks mint/owner/decimals/account index and exact raw net effects, including 24 decimals, and learns historical token accounts for further paging. These are transaction/account net facts, not fabricated instruction-level rewards. Closed accounts/missing owner/open-close sides/Token-2022 and extensions are partial; no inferred zero/reward. Signatures use before pagination; state is scope/tip bound, retained transactions and signature prefixes are revalidated, archive gaps remain marked across resume. Missing pre/post continuity is a gap, not a verified balance. No Solana private key or send method.

21 targeted Node cases passed including existing Solana scanner fallback regressions; new native/SPL, v0, closed/unknown owner, Token-2022, fee, failed, overlap, pagination/resume/corrupt cursor, archive-null, HTTP 403/429/500, timeout, abort and method denial fixtures. Chromium/Firefox/WebKit cross-chain UI E2E passed with SOL/SPL accepted in the same store and actual AES encrypted BTC/ETH/SOL history roundtrip. Native-only fixture reconstructs 85 lamports from an observed 100-lamport opening minus movement/fee. SPL fixture correctly shows unknown total holdings while keeping its exact 7-base-unit event. Quality explanations are human-readable; raw codes remain available in titles for diagnosis. No live archive or real Helius account has been certified by fixtures.

## D — WH07

Implemented after Gate C. Existing position-history CoinGecko/CoinPaprika EUR fallbacks and coin IDs price native BTC/ETH/SOL. ERC-20 contract and SPL mint identity is never guessed from a ticker: existing local EUR CSV history requires explicit confirmation for this exact asset. Quotes are date/chain/contract/mint bound, validated and source-sanitized; conflicting quotes reject. All displayed EUR values remain labelled estimates, including with verified holdings. Missing/non-EUR/wrong-date/wrong-identity/zero quotes and partial quantities produce an unknown EUR cell, never a fake zero. No free interpolation or automatic FX conversion is introduced. A genuine verified zero quantity times a positive quote may correctly equal EUR zero.

Day rows include unchanged UTC calendar days only BETWEEN evidenced first/last transaction dates, never extrapolation outside the proven interval. The existing chart/keyboard interaction and wealth period definitions are reused; a chart is drawn only for one asset with contiguous known daily values, so it cannot bridge a quote gap. Price loading creates a new preview requiring acceptance. It does not alter asset prices, positions, journal, snapshots, XIRR/TWR, FIFO or tax data.

Performance audit measured approximately 4.5 seconds for synchronous 1,000-event/334-day replay. Calculation now runs in a same-origin module Worker using WH01 replay, with cancellation, a 15-second budget and a three-entry memory cache. Main-thread heartbeat in Chromium/Firefox/WebKit was 29–93 ms during the 1,000-event calculation; cancellation passed. All modules are revision-precached. A real offline WebKit worker-load failure found by regression was fixed with a cooperative day-by-day fallback to the SAME replay generator, limited to 5,000 events; larger offline histories report an explicit retry-online limitation. It introduces neither a second history engine nor cached API responses. No row is manufactured on calculation timeout.

Persistent history limits are 100 accepted sessions, 50,000 events total and 8 MB encoded history; acceptance also checks a 10 MB combined portfolio envelope to stay under the existing 20 MB backup input limit. Limits reject acceptance explicitly; accepted data is never silently evicted/pruned. Duplicated identical facts canonicalize, conflicting revisions reject, and persisted coverage can only be downgraded by validation. Full raw page eviction causes a scoped re-fetch, not loss of accepted facts.

Final audit follow-up: advancing finalized Solana tips formerly caused an unnecessary restart after a long scan. A regression now advances the tip during pagination and proves a fixed, scanner-observed snapshot remains valid; transactions after that snapshot are excluded. Canonical snapshot hash changes still reject, and newer resume scanner data is never mislabeled as an old-slot balance. Missing transaction outcomes and failed token-state conflicts are conservative. Cancellation of EUR loading prevents a late result from replacing the preview; an already-sent price request may complete under the existing global coordinator/timeouts without being accepted. No new provider rate-limit infrastructure is introduced.

## Acceptance matrix — WH04

| Requirement | Implementation / evidence | Result |
| --- | --- | --- |
| Validated events, decisions, coverage persist | wallet-history-state + existing portfolio v3; duplicate/conflict regression | PASS |
| Atomic/idempotent writes, two tabs, quota/crash | Existing CAS/WebLocks/tombstones; browser-history-storage and existing concurrent/crash gates | PASS |
| Abort/resume/provider/tip binding | Memory cursor revalidation; durable sanitized schema/wallet/filter/provider/scope/tip marker; reload explicitly re-fetches | PASS with documented cache limit |
| Reorg rollback, no coverage upgrade | Evidence preserved; invalidation + replay quality downgrade; Node fixtures | PASS |
| Blocked IndexedDB | Injected open onblocked rejection, late success closed, committed history unchanged | PASS simulation |
| Optional encrypted complete backup | Existing vault v2 encrypt/decrypt; explicit history opt-in; portable cache excluded | PASS |
| v1/v2/v3 and Google Drive compatibility | Existing Node/Drive/Vault and browser restore gates; new optional field, no format migration | PASS simulations; live Google manual |
| No secret/open JSON leakage or financial changes | Export defaults omit history; credential-free projection; unchanged journal/snapshots fixtures | PASS |

## Acceptance matrix — WH05

| Requirement | Implementation / evidence | Result |
| --- | --- | --- |
| Position wallet entry, BTC/HD + ETH selection | Existing adapters wired through one dialog; no new navigation | PASS |
| Period, progress, abort/resume, source/time | Shared period definitions; live status, provider checkpoints, re-fetch explanation | PASS |
| Preview / accept / discard | Actual adapter HTTP fixtures; no accepted writes before confirmation; stale-tab acceptance rejected | PASS |
| Daily amounts/events, quality, explorer links | Exact raw amounts, bounded days/events, source and quality explanations | PASS |
| Privacy, no finance classification | Address/xpub disclosure, seeds prohibited; transfer is not a cash flow | PASS |
| Mobile/keyboard/focus/a11y | 320/390/430/768/1440; native dialog focus; chart arrows; axe zero A/AA/2.1AA violations | PASS all three engines |
| BTC overlap / ETH logs/fees / restore | Existing WH02/03 unit/browser regression; cross-chain UI + encrypted restore | PASS |

## Acceptance matrix — WH06

| Requirement | Implementation / evidence | Result |
| --- | --- | --- |
| Existing RPC/Helius, read-only history methods | Explicit historical whitelist, safe endpoints, no send/sign method | PASS |
| Signatures/transactions pagination, retries/resume | before cursor; duplicate/nonadvance rejection; retained pages/TX/block revalidation | PASS fixtures |
| Exact SOL amounts/fees, failed, eigen transfers | pre/post deltas, fee once, canonical signature/account IDs, duplicate fixtures | PASS |
| SPL mint/owner/decimals/token accounts | Exact raw net account effects, current + historically learned accounts | PASS qualified facts |
| v0 loaded addresses, finality/reorg | Loaded keys, finalized slot/block proofs; changed tips require safe restart | PASS fixtures |
| Closed/old accounts, Token-2022, LST/DeFi/archive holes | Partial/unknown; no invented zero or reward; optional archive source explained | PASS conservative quality |
| Same UI/storage/resume/backup | SOL/SPL in BTC/ETH dialog/store; vault v2 roundtrip across all chains | PASS all three engines |

Solana events intentionally represent proven transaction/account net changes, with stable signature + account subindex IDs, rather than pretending to decode every instruction/inner instruction. Internal account movements are deduplicated; these facts are not transaction classification, rewards attribution or a complete token-account census. Native current scanning is captured at an actual finalized slot before pagination; normal tip advancement is allowed while that snapshot block remains canonical. Newer scanner contexts during resume are partial and are never falsely attributed to the old snapshot. Closed token accounts and undiscovered historic accounts prevent verified SPL total balances. This conservative limitation is visible to the user.

## Acceptance matrix — WH07

| Requirement | Implementation / evidence | Result |
| --- | --- | --- |
| Dated EUR + proven quantities only | Exact BigInt multiplication, existing decimal contract; missing/wrong-date/non-EUR quote fixtures | PASS |
| Contract/mint/coin ID identity | Frozen asset tuple; token local history requires explicit binding; conflicts rejected | PASS |
| Estimated/verified/partial/missing distinction | Quantity quality separate from estimated EUR; no phantom null-to-zero | PASS |
| Existing periods/chart, UTC day boundaries | Shared chart modules, contiguous series only; daily gap/boundary tests | PASS |
| No financial engine changes | No edits to performance, transactions, Flatex, FIFO or tax engines; UI financial byte checks | PASS |
| Cross-chain integration + storage/privacy | BTC/ETH/SOL/SPL UI, actual AES vault v2, two tabs, old backup/credential gates | PASS |
| Performance/cancel/offline/PWA | Worker heartbeat, cancellation, real SW offline computation, PWA update/offline-mobile | PASS; explicit size/time limits |
| Full regression and CI | Commands below; GitHub run and tested target SHA recorded in final PR | Await final CI evidence |

## Final executed verification and manual gates

- `npm run check`: PASS. `npm test`: **534 passed, 0 failed, 0 skipped**. Includes wallet/blockchain, financial, storage, encrypted v1/v2/v3 restore and Drive/Vault simulations.
- `HISTORY_ENGINES=chromium,firefox node tests/browser-history-ui.mjs` and WebKit separately: PASS. Real adapter HTTP fixtures, four wallet types, explicit CSV EUR binding, chart keyboard, five viewport widths, axe, preview/accept/discard, abort/resume, stale second-tab rejection and encrypted vault v2 cross-chain roundtrip.
- `browser-history-storage.mjs` and `browser-history-worker.mjs` executed separately on Chromium, Firefox and WebKit. Storage includes real localStorage/IndexedDB and simulated quota/blocked upgrade; worker includes 1,000-event responsiveness/cancel and actual SW-controlled offline computation.
- Additional Chromium: `browser-pwa-updates.mjs`, `browser-offline-mobile.mjs` (4x CPU throttle, 240 holdings/730 snapshots), `browser-idb-crash-recovery.mjs`, `browser-idb-concurrent-imports.mjs`, `browser-idb-corrupt-recovery.mjs`, `browser-key-privacy.mjs`: PASS. Earlier phase gates also executed migration-resilience, corrupt-backup-restore, multitab-integrity and settings-backup.
- New browser/storage/UI/worker checks are added to BOTH existing Chromium and Firefox/WebKit CI jobs; no existing tests removed or weakened. CI retains unit/syntax/tested SHA artifacts and skips deployment on PRs.
- Public probe, without a private wallet address: Bitcoin tip HTTP 200 with CORS `*`; Ethereum Blockscout blocks and public Solana genesis HTTP 403 from this environment. These are access/provider limitations, not successful live archive acceptance. No real Google account, Helius credential or private archive was used.

Remaining manual release gates: encrypted Google Drive upload/restore on a real account, real phone/tablet/Safari devices, browser/OS eviction and physical power loss, and production archive/provider limits with representative consenting public addresses. Deterministic mocks/fault injection are explicitly not those hardware/account tests. Native ETH protocol credits and rebase/complex tokens retain the WH03 partial contract; Solana SPL totals/closed accounts stay partial. Historical EUR availability depends on provider retention/free limits or explicitly mapped local EUR CSV data. There is no promise of universal verified history.

Recommendation: review the single PR and its final green CI; merge only by separate maintainer approval. Do not deploy or automatically promote historical data into portfolio accounting. All four engineering phases are implemented; final CI status is tracked in the PR.
