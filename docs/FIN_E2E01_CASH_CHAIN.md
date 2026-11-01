# FIN-E2E01 · oracle v1 · bounded cash/trade chain

Issue #255, base v251. Test-only candidate; no shipped asset, schema, decimal, journal, import, CAS, cryptography or deletion-permission change. Application cache remains v251. This is a first executable slice, not completion of #255.

`tests/fin-e2e-scenario.mjs` calls existing production APIs. The oracle consists of independently hand-calculated decimal strings; generated booking/journal IDs are checked for provenance and uniqueness rather than frozen. No test engine calculates replacement financial results. Synthetic opening cash is 1000.000000000000000001 EUR; cash B and ETF start at zero.

1. Existing manual deposit 10 EUR; import separate interest receipt 2 EUR and own-account transfer -100/+100 EUR.
2. Correct the manual receipt to 12 EUR dated January 5, after existing journal events. A backdated replacement before later events is not a supported inverse. No engine relaxation.
3. Explicitly match both original transfer receipts. Cash stays fixed; the external-flow pair disappears, leaving only the corrected 12 EUR deposit.
4. Remove the independently proven interest receipt: preview, consent, retained original journal/source evidence. Reimport must fail. Undo must restore all canonical bytes.
5. Repeat the original interest import: duplicate and complete no-op. Archive/restore booking and positive cash holding without financial change.
6. ETF buy 2 × 100 EUR + fee 2; sell 1 × 120 EUR - fee 1 - tax 3. Remaining cost basis 101 EUR; realized P&L 15 EUR; fees 3 EUR; tax 3 EUR. Coupled trade removal stays blocked.
7. Remove the interest again and add historical start/end references. Final cash A 826.000000000000000001; cash B 100; ETF 1 × 100; total 1026.000000000000000001 EUR. Snapshots, transfer provenance, removed source identity and audit all survive authenticated backup/restore. Referenced position and matched-transfer removal stay blocked.

The deliberately nonrepresentable imported quantity 2.000000000000000001 is separately checked as a **blocked** removal: existing numeric mirror checks do not prove its inverse. This scope does not broaden that contract. Exact 18-place opening/holding values are still tested throughout the successful chain.

Node: `node --test tests/fin-e2e.test.mjs` (v1 crypto authenticated exact plaintext and canonical model).
Browser: `node tests/browser-fin-e2e.mjs`; `FIN_E2E_ENGINES=firefox,webkit` selects other engines; `FIN_E2E_BASE` selects production.

Browser financial steps call the real application APIs and persist to actual IndexedDB; they are not all UI clicks. Every step checks exact independent financial oracle plus CAS revision. Cancellation/stale preimage, injected quota and post-put transaction abort must retain full raw bytes/revision. A real second tab attempts a stale write. Existing mobile UI is read at seven widths with Axe, then offline reload. The actual encrypted v2 UI download is restored with the UI file input in a fresh browser context; exact canonical portfolio and deleted receipt protection are verified after restore and reload. No provider/OAuth calls, user data or real hardware claims.

All historical CI commands remain mandatory. The new browser suite is additional in Chromium, cross-engine shard 2 (Firefox/WebKit), and actual production acceptance. Sealed historical workflow hashes/manifests remain unchanged; contract tests explicitly require/exclude only the added commands when verifying the old baseline.

Remaining #255: further UI action sequences, partial fills/split receipts, FX, staking/wallet histories, additional independent return oracles and fault/recovery interleavings. Real Android/OAuth/OS-crash/eviction remain external checks; emulation and injected failures are not hardware evidence. Subsequent work stays serial.
