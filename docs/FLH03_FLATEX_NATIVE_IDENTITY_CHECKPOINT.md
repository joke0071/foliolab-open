# Sichtbare Archivnavigation vor finaler CI · 28.10.2026

Zweiter Kandidat ff2b79d58fd7ee6cccfbcd3ba992a961c947d6a9 / Lauf40767434426
regulär beendet: test und Cross(2)SUCCESS, Wallet40767434644SUCCESS. Korrigierter
Kraken-Setup in voller Cross-Engine-Prüfung grün. Cross(1)FAILURE beim bestehenden
Archivtest browser-position-archive.mjs:32/nav:12: mobiler WebKit-Setup wartete auf
versteckten Desktopbutton. Die vorab abgefragte mobileNav-Sichtbarkeit darf nicht
als fester Navigationszweig über Layout-/Navigationswechsel erhalten bleiben.

Minimaler Testfix: :visible-Union der beiden echten Navigationsbuttons beim regulären
Klick auswerten; kein force/retry/Timeout-/Assertion-/Pin-/Workflowwechsel. Gezielter
lokaler Chromium-Archivlauf vollständig PASS: sechs Breiten/Axe, Archiv/Restore,
unveränderte Ökonomie/Historie, Quota/CAS, Offline, Plain-/Encrypted-UI-Restore.
App-/Identitäts-/Finanzquellen seit c6329 unverändert, rote Evidenz beider Läufe
erhalten; beide Läufe vor Korrekturpush regulär beendet. Neue volle Pflicht-CI
bleibt erforderlich. Produktion v202, SW203 unveröffentlicht, Grundlage IN_PROGRESS.

---

# Begrenzte Kraken-Setup-Synchronisation vor finaler CI · 28.10.2026

Erstkandidat c6329da2c8beea0c3f284e9c945d39133551285a / PR193 im ersten Lauf
40766119013 regulär beendet: test und Cross-Engine(1) SUCCESS, Wallet40766119069
SUCCESS, Cross-Engine(2) FAILURE ausschließlich beim vorhandenen Kraken-Setup:
browser-kraken-ledger.mjs:23 Execution context destroyed / navigation.
Neue native Identitätsgates Chromium/Firefox/WebKit bereits tatsächlich PASS.
Keine vollständige Abnahme aus den Teil-PASS ableiten; rote Evidenz zentral erhalten.

Die App kann bei Service-Worker-Controllerwechsel neu laden. Kraken startete Seed/
zweite Navigation vor gesichertem ersten Workerclaim; minimale Setupkorrektur wartet
nun vor Seed auf serviceWorker.ready UND den tatsächlichen Controller. Gezielter
Chromium-Krakenlauf samt5Breiten/Axe/Submit/Offline/exaktem Nullmutationsgate PASS.
Keine App-/Finanzquellenänderung nach c6329, keine Retry-/Sleep-/Assertion-/Pin-/
Workflowlockerung. Erstlauf vollständig beendet, dann konsistente Korrektur auf
demselben Branch/PR; neue volle unveränderte finale CI/Artefaktabnahme erforderlich.

---

# Native Quellidentität: Kandidat lokal geprüft · 28.10.2026

Basis main4e9a4a7392e3469eeb2018b7a9516debe3a48e96/v202 LIVE_ACCEPTED.
Einziger neuer Funktionsbranch feature/flh03-flatex-native-identity; frühere
PR192/Format-/Order-/Dialogschritte DONE und unverändert. Zentraler Checkpoint
weiterhin docs/WORK_RESTPAKETE_CHECKPOINT.md auf feature/flh05-import-foundation.
Vorabvertrag27fc50fe62181b3f749cbd82b7ce120c04c06623 vor Code dauerhaft gesichert.

Gegenbeispiel vor Code reproduziert: geänderte native sourceEvidence bei gleicher
normalisierter Projektion wurde noch duplicate1/issues0. Nun bestehender
source-conflict bei gleicher Quell-ID/geänderter Evidenz, ohne eigenen Importkern.

Reine native Quellenidentitätsangebote in import-identity.js, Scope-/Seitennamespace
und exakte Bank-ID ohne Datum/Order/File/Ordinal als Identität. Vorhandener SHA256
über feste Raw-Quellfelder außer Exportordinal, unabhängig gegengeprüft. Alle Zeilen
erhalten, Überschneidungen/Änderungen/fehlende Referenzen/Parserissues bleiben Review;
kein Angebot für betroffene Vorkommen. Immutable/ready=false/writeEnabled=false,
keine Portfolio-/Kontobindung oder Finanzprojektion, costsVerified:false.

Gemeinsamer previewCSV-Payloadvergleich und vorhandener Importherkunftvalidator
verarbeiten optionale native Evidenz im vorhandenen sourcePayload. Kein neues
Top-Level-Backupfeld, keine aktive Dialog-/Wirtschafts-/Persistenzintegration.
Gültige native Namespace/Evidenz/Bank-ID zwingend; Legacy/Generik ohne Evidenz
unverändert. Unbelegte nichtnative Altbuchungen bleiben vor Namespacewechsel
geschützt; unterschiedliche eindeutige native Quellen bleiben getrennt.

16 neue synthetische Tests PASS; finale892/892Units unter Node20/0Fehler/Skip,
bestehende20 CSV-Konflikt-/Batchtests separat PASS. Gezielter Chromium-Runtimegate
PASS: direkte Parserdokumente/unabhängiger SHA, getrennte Referenzen/Seiten,
Overlap/Konflikt/fehlende Quellen/Zeilenerhalt, gemeinsamer Replay-/Manual-/Legacy-/
Backup-/Stale-Schutz, echter SW-Offline-Reload/Modulimport, exakter IDB-Record samt
Revision/Settings unverändert, keine externen Requests. Nur synthetische unabhängige
normalisierte DTOs als Schutzkernbeweis, kein nativer Wirtschaftsadapter.

Noch IN_PROGRESS bis aktuelle volle unveränderte Pflicht-CI/Wallet/Drei-Engine-/
Quell-/Artefaktabnahme. Kein neuer visueller UI-PASS; kein Dialog geändert.
SW203 unveröffentlicht, Produktion v202 unverändert. Keine privaten Originale
geöffnet oder privaten Produktivdaten verändert. UI-MASTER28/DELETE-MASTER28
und bestehende Roadmap erhalten, Gesamtmaster PARTIAL.

Exakt nächster Schritt konsistenten Kandidaten auf einzigem Funktionsbranch sichern,
PR mit vollen unveränderten Pflichtgates prüfen und tatsächliche Berichte/Digests/
Merge-/Kandidatenbäume abgleichen. Nach zwei Etappen Vertrag + Grundlage dauerhaft
sichern; Staging-/Kontobindung, UI und kontrollierter Release folgen separat.

Zusätzlicher Gegenbeispieltest vor Kandidaten-Push ROT: gemischter Legacy-/Native-
Stapel konnte noch zwei Vorlagen erzeugen. Begrenzte Korrektur: gemeinsame Herkunfts-
prüfung symmetrisch gegen den bestehenden Dry-run, nicht nur ursprüngliches Modell.
Nun beide Stapelreihenfolgen per Unit und Browser geprüft, kein neuer Importpfad.
Finale892Units sowie korrigierter Chromium-/Offline-/exakter Nullmutationsgate
und Syntaxprüfung PASS; volle aktuelle CI/Artefaktabnahme weiterhin offen.
