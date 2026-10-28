# Native Flatex-Orderbeziehungen – Kandidat in Prüfung, 28.10.2026

Basis main88508742db6bed9be57d6e907b2bfe56d61b1631/v201 LIVE_ACCEPTED.
Einziger Funktionsbranch feature/flh03-flatex-order-links.
Vorabvertrag vor Code separat gesichert: e5f2a20ae01e6b0a25edcccdc8bf026f1fb3aca7,
docs/FLH03_FLATEX_ORDER_LINK_CONTRACT.md. Zentraler Gesamtcheckpoint weiterhin
auf feature/flh05-import-foundation in docs/WORK_RESTPAKETE_CHECKPOINT.md.

Vertrag DONE, reine Zuordnungsgrundlage IN_PROGRESS bis finale Pflicht-CI/Quellprüfung.
inspectNativeFlatexOrderLinks im vorhandenen flatex-settlements.js; Legacy-API/Heuristik
unverändert, bounded Datumshorizont und qualifizierter 1:1-Weg darüber wiederverwendet.
Orderreferenz nicht gleich Bank-TA-ID. Dokumentlokale Quellzeilen-Lokatoren und alle
Beine erhalten; keine Deduplizierung, Summierung, Finanz-/Cash-/Steuer-/Gebührenannahme.
Mehrere Cash-/Depotausführungen bleiben Review; Widersprüche, Überschneidungen,
Storno, Quellkontexte, fehlende Referenzen, Währungen und Datumslücken explizit.
Keine Änderung von app.js, Quellparser, Finanz-/Storage-/Backupvertrag; kein Dialog
und kein visueller UI-PASS behauptet. SW202 unveröffentlicht, Produktion v201.

871/871 gesamte lokale Tests unter Node20 (0 Fehler/Skip), Syntax PASS.
16 neue fokussierte Tests auch unter lokalem Node24; vorherige volle870Units grün.
Neue Chromium-Runtimeprüfung PASS: getrennte Referenzen, 1:1/mehrere Beine/Teilausführung,
Überschneidung/Konflikt/Storno/Währung/Scope/fehlende/unzugeordnete Fälle,
exakte kleine Zahlen, Grenzen/Unveränderlichkeit, unveränderte Legacy-Regression,
echter SW-Offline-Reload/Modulimport und exakter IDB-Record/Revision/Settings unverändert,
keine externen Requests. Öffentliche Fixtures ausschließlich synthetisch.

Private lokale Originalkopien bei unveränderten Drive-Metadaten lesend wiederverwendet.
Sämtliche möglichen1:1-Lokatoren stimmen mit unabhängiger Python-csv/Decimal-
Referenzbeziehung überein; privates Sollziel bestätigt, alle Quellzeilen erhalten.
Keine privaten Referenzen, Zeilen, Mengen, Zeiträume, Geldbeträge oder Hashes öffentlich.
Kein vollständiger Historien-/Saldo-/Cashflow-/Performancebeweis.

Nächster Schritt: volle unveränderte Pflicht-CI/Wallet/Chromium/beide Firefox-WebKit-
Shards, tatsächliche neue Runtimeberichte/Artefaktdigests und identische Kandidaten-/
Merge-/Lokalbäume prüfen, finalen Diff reviewen und zentral dauerhaft sichern.
Nach zwei Etappen Vertrag + geprüfte reine Grundlage sicher übergeben; Dialoganbindung
und kontrollierter Release später separat, keine wirtschaftliche Importfreigabe.
UI-MASTER28/DELETE-MASTER28 und bestehende Roadmap erhalten/offen; keine privaten
Produktivdatenänderungen ohne ausdrückliche Freigabe. Gesamtmaster/FLH03-05 PARTIAL.
