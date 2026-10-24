# WP03 — persistence and recovery

Stacked on WP02 (68429cf94967172886941642bb526cb3b384fbde); no default IDB cutover or schema change.

Existing IDB CAS commits remain authoritative only after oncomplete. Existing tests cover competing saves, tombstones, rollback/marker interruption, quota injection, missing/corrupt IDB, stale legacy data, v1/v2 migration and v3 backups. All application save call sites await save; success notices follow completion.

Reproduced local-storage gap: two controllers sharing storage could overwrite a confirmed write because the model module shared an observed-byte cache. Each controller now checks its own last-read bytes, and browser writes/migrate/revert/delete share one Web Lock. Browsers without Web Locks fail closed for local writes. IndexedDB still uses its transactional CAS. Reload renews the local revision. Deletion purges under the lock and preserves the IDB mode marker throughout, avoiding a crash window that could select the old store.

Contradictory raw=null/deleted=false records now reject rather than becoming a blank portfolio. Historical staged records with settings omitted remain compatible.

New tests: stale local writes, mode switch, quota retry, delete/recreate and stale resurrection; actual two-page concurrent local saves; contradictory IDB tombstone. Browser tests now wait for confirmed asynchronous save completion before checking the same original assertions. The crash recovery test explicitly injects a stale legacy copy after deletion and verifies it cannot resurrect.

439 Node tests pass. Chromium targeted gates recorded during this work; full CI remains mandatory. Android low-storage/process-kill testing is manual and not claimed.
