# Priorisierte Anbieter-Kompatibilitätsmatrix — Recherche v1

Stand27.10.2026, Produktionsbasisv188. **Keine neue Formatunterstützung durch diese Tabelle behauptet.** E1Exportdokumentation, E2konkreteOSS-Feldbelege, E3eigeneFolioLab-Tests, E4privateOriginale, E5vollständigerAbgleich sind getrennt. Details/Kopfzeilen/Codepfade: [catalog.v1.json](catalog.v1.json); Quellrevisionen/Lizenzen: [sources.v1.json](sources.v1.json).

| Anbieter | Prio | Konkrete Dialekte / Grenzen | Original-/Abgleichgate |
| --- | --- | --- | --- |
| flatex Österreich | A | flatex-at-depot-classic-oss, flatex-at-cash-classic-oss | Native AT depot and cash export pair, complete settlements, balances and fees/FX/tax evidence. Derived extraETF data is not this native proof. |
| Bittr | A | bittr-purchase-evidence-v1 | Full portfolio boundary reconciliation and universal-profile original roundtrip still separate. Public normative Bittr schema not located; local original/schema evidence is explicit. |
| Ledger Live | A | ledger-live-native-12 | Exact on-chain locator/ownership/fees and opening-to-closing reconciliation per supported protocol. Prior local schema validation is not a complete economic importer. |
| Kraken | A | kraken-ledgers-legacy-9, kraken-ledgers-10, kraken-ledgers-enriched-columns, kraken-trades, kraken-balances | All-fields Trades + Ledgers over identical interval and opening/closing Balances; deposits/withdrawal chain refs separately. Optional current columns and regional tax scope need originals. |
| Bitpanda | A | bitpanda-retail-16, bitpanda-pro-history | Retail original all-history CSV, exports for fee-token/swaps/staking and overlapping intervals; Pro only if relevant. |
| Trade Republic | A | trade-republic-semicolon-value-date, trade-republic-comma-mcc | Current regional native export + paired original trade/cash/tax evidence; official header contract not located. Public PP CSV is stronger than old no-CSV assumption but not private original validation. |
| Binance | B | binance-account-history | Regional account/spot original variants, stable references and complete balances before automatic multi-leg posting. |
| Coinbase | B | coinbase-retail-11, coinbase-retail-10, coinbase-pro-account | Current regional Retail/Advanced originals and fee/reward/conversion cases with balances. |
| Bitstamp | B | bitstamp-transactions-8 | Current export version, native timezone and original fee/account references. |
| Crypto.com | B | crypto-com-app-wallet, crypto-com-exchange | Current product-specific originals, transfer/fee/reward cases and complete export intervals. |
| Scalable Capital | B | scalable-oss-native-prime, scalable-bookmarklet-api | Native current export and settlement/tax references; converted PP files distinctly tagged. |
| Revolut | B | revolut-retail-10 | Relevant regional Retail/Business/securities original and timezone/state/fee examples. |
| DEGIRO | B | degiro-account-nl-positioned, degiro-trades-and-holdings | Regional/language-specific account+trades CSVs and opening/closing portfolio/cash, explicit FX direction. |
| ING | B | ing-de-account-observed, ing-de-holdings-positioned | Actual regional/retail product original, header variants with/without balance and paired stock statements. |
| DADAT | B | dadat-native-csv-unverified | Native CSV or publicly evidenced header/export documentation. Actual complete cash/depot/settlement originals for economic validation. |
