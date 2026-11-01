# ETH-HISTORY-CURSOR01 — bounded cursor and recovery fix

Issue #268. Candidate v260, based on v259/main `6c339c0ea502781f155d209b6443a6c02db8182d`.

The previous validator rejected Blockscout transaction pagination fields `fee`, `value`, `inserted_at`, `hash` and token-batch `index_in_batch`. The official implementations were read directly on 2026-11-01:

- https://github.com/blockscout/blockscout/blob/master/apps/explorer/lib/explorer/chain/transaction.ex (`address_transactions_next_page_params`)
- https://github.com/blockscout/blockscout/blob/master/apps/block_scout_web/lib/block_scout_web/chain.ex (`token_transfers_next_page_params`)

The adapter now validates an endpoint-specific allowlist, exact bounded numeric strings, safe integers, hashes, timestamps and supported null fields. It forwards values through URLSearchParams without numeric coercion. Unknown fields, cycles, changed retained pages, changed scope or tip require a restart rather than an import preview. Completed pages are still fetched again and compared before resuming; receipt/block/scanner reconciliation remains mandatory. Existing ETH protocol-credit and token-model coverage limitations remain explicit.

Jobs exist before the first network request. An old empty checkpoint is rebuilt only when its exact scope, empty evidence and absent tip prove that no progress exists. Transient network/timeout/abort/page-budget/429/server failures can retain their checkpoint; unsupported or inconsistent cursors cannot. The dialog offers a focused “Neu abrufen” action, disables misleading resume after raw-cache loss, and removes only the affected pending marker. Accepted events and financial records remain intact. Observed reorgs retain existing invalidation behavior rather than asserting verified coverage.

Validation on the combined v260 candidate (including the separately handed-over Alpha response-spacing correction): 1,071 unit tests, zero failures/skips; syntax and diff checks; adapter and expanded actual dialog suite in Chromium and Firefox. The dialog exercises official transaction and batch-only cursors, successful transient resume, unsupported cursor recovery, reload/cache loss, unchanged accepted sessions/financial fields, seven widths 320–1440 px, WCAG axe scans and focus, existing BTC/SOL/SPL handling, cross-tab conflict and encrypted history roundtrip/download. Full mandatory GitHub CI, WebKit and actual production acceptance are still required before release acceptance. No private wallets, credentials or provider payloads are in fixtures or evidence. No physical Android/native Safari claim.

The precise cause of the user's private request remains unproven; the two demonstrated code defects are fixed. No missing balance is treated as zero and no accepted history is automatically replaced.
