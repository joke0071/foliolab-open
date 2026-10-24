# Integrated WH04–WH07 work log

Base main: 875806c10c2834fd76654c97a9ab55db5cfc4485; WH01–03 merged, no open PRs at intake; main CI 40135229240 green. Read issue #119, consolidated comment 6389893552 and all four original comments. One branch, sequential gates; no main merge/deployment.

## A — WH04 storage and backup

Accepted canonical events, explicit streams/openings/coverage and acceptance decisions live in optional walletHistory schema 1 inside the EXISTING v3 portfolio record. No new DB/store/storage-mode engine. PortfolioStorage local WebLocks/source comparison and IndexedDB CAS/tombstone paths are reused unchanged in behavior. No journals, snapshots, Flatex or returns are rewritten. safeImport validates the optional history, all old versions remain readable, and corrupt histories fail closed.

Provider pages remain transient; persistent pending metadata is public, source-sanitized and always marked re-fetch-needed. No raw provider payload or secret-bearing RPC path is put in portable history. If memory cache is lost, resume requires re-fetching and revalidation rather than trusting an unverifiable cursor. This conservative restart is explicit; durable raw-page caching is deliberately excluded. One accepted preview is one validated atomic chunk; idempotent replacement never merges reorg revisions blindly. Reorg invalidation preserves evidence/decision while demoting coverage. No automatic history acceptance.

Open JSON exports omit history by default. Internal IDB serialization explicitly preserves it. A separate opt-in checkbox adds accepted histories (without pending/cache) only to the existing encrypted complete-backup payload, including Drive's existing encrypted backend. OAuth tokens/device vault secrets remain excluded. Existing restore prompts and CAS apply. Old complete backups without history stay valid.

Gate A evidence: 20 targeted Node tests initially green (including real AES encrypted roundtrip plus existing Drive/Vault simulations); added reorg invalidation test green. Full Node baseline after storage changes: 516/516; syntax check green. New browser-history-storage passed Chromium and Firefox: local + IDB roundtrip, stale writer blocked, simulated quota leaves committed history byte-identical, pending metadata restore and no open-export history. Existing browser-idb-migration-resilience, corrupt-backup-restore, multitab-integrity and settings-backup passed. WebKit result is appended at phase gate completion. Node fixture-only prototype assertion failure fixed by comparing original serialized model bytes (structuredClone normalizes null prototypes); no existing tests weakened.

Real Google-account, physical hardware, browser OS eviction and power-cut tests are not simulated success claims. Existing Drive tests use mocked Google requests; quota/crash/blocked-upgrade tests use explicit fault injection. Provider eviction cannot erase accepted history because no provider cache is its canonical store.

## B — WH05

Not started before Gate A. Acceptance matrix pending implementation.

## C — WH06

Not started before Gate B. Acceptance matrix pending implementation.

## D — WH07

Not started before Gate C. Acceptance matrix pending implementation.
