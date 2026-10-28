# FLH03-04-BP02 – reiner Bitpanda-Parserkandidat

Basis v199 LIVE_ACCEPTED/main c28053a109ed0338cdb040d88758766a1888a535.
Einziger Funktionsbranch: feature/flh03-bitpanda-preview.
Vorabvertrag: e22a803ae03057744701587f421e11f724852dca / FLH03_BITPANDA_CONTRACT.md.

- BP01 DONE; BP02 IN_PROGRESS bis CI und Scope-Review.
- Gemeinsam extrahierter CSV-Zeichenautomat, generischer parseCSV bleibt strikt.
- Native bestätigte18/17-Spaltenform und begrenzter Vorspann; keine sensiblen Vorspannwerte im Ergebnis.
- Fehlendes/leer-/Strich-TaxFiat unbekannt, explizites0 bleibt0. Decimal18 exakt.
- Zeitoffset, Fiat/Asset/Feeasset/Spread/Product/In-Out erhalten, keine wirtschaftliche Ableitung.
- Alle Zeilen/doppelte/konfligierende IDs erhalten; tiefimmutable Ausgabe ohne Schreib-API.
- Noch keine Dialog-/Buchungsintegration. BP03 UI und BP04 Release separat.
- Originale privat, Fixtures vollständig synthetisch; kein Finanz-/Storage-/Migrations-/Backupumbau.
- Lokal21gezielte Tests/842gesamteUnits/0Fail/0Skip und Syntax PASS.
- Zusätzlich1529synthetische Vergleichsfälle bestätigen generische Ergebnisse/Ablehnungen gegen vorherigenParser.
- Browser- und finale Pflicht-CI noch offen, kein lokaler Browser-PASS behauptet.
- Neuer Runtimegate über vorhandenen UI-Quality-/Drei-Engine-/Produktionspfad.
- Unveränderte Pflichtgates/Pins/Workflows; csv-records/bitpanda-preview inSW200 vorgemerkt.
- SW200 unveröffentlicht, Produktion bleibtv199 LIVE_ACCEPTED.
- NächsterSchritt regulärePR-CI/3Engine-Runtime/Offline/exakteIDB-/Settings-Nullmutation prüfen,
  gesamtenDiff/identischeBäume reviewen; dann nachzweiEtappen zentral sichern/stoppen.
- Aktueller zentraler Nachweis auf feature/flh05-import-foundation ist bei späterer
  Statusfortschreibung maßgeblich; dieser Kandidatencheckpoint bleibt historischer Commitnachweis.
