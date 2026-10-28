# FolioLab Open – aktueller Stand

Stand: 28.10.2026. Einstieg auf `feature/flh05-import-foundation`; keine zweite Roadmap.
Verbindliche Details: [WORK_RESTPAKETE_CHECKPOINT.md](WORK_RESTPAKETE_CHECKPOINT.md).
Bei Widersprüchen GitHub und konkrete Nachweise prüfen; ältere Einträge sind Historie.

- Letzter produktiv abgenommener Release: **v198 LIVE_ACCEPTED**.
- Aktueller main: `8391dc0a8478af7e1aeb860b8b705217fdd24546` (PR187).
- Releasebaum: `5a6ad50997bfc932fa0220278a912f93267ff2e7`, identisch geprüfter Kandidat.
- PR187 gemergt, veröffentlicht und tatsächlich live abgenommen; kein aktiver Funktions-PR.
- PR157/161 bleiben unverändert geparkt; kein anderer Writer/aktive CI beim Abschluss.
- **P09-ID03 DONE:** kontrollierter reinlesender P-Chain-Identitätsrelease.
- **FLH03-ORIG01 DONE:** neuer regulärer lesender Original-CSV-/Parserabgleich.
- Gesamtmaster und FLH03-09 bleiben **PARTIAL**; keine vollständige Walletintegration.

## Letzte erfolgreiche Prüfungen

- PR-CI40691053325 und Wallet40691053211 SUCCESS.
- [Main/Pages/Live40693772763](https://github.com/joke0071/foliolab-open/actions/runs/40693772763)
  vollständig SUCCESS:821/821Units/0Fail/0Skip, Syntax, Chromium, beide Firefox/WebKit-Shards,
  Deployment und tatsächliche Drei-Engine-Liveabnahme.
- Produktion: SW198,113exakteDateivergleiche,6Kerngruppen/18Axe ohne Befund.
- Neue P-Chain-Adress-/Identitäts-/Negativ-/IDB-/Settings-Nullmutationsgates3Engines PASS.
- ProduktionsZIP-Digest vor Extraktion geprüft; neue320/390/1440-Kernbilder tatsächlich angesehen.
- [Releasebeleg](release-evidence/pchain-identity-v198-release.json).
- Keine offenen technischen Releasegates für PR187; spätere aktive Finanzadapter separat freigeben.

## Regulärer Originaldaten-Checkpoint

- Vier benannte Originalexporte zugänglich und ausschließlich lesend privat geprüft.
- Bittr: bestehender Kaufbelegparser akzeptiert Original; bestehende Allowlist bestätigt.
- Kraken: bestätigter16-Spalten-Ledgerdialekt; kein nativer wirtschaftlicher Adapter.
  Generisches fee→feeEUR ist für deklarierte Nicht-EUR-Gebühren keine Freigabe.
- Bitpanda: Vorspann +18/17-Feld-Varianten; bestehender Parser lehnt Originalstruktur ab.
- Flatex:13-Spalten-Depot mit drei unbenannten Positionsfeldern, kein gültiges UTF-8.
  Headerdetektor erkennt Depot, Parser lehnt Blankheader ab; Thesaurierungen separat.
- Flatex laut Nutzer unvollständig; weitere Originale derzeit nicht verfügbar.
  Keine vollständige Depot-/Cash-/Steuer-/Saldoabnahme oder erfundenen Eröffnungen.
- Exakte private Zeiträume/Anzahlen im privaten Prüfbericht; öffentlich nur abstrahierter
  [Formatabgleich](original-formats/ORIGINAL_FORMAT_AUDIT_2026-10-28.md).
- Vier vollständig synthetische Schema-Prüfungen PASS; kein Produkt-/Parser-/Workflowcode geändert.
- Alle Originale bleiben privat/unverändert; keine Zeilen, Beträge, IDs, Adressen oder Fingerprints publiziert.

## Exakt nächster ausführbarer Schritt

**FLH03-03-KRAKEN01 TODO:** nach Kollisionscheck auf aktuellem main einen begrenzten
reinlesenden Ledger-Vorschauvertrag vor Code sichern. Bestätigten16-Spalten-Dialekt,
txid/refid, Mehrbeine, Fee-Währung, unbekannte Subtypen und unbewiesene Vollständigkeit
an bestehenden CSV-/Decimal-/Preview-/Journal-/CAS-Schnittstellen abgrenzen.
Keine vollständige Buchungsfreigabe oder feste Zweizeilen-/Zeit-/Einstandswerterfindung.
Fehlende Trades/Balances/Anfang-Endbelege bleiben konkret offen; keine derzeit nicht
verfügbaren Originale erneut pauschal anfordern. TR weiterhin originalbezogen blockiert.
Danach vorhandene Bitpanda-/Flatex-Lücken gemäß bestehender FLH03-Sequenz fortsetzen.
P-Chain-Mehrseiten-/Ankerliteratur nur lesend vorbereitet, erhalten; keine parallele Umsetzung.
FLH05/PERF nicht vorziehen; FLH-PROJ01 weiterhin ausschließlich später dokumentiert.

## Verbindlicher Sitzungs- und Übergabevertrag

- Vor jeder schreibenden Aktion main/relevante Branches, offene PRs, aktive/queued Actions,
  letzten LIVE_ACCEPTED-Release, Detailcheckpoint und andere Writer prüfen.
  Unklare Übergabe: lesend bleiben und eindeutige Freigabe einholen.
- Maximal zwei Entwicklungsetappen je Sitzung; Richtwert30–60Minuten.
  Jede Etappe: ID, Ergebnis, Umfang, Abhängigkeiten, Abnahme, TODO/IN_PROGRESS/BLOCKED/DONE.
- Vor Start Release/main, PR/Branch, Ziel, Voraussetzungen und Blocker festhalten.
  Nach konsistentem Schritt bzw. spätestens etwa30–45Minuten gezielt prüfen/testen,
  sinnvoll committen und kollisionsfrei auf bestehendem Branch sichern.
- Nach Etappe beide Statusdateien möglichst atomar mit Ergebnis/Commit/Tests/Release/nächstem Schritt.
- Identische grüne Nachweise wiederverwenden; alle Pflichtgates erhalten.
  Keine CI-Duplikate, Retryschleifen oder parallelen Ersatzprozesse bei Rate Limits.
- Nach zwei Etappen gesichert stoppen; begonnene Sicherheits-/Releaseabschlüsse regulär beenden.
- Sitzung abgeschlossen: P09-ID03 und FLH03-ORIG01 DONE; nächster Schritt KRAKEN01-Vertrag.
