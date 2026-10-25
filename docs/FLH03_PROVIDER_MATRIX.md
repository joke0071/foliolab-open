# FLH03 provider/format/capability evidence — 2026-10-25

Scope: spec Version 4, packages 00/01; private originals are never committed. No CORS or provider-account access was performed with real keys. Documentation proves a capability, not a working browser integration or a validated regional CSV dialect.

| Input | Current implementation | Proven format/coverage | Release gate / next evidence |
|---|---|---|---|
| Generic mapped booking CSV | Existing single-file parser/journal; 01 adds 1–20 same-header documents, global chronological dry-run, source-row provenance, exact overlap/replay/conflict review | Synthetic fixtures `tests/fixtures/flh03`; 2 MB/file, 5,000 rows/batch; semicolon/comma/tab and quoted UTF-8 via existing parser; one normalized economic event per row | User explicitly maps positions/accounts/cash. No source-specific interpretation from header similarity. Split/aggregate equal-ID variants conflict, never auto-booked as extra events. |
| flatex AT depot/account Classic/Next | Existing `flatex-import`, `flatex-{settlements,settlement-audit,cash-audit,reconciliation,backfill,cost-basis}`; multi-file Beta, explicit depot/backup/acknowledgement gates | Existing guarded headers and synthetic regressions; depot vs cash separated; cash rows remain evidence/review, not automatic postings | #127 AT03-C: authorized anonymized matching depot+cash statements, start/end balances, fees/taxes/FX. No new claim of full cash support. |
| Trade Republic | No native provider adapter; generic mapper is not a TR integration | Spec lists candidate headers; no approved original AT export in this run | 02: verify actual regional/header/types, stable trade vs settlement identity and reference relationships before enabling. No login/PSD2 scraping. |
| Kraken Trades/Ledgers/Balances | No native adapter or authenticated API | Official export guide independently retrieved 2026-10-25: Trades executions; Ledgers deposits/withdrawals/fees/balance changes; Balances dated snapshot; CSV/PDF and optional export fields | 03: verify concrete header dialect and cross-file IDs with sanitized evidence; balance snapshots are not deposits; margin/futures excluded absent model contract. |
| Bitpanda CSV | No native adapter | No actual CSV header verified | 04 format stop gate: approved anonymized header/row evidence by product/year; do not invent supported CSV. |
| Bitpanda new public API | Not enabled | Official API-key docs retrieved 2026-10-25: `Transaction`, `Balances`, optional `Earn (Read)`; write scopes explicitly different | 06: origin-specific real OPTIONS/GET CORS, pagination/limits/rights/storage safety not verified. Keep blocked, CSV path primary. No new proxy/Worker. |
| Kraken private API | Not enabled | Spec references official HMAC/nonce documentation, not revalidated as a usable integration in this run | 06: browser CORS + secret/signing + multi-tab nonce + rights gate; no live credentials supplied. |

Primary references:
- Kraken exports: https://support.kraken.com/articles/208267878-how-to-export-your-account-history (retrieved current guide; document distinguishes export types; no fixed CSV header inferred).
- Bitpanda scopes: https://docs.public.bitpanda.com/api-key-generation (retrieved; new scopes take precedence over inconsistent legacy help text).
- flatex code contract: `src/flatex-import.js`, `docs/BENCHMARK_RESTARBEITEN_2026-10.md`, #127. Unchanged Beta evidence boundary.

Read-only provider APIs are optional future work. No account login, key requirement, server, worker, migration or second journal is added by 00/01. Original private financial statements/screenshots were not read or used in fixtures.
