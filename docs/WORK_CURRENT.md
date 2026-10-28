# FolioLab Open – aktueller Stand

Stand: 28.10.2026. Einstieg auf `feature/flh05-import-foundation`; keine zweite Roadmap.
Verbindliche Details: [WORK_RESTPAKETE_CHECKPOINT.md](WORK_RESTPAKETE_CHECKPOINT.md).
Bei Widersprüchen GitHub und konkrete Nachweise prüfen; ältere Einträge sind Historie.

- Letzter produktiv abgenommener Release: **v197 LIVE_ACCEPTED**.
- Aktueller main: `7b96a411925621f59021c36ad4d4a60a531c3a92` (PR186).
- Einziger Funktions-PR: [PR187](https://github.com/joke0071/foliolab-open/pull/187), offen, kein Draft.
- Branch: `feature/flh03-pchain-identity`.
- HEAD: `06726680c794145d158d378d6b24741fa0c34247`.
- Getesteter PR-Merge: `2036ac9a225fb06256652f746c01f03c71c71a49`.
- Kandidat-/lokaler-/Mergebaum identisch: `5a6ad50997bfc932fa0220278a912f93267ff2e7`.
- Arbeitspaket FLH03-09: P-Chain-Adresse und kontextgebundene UTXO-Beobachtungsidentität.
- **P09-ID01 DONE / P09-ID02 DONE** für Vertrag und geprüften Implementierungskandidaten.
- **P09-ID03 TODO:** kontrollierter Release und tatsächliche Produktionsabnahme.
- Kein Merge/Deployment für PR187 begonnen; SW198 bleibt unveröffentlicht.
- Gesamtmaster und FLH03-09 insgesamt **PARTIAL**; PR157/161 unverändert geparkt.

## Abgeschlossene Etappen dieser Sitzung

- **P09-ID01 DONE:** fester [Fachvertrag vor Code](https://github.com/joke0071/foliolab-open/blob/7d7fa3f9ae476dafcb8b1e3a4719b2ac8fc8400c/docs/FLH03_PCHAIN_IDENTITY_CONTRACT.md),
  Commit `7d7fa3f9ae476dafcb8b1e3a4719b2ac8fc8400c`.
- **P09-ID02 DONE:** reine Prüfhelfer, neun neue Fachtests, bestehende Browser-Suite erweitert.
  Kein aktiver Scanner/RPC, Walletbestand, Finanz-/Storage-/Migrations-/Backupumbau.
- Quell-/Scopeprüfung ohne blockierenden Befund; bisherige Assertions/Gates/Pins erhalten.

## Letzte erfolgreiche Prüfungen / offene Gates

- Lokal24/24 gezielte Tests, volle821/821Units/0Fail/0Skip und Syntax PASS.
- Lokaler Browserstart war vor Ausführung wegen fehlender Playwright-Binärdatei blockiert.
  Verbindlicher Drei-Engine-Nachweis stammt aus regulärer CI, kein lokaler Browser-PASS.
- [Pflicht-CI40691053325](https://github.com/joke0071/foliolab-open/actions/runs/40691053325)
  und Wallet40691053211 vollständig SUCCESS:821/821Units, Syntax, Chromium, beide Pflichtshards.
- Neue Adress-/Identitätsprüfungen in Chromium/Firefox/WebKit PASS; Netzwerk/Chain/Negativfälle,
  exakte Owner-/Outpoint-Zuordnung, IDB-/Settings-Nullmutation und Immutable-Ergebnisse geprüft.
- Release-/Cross2-ZIP-Digests vor Extraktion bestätigt; Mergebaum exakt.
  [Kandidatenbeleg](release-evidence/pchain-identity-pr187-candidate.json).
- Offen: aktueller Kollisions-/HEAD-/Mergebaumcheck, Releaseentscheidung im reinlesenden Scope,
  kontrollierter Merge, vollständige Main-/Pages-/echte Drei-Engine-Livegates, Modulbytes/Kernbilder.
- Keine zusätzliche externe Freigabe für diese reinen Prüfhelfer erforderlich.
  Ein späterer aktiver Finanzadapter benötigt eigene konkrete Freigabe und Fachbelege.

## Exakt nächster ausführbarer Schritt

**P09-ID03 starten:** main/HEAD/PRs/Actions/Writer prüfen; vorhandene grüne Gates bei
identischem Kandidaten wiederverwenden. PR187 kontrolliert mit erwarteter HEAD-SHA mergen;
danach reguläre Main-/Pages-/Liveabnahme vollständig abschließen und Belege/Bilder prüfen.
Keine bereits bestandene PR-CI erneut starten. Erst danach v198 LIVE_ACCEPTED dokumentieren.
Details: Fachvertrag und Kandidatencheckpoint im PR; aktueller QA-Stand hier/im Detailcheckpoint.
Danach offene konsistente P-Chain-UTXO-/Staking-/C↔P-/Fee-/Sollwertverträge gemäß Rang5.
Beobachtungsidentität ist kein globaler wirtschaftlicher Ereignis-/Eigentums-/Saldo-Nachweis.
Spätere Sonic-/Drive-/FLH04-Folge erhalten; FLH05/PERF nicht vorziehen, FLH-PROJ01 nur dokumentiert.

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
- Sitzung abgeschlossen: P09-ID01/02 DONE, PR187 geprüft/offen, P09-ID03 TODO.
