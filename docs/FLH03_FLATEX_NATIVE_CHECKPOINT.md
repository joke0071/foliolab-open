# FX-FORMAT01 – Kandidat in Prüfung, 28.10.2026

Basis main b2a07f4131a7b38d1fa7da40fab8ea58b72fd119 / v200 LIVE_ACCEPTED.
Einziger Funktionsbranch: feature/flh03-flatex-native-format.
Vorabvertrag separat vor Code gesichert: 412852f63091ece0d879e698c4fd65ba376ef63e.
FX-AUDIT01 DONE auf zentralem Dokumentationsbranch in 814a092b60ca802c049a7cd9c64de40244d1e147;
maßgeblicher Gesamtcheckpoint bleibt docs/WORK_RESTPAKETE_CHECKPOINT.md dort.

FX-FORMAT01 IN_PROGRESS bis vollständiger PR-CI und finalem Scope-/Runtime-Review.
Reine native 12-/10-Spaltenprojektion auf gemeinsamem CSV-Lexer/Decimal-Kern;
Blankspalten vollständig positionsgetreu, UTF-8/Windows-1252 ohne Ersatzzeichen,
getrennte Quellzahlen/Währungen/Daten/Referenzen, dokumentarische Ereignisse,
alle doppelten/konfligierenden Zeilen erhalten, tief immutable ohne Import-API.
Keine Änderung von app.js, parseCSV oder prepareFlatexImport, keine wirtschaftliche
Freigabe, kein Finanz-/Storage-/Migrations-/Backupumbau. SW201 unveröffentlicht.

Lokal 852/852 Units (0 Fehler/Skip), Syntax und neue Chromium-Runtimeprüfung PASS:
native Bytes tatsächlich decodiert, Blankspalten, exakte Zahlen, unbekannt/0,
getrennte Referenzen, negative Schemata, echter SW-Offline-Reload/Modulimport,
exakter IDB-Record/Revision/Settings unverändert, keine externen Requests.
Beide privaten Originale vollständig lokal gelesen; sämtliche Quellfelder und
Datum-/Decimal-Projektionen unabhängig mit Python-csv/Decimal geprüft und gleich.
Keine Originalzeilen, Kennungen, privaten Mengen/Zeiträume/Beträge/Fingerprints
in Repository/Fixtures/CI. Keine vollständige Historien-/Bestandsabnahme behauptet.

Nächster Schritt: reguläre vollständige Pflicht-CI/Wallet/Chromium/beide
Firefox-WebKit-Shards abwarten, tatsächliche neue Runtimeberichte/Artefaktdigests
und identische Kandidaten-/Merge-/Lokalbäume prüfen; zentral dauerhaft sichern.
Nach zwei Etappen Audit + Formatgrundlage sicheren Kandidaten übergeben.
Später nächster Schnitt: getrennte Depot-/Kontouploads und native Quarantänevorschau;
Order-/Mehrfachgegenbeinvertrag und wirtschaftliche Integration separat.
Kein Merge/Deployment dieser noch nicht dialoggebundenen Grundlage behauptet;
Produktion bleibt v200 LIVE_ACCEPTED. Gesamtmaster/FLH03-05 PARTIAL,
UI-MASTER28 und ursprüngliche Folge erhalten; FLH05/PERF/PROJ01 nicht vorziehen.
