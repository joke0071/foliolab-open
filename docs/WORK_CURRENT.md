# FolioLab Open – aktueller Stand

Stand: 28.10.2026. Einstieg auf `feature/flh05-import-foundation`; keine zweite Roadmap.
Verbindlich: [WORK_RESTPAKETE_CHECKPOINT.md](WORK_RESTPAKETE_CHECKPOINT.md).
Bei Konflikten GitHub und konkrete Detailnachweise prüfen; ältere Einträge sind Historie.

- Letzter produktiv abgenommener Release: **v199 LIVE_ACCEPTED**.
- main: `c28053a109ed0338cdb040d88758766a1888a535` (PR188/189).
- Aktiver [PR190](https://github.com/joke0071/foliolab-open/pull/190), offen/geprüft, kein Draft.
- Branch: `feature/flh03-bitpanda-preview`.
- HEAD: `e83d3bddc2132ea5a5632902f5971e97679b0818`.
- Getesteter PR-Merge: `6de821d0cfd9513a756370d883ef35b38a5ea1a4`.
- Lokaler-/Remote-/Mergebaum identisch: `25cd84474adad7f592e65611daf3d12b509df22c`.
- **FLH03-04-BP01 DONE / BP02 DONE** im vereinbarten reinen Parser-/PR-Umfang.
- **BP03 TODO:** native Dialoganbindung im bestehenden PR; **BP04 TODO:** Release/Liveabnahme.
- Kein Merge/Deployment von PR190 begonnen; SW200 unveröffentlicht.
- Master/FLH03-04 **PARTIAL**. PR157/161 unverändert geparkt; keine aktiven Actions/Writer.

## Abgeschlossene Etappen dieser Sitzung

- BP01: [Fachvertrag vor Code](https://github.com/joke0071/foliolab-open/blob/e22a803ae03057744701587f421e11f724852dca/docs/FLH03_BITPANDA_CONTRACT.md),
  Commit `e22a803ae03057744701587f421e11f724852dca`.
- BP02: gemeinsamer bestehender CSV-Zeichenautomat, generischer Import unverändert strikt.
  Reine Bitpanda18/17-/Vorspannprojektion, exakte Decimal18-Werte, fehlendes/leer-/Strich-
  Steuerfeld unbekannt statt0; alle Zeilen/unklaren/duplizierten Konflikte erhalten.
- Vorspanninhalte nicht im Ergebnis, Quellzeitoffset/Fiat/Asset/Feeasset/Spread/Product/In-Out erhalten.
- Keine Dialog-/Buchungsintegration oder Finanz-/Storage-/Migrations-/Backupänderung.
- Öffentliche Fixtures ausschließlich synthetisch; Originale privat.

## Letzte erfolgreiche Prüfungen / offene Gates

- Lokal21gezielte Tests,842/842Units/0Fail/0Skip und Syntax PASS.
- 1529synthetische Vergleiche gegen vorherigen generischen Parser: Ergebnisse/Ablehnungen identisch.
- [Pflicht-CI40720747693](https://github.com/joke0071/foliolab-open/actions/runs/40720747693)
  und Wallet40720747688 vollständig SUCCESS:842/842Units, Syntax, Chromium, beide Pflichtshards.
- Neue Runtime tatsächlich in Chromium/Firefox/WebKit PASS: Schema/18-17/Vorspann/
  Zahlen/Fees/unklare Tax/alle Konfliktzeilen/Negative/Immutable/exakter IDB-Record inklusive
  Revision und Settings unverändert, echter SW-Offline-Reload/Modulimport, keine externen Requests.
- Main-/Cross2-ZIP-Digests vor Extraktion geprüft; getesteter Merge/SHA exakt.
  Erste kürzere lokale Main-ZIP wegen falschem Digest verworfen und nicht extrahiert;
  einmaliger neuer Download vollständig verifiziert. Keine CI wiederholt.
- Zehn-Dateien-Scope-/Quellreview ohne Blocker, alle bisherigen Assertions/Pins/Gates erhalten.
- [Maschinenbeleg](release-evidence/bitpanda-pr190-candidate.json).
- Offen: BP03-UI samt nativer Quarantäne/Submit/Fokus/Axe und BP04 volle tatsächliche Liveabnahme.
  Kein Bitpanda-UI- oder wirtschaftlicher Import-PASS behauptet.

## Exakt nächster ausführbarer Schritt

Nächste Sitzung **BP03**: frischer Kollisions-/HEAD-/Baumcheck, bestehenden PR190/Branch
weiterverwenden. Vorhandenen CSV-Dialog um native Bitpanda-Vorschau ergänzen: erkennbare
Formate vor generischem Mapping quarantänisieren; genau eine native Datei, Misch-/Fremdmodus
und Submit sperren. Bestehende Generation-/Abbruch-/Fokus-/Pagingmechanik und Escaping nutzen.
Gezielte UI-Tests, unveränderte volle Pflicht-CI/3Engines/Offline/Nullmutation/Review.
Danach BP04 kontrollierter Release mit tatsächlicher Produktionsabnahme; keine Freigabe allein aus Parser-PASS.
Zwei Etappen dieser Sitzung abgeschlossen: gesicherter Stopp, jetzt kein weiteres Paket.

## Flatex-Nachtrag / externe Grenzen

- [Universeller Flatex-Nachtrag](FLH03_FLATEX_UNIVERSAL_ADDENDUM.md) aufgenommen, **FX-AUDIT01 TODO**.
- Neue konsolidierte private Depot-/Kontoreferenzen gemeldet, von Work noch nicht geprüft.
  Gemeldete12/10Spalten mit Blankheadern/Windows-1252; private Mengen/Zeiträume/Order-Sollwerte privat.
- Frühere unvollständige Datei bleibt historische Evidenz; keine neue pauschale Datenanforderung.
- Audit erst im regulären Flatex-Schritt nach laufender Bitpanda-Folge, ohne Umpriorisierung.
  Neun Istpunkte klassifizieren, vorhandene Implementierung zuerst prüfen, nur belegte Lücken schließen.
- Gemeinsame/separate Dateien, Order-/Cash-Mehrfachbeziehungen ohne Doppelbuchung, Sonderereignisse,
  historischer Produktstart01.01.2022 und Bestands-/Cashflowabnahme gemäß Nachtrag.
- [Originalaudit](original-formats/ORIGINAL_FORMAT_AUDIT_2026-10-28.md): fehlende unabhängige Stichtage/
  Anfangsbestände/Transfer-/Stakingnachweise konkret offen; keine erfundenen Buchungen/Bestände.
- Keine zusätzliche kritische Freigabe für reine Vorschau; wirtschaftliche Integration separat.
- Bestehende Bitpanda-/Flatex-/P-Chain-Folge; FLH05/PERF nicht vorziehen, FLH-PROJ01 nur später dokumentiert.

## Verbindliche Übergabe

Vor Schreibaktionen main/Branches/PRs/Actions/Release/Detailcheckpoint/Writer prüfen.
Höchstens zwei begrenzte Etappen je Sitzung; nach konsistentem Schritt bzw.30–45Minuten sichern.
Gezielte Tests zuerst, identische grüne Nachweise wiederverwenden; volle Releasegates erhalten.
Beide Statusdateien atomar mit Commit/Tests/Blockern/Release/exakt nächstem Schritt aktualisieren.
Keine parallelen Stränge, CI-Abbrüche, automatischen Retries oder gelöschte Historie.
Bei unklarer Übergabe lesend bleiben. Gesicherter Commit ist keine Releasefreigabe.
