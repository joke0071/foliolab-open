# Ledger Live: unpublished intermediate checkpoint

Base v188 / ca1fa8fd46b3060d10a13095400bc3d33b0f3c42, issue159. Production v188 is live accepted; this branch is not released. SW189 is a candidate only.

The first local native recognition/preview experiment reuses the already audited official twelve-column dialect and existing CSV, decimal, wallet-history and Bittr grouping functions. No balance/journal/history commit API is implemented. Wallet mappings are transient, unknown fees/identity/locators remain unresolved and countervalues are not purchase prices. Exact duplicate export observations are retained as ambiguous, not silently removed.

Local checkpoint: eleven focused unit tests pass; syntax checks pass. A mistaken test expectation that an invalid per-row identity throws globally was corrected to assert its explicit row blocker. No product assertion was weakened. No full/browser/real-original validation or release readiness claimed. Browser test integration and field-level security review are unfinished.

New master steering: FLH05-00 format/open-source/license research now precedes further parser development. This intermediate experiment is preserved remotely and paused. Its prior Ledger/Bittr schema/source evidence remains reusable; research must cover all priority A/B providers and shared import architecture before this code is extended or shipped. Current native posting support is OPEN/BLOCKED by provenance, fee and event-locator evidence. No private original rows, identifiers, addresses or fingerprints are part of this branch.
