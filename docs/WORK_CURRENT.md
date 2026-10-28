# FolioLab Open – aktueller Stand

Stand: 28.10.2026. Einstieg auf `feature/flh05-import-foundation`; keine zweite Roadmap.
Verbindliche Details: [WORK_RESTPAKETE_CHECKPOINT.md](WORK_RESTPAKETE_CHECKPOINT.md).
Bei Widersprüchen GitHub und konkrete Nachweise prüfen; ältere Einträge sind Historie.

- Letzter produktiv abgenommener Release: **v198 LIVE_ACCEPTED**.
- Aktueller main: `49fe892d09d53a8de13a7481d2526aca356cef5f` (PR188).
- Einziger Funktions-PR: [PR188](https://github.com/joke0071/foliolab-open/pull/188), gemergt; Main-/Deployment-/Live40710232523 läuft.
- Branch: `feature/flh03-kraken-ledger-preview`.
- HEAD: `c783f460e3069d0654269ae2d1e1879022ede20d`.
- Getesteter PR-Merge: `f44920f884391037a6229cf5185fec7604ff61ab`.
- Kandidat-/lokaler-/Mergebaum identisch: `ecc9f587340e3fb2a9b0246b06fa85e9973b16d8`.
- **FLH03-03-KRAKEN01 DONE / KRAKEN02 DONE** für Vertrag und geprüften Implementierungskandidaten.
- **KRAKEN03 IN_PROGRESS:** kontrollierter Release mit vollständiger tatsächlicher Liveabnahme.
- Mergebaum identisch; v198 bleibt bis vollständiger Liveabnahme maßgeblich.
- Gesamtmaster und FLH03-03 **PARTIAL**; PR157/161 unverändert geparkt.

## Abgeschlossene Etappen dieser Sitzung

- **KRAKEN01 DONE:** [Fachvertrag vor Code](https://github.com/joke0071/foliolab-open/blob/314c4fc6a2c44ff1e1698cb62efaf0de007fb720/docs/FLH03_KRAKEN_LEDGER_CONTRACT.md),
  Commit `314c4fc6a2c44ff1e1698cb62efaf0de007fb720`.
- **KRAKEN02 DONE:** reine native16-Spalten-Vorschau im vorhandenen CSV-Dialog.
  Zeilen/Mehrbeingruppen, deklarierte Fees und ungeklärte/duplizierte/konfligierende Daten erhalten;
  generisches Mapping und Übernahme einschließlich forcedSubmit gesperrt.
- Kein Finanz-/Modell-/Storage-/Migrations-/Backupumbau; Originale privat, Tests nur synthetisch.
- Quell-/Scope-/Bildreview ohne blockierenden Befund; alle bisherigen Gates/Pins/Assertions erhalten.

## Letzte erfolgreiche Prüfungen / offene Gates

- Lokal zehn neue Fachtests,831/831Units/0Fail/0Skip, Syntax PASS.
- [Pflicht-CI40704994032](https://github.com/joke0071/foliolab-open/actions/runs/40704994032)
  und Wallet40704994025 vollständig SUCCESS:831/831Units, Syntax, Chromium, beide Pflichtshards.
- Neuer Kraken-Gate tatsächlich inChromium/Firefox/WebKit PASS: Erkennung/Quarantäne/
  Fees/alleBeine/hostileInput/50-100Anzeige/Fokus/5Breiten/Axe/44px/forcedSubmit/
  Escape/Cancel/Neuöffnen/echterOfflineReload/exakteIDB-Revision-Settings-Nullmutation.
- Release-/Cross2-ZIP-Digests vor Extraktion geprüft; getesteter Mergebaum exakt.
  Drei finale Bilder tatsächlich angesehen: Chromium390,Firefox320,WebKit1440; PASS.
  [Kandidatenbeleg](release-evidence/kraken-ledger-pr188-candidate.json).
- Main Versuch1: test/Cross1 SUCCESS; Cross2 WebKit-Logoassertion fehlgeschlagen.
- Einmalige gezielte Wiederholung mit identischem SHA; keine Assertions geändert.
- Offen: volle Main-/Pages-/
  tatsächliche Drei-Engine-Livegates/Modulbytes/Produktionsbilder.
- Keine neue externe Freigabe für die reine Vorschau erforderlich; spätere wirtschaftliche
  Übernahme erfordert eigenen kritischen Fach-/Releasevertrag und weitere Belege.

## Exakt nächster ausführbarer Schritt

**KRAKEN03 starten:** main/HEAD/PRs/Actions/Writer prüfen, identische grüne Kandidatengates
wiederverwenden. PR188 kontrolliert mit erwarteter HEAD-SHA mergen, vollständigen Main-/
Pages-/tatsächlichen Drei-Engine-Livelauf regulär abschließen, Artefakte/Bilder prüfen.
Erst danach v199 LIVE_ACCEPTED dokumentieren. Keine bereits grüne PR-CI erneut starten.
Details: Fachvertrag/Kandidatencheckpoint im PR; aktueller QA-Nachweis hier/im Detailcheckpoint.

Vorheriger Originalaudit bleibt maßgeblich; keine erneute Gesamtrekonstruktion:
Bittr-Belegpfad bestätigt, Kraken-Mehrbeine/Fees quellenbezogen, Bitpanda18/17/Vorspann
und Flatex13/Blankheader/Encoding offen. Flatex ausdrücklich unvollständig; weitere
Originale derzeit nicht verfügbar. Fehlende Trades/Balances/unabhängige Stichtage
konkret führen; keine erfundenen Eröffnungen/Cashflows/Steuern.
Danach bestehende Bitpanda-/Flatex-/P-Chain-Folge, FLH05/PERF nicht vorziehen,
FLH-PROJ01 weiterhin ausschließlich später dokumentiert.

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
- Identische grüne Nachweise wiederverwenden; sämtliche Pflichtgates erhalten.
  Keine CI-Duplikate, Retryschleifen oder parallelen Ersatzprozesse bei Rate Limits.
- Nach zwei Etappen gesichert stoppen; begonnene Sicherheits-/Releaseabschlüsse regulär beenden.
- Sitzung abgeschlossen: KRAKEN01/02 DONE, PR188 geprüft/offen, KRAKEN03 TODO.
