# UH03 – bounded native Ethereum source bridge

User outcome: reconcile one Kraken ETH withdrawal with one already scanned own Ethereum mainnet incoming event. Keep the scanned recipient holding unchanged; debit the exchange principal and its separate exchange fee exactly once. Sender network gas is documentary evidence, never another recipient fee. Source and recipient historical opening/end balances are not inferred.

Scope: direct native ETH only, successful receipt with no logs, empty input, 21,000 gas, canonical indexed block inclusion and a finalized RPC anchor. No ERC20, internal calls, N:M transfer matching, other chains or whole-history coverage upgrade. Existing ETH history remains partial, including `native-protocol-credits-uncovered`.

Contracts: `kraken-ethereum-bridge.js` retains a bounded immutable transaction/receipt/block proof plus exact event, current own wallet/chain/account/asset scope and source-group binding. ETH uses its own bridge scope; the BTC-only history-session scope field is unchanged. A new bridge requires one accepted matching history event; portable backup/restore can omit optional history while retaining the journal proof. A changed wallet scope, conflicting event, missing proof, duplicate event claim or changed source group fails closed. The existing v5 marker, data/install identity, journal, CAS, backup/restore and permanent source-removal contracts remain in force.

UI: explicit Ethereum reconciliation in the existing Kraken CSV dialog. Public lookup uses the existing `ethereum-rpc.publicnode.com` endpoint after explicit source/network/hash/destination confirmation; local CSVs are not transmitted. Existing cancel/generation/baseline protection, pure preview and canonical CAS commit remain in place.

Acceptance:

- Exact principal plus exchange fee matches the independent expected source debit; recipient holding, history coverage and external flows do not change.
- Chain/hash/receipt/inclusion/finality/asset/own-address/source binding negatives fail without mutation.
- Duplicate import, documentary Ledger-first/Kraken-first ordering, reload, optional-history backup, encrypted restore, undo and permanent complete-group withdrawal preserve identities and quantities.
- Actual dialog, seven widths/Axe, IDB quota and post-put abort preserve raw bytes/revision; stale CAS and offline PWA remain protected.
- Freeze one candidate after local qualification; retain all required PR/Main/deploy/production gates and actual new asset identity checks.

Risk: financial source attribution. Existing independent private original oracle and native/CSV/receipt/block evidence are reused; no private identifiers, original amounts or exports are published. The private original replay uses controlled openings and a controlled finalized-header fixture: the inherited real evidence proves canonical inclusion and confirmation depth, not a captured finalized-tag RPC response. This is not acceptance of an actual portfolio or its historical balances. Public fixtures are synthetic; final public RPC transport and finality checks have explicit mock provenance.

Safe release point: one complete ETH bridge flow with protected restore/removal, fully qualified before release. UH03 remains PARTIAL afterward; remaining networks, N:M and historical independent balances precede UH04 → UH05. EFF01/HND01 and all other roadmap work remain in force.
