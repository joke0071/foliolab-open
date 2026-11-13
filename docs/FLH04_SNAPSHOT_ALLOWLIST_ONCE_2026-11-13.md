# FLH04 — einmaliger Snapshot-Vertragsbeleg

STOPPED / CONTRACT_GAP_PROVEN / VALIDATOR_NOT_IMPLEMENTED / RELEASE_BLOCKED.
Kein HND01-Ownerwechsel. Auftrag begrenzt auf neue eigene Dateien; nach gepinntem Readback keine weiteren eigenen Schreibaktivitäten.

Basis: `648cc0fbeef7031d6583231aa05a4d40d379b9bb`.
Eigener Branch: `feature/flh04-snapshot-allowlist-once-20261113`.
Frischer Quellen-/Kollisionsabgleich: Hauptbranch stand beim Eingang und vor Sicherung auf `06b60b12e7f99fb5c8b1c6cb92f656b03a8545ed`, ein Commit nach Basis, ausschließlich 16 zusätzliche Architekturzeilen zum persistenten Outboxvertrag. Diese wurden gelesen, aber nicht übernommen oder verändert. Vollständiger gepinnter Basisbaum enthält keine AGENTS.md und keine dieser zwei neuen Dateinamen. Hauptbranch, zentraler Checkpoint, vorhandene Syncmodule und alle bestehenden Dateien bleiben unangetastet.

## Konkrete fachliche Lücke

Der bestehende Vertrag verlangt einen separat erlaubten Portfolio-/History-/Journalumfang, definiert aber noch kein geschlossenes Sync-Snapshotschema. Vorhandene Leser können nicht als dieser Validator verwendet werden. Ein Ablehnen unbekannter Felder lässt sich nicht durch einfaches safeImport/backup plus Settingsentfernung ersetzen.

| Quellbeleg an der Basis | Ausführbare Gegenprobe / Konsequenz |
| --- | --- |
| `src/model.js` safeImport, insbesondere Buchungs-Spread, Snapshot byAccount/quoteTimes/revisions; `src/transactions.js` validateJournalEntry | Zusätzliche synthetische Credentials bleiben in gewöhnlichen Buchungen, Journalen, Postings und historischen Strukturen erhalten. Ein unbekannter Accountkey mit Objektwert wird in byAccount akzeptiert. Diese Strukturen besitzen keinen vollständigen rekursiven Feld-/Typ-/Referenzvertrag. |
| `src/model.js` backup | Root-Spread kopiert zusätzliche apiKey/oauthToken/password/privateDeviceCredential-Felder. Settingsreset ist keine rekursive Allowlist. Dies beweist Verhalten für eingeschleuste synthetische Felder, keine Behauptung realer gespeicherter Credentials. |
| `src/model.js` safeImport/openingPositions; `src/fx-state.js` normalizePositionFX | Import normalisiert z.B. `10.0000` zu `10`; nullable Legacy-FX wird ausdrücklich UNKNOWN. Der Import ist ein normalisierender Leser, kein identitätsgebundener, unverändernder Sync-Prädikatvalidator. Unbekannte Rootattribute werden ignoriert, statt abgelehnt; portfolioId wird nicht gebunden. |
| `src/complete-backup.js` createCompleteBackup/portableSettings | Optionale Konfiguration kann absichtlich API-Zugänge enthalten. Auch die Datenhülle nutzt einen Spread. Vollbackup ist kein Sync-Payloadschema. |
| `src/wallet-history-state.js` validateWalletHistory/portableWalletHistory | Historyleser projiziert unbekannte Felder weg, schreibt pending-Status um; portabler Export entfernt pending ganz. Ob Sync genau akzeptierte Sessions ohne Resumeinformationen trägt, muss explizit zum unveränderten Datenumfang gehören. |
| `src/model.js` safeImport; `src/backup-limits.js`; `src/sync-frame-verifier.js` | Zeilenlimits verhindern keinen >10-Millionen-Byte-Inhalt in historischen Metadaten. Backup-, History- und Framegrenzen sind unterschiedlich; ein gemeinsames Sync-Plaintext-/UTF8-/Tiefe-/Knotenbudget fehlt als eigenständiger Schema-Vertrag. Der Frame-Cipher ist enger als das Backup. |

Vor einer sicheren Implementierung konkret festzulegen:

1. Rekursiv geschlossene Feld-/Typ-/Versionsregeln insbesondere für historische Revisionen, Accountwerte, Quotezeiten, gewöhnliche Journal-/Posting- und Bookingvarianten einschließlich eingebetteter Managementoriginale. Historische Referenzen auf inzwischen entfernte Positionen/Konten benötigen ausdrücklich erlaubte Semantik; nicht pauschal löschen oder gegen heutigen Bestand verbieten.
2. V3/V4/V5-Abdeckung und Abhängigkeiten geschützter Importnachweise: Der neue Outboxvertrag nennt ausdrücklich v5. Die Gegenproben verwenden gültige synthetische v3-Daten; daraus wird keine v5-Vollabdeckung abgeleitet. Kein eingeschränktes Teilschema darf bestehende wirtschaftliche Belege still abschneiden.
3. Identitätsbindung über den authentisierten Descriptor und separat definierter Snapshotumfang. Der neue Outboxvertrag fordert gleichzeitig exakte kanonische lokale raw-Bytes; diese können Settings und Resumeinformationen enthalten. Eine credential-freie Projektion verändert raw. Der Hauptagent muss festlegen, wie erlaubte Payloadbytes und lokales Preimage/CAS atomar miteinander gebunden werden, bevor eine Projektion als identischer Snapshot gilt. Keine Änderung an seiner Outbox vorgenommen.
4. Reine Validierung ohne Normalisierung: zulässige Decimalrepräsentationen und UNKNOWN-FX einschließlich unbewertetem USD-Journal unverändert prüfen; vorhandene Finanzoracles auf einer getrennten Prüfansicht wiederverwenden. Keine normalisierte Rückgabe als Syncbytes verwenden. Textfelder können beliebigen Nutzertext enthalten; eine strukturelle Allowlist ist keine Erkennung versehentlich in Notizen geschriebener Geheimnisse.

Deshalb nach ausdrücklichem Auftrags-Abbruchpfad kein neues Produktionsmodul, kein Teilschema und kein Ersatzvalidator implementiert. Die Tests dokumentieren die Lücke; ein PASS der GAP-Fälle ist ausdrücklich **kein** bestandener Sync-Sicherheitsnachweis.

## Tatsächliche Prüfung

Node `v24.22.1`, abweichend von CI22/Wallet20. Alle 73 lokalen Paket-/Quell-/Testeingaben vor Abschluss gegen ihre Git-Blob-SHAs aus dem gepinnten Commit bytegenau bestätigt.

- Neue Datei `tests/flh04-snapshot-contract-gap-once.test.mjs`: final **10 PASS / 0 FAIL / 0 SKIP / 0 CANCELLED**. Positive exakte Journal-/Referenzprobe, negative Version/Duplikate/Journalmengenkonsistenz sowie acht konkret benannte Lückencharakterisierungen, ausschließlich synthetische Daten.
- Unveränderte bestehende Suites `backup-references.test.mjs`, `unknown-fx.test.mjs`, `complete-backup.test.mjs`, `model.test.mjs`: **31 PASS / 0 FAIL / 0 SKIP / 0 CANCELLED**. Einschließlich unabhängiger Decimalergebnisse, UNKNOWN/Null, falscher FX, beschädigter Referenzen und verschlüsseltem Backup-Roundtrip. Erster gemeinsamer Lauf 39 PASS (31 bestehende + damals 8 neue); nach zwei zusätzlichen positiven/negativen Kontrollen nur neue Suite final erneut ausgeführt: 10 PASS. Insgesamt 41 verschiedene erfolgreiche Tests, keine 49 verschiedenen behauptet.
- Keine Full-CI, kein Workflowstart, kein Browser-/IDB-/Netzwerk-/Vault-/SW-/Appcode, kein Apply, kein PR/Merge/Deploy. Keine bestehende Testdatei verändert. Kein v5-/Sync-Apply-/Zweigerätenachweis.

## Integrationshinweis

Nur diese zwei neuen Dateien gezielt prüfen oder cherry-picken, nicht den Hauptbranch/Checkpoint ersetzen. Tests sind reine Charakterisierung des gepinnten Bestands und sollen nach einer künftigen Vertragsentscheidung durch wirkliche Reject-/Accept-Tests des geschlossenen Validators ergänzt werden. Keine automatische Integration, keine Freigabe und keine Kopplung an die persistente Outbox. Hauptagent entscheidet über Vertrag, Review und Übernahme.
