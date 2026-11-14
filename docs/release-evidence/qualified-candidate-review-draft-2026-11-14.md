# Lokaler Review- und PR-Entwurf · 14.11.2026

Status: DRAFT_ONLY_NOT_SUBMITTED. Keine Produkt-PR, Produktref, CI, Integration oder Veröffentlichung angelegt.
Dies ist der gezielte interne Vergleich dieses einen Kandidaten; keine Gesamtinventur und kein unabhängiges Kryptoreview.

## Exakte Basis und Umfang

- Mainbasis: a27cde2f802c26bfec41190911d88bd1d7d8e325.
- Produkt: 8f9ed1ce0393d7a1b977d613551e50c8bbefd941, Tree1c1a6404012cb18f73be01b641da04b9376d63b0.
- GitHub-Compare: ahead11/behind0; Mergebase exakt Mainbasis; elf lineare Produktcommits.
-61geändertePfade:10Produkt-/HTMLdateien,12Testdateien,39Belegdateien; keineLöschungen.
- KeineWorkflow-/SW-/Stylesheet-/Manifest-/Packageänderung gegenüberMain. KeineDiagnosetrigger oderZentralcheckpointinhalte imProduktbaum.

Produktpfade:
- index.html
- src/alpha-vantage.js
- src/app.js
- src/booking-management.js
- src/crypto-fallbacks.js
- src/drive-backup.js
- src/header-status.js
- src/market.js
- src/model.js
- src/security-sources.js

Der tatsächliche Produktdelta umfasst zusätzlich zu den sieben früheren Korrekturen den ursprünglichen Restore-Ergebnis-/Toast-Schnitt und die beiden späteren Timestamp-/Nachcommitkorrekturen.
Daher nicht als bloßer Drei-Fall-Harnesspatch oder vollständigneuimplementierteK4-Legacyfunktionbeschreiben.
AllezehnProduktpatcheswurdenimgezieltenMainvergleichgelesen;keineweiterebestätigteProduktlückeindiesemDeltaabgeleitet.
DieserserielleinterneReviewersetztkeinePflichtCI,unabhängigeOriginal-/KryptoprüfungoderProduktionsabnahme.

## Vorgeschlagener Titel

Ungültige Portfolioänderungen abweisen und bestätigte Restore-Ergebnisse erhalten

## Vorgeschlagene Beschreibung

Kursquellen und Backups können boolesche oder strukturierte Zahlenwerte liefern. Diese Werte werden vor Übernahme abgewiesen; belegte Kurse, UNKNOWN-FX und gespeicherte Daten bleiben bei Ablehnung erhalten.
Buchungsänderungen erkennen codierte Abhängigkeiten und behandeln unbekannte Gebühren/Steuern getrennt von bestätigten Nullkosten.

Restore bestätigt nur übernommene Portfoliodaten. Nach einem bestätigten Commit bleibt der neue Stand bei Anzeigeproblemen erhalten und wird als gespeichert mit Anzeigewarnung gemeldet.
Ein tatsächlicher Commitabbruch meldet weiterhin einen Speicherfehler und behält den alten Datensatz. Ein Restore erfindet keinen lokalen Backup-Erstellungszeitpunkt.

Validierung:305/305ausgewählteNodeTestsin40DateienamProduktstand;29eindeutigeChromiumfälleüberzweiquellengebundeneLäufezugeordnet.
Der frühereLauf43567167015/1bleibtFAILURE28/29;43568173088/1SUCCESS3/3schließtdienichtausgelösteNachcommitexceptionmitErfolg-/Abbruchkontrollen.
[Exakte29Fall-Matrix](https://github.com/joke0071/foliolab-open/blob/2824378830941051a50c2c3ffd48a2bc3761a15c/docs/release-evidence/bounded-native-case-matrix-2026-11-14.json)
und[letzterNativebeleg](https://github.com/joke0071/foliolab-open/blob/2824378830941051a50c2c3ffd48a2bc3761a15c/docs/release-evidence/display-boundary-native-result-2026-11-14.json).

OAuth, Drive, Entschlüsselung und Passwortübernahme sind simuliert. Native IDB-Commits, Commitabbrüche, readonlyReadback und Wiederöffnen sind tatsächlich ausgeführt.
Der Anzeigefehler ist gezielt synthetisch ausgelöst. LinuxChromium390px/serviceWorkersblocked ist keineWindows-/Edge-/Android-/PWA-/Offline-/FullCI-/Krypto-/Releaseabnahme.

## Verbleibender Ausführungsweg

Nach neuer ausdrücklicher Produkt-PR-Freigabe zuerst Main/Owner/Refkollision frisch prüfen.
Nur den exakten Produktkandidaten gegen Main alsReviewgegenstand verwenden; Zentralbranch niemals vollständig nachMainmergen.
Die bestehenden regulären PR-/Main-/Produktionsgates erhalten. Keine CI-Suite aus diesen gezielten Belegen als erledigt ableiten; kein bereitsbelegterZeit-/Gesamtnutzen erfunden.
Main43332355188UrsacheUNKNOWN bleibt gesonderterBlocker; keinBlindrerun oderTimeoutlockerung. SW-/Releaseänderungen benötigen den dafür geltenden autorisierten Releaseumfang.
Reale Geräte-/OAuth-/Original-/Kryptoreviewgates bleiben separat offen. Die reine weitereReviewarbeit ist lesend zulässig; PR-Erstellung/Integration/Release sind aktuell ausdrücklich verboten.
