# Konsolidierung P0 (24.10.2026)

This branch integrates the outstanding, independently relevant storage changes of superseded PR #105 onto current main `f400134816937032dadd83adba23a0771b20a9d8`, after CI PR #103 and PLUS01 PR #115 were already merged and PR #116 updated settings UI.

- No wholesale merge of superseded stacked draft branches #104-#106; #104 and #106 overlap with the shipped PLUS01 financial/import changes.
- Browser localStorage writes, migration, revert and delete now serialize through Web Locks and independently guard stale tabs; unsupported browsers fail closed rather than risk corrupt writes.
- IndexedDB retains single readwrite transaction and revision tombstones. A contradictory deleted/raw record fails validation; the delete-all flow keeps the IDB marker without a transient local fallback.
- The existing optional full encrypted backup, password vault, Google Drive OAuth and updated settings UI remain unchanged; no new storage backend or credential migration.
- No claim to have covered physical device crashes/eviction or real Google account restoration; keep issue #44 open until those manual checks are satisfied.

Tests: `npm test` (new localStorage tests), Chromium including `browser-p0-storage.mjs`, full existing Drive/Vault/Backup regression, Firefox/WebKit. Release only after these checks pass on this exact integration commit and production GitHub Pages deployment succeeds.
