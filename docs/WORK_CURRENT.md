# FolioLab Open – aktueller Stand

Stand: 28.10.2026. Einstieg auf `feature/flh05-import-foundation`; keine zweite Roadmap.
Verbindlich: [WORK_RESTPAKETE_CHECKPOINT.md](WORK_RESTPAKETE_CHECKPOINT.md).

- Letzter abgenommener Release: **v198 LIVE_ACCEPTED**.
- Veröffentlicht: **v199, NICHT LIVE_ACCEPTED**.
- main: `c28053a109ed0338cdb040d88758766a1888a535` (PR188/189 gemergt).
- Baum: `c4583d5d866c56f46d6c59741cbfc6b49348e3b4`, exakt geprüfter Korrekturkandidat.
- Aktiver Branch: `feature/flh03-kraken-ledger-preview`; [PR189](https://github.com/joke0071/foliolab-open/pull/189) gemergt.
- HEAD `f6a1fc29bb43e5e53d3be9a22d586a739a7514c9`, Tree `c4583d5d866c56f46d6c59741cbfc6b49348e3b4`.
- Pflicht-CI40713975520/Wallet40713975525 vollständig SUCCESS, Ein-Zeilen-Review PASS.
- Main-/Pages-/Live40715191210 läuft regulär.
- **KRAKEN03 IN_PROGRESS**, **KRAKEN-QA01 Implementierung/PR DONE** (zweite Etappe).
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

Main40715191210 regulär vollständig abschließen; tatsächliche Drei-Engine-Liveberichte,
Artefakt-Digest/Modulbytes/Produktionsbilder prüfen und erst dann v199 LIVE_ACCEPTED. Danach notwendiger Releaseabschluss und sicherer Stopp.
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
