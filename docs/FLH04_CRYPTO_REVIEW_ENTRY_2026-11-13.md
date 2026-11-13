# FLH04 — Einstieg in das unabhängige Kryptoreview

Status: **REVIEW_READY / EXTERNAL_REVIEW_PENDING** · 13.11.2026.
Zusammenstellung: work-f236b969b0b1-20261113 (KI, aktueller Implementierungsowner).
Prüfer: **nicht benannt / nicht verfügbar**. Unabhängigkeit: **nicht nachgewiesen**.
Kein Reviewabschluss, keine Kryptofreigabe, keine Aktivierung.

## Unveränderlicher Prüfgegenstand

Repository: https://github.com/joke0071/foliolab-open
Kandidat: **17a5a190d472f1f07b3508e6f35194371fe95eb2**
Tree: **44ff9c4d60fb22b9519b4b0b344a91045f97f28e**.
Alle nachfolgenden Pfade beziehen sich ausschließlich auf diesen Commit.
Branchspitzen sind keine Reviewidentität. Spätere Implementierungen und
Snapshotänderungen benötigen einen expliziten Impactabgleich; ein Review
dieses Kandidaten ist keine pauschale Freigabe späterer Commits.

Zuerst [Ausstellervertrag](https://github.com/joke0071/foliolab-open/blob/17a5a190d472f1f07b3508e6f35194371fe95eb2/docs/FLH04_ENROLLMENT_ISSUER_CONTRACT.md)
Abschnitte1–6, dann [Wrap-/Autoritätsbytes](https://github.com/joke0071/foliolab-open/blob/17a5a190d472f1f07b3508e6f35194371fe95eb2/docs/FLH04_SYNC_WRAP_AUTHORITY_BYTE_CONTRACT.md)
und [Writerhülle](https://github.com/joke0071/foliolab-open/blob/17a5a190d472f1f07b3508e6f35194371fe95eb2/docs/FLH04_WRITER_FRAME_BYTE_CONTRACT.md).
Die bestehenden Spezifikationen sind maßgeblich; dieser Einstieg schreibt sie
nicht neu. Architektur, Snapshotgrenzen, native Harness und vorhandener
prepared-locked-/Verifier-/Storagecode gehören zum Kontext im Manifest.

## Vertrauensannahmen und Nichtzusagen

Vertrauenswürdige App/Realm, Host, Plattform-WebCrypto, Zufall und kanonischer
lokaler Store; unabhängig bestätigtes Rootpinning bei Bootstrap/Beitritt.
Kein Schutz gegen feindlichen Same-Realm-Code, kompromittierten Host oder
vollständigen Geräte-/DBklon. Non-extractable ist keine Geräteattestation.
Passwort/Entschlüsselung/OAuth beweisen weder A- noch W-Autorität.
A und W entstehen getrennt, E unabhängig; normale Finanzbackups portieren
keine Autoritäts-/Writer-/Syncidentität. Server kann neuere Zustände verbergen;
gültige Signaturen/Zähler beweisen keine globale Frische.
Freitext kann versehentlich Geheimnisse enthalten; strukturelle Allowlist
ist kein allgemeiner Geheimnisdetektor.

## Prüfmatrix und konkret offene Befunde

| ID | Prüfgegenstand / maßgeblicher Vertrag | Erwarteter Abschluss / derzeitige Grenze |
| --- | --- | --- |
| CR1 | C-Grammatik, Domains/Versionen/Rollen/Längen, State→Envelope→Grant, WriterHeader+vollständiger Ciphertext; Wrap§2–5, Writer§2–4 | Komposition auf Cross-Protokoll-, Substitutions-, Zirkel-, Malleabilitäts- und Identitätsfehler prüfen; TBS-ID und Transportbytes getrennt. Noch ungeprüft. |
| CR2 | Schlüsselherkunft, PBKDF2/HKDF, Passwort-UTF8, Workfactor, E-Commitment, Einmal-KEK/IV/Entropie/Klon; Wrap§1–4 | Eignung von Suite/Parametern/DoS-/Mobilbudget und Nonceannahmen ausdrücklich beurteilen; lokale Wiederholungsprüfung ist kein globaler Beweis. Noch ungeprüft. |
| CR3 | Rootpinning, A/W-Trennung, SPKI/P256, Mitgliedschaft, individuelle Signatur; Issuer§2/3/5, Writer§3 | E/Passwort/A/anderer W darf keine Writerrevision autorisieren; unbekannte Selbstsignatur kein Root. Noch ungeprüft. |
| CR4 | CryptoKey-Austausch zwischen Challenge und Commit; Issuer§4, Wrap§7 | **UNGELÖST:** JSON/Objektidentität/Envelope-/Lifecycle-IDs beweisen keinen unveränderten Keyslot. Separater exklusiver Lifecycle-/Transaktionsvertrag und native Racebelege fehlen. Kein autorisierender Commit. |
| CR5 | Atomare Keyslot-/Portfolio-/Outbox-/CAS-Bindung, Capabilityverbrauch, Antwortverlust; Issuer§3/4, Wrap§6/7 | Vollpreimages nach jedem Cryptoawait atomar, kein Cryptoawait in IDB, oncomplete einzige Erfolgsgrenze. Native Keypersistenz/Reopen/Mehrtab nicht qualifiziert; Metadatenvergleich allein unzureichend. |
| CR6 | Replay/Forks/Revocation/Frische/Rotation/Recovery/A-Verlust; Wrap§5/8, Writer§4 | Versteckte neue States, unbekannte Revisionen vor/nach Widerruf und Epochenübergänge fail closed. Kein portabler A oder Passwort-Recovery. Remote-/Zweigerätenachweise offen. |
| CR7 | Metadatenschutz, Headerverknüpfbarkeit und Ressourcen; Writer§2/5, Snapshotvertrag | Opake klare Kennungen, Größen und Salt/Nonce offenlegen und bewerten; Finanzdescriptor/Payload verschlüsselt. Keine zusätzlichen Klartextindizes/Logs. Noch ungeprüft. |
| CR8 | Format1/prepared-locked, A1/A2, Backup/Restore, unsupported Snapshotdaten | Keine automatische Promotion/Migration/Schlüsselportierung. applyAuthorized=false; Storage.confirm gesperrt; remoteAnchor/acknowledgedLocalRevision=null. Voll-v5/History/Belege/Apply unvollständig. |

Diese Matrix ist eine Liste offener Reviewaufträge, keine eigenständige
Schwachstellenbewertung oder Behauptung einer externen Prüfung.
Bytevektoren enthalten öffentliche Dummybytes und bewusst ungültige Signaturen,
keine KDF-/AEAD-/Signatur-/Sicherheitsabnahme. Eigene Tests und KI-Quellenprüfung
ersetzen keinen unabhängigen Prüfer.

## Abnahmekriterien und Abschlussprotokoll

Ein gültiger externer Reviewabschluss muss mindestens enthalten:

1. Name/Organisation, fachliche Eignung, Datum und überprüfbare Erklärung der
   Unabhängigkeit vom Entwurf/Implementierungsowner; keine eigene KI-/Agentenfreigabe.
2. Obigen exakten Commit/Tree und vollständig geprüfte Manifestdateien;
   Auslassungen, Methoden und Grenzen ausdrücklich nennen.
3. Je CR1–CR8 nachvollziehbaren Befund mit Schweregrad, Reproduktions-/Argumentbeleg,
   betroffener Stelle und begründeter Entscheidung. Explizit ungelöste
   Keyslot-/Frische-/Recoveryfragen dürfen nicht als gelöst umetikettiert werden.
4. Für jede Korrektur neuen exakten Kandidaten, Delta, Erledigungsbeleg und
   unabhängige Nachprüfung dokumentieren. Kein stilles Ändern des geprüften Standes.
5. Explizites Ergebnis mit freigegebenem, eng benanntem Umfang und verbleibenden
   Sperren. Kein gesperrter Umhüllungs-/Signatur-/Aussteller-/Entsperrcode vor
   gültigem einschlägigem Reviewabschluss; native Pflichtgates gelten zusätzlich.
   Auch ein positives Spezifikationsreview löst CR4/CR5 nicht durch Erklärung.

Noch benötigter externer Beitrag: geeigneter unabhängiger Kryptografieprüfer,
der diesen gepinnten gemeinsamen Protokollkandidaten tatsächlich prüft,
Befunde liefert und deren Erledigung am endgültigen Kandidaten bestätigt.
Keine Beauftragung oder Nachricht durch diese Sitzung.

| Abschlussfeld | Tatsächlicher Stand |
| --- | --- |
| Reviewer / Unabhängigkeit / Datum | nicht benannt / nicht nachgewiesen / ausstehend |
| Geprüfter Kandidat | für Review gepinnt, nicht extern geprüft |
| Befunde / Erledigung / Nachprüfung | CR1–CR8 offen, kein externer Abschluss |
| Entscheidung | EXTERNAL_REVIEW_PENDING; keine Implementierungsfreigabe |

## Native Prüfgrenzen

Aktueller Executor13.11.: Node24.22.1, Seccomp2/NoNewPrivs1,
AF_UNIX socket()→EPERM. Kein Chromiumstart wiederholt; kein neuer Runner,
Workflowstart oder Retry. Unveränderte tests/browser-sync-outbox.mjs ist der
vorgesehene native Harness. Browserverfügbarkeit ist noch nicht gegeben.
Seine künftigen native-IDB/CryptoKey-/Page-Reopen-/Zweiseiten-CAS-Aussagen sind
von injizierten Abort-/Quotafehlern zu trennen; echter Prozesscrash,
tatsächliche Quota/Recovery sind separat offen. Selbst ein Harness-PASS
löst keinen fehlenden Keyslotvertrag zwischen Challenge und Commit.

## Dateimanifest (Git-Blob-SHA1 am gepinnten Kandidaten)

| Datei | Blob |
| --- | --- |
| [docs/FLH04_ENROLLMENT_ISSUER_CONTRACT.md](https://github.com/joke0071/foliolab-open/blob/17a5a190d472f1f07b3508e6f35194371fe95eb2/docs/FLH04_ENROLLMENT_ISSUER_CONTRACT.md) | 4e0c446e70a828cd0cfcf81b1600a556cd7c509a |
| [docs/FLH04_SNAPSHOT_ALLOWLIST_ONCE_2026-11-13.md](https://github.com/joke0071/foliolab-open/blob/17a5a190d472f1f07b3508e6f35194371fe95eb2/docs/FLH04_SNAPSHOT_ALLOWLIST_ONCE_2026-11-13.md) | 5d8664a4cfcaa0d19b273d13cc7b0d0776129eb5 |
| [docs/FLH04_SNAPSHOT_CONTRACT.md](https://github.com/joke0071/foliolab-open/blob/17a5a190d472f1f07b3508e6f35194371fe95eb2/docs/FLH04_SNAPSHOT_CONTRACT.md) | aa1e0bb3a7a4981feded2c204013a938d699e312 |
| [docs/FLH04_SYNC_ARCHITECTURE.md](https://github.com/joke0071/foliolab-open/blob/17a5a190d472f1f07b3508e6f35194371fe95eb2/docs/FLH04_SYNC_ARCHITECTURE.md) | 705fbea018fc1ef6730e89dfa4efc8b6723b12b5 |
| [docs/FLH04_SYNC_WRAP_AUTHORITY_BYTE_CONTRACT.md](https://github.com/joke0071/foliolab-open/blob/17a5a190d472f1f07b3508e6f35194371fe95eb2/docs/FLH04_SYNC_WRAP_AUTHORITY_BYTE_CONTRACT.md) | d4343830ebd1a513c674fb3ec347a2605c7c7b01 |
| [docs/FLH04_SYNC_WRAP_AUTHORITY_BYTE_VECTORS.json](https://github.com/joke0071/foliolab-open/blob/17a5a190d472f1f07b3508e6f35194371fe95eb2/docs/FLH04_SYNC_WRAP_AUTHORITY_BYTE_VECTORS.json) | cda312a060f4aa60b8746466cb0ddd73abc7c297 |
| [docs/FLH04_WORK_CHECKPOINT.md](https://github.com/joke0071/foliolab-open/blob/17a5a190d472f1f07b3508e6f35194371fe95eb2/docs/FLH04_WORK_CHECKPOINT.md) | 4ec04d1eb5785c233d4da25b88ca98e58d1f266c |
| [docs/FLH04_WRITER_FRAME_BYTE_CONTRACT.md](https://github.com/joke0071/foliolab-open/blob/17a5a190d472f1f07b3508e6f35194371fe95eb2/docs/FLH04_WRITER_FRAME_BYTE_CONTRACT.md) | 9fa404df544eaa6a64da5f0f62a8f9b915a287de |
| [docs/FLH04_WRITER_FRAME_BYTE_VECTORS.json](https://github.com/joke0071/foliolab-open/blob/17a5a190d472f1f07b3508e6f35194371fe95eb2/docs/FLH04_WRITER_FRAME_BYTE_VECTORS.json) | 098bd729c7abb2d88ddfa195bdac7b85fab10e42 |
| [src/atomic-storage.js](https://github.com/joke0071/foliolab-open/blob/17a5a190d472f1f07b3508e6f35194371fe95eb2/src/atomic-storage.js) | b8bc22967d451150801cd8ac1fd847a768c37ca2 |
| [src/sync-frame-verifier.js](https://github.com/joke0071/foliolab-open/blob/17a5a190d472f1f07b3508e6f35194371fe95eb2/src/sync-frame-verifier.js) | 21df71dd11dff5114a5c070a004ffc4f0bf4c365 |
| [src/sync-local-anchor.js](https://github.com/joke0071/foliolab-open/blob/17a5a190d472f1f07b3508e6f35194371fe95eb2/src/sync-local-anchor.js) | 815f2ac2ccd0e507bcf4dbefbaf6a07b5332afa4 |
| [src/sync-outbox-attempt.js](https://github.com/joke0071/foliolab-open/blob/17a5a190d472f1f07b3508e6f35194371fe95eb2/src/sync-outbox-attempt.js) | f8eed3a514502e123d13278ce5a70e1140f2a805 |
| [src/sync-outbox-state.js](https://github.com/joke0071/foliolab-open/blob/17a5a190d472f1f07b3508e6f35194371fe95eb2/src/sync-outbox-state.js) | ba713bb111a74c1d3d7e1b4f2ca884fbd804cc9d |
| [src/sync-outbox-storage.js](https://github.com/joke0071/foliolab-open/blob/17a5a190d472f1f07b3508e6f35194371fe95eb2/src/sync-outbox-storage.js) | e2f4341934f33f81f16fdb731d57d6bf0c40525e |
| [src/sync-payload-integrity.js](https://github.com/joke0071/foliolab-open/blob/17a5a190d472f1f07b3508e6f35194371fe95eb2/src/sync-payload-integrity.js) | 99a91dd41d911f5df5b3ef9328a29de4352af57b |
| [src/sync-revisions.js](https://github.com/joke0071/foliolab-open/blob/17a5a190d472f1f07b3508e6f35194371fe95eb2/src/sync-revisions.js) | cdafe6d76bc8b6622e4ba7baebf89aaa0329b5e7 |
| [src/sync-snapshot.js](https://github.com/joke0071/foliolab-open/blob/17a5a190d472f1f07b3508e6f35194371fe95eb2/src/sync-snapshot.js) | 12c3be168813f2b7900ec7e6ee12d951edfc7f67 |
| [tests/browser-sync-outbox.mjs](https://github.com/joke0071/foliolab-open/blob/17a5a190d472f1f07b3508e6f35194371fe95eb2/tests/browser-sync-outbox.mjs) | 88529dbbc1748e48c0f1c9c973fe4c0e03550691 |
| [tests/sync-enrollment-boundaries.test.mjs](https://github.com/joke0071/foliolab-open/blob/17a5a190d472f1f07b3508e6f35194371fe95eb2/tests/sync-enrollment-boundaries.test.mjs) | 53bc42ffa8358160fc4183b0b89f4881a041ba7f |
