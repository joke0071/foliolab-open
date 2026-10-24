# SOL-WH01 — read-only wallet history core

Scope: issue #119, comment 6388746298 only. Base: `a24b159cd5d5d6d1dc39b854067a8fdc88bb3226` (includes #118). No open PRs at intake. No journal, snapshots, financial transactions, portfolio schema, backup, OAuth or storage implementation changes. No chain adapter/network implementation, UI, prices or returns. No merge/deploy.

## Delta audit

- `model.js` owns portfolio v3, opening positions and snapshots; not a blockchain event store.
- `transactions.js` replays economic journal postings. Reusing it would risk turning blockchain facts into financial cashflows.
- `decimal.js` uses 18-place fixed point (including `atomicDecimal`); cannot represent arbitrary 24-place base units. The new core uses native BigInt internally, returning **strings only**.
- `position-history.js` contains market prices and recorded snapshots, not on-chain balance replay; `performance.js` requires verified economic flows/valuations. Neither is modified.
- `blockchain-adapters.js` and `bitcoin-hd.js` already supply current scan capabilities and identities; these remain unchanged for WH02/03 reuse.
- Existing Node baseline: 467/467 passing. Main workflow 40126098868 failed its cache revision gate before Node/browser smoke; its cross-engine job passed. This is an inherited CI failure, not evidence of a financial regression. This PR bumps the PWA revision for the newly precached module.

## Core API and trust boundary

`src/wallet-history-core.js` has no imports, network, persistence, clock, or model access. All functions are pure. Inputs are adapter facts, not independently authenticated blockchain evidence; validators cannot prove that a provider told the truth.

- `validateHistoryEvent`: canonical JSON projection; validates identity, signed raw integer string, decimals 0–255, chain locator, block/slot height as string, block hash, UTC timestamps (missing event time stays null), source, status/finality, coverage and quality code. `txid` holds a tx hash or Solana signature; `blockHeight` holds block height or slot. Native assets have null contract/mint. Tokens retain contract/mint in the identity.
- `historyEventId`: JSON tuple of network, chain, canonical account/asset/contract/mint, transaction and locator kind/index/subindex. Distinct logs/inputs/outputs/instructions are never collapsed merely because they share a transaction hash.
- `dedupeHistoryEvents`: repeated identical facts become one, even across scan wallet aliases. Contradictory facts are quarantined, reported and make that stream unknown. No last-write-wins reorg handling.
- `sortHistoryEvents`: chain, numeric height, numeric transaction index, transaction ID and numeric locator ordering. Same timestamps do not imply same events. When no transaction index exists, ties use deterministic identity order; no claim of exact intrablock intermediate balances.
- `replayWalletHistory({events, streams})`: reconstructs each requested stream at inclusive `throughBlock`, with exact signed deltas and per-asset totals. Repeat for different block boundaries to obtain historical checkpoints. No interpolation or current-balance backfill.
- `reconcileWalletHistory(result, observations)`: exact observed vs reconstructed difference, only with same network/account/asset/decimals, block height and block hash plus source. Otherwise `unknown`; no mutation or automatic correction.

### Ownership, fees and reconstruction contract

`accountId` is the **canonical custody owner** already resolved by the caller; `walletId` is a scan view/registered wallet, not a second holding. HD and individually scanned addresses of the same holding must use the same accountId. Core dedupe then removes overlapping views of the same event. Identical wallet IDs assigned to multiple canonical accounts are flagged as ambiguous. The core cannot infer address ownership, xpub membership or cross-account aliases from arbitrary names: WH02 must establish that evidence, never guess or double count it.

Each fee is a separate negative `fee` event with locator `{kind:'fee', index:'0', subindex:'0'}`, once per transaction/account/fee asset. By default its balance effect is additional (e.g. ETH gas alongside an ETH transfer). For raw BTC inputs, the fee may already be contained in a spent-input debit. In that case `includedInEventId` references that canonical debit, retaining the **unchanged exact prevout amount** and the separate fee fact without charging it again. Replay requires an existing confirmed negative debit of the same stream, transaction, block/hash and decimals whose magnitude covers the fee; a missing/mismatching reference makes the balance unknown. Failed fee-only transactions cannot claim an included fee. An adapter must supply this accounting evidence and must never mix fee-inclusive inputs with an additional unlinked fee. Both additional-fee and raw-input/change/included-fee modes have deterministic fixtures.

Failed transactions may contribute fee events only; success transfers for a failed transaction are rejected. No event automatically becomes a deposit, trade, tax event or reward cashflow. `internal_transfer` consists of signed account legs; summing owned accounts cancels those legs, leaving actual fees.

Each explicit stream includes:

```
{ network, chainId, accountId, assetId, contract: null|string, mint: null|string,
  decimals, throughBlock: '10',
  opening: { quantityBaseUnits: '0', beforeBlock: '0', source: 'evidence' } | null,
  coverage: { status: 'verified', fromBlock: '0', toBlock: '10',
              tipHash: 'block-10', source: 'provider-evidence' } | null }
```

Opening is immediately **before** `beforeBlock`; events in `[beforeBlock, throughBlock]` are applied. Missing genesis is not an implicit zero; an evidenced opening checkpoint can establish a later starting point. A proved zero opening and complete empty interval can establish zero. The caller must enumerate every requested wallet/asset stream, including empty streams, to prevent silent omission from totals. No undeclared event streams are allowed.

Provider coverage must start at/before the opening and end exactly at the requested tip hash/height. Missing opening/provenance, gaps, unsupported/unknown rebase effects, mismatched decimals, contradictory block hashes, reorg/orphaned or unconfirmed records withhold `quantityBaseUnits` (`null`). `knownDeltaBaseUnits` is diagnostic observed flow **only**, never a complete holding. Negative deltas are valid; a negative spot holding is an error. Aggregates are only verified for wholly verified streams at the same chain checkpoint and consistent decimals; they never sum partial balances as if complete.

Coverage codes: `verified|partial|missing|unsupported|unconfirmed|error`. Unknown amounts are null, never JSON BigInt, invented zero or fabricated price/return. Conflicting revisions are deliberately conservative: a later adapter/storage synchronization must supply an explicitly resolved canonical set before replay, rather than leaving old and replacement facts together. Automatic rollback/persistence is WH04 scope.

### Future provider contract (validation only)

JSDoc `HistoryRequest`, `HistoryCursor`, `HistoryPage`; `validateHistoryRequest` / `validateHistoryPage` check provider, network/chain/account, filter identity, schema, cursor scope (including UTC window), bounded page size (1–1000), page budget (1–10000), AbortSignal and abort status. Page facts must match scope/window; page length, advancing cursor, terminal-page consistency and coverage are checked. A nonterminal page cannot claim the complete requested history is verified. `filterKey` must identify all adapter-specific query filters (asset/address set etc.). No fetch/getPage implementation is included.

## Validation and remaining gates

Deterministic Node fixtures are committed before implementation (initial red result: missing core module). They cover 24-decimals/huge/negative raw quantities, same timestamps, two indices per hash, input/change, overlap, repeated import, three wallets, fee-only failure, missing genesis/provenance/gaps, reorg, unknown rebase, invalid metadata, exact reconciliation, cursor scope/time limits and abort.

The dedicated browser test compares nine replay scenarios byte-for-byte with Node, verifies JSON and reconciliation, and checks that fetch, localStorage, IndexedDB and the existing portfolio/backup are untouched. It is wired into Chromium and Firefox/WebKit CI jobs. Existing financial/browser regression results and final SHA are recorded in the PR.

WH02 is eligible **only after positive WH01 review and merge**. Its first tasks must implement the documented ownership and fee inclusion contracts using existing HD/scanner components. Reorg replacement policy, persisted resume and backup integration remain out of this package.
