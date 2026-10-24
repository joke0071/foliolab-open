# SOL-WH02 — Bitcoin history adapter

Scope: issue #119 / comment 6388746639. Baseline main `7f91a18524bfcba2ab5b301aa3bfb7af8101b317`, PR #120 integrated; no open PRs; main Actions 40128821859 green. Reviewed WH01 contract, core, bitcoin-hd, market, blockchain-adapters and existing financial/backup/storage/wallet tests. Official provider contract: https://github.com/Blockstream/esplora/blob/master/API.md (25 confirmed/page, 50 mempool cap, vin.prevout/vout amounts in satoshis).

## Delta and API

`src/bitcoin-history.js` is independent of application UI and persistence. `fetchBitcoinHistory({wallets, fetcher, signal, endpoint, maxPages, timeoutMs, retries, retryDelayMs, resume, onCheckpoint, observedAt})` returns read-only data. Wallets use existing `{chain:'btc'|'btc-hd', address, accountId, addressType?}` identities. `bitcoinHistoryEvents(transactions, walletsWithAddresses, options)` provides pure normalization for fixtures/consumers. No app integration or journal posting. No modifications to HD derivation, core, journal, returns, snapshot, portfolio or backup schemas.

Existing `scanBitcoinAccount` supplies address-type detection, receive/change derivation and gap20 (existing 100-address/branch ceiling). `validateAddress` is reused. No second HD implementation. For xpub, auto detection probes native/nested/legacy as before; empty ambiguous xpub produces `hd-address-type-unknown` and no balance. Explicit xpub format, ypub and zpub can evidence an unused account. Taproot is unsupported. Single mainnet Legacy, nested and native SegWit addresses follow existing validation. Public xpub derivation requires WebCrypto/HTTPS.

History requests use uncached GETs only and reject redirects; optional endpoint must be HTTPS without credentials/query/hash. No broadcast, private keys, seeds, signatures, backend or cloud database. Public address/xpub-derived requests disclose the queried address set to the chosen indexer; no keys are logged. Error reports contain stable codes, not arbitrary upstream error text.

## Reconstruction and integrity

- All satoshis use BigInt arithmetic locally and JSON integer strings externally. Numeric provider values must be safe nonnegative integers; unsafe JSON numbers are rejected. No prices, economic classifications or yields are inferred.
- Each raw owned vin debit and vout credit keeps its native transaction index. UTXOs are reconstructed from confirmed owned outputs minus referenced spent outpoints. They are confirmed-state facts, not a claim of spendability/maturity or mempool availability.
- Shared derived/single addresses union canonical custody groups; aliases are returned explicitly. This is only a reconstruction view and never rewrites existing accounts. A transaction appearing at multiple addresses is normalized once; conflicting versions block verification.
- Self/change and cross-owned legs use internal transfer facts; these are never external investor deposits. The full raw input debit includes fees already. A separately displayed fee links to an adequate raw debit via WH01 `includedInEventId` and is not subtracted again. Fee attribution requires all inputs in a single canonical owned account and an adequate debit. CoinJoin/mixed-owner or otherwise unprovable allocation is partial (`fee-allocation-unknown`); no invented allocation. Multiple owned account deltas remain exact, but ambiguous fee ownership prevents a verified report.
- Confirmed terminal pagination plus per-address unique transaction counts is required before a zero genesis opening can be used. Missing prevouts, count gaps, unsafe amounts, mismatched scanner sums or incomplete ownership evidence prevent verified holdings. Data completeness is relative to the scanned gap window and provider, not a mathematical proof that no address beyond the gap exists.
- Confirmed events and mempool are separate results. Mempool events have unknown block/time and `unconfirmed` status. The 50-entry cap or count mismatch is explicitly partial. Confirmed reconstruction never consumes pending effects.
- Every referenced confirmed block hash is checked against `/block-height/:height`. Tip hash/height is sampled before and after history + scanner reads. Reorg/tip changes invalidate the attempt and require a clean restart; old/new records are never silently merged. A stable confirmed tip is required for the returned confirmed scanner observations.
- Exact confirmed address-summary sums are reconciled through the WH01 core at the same block hash/height. Existing `btcBalance` is exercised against exactly those captured summaries, while raw BigInt sums remain authoritative. HD scanner totals are compared with summary totals including mempool. The existing scanner's Number return is only an API-boundary consistency check, never the reconstruction input.

## Resume, cancellation and provider limits

Each completed history page yields a JSON checkpoint via `onCheckpoint`; this is optional caller-owned memory, not an automatic persisted record. A partial/error result contains its last session checkpoint. Resume is bound to schema/provider/wallet configuration and fixed tip. HD discovery is repeated; derived address manifests must match. Retained transactions are re-fetched and compared before continuing; cursor fields, exact address manifest, final counts, block hashes and balances are revalidated. Altered/stale state cannot establish an implicit opening. Automatic on-disk resume and atomic state acceptance remain WH04.

`maxPages` bounds confirmed history work per invocation. Abort applies to reads, HD discovery wrappers and page boundaries; a completed page remains resumable. Fetch and response body have timeouts. 403 is not retried, 429/5xx have at most the requested bounded retries (0–2), Retry-After is honored up to five seconds; longer waits return `rate-limit-wait-required`. Aborts during backoff are observed at the next request (at most five seconds). CORS/network failures return sanitized partial status. No failure is a verified zero. A busy advancing chain can require restarting a long scan; fixed-tip incremental persistence is intentionally WH04 scope.

## Acceptance matrix

| Requirement | Implementation / deterministic evidence |
|---|---|
| 25+1 pages; terminal empty page | 26-TX fake Esplora; page limit/resume; malformed oversized page rejected |
| xpub/ypub/zpub; receive/change/gap20 | All three key versions through unchanged production scanner; both branches and overlapping single address |
| Exact input/output/change/fee | Original -100 input, +39 change, separate included fee; one fee; UTXO exact string |
| Repeated/address-overlap imports | TX dedupe, canonical address owner union, stable vin/vout IDs, aliases |
| Own transfers | Internal signed facts, no financial journal imports; cross-account ambiguity stays partial |
| Missing history/prevout | Count mismatch/missing-prevout gates; no reconstructed amount |
| Unconfirmed and reorg | Separate pending facts; canonical block mismatch and changing tip rejected |
| Current scanner agreement | Same-summary btcBalance check + HD total + exact same-block core reconciliation |
| Abort/resume/provider failures | Page checkpoint, AbortSignal, cursor scope/corruption, retained TX refetch, 403/429/500, recovery, CORS/hanging fetch and response-body timeout |
| Unsupported type / unsafe number | Empty ambiguous xpub partial; Taproot unsupported; unsafe satoshis rejected |
| No data mutation | Browser fixture checks portfolio/backup representation, localStorage and IndexedDB unchanged |
| Regressions and PWA | Full npm tests/check; Chromium existing xpub/journal/backup/multitab/PWA; dedicated Chromium/Firefox/WebKit adapter gate in CI |

Tests: `tests/bitcoin-history.test.mjs` (11 top-level cases, parameterized HD/error cases) and `tests/browser-bitcoin-history.mjs`. Initial full test run correctly failed the existing offline precache gate for the new module; adding it with cache v139 fixed the failure. Final results and exact tested SHA/CI are in the PR. Real public queries are not required for acceptance and were not used to establish deterministic correctness.

## Remaining limits / next package

Provider-reported history is not cryptographically authenticated; no independent full node / Merkle verification is claimed. Gap discovery may miss addresses beyond the established gap. Unusual collaborative fee allocation and current-state-only HD discovery limitations are explicit partial results. No EUR history, UI, persisted state, backup or Ethereum/Solana work. SOL-WH03 may start only after positive review and merge of this package. No autonomous merge/deployment.
