# SOL-WH03 — Ethereum mainnet history adapter

Baseline: main `532d4aab9c1b8f1686bc48f81fd159ba0a87e8de`, WH01/#120 and WH02/#121 merged; no open PRs; Actions 40133696542 green. Scope is issue #119 comment 6388746956 only. No merge/deploy, UI, financial journal, price/return, snapshot, storage or backup changes.

## Delta audit / reuse

Reviewed docs/SOL-WH01.md and SOL-WH02.md, wallet-history-core.js, blockchain-adapters.js, market.js, ethereum-fallback.js, request-cache.js and decimal.js plus wallet/financial/storage/backup tests. Existing network 1 configuration, address validation, ETH_RPC and LST contract registry, walletBalanceExact scanner and WH01 event IDs/dedupe/sort/replay/reconciliation are reused unchanged. decimal.js has an 18-place financial boundary, so raw history uses native BigInt and returns integer strings. No second replay engine or parallel financial ledger. The new transport is scoped to this adapter because generic request-cache owns its AbortController and does not bound response-body consumption with the caller signal; it does not replace shared infrastructure.

## API and supported facts

`ethereumHistoryEvents({wallets,tokens,transactions,transfers,internals,evidence,source,observedAt})` is pure. `fetchEthereumHistory(options)` performs uncached public reads. Wallets are `{accountId,address}`; chainId is strictly 1. Duplicate registered addresses use a canonical account ID (lexicographically first), with explicit alias mapping; no existing account is edited. Distinct addresses under one canonical account sum into that account.

Tokens are explicit `{contract,decimals,balanceModel}` descriptors. `balanceModel:'transfer'` is an explicit caller assertion of standard transfer-based accounting, not a deduction from symbol/name. Unknown models, known stETH/rETH/wstETH/LST contracts and complex DeFi/bridge contract interactions remain partial. Unknown contracts in discovered logs are reported and not invented as configured assets. Decimals are checked against paginated transfer metadata, Blockscout token metadata and pinned on-chain decimals(). Unknown/contradictory data is a conflict.

Native transaction value and fees are checked against `eth_getTransactionByHash` and mined receipts. Actual gas is gasUsed × effectiveGasPrice (legacy gasPrice fallback); EIP-4844 blobGasUsed × blobGasPrice is included when present. A type-3 transaction missing its blob fee evidence is partial. Blockscout `fee.type='actual'` and raw value must agree. Failed receipts emit sender fee only, never successful value/token/trace legs. No event is interpreted as an economic deposit, buy/sell or investor cashflow.

ERC-20 logs require successful parent receipt, matching block/transaction/contract, canonical Transfer topic and padded address topics, exact uint256 data, log index and removed=false. Multiple logs retain their indices. Embedded transaction transfers and dedicated transfer endpoint rows produce the same WH01 IDs and dedupe. Self-transfers have separate debit/credit subindices, net zero. Cross-owned transfers net zero apart from sender gas once.

Internal traces require successful mined parent, explicit success=true, no trace error, matching block/time, stable trace index and supported call/create/create2/selfdestruct type. Index-zero root must exactly match the transaction value and endpoints and is not counted again. Internal execution remains provider-qualified trace evidence, not independently reexecuted EVM proof. Missing/contradictory provenance is partial; unsupported trace types are not fabricated.

## Provider contract and chronology

Official schema read: https://github.com/blockscout/blockscout-api-v2-swagger/blob/main/swagger.yaml . Uses the documented Blockscout v2 address `transactions`, `token-transfers?type=ERC-20`, `internal-transactions` endpoints and their actual `next_page_params` objects (including block_number/index/transaction_index/items_count and batch locator fields). Cursor parameters are allowlisted; repeated/nonadvancing cursors and incomplete/oversized pages fail safely. Related transaction details come from `/transactions/{hash}`; token metadata from `/tokens/{contract}`.

Blockscout is the preferred configured public provider; existing Etherscan-key settings are passed only to the existing scanner. This package does not add a second Etherscan history parser or copy keys into cursors/checkpoints. The existing Ethereum public RPC supplies only whitelisted read calls issued in code: chain ID, finalized/latest or numbered blocks, transaction/receipt, eth_getBalance and eth_call (balanceOf/decimals). No signing, sendTransaction, private keys or write methods.

Events are sorted/replayed by the WH01 core. RPC chain ID must be 1. Confirmed facts must be mined at/before the sampled finalized block, and their block hashes must agree with canonical numbered RPC blocks. The sampled finalized block is checked again at completion. Newer/pending rows are explicitly unfinalized/missing-provenance, never silently finalized. OldestReached means all requested provider page chains terminated; it is not a proof that an indexer has a complete archive.

## Honest balance and coverage boundaries

An opening is explicit caller-owned evidence `{accountId,contract:null|string,quantityBaseUnits,beforeBlock,source}`. No zero genesis baseline is guessed. It is not written to portfolio openings or automatically accepted. Raw quantities remain exact even with 24+ decimals; existing scanner precision limits can still make scanner comparison unavailable and therefore the reconstructed balance partial.

Pinned on-chain ETH/balanceOf observations are separate from reconstructed balances. The existing scanner is sampled against a separately pinned latest block, with stable latest head before/after; it is not mislabeled as the finalized observation. Missing scanner, moving head or disagreement prevents verified candidates. Token candidates need supported transfer model, consistent decimals/receipts, explicit opening and exact same-block raw balance reconciliation. No mismatch is corrected automatically.

**Native ETH balances intentionally remain partial with `native-protocol-credits-uncovered`: transaction/trace endpoints do not establish genesis allocation, historical mining rewards or beacon withdrawals.** Observed ETH movements and fees are retained as exact known deltas, while quantityBaseUnits remains null. This package implements the required transfer/fee history, not an unsupported claim of complete native holdings. In particular, a current matching ETH balance alone cannot prove all prior native balances. Adding protocol-credit sources is not silently included. Rebase, DeFi/LST and bridges similarly do not acquire a full balance/return label.

## Bounded work, resume and privacy

maxPages bounds NEW pages per invocation (1–10000), per-page limit 100; each request/body has a timeout and caller AbortSignal. 403 fails without retry; 429/5xx retry 0–2 times with bounded delay. Retry-After >5 s returns rate-limit-wait-required instead of violating cooldown. Abort during backoff is observed before the next request (at most 5 s). CORS/network/schema failures return partial and sanitized stable codes, never provider messages or key-bearing URLs.

onCheckpoint returns a structured-cloned public in-memory session. No persistence is performed. Resume is bound to schema, ordered wallet/token/opening configuration and finalized tip. Retained pages are fetched again from the beginning and compared before their cursors can continue; old receipt evidence is discarded and reacquired. Validation pages do not consume the new-page budget. A corrupted or provider-changed page rejects the cursor. Tip changes require restart; long archival work may therefore need a fresh run. Persisted/atomic resumability belongs to WH04. There is no accepted-state backup migration.

## Acceptance matrix / tests

| Criterion | Deterministic evidence |
|---|---|
| ETH and ERC-20 exact quantities | Receipt-backed native and token fixtures, huge integers, 24-decimal projection |
| 2 logs/hash; cross-endpoint dedupe | Distinct log indices plus repeated/embedded transfer rows |
| Actual gas / failed fee-only / blobs | Sender receipt fee, no phantom failed transfer, type-3 blob fee and missing evidence |
| Self and own wallets | Two-leg self transfer and 2 owned accounts net only -gas, aliases |
| Internal transfers | Successful trace, root exclusion, wrong timestamp, failed parent |
| Unknown token / bad decimals / rebase | Unknown contract, conflicting decimals/log values, unsupported model and known-LST guard |
| Pagination and repeated sync | Actual next_page_params replay; identical repeated events |
| Abort and safe resume | Same one-page budget makes progress, retained-row corruption rejected, scope and chain rejection |
| Provider failures | 403, 429/500 recovery, CORS, hanging fetch/body, cancelled fetch, nonadvancing cursors |
| Reorg / unfinalized / incomplete history | Canonical block mismatch, newer receipts, missing opening/internals endpoint failure |
| Scanner disagreement | Same-block candidate reconciliation mismatch; no corrected or invented amount |
| No persistent financial change | Browser checks model/backup representation, localStorage and IndexedDB unchanged |
| Browser/PWA/cross-engine | Dedicated adapter gate wired into Chromium and Firefox/WebKit CI; existing journal/backup/multitab/PWA gates |

`tests/ethereum-history.test.mjs`: 17 top-level tests with parameterized cases. Initial fixture failures were fixed (mismatch value after default decimals change, shared mutable fixture token array); no existing tests removed or weakened. Same-budget resume regression drove revalidation/continuation correction. Full Node/syntax and final CI evidence are recorded in the PR.

## Informational public checks (not deterministic acceptance)

From this execution environment, real public GETs to Ethereum Blockscout `/transactions?filter=validated` and address `0x0000000000000000000000000000000000000001` transactions returned HTTP 403. Retried informational address GET with browser Origin and read-only publicnode eth_chainId POST also returned HTTP 403. Provider/network access is unavailable here; this is not a fabricated successful live history/CORS check and not a fixture/parser failure. Production endpoint availability/CORS must be checked in the user's actual browser; no production-reliability claim follows from mocks. No private/user portfolio address was used.

WH04 recommendation: start only after positive review and merge. Preserve public facts vs accepted state separation, unknown native/protocol scope, token-model assertions, version-bound cursors and receipt/block evidence. No WH04–WH07 work, merge or deployment performed here.
