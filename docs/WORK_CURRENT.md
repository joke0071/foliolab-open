# FolioLab Open – aktueller Stand

Stand: 28.10.2026. Einstieg auf `feature/flh05-import-foundation`; keine zweite Roadmap.
Verbindlich: [WORK_RESTPAKETE_CHECKPOINT.md](WORK_RESTPAKETE_CHECKPOINT.md).

- Letzter abgenommener Release: **v198 LIVE_ACCEPTED**.
- Veröffentlicht: **v199, NICHT LIVE_ACCEPTED**.
- main: `49fe892d09d53a8de13a7481d2526aca356cef5f` (PR188 gemergt).
- Baum: `ecc9f587340e3fb2a9b0246b06fa85e9973b16d8`, exakt geprüfter Kandidat.
- Aktiver Branch: `feature/flh03-kraken-ledger-preview`; Korrektur-PR folgt.
- **KRAKEN03 BLOCKED**, **KRAKEN-QA01 IN_PROGRESS** (zweite Etappe).
- Gesamtmaster/FLH03-03 PARTIAL; wirtschaftliche Übernahme bleibt gesperrt.

## Erledigt / geprüft

- KRAKEN01/02 DONE: Fachvertrag, reinlesende native16-Spalten-Vorschau, synthetische Tests.
- PR188-CI40704994032/Wallet40704994025 SUCCESS,831/831Units/3Engines.
- Main40710232523: test/Cross1 SUCCESS; Cross2 nach einmaliger gezielter Wiederholung SUCCESS.
- Historischer WebKit-Logoaussetzer dokumentiert; unveränderte Assertions danach PASS.
- MainZIP12826556226 vorExtraktionDigest bestätigt, testedSHA exakt,831/831Units/0Fail/0Skip.
- Deployment SUCCESS; Kernlive115Assetvergleiche/SW199/6Gruppen/18Axe/Restore/Offline PASS.
- Livejob122903996772 FAILURE vor Kraken-Seed: Test öffnet nichtdeployte tests-Hilfsseite.
- Keine vollständige Drei-Engine-Produktionsabnahme; kein v199-LIVE_ACCEPTED.

## Aktuelle Etappe / Abnahme

KRAKEN-QA01: nur Teststart auf produktiver Startseite nach bestehender IDB-Bereitschaft
statt `tests/storage-origin.html`. Keine Produkt-/Finanz-/Storage-/Backupänderung.
Alle Assertions, Pflichtengines, Nullmutation, Offline, Security und Finance unverändert.
VorCode frischer Kollisionscheck, bestehender Krakenbranch, da188 gemergt neuer Korrektur-PR.
Abnahme: Ein-Zeilen-Diff/Syntax, volle unveränderte PR-CI/3Engines/Review, kontrollierter Merge,
vollständige tatsächliche Produktionsgates, Artefakt-Digests/Modulbytes/Bilder.
Keine zusätzliche externe Freigabe für Testkorrektur/reinlesende Vorschau erforderlich.

## Exakt nächster Schritt

Testinitialisierung korrigieren, gezielt prüfen und auf bestehendem Branch sichern;
Korrektur-PR regulär abnehmen. Danach notwendiger Releaseabschluss und sicherer Stopp.
Maximal zwei Etappen: KRAKEN03-Release + KRAKEN-QA01-Fehlerkorrektur.
Danach nächste Sitzung bestehende Bitpanda-/Flatex-/P-Chain-Folge, keine neue Roadmap.

## Erhaltene Grenzen / Nachweise

- [Kraken-Vertrag](https://github.com/joke0071/foliolab-open/blob/c783f460e3069d0654269ae2d1e1879022ede20d/docs/FLH03_KRAKEN_LEDGER_CONTRACT.md)
- [Kandidatenbeleg](release-evidence/kraken-ledger-pr188-candidate.json)
- [Originalformataudit](original-formats/ORIGINAL_FORMAT_AUDIT_2026-10-28.md)
- Originale privat; öffentliche Fixtures ausschließlich synthetisch.
- Flatex ausdrücklich unvollständig; weitere Originale derzeit nicht verfügbar.
- Trades/Balances/unabhängige Stichtage weiterhin konkret offen; keine erfundenen Buchungen.
- Geparkte PR157/161 unverändert; FLH05/PERF nicht vorziehen; FLH-PROJ01 nur später dokumentiert.

## Verbindliche Übergabe

Vor Schreibaktionen main/Branches/PRs/Actions/Release/Detailcheckpoint/Writer prüfen.
Höchstens zwei begrenzte Etappen je Sitzung; nach konsistentem Schritt bzw.30–45Minuten sichern.
Gezielte Tests zuerst, identische grüne Nachweise wiederverwenden; volle Releasegates erhalten.
Beide Statusdateien atomar mit Commit/Tests/Blockern/Release/exakt nächstem Schritt aktualisieren.
Keine parallelen Stränge, CI-Abbrüche, automatischen Retries oder gelöschte Historie.
Bei unklarer Übergabe lesend bleiben. Gesicherter Commit ist keine Releasefreigabe.
