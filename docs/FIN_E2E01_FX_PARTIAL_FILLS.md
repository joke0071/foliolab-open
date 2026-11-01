# FIN-E2E01 · USD partial-fill continuation

Issue #255, base v252 / main `28903ff201bf0c942851874dc118f3699e0a5d43`. Test-only continuation of the accepted cash chain, using the existing generic CSV importer, journal, Decimal, archive, IDB/CAS and backup contracts. No shipped asset or cache change. #255 remains PARTIAL.

The existing isolated historical-FX oracle is `tests/ledger-multistep-fx-corporate.test.mjs`. This addition tests subsequent actions on the same cash-chain portfolio, including actual persistence and final encrypted UI restore. `tests/fin-e2e-scenario.mjs` contains five extra steps and independently calculated exact decimal expectations, not a second calculation engine.

After the original eleven steps, cash A is 826.000000000000000001 EUR, cash B 100 EUR and the ETF one unit at 100 EUR. A new synthetic USD stock starts with zero units and current quote 100 USD / 0.85 EUR per USD. Two distinct original receipts each buy 0.5 units at historical quote 100 USD / FX 0.8, fee 0.8 EUR and tax 0 EUR. They must remain two separate imported bookings and journals despite equal economic amounts.

| Step | Cash A, EUR | USD quantity | USD cost basis, EUR | USD realized P&L, EUR | Total at current quotes, EUR |
| --- | --- | --- | --- | --- | --- |
| Two fills imported | 744.400000000000000001 | 1 | 81.6 | unset | 1029.400000000000000001 |
| Half sold | 793.000000000000000001 | 0.5 | 40.8 | 7.8 | 1035.500000000000000001 |
| Both fills/position archived | unchanged | 0.5 | 40.8 | 7.8 | 1035.500000000000000001 |
| Archive restored | unchanged | 0.5 | 40.8 | 7.8 | 1035.500000000000000001 |
| Both original files reimported | unchanged, no write | 0.5 | 40.8 | 7.8 | 1035.500000000000000001 |

Each fill settles `0.5 × 100 × 0.8 + 0.8 = 40.8 EUR`. The sale uses 110 USD / historical FX 0.9, fee 0.5 EUR and tax 0.4 EUR: net proceeds 48.6 EUR, basis consumed 40.8 EUR, realized profit 7.8 EUR. The current 0.85 quote remains unchanged and values the remaining half at 42.5 EUR. Across the entire portfolio, fees are 5.1 EUR, taxes 3.4 EUR and external flows remain only the corrected 12 EUR deposit. These trades never become external deposits/withdrawals. Every expected journal posting checks exact quantities, roles and EUR amounts.

Every step compares API state, portable-reader state and (in browsers) the actual saved/reloaded IDB record against fixed expectations. Existing opening records and January 7 historical references remain intact. The new zero opening is explicit. Journal sequences and the two original receipt/journal identities remain unique. Reimports have 2/1 duplicates, no ready rows, no canonical changes and no CAS revision increment.

Missing historical FX, changed payload under the same original identity and stale import preview are rejected. Imported coupled FX trades remain deletion-blocked. Browser checks also inject quota and post-put transaction abort on both buy and sell commits; full original bytes/revision must survive. The existing second-tab conflict, seven mobile/desktop widths with Axe and real service-worker offline reload now operate on the extended portfolio.

The actual v2 encrypted UI download is restored through the file input in a fresh browser context. Full canonical equality includes all new financial, source and journal evidence. Reimport after restore still deduplicates all three FX receipts, while the earlier explicitly deleted interest receipt remains blocked. Node additionally proves authenticated v1 complete-backup equality.

Validation commands remain `node --test tests/fin-e2e.test.mjs` and `node tests/browser-fin-e2e.mjs`, with `FIN_E2E_ENGINES=firefox,webkit` for the other engines. Existing mandatory CI and actual production FIN gates automatically execute this continuation. No gate is removed or weakened; no real financial provider or OAuth call is required.

This does not establish general broker partial-fill grouping, anonymous split-receipt equivalence, arbitrary FX transfer matching, economic trade deletion, wallet/staking histories, return/XIRR/TWR oracles, or physical Android/OS/OAuth/TalkBack acceptance. Those remain separate #255/master residuals. Financial actions here use production APIs rather than claiming every operation is a UI click.
