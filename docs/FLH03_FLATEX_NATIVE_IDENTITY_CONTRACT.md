# FLH03 – Native Flatex-Quellidentität und Korrekturschutz, Vorabvertrag

Basis main4e9a4a7392e3469eeb2018b7a9516debe3a48e96/v202 LIVE_ACCEPTED. Bestehende Format-/Order-/Dialogfunktionen DONE, nicht neu implementieren. Dieser Schnitt bleibt reine Grundlage ohne aktive Dialog-/Wirtschafts-/Storageintegration. Zwei Etappen: Vertrag/Gegenbeispiel, dann geprüfte Grundlage; UI/Release separat.

## Vorhandenen Kern wiederverwenden

import-identity.js: sourceDigest/importSourceKey/bookingOwnership/sourceUnmodified und Importherkunftversion1 vorhanden. csv-import.js/previewCSV: gleiche-ID-Payloadvergleich, manuelle Eigentumsprüfung, Legacyprüfung, atomarer Commit/stale baseline vorhanden; csv-batch/Backup/Undo/IndexedDB-CAS unverändert. Kein zweiter Import-/Journal-/Persistenzpfad.

Konkrete Lücke: gemeinsame Herkunft vergleicht normalisierte Finanzprojektion. Native Rohfelder wie Valuta, Kontoreferenzen oder Quelltext nach Notes-Kürzung können sich ändern, ohne diese Projektion zu ändern. Synthetisches Gegenbeispiel vor Code reproduzieren; bloßes Parser-/Hash-PASS nicht als Importabnahme ausgeben.

## Reine Identitätsprojektion

inspectNativeFlatexSourceIdentities(documents) in bestehendem import-identity.js, direkte gefrorene native Parserdokumente,1–20Dokumente/1–5000Zeilen. Bestätigte Spalten-/Wertestruktur und physische eindeutige Zeilen prüfen. Keine fremden CSV-Dialekte normalisieren.

Identitätsnamespace flatex-native-v1:<depot|account>:SHA256(Quellkontext), externalId unveränderte vollständige Bank-TA-Referenz einschließlich führender Nullen. Fehlende/ungeklärte/überlange/kontrollzeichenhaltige Scope-/Bankreferenzen bleiben Review, kein Inhalts-/Datei-/Orderfallback. Datum/Valuta/ISIN/Orderreferenz/Exportordinal/Dateiname/Reihenfolge gehören nicht in die Identität; geänderte Fakten dürfen keine neue Identität erzeugen. Depot-/Kontoseite und mehrere Quellkontexte bleiben getrennt. Namespace und Hash sind keine Bestätigung globaler Identität, Kontoeigentümerschaft oder Authentizität.

Versionierte sourceEvidence {version:1,payloadDigest:<SHA256>} über feste positionsgebundene Schlüssel/Werte aller geparsten Originalfelder außer Depot-Exportordinal number. Encoding/physische Zeile/Dateiname nicht einbeziehen. Raw-Strings nach bestehender Parsertrimmung unverändert, keine Geldsummen/Normalisierung/Steuer-/FX-/Kostenannahme. Synthetischen unabhängigen Node-crypto-Referenzhash nachweisen.

Alle Quelllokatoren/Bank-/Orderreferenzen erhalten. Gleiche Quellenidentität mit identischem Payload = overlap-review, abweichender Payload = conflict für alle betroffenen Vorkommen. Keine Zeile entfernen oder automatisch überspringen. Parserissues/fehlende Identität bleiben source-review. Nur eindeutige quellenklare Einträge können ein Identitätsangebot enthalten; costsVerified:false, Gesamtergebnis ready=false/writeEnabled=false/deeply immutable. Keine Finanzzeile/Portfolio-/Kontozuordnung, keine Commit- oder Importfunktion.

## Gemeinsamer Quellschutz statt Parallelmodell

Optionale Evidenz ausschließlich im vorhandenen importSource.sourcePayload neben bestehenden normalisierten Feldern, keine neue Top-Level-Backupstruktur oder Finanzfelder. Native Namespace nur mit gültiger Evidenzversion/64hexDigest und nichtleerer sicherer Bankreferenz; ungültige/fehlende/überzählige Evidenzfelder fail closed, auch bei Backupvalidierung. Nonnative/Legacyherkunft ohne Evidenz bleibt exakt unverändert; fremde Herkunft darf native Evidenz nicht einschmuggeln.

previewCSV bindet Evidenz in den vorhandenen Payloadvergleich ein. Gleiche Quell-ID/abweichende Evidenz erzeugt bestehenden source-conflict, auch wenn normalisierte Finanzfelder gleich sind. Fehlende/entfernte Evidenz darf keinen Replay-PASS erzeugen. Vorhandener sourceUnmodified-/bookingOwnership-Schutz, Cashlink-Fallback, atomare Ganzstapel-/Stale-/CASgates weiterverwenden.

Neue Namespace darf alte Flatex-/allgemeine/manuelle Buchungen nicht als sicher neu umgehen: unbelegte bestehende nichtnative Buchung mit gleicher Portfoliozuordnung/Datum/Typ/Position oder alte Flatex-Bank-ID im gewählten Konto bleibt source-conflict/Review. Kein automatischer Namespace-Migrations-/Dedupe-/Overwritepfad. Unterschiedliche eindeutige native Bank-IDs bleiben getrennte Quellen; eigene wirtschaftliche Qualifikation und ausdrückliche Konto-/Scopebindung sind später erforderlich.

## Nachweise und Grenzen

Synthetische Units: getrennte Seiten/Scopes/IDs/führende Nullen; umbenannte/umgeordnete/Teil-Dateien/Ordinal; geänderte Rohfelder ohne Identitätswechsel; Konflikt/Overlap alle Vorkommen; fehlende IDs/Bounds/Schema/Immutability; unabhängiger SHA; bestehender gemeinsamer previewCSV/Import-CAS/Backup-/Plain-/Encrypted-Restore-/Replay-/manuelle Korrekturen/Legacy-Abgrenzung ohne produktive Mutation. Synthetische Projektionen dienen nur dem gemeinsamen Schutzkernbeweis, sind kein freigegebener nativer Wirtschaftsadapter.

Browser über bestehenden Drei-Engine-CI-Einstieg: reale Parserdokumente, gleiche gemeinsame Guards und Hashreferenz, echte Offline-Neuladung/Modulimport, exakter IDB-Record/Revision/Settings unverändert und keine externen Requests. Keine aktiven Finanzbuchungen/Journal-/Storage-/Backupänderung in Browserprofilen. Neue SW203 nur Kandidat; kein zusätzlicher neuer ausgelieferter Modulpfad. Volle unveränderte Pflicht-CI/Wallet/Quell-/Artefaktabnahme, keine Test-/Pin-/Workflowlockerung. Kein visueller UI-PASS ohne UIänderung.

Keine privaten Originale für diesen Strukturschnitt erforderlich, keine privaten Produktivdaten ändern. Private Sourcehashes niemals veröffentlichen. Gesamtmaster PARTIAL; UI-MASTER28/DELETE-MASTER28/FLH04/sonstige Roadmap erhalten, FLH05/PERF/PROJ01 nicht vorziehen. Nach geprüfter Grundlage dauerhaft sichern; native Staging-/Kontobindung und wirtschaftliche Freigabe separat.
