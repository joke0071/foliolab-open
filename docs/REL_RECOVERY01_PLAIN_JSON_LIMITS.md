# REL-RECOVERY01 · plain JSON writer/reader compatibility · v252 candidate

The unchanged local file reader accepts at most 20,000,000 UTF-8 bytes. Before
this fix a real accepted compact legacy portfolio (19,999,830 bytes) produced a
20,000,170-byte pretty JSON UI download. That file was advertised as a successful
backup although the same reader rejected it. The synthetic case uses preserved
legacy snapshot revision metadata, no customer data. Chromium reproduced both
the accepted input and oversized actual download against v251.

`localJSONBackupFile` now keeps ordinary readable JSON byte-for-byte. Only if the
formatted file exceeds the existing limit does it serialize the already encoded
JSON compactly. The resulting Blob must still fit the original byte limit.
This changes JSON formatting only; no field, revision/history metadata, exact
decimal string, schema or reader limit is changed. A compact file that remains
too large throws before object URL, download, backup-success timestamp or import
approval. Encrypted export does not fall back to plaintext.

The same preparation applies to the explicit JSON export, reference-removal and
position-removal safety backups, native Flatex and existing CSV Flatex safety
backups, and plaintext migration backups. Existing consent/CAS/dependency guards
remain in place. The unverified raw-data rescue path remains byte-for-byte and
separate: it must remain available even for corrupt or oversized original data.

Node tests cover unchanged normal formatting, accepted historical revision
metadata through lossless compaction, exact 20 MB UTF-8 boundaries and rejected
oversized Unicode. The browser contract imports the real accepted legacy file,
downloads and restores the compact result in a fresh context, then verifies an
unportable Unicode case produces no URL, false backup acknowledgement or IDB
mutation. A failed mandatory safety export cannot unlock reference deletion.
The additional browser contract is awaited sequentially by every existing local
and production recovery gate in Chromium, Firefox and WebKit. All old gates are
retained. Run `node --test tests/plain-backup-limits.test.mjs` and
`RECOVERY_ENGINES=chromium,firefox,webkit node tests/browser-recovery-backup-limits.mjs`.

The existing structured-quality focus assertion also waits, with a bounded
deadline, for the native dialog `close` event before inspecting focus. Native
dialog hiding precedes that event. The exact focus assertion and every finance
assertion remain unchanged; this removes the observed pre-event timing race.

This is a bounded #254 correction, not completion of REL-RECOVERY01. Historical
formats, version downgrades, old tabs, crash/eviction/OAuth/hardware chains and
larger encrypted format capacity remain separate. The 10k synthetic benchmark
correctly hit existing encrypted limits; this fix does not increase those limits
or make a physical Android performance claim.
