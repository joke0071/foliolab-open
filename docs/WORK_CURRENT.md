# FolioLab Open – aktueller Stand

Stand: 28.10.2026. Einstieg auf `feature/flh05-import-foundation`; keine zweite Roadmap.
Verbindlich: [WORK_RESTPAKETE_CHECKPOINT.md](WORK_RESTPAKETE_CHECKPOINT.md).
Bei Konflikten GitHub und detaillierte Nachweise prüfen; ältere Einträge sind Historie.

- Letzter produktiv abgenommener Release: **v199 LIVE_ACCEPTED**.
- main: `c28053a109ed0338cdb040d88758766a1888a535` (PR188/189).
- Baum: `c4583d5d866c56f46d6c59741cbfc6b49348e3b4`, exakt geprüfter Korrekturkandidat.
- [PR188](https://github.com/joke0071/foliolab-open/pull/188) und [PR189](https://github.com/joke0071/foliolab-open/pull/189) gemergt.
- Kein aktiver Funktions-PR; Krakenbranch vollständig gesichert als Referenz erhalten.
- **KRAKEN03 DONE / KRAKEN-QA01 DONE**; zwei Etappen dieser Sitzung abgeschlossen.
- Gesamtmaster/FLH03-03 **PARTIAL**; wirtschaftliche Übernahme bleibt gesperrt.
- Geparkte PR157/161 unverändert; keine laufenden Actions oder lokalen Writer.

## Erledigt

- Reine native16-Spalten-Kraken-Vorschau kontrolliert veröffentlicht und tatsächlich live abgenommen.
- Alle Zeilen/refid-Mehrbeine, deklarierte Fee-Währung und ungeklärte/duplizierte Konflikte erhalten.
- Übernahme einschließlich forcedSubmit gesperrt; kein Finanz-/Storage-/Migrations-/Backupumbau.
- KRAKEN-QA01: Live-Teststart auf echte Startseite/IDB-ready korrigiert statt nichtdeployter
  tests-Hilfsseite; ausschließlich ein Testdatei-/Ein-Zeilen-Diff, sämtliche Assertions erhalten.

## Letzte erfolgreiche Prüfungen

- PR189-CI40713975520/Wallet40713975525 vollständig SUCCESS.
- [Main-/Pages-/Live40715191210](https://github.com/joke0071/foliolab-open/actions/runs/40715191210)
  vollständig SUCCESS:831/831Units/0Fail/0Skip, Syntax, Chromium, beide Pflichtshards,
  Deployment und tatsächliche Produktionsabnahme.
- Produktion SW199,115exakteDateivergleiche inklusive beider Krakenmodule,
  6Kerngruppen/18Axe, echte Plain-/EncryptedUIRestore und OfflinecommitReload PASS.
- Neue Kraken-Suite tatsächlich inChromium/Firefox/WebKit auf Produktionsdomain PASS:
  Auto/Explizit/Schema/Misch-/Modussperre, alleBeine/Fees/hostileInput/50-100Anzeige/Fokus/
  5Breiten/Axe/44px/forcedSubmit/Cancel/Escape/Neuöffnen/Offline/exakteIDB-Settings-Nullmutation.
- Finale Main-/ProduktionsZIP-Digests vor Lesen/Extraktion bestätigt, SHA/Baum exakt.
- Sechs Produktionsbilder tatsächlich angesehen, PASS: Kraken Chromium390/Firefox320/
  WebKit1440 und Kern320/390/1440.
- [Maschinenbeleg](release-evidence/kraken-ledger-v199-release.json).
- Frühere fehlgeschlagene Main-/Livegates unverändert dokumentiert, nicht als PASS umgedeutet.
  Historischer WebKit-Logoaussetzer nach einmaliger identischer Wiederholung bestanden;
  Test-Hilfsseitenfehler in PR189 korrigiert; finaler neuer Release vollständig grün.

## Exakt nächster ausführbarer Schritt

Nächste Sitzung **FLH03-04-BP01 TODO**: frischer Kollisionscheck, vorhandenen
[Originalformataudit](original-formats/ORIGINAL_FORMAT_AUDIT_2026-10-28.md) und gezielte
bestehende CSV-/Decimal-/Previewverträge laden; vor Code begrenzten reinlesenden
Bitpanda18/17-/Vorspannvertrag sichern. Fehlendes Tax-Feld/Leerwerte/Striche unbekannt,
expliziten Zeitoffset/Fiat/Asset/Feeasset/Spread/Product/In-Out erhalten;
keine Steuer0, Preis-/Kosten-/Cash-/Stakingannahmen oder neue wirtschaftliche Übernahme.
Bestehende Parser-/Dialogmechanik wiederverwenden; neue Formatvarianten nicht erfinden.
Danach laut bestehender Folge Flatex-Formatlücken/P-Chain-Reste; FLH05/PERF nicht vorziehen.
Kein weiteres Entwicklungspaket dieser Sitzung. FLH-PROJ01 nur später dokumentiert.

## Externe Grenzen / Detailquellen

- Originale privat; öffentliche Fixtures ausschließlich synthetisch.
- Flatex ausdrücklich unvollständig; weitere Originale derzeit nicht verfügbar.
- Trades/Balances/unabhängige Stichtage konkret offen; keine erfundenen Buchungen/Bestände.
- Keine zusätzliche externe Freigabe für reine Vorschau nötig; wirtschaftliche Integration separat.
- [Kraken-Fachvertrag](https://github.com/joke0071/foliolab-open/blob/c783f460e3069d0654269ae2d1e1879022ede20d/docs/FLH03_KRAKEN_LEDGER_CONTRACT.md)
- [PR188-Kandidatenbeleg](release-evidence/kraken-ledger-pr188-candidate.json)
- Bestehende Roadmap/FLH03_WORK_CHECKPOINT bleiben maßgeblich; keine neue Gesamtplanung.

## Verbindliche Übergabe

Vor Schreibaktionen main/Branches/PRs/Actions/Release/Detailcheckpoint/Writer prüfen.
Höchstens zwei begrenzte Etappen je Sitzung; nach konsistentem Schritt bzw.30–45Minuten sichern.
Gezielte Tests zuerst, identische grüne Nachweise wiederverwenden; volle Releasegates erhalten.
Beide Statusdateien atomar mit Commit/Tests/Blockern/Release/exakt nächstem Schritt aktualisieren.
Keine parallelen Stränge, CI-Abbrüche, automatischen Retries oder gelöschte Historie.
Bei unklarer Übergabe lesend bleiben. Gesicherter Commit ist keine Releasefreigabe.
