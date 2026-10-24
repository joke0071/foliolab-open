# WP04 — import identity and ownership contract

Base: d15f1af13eb65c1b505faebbed33ca6c3f14b035 (WP03 / PR #105).

Optional booking.importSource version 1 stores sourceId, local accountId, externalId, sourcePayload, ownedSnapshot, fileId, occurrence and ownership. No new model version or second ledger. Legacy bookings remain unchanged. safeImport validates version, lengths, ownership enum and account scope; JSON backup retains provenance.

Strong identity is exactly source/account/external ID. The generic adapter uses the mapped booking-ID column in its generic-csv namespace; unrelated sources must use different sourceId values. Flatex uses its original TA reference, not the content-derived legacy externalId, so a changed price cannot turn one referenced trade into a second transaction. Missing Flatex references are deliberately not strong identities.

The sourcePayload records normalized imported fields. ownedSnapshot records the imported booking and journal values; any manual change or explicit ownership=manual blocks automatic handling. An identical source ID with changed payload conflicts. No automatic overwrite. Validation uses the existing transaction engine. Legacy fingerprints are retained for compatibility, with stronger conservative matching supplied by WP05.

Tests: same ID across accounts; distinct IDs with identical economic values; changed payload; manual notes; backup roundtrip and reimport; malformed account provenance; no invented legacy metadata. Existing v1/v2/v3 migration and Flatex suites remain mandatory.

File identity and claimed legacy candidates are WP05 responsibilities. No UI redesign. Existing CSV issue rows expose conflicts. Imported source IDs are data, never credentials; full source files are not retained or uploaded.
