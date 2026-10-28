# FolioLab Open – aktueller Stand

Stand: 28.10.2026. Einstieg auf `feature/flh05-import-foundation`; keine zweite Roadmap.
Verbindliche Details: [WORK_RESTPAKETE_CHECKPOINT.md](WORK_RESTPAKETE_CHECKPOINT.md).
Bei Widersprüchen GitHub und konkrete Nachweise prüfen; ältere Einträge sind Historie.

- Letzter produktiv abgenommener Release: **v196 LIVE_ACCEPTED**.
- Aktueller main: `bccd1f7956edba4d9ec0c5f11dc8edd023f31809` (PR185).
- Einziger funktionaler PR: [Draft PR186](https://github.com/joke0071/foliolab-open/pull/186).
- Funktionsbranch: `feature/reference-management`.
- Kandidat: `c7d307c0eea079071adbce2add80780710ca1c8e`.
- Geprüfter PR-Merge: `29d298f2c9f4123aeeb0da9c4905090226bc2b4f`.
- Identischer Kandidaten-/Mergebaum: `2572b4aa3bab516f4a4b92c489684a4ad69609bb`.
- Arbeitspaket: historische Referenzverwaltung / UI-Nachtrag.
- Aktuelle Etappe **REF186-RELEASE: IN_PROGRESS** – ausdrückliche Backupfreigabe am 28.10.2026 erteilt.
- Gesamtmaster: **PARTIAL**; SW197 ist unveröffentlicht.

## Zuletzt abgeschlossene Etappen

- **REF186-QA: DONE** – vorhandene finale Pflicht-CI, Artefakte, Mergebaum und
  begrenzten Quellumfang geprüft; ausgewählte finale Firefox-/WebKit-Bilder angesehen.
  Kein blockierender Befund. Keine Tests wiederholt oder Gates geändert.
- **WORK-ORG01: DONE** – Kurzstatus, atomarer Detailcheckpoint und Übergaberegeln eingeführt.
  Reine Dokumentation auf bestehendem Checkpoint-Branch; kein Produktcommit verändert.

## Belegte Prüfungen / offene Gates

- PR-CI [40681735312](https://github.com/joke0071/foliolab-open/actions/runs/40681735312):
  SUCCESS; 812/812 Units, 0 Fehler/Skip, Syntax, Chromium, beide Firefox/WebKit-Shards.
- Wallet-CI [40681735033](https://github.com/joke0071/foliolab-open/actions/runs/40681735033): SUCCESS.
- Archiv/Originale/nicht-null TWR-XIRR/CAS/Quota/Abort/Restore/Offline/5 Breiten/Axe:
  neue Referenzsuite PASS in allen drei Engines.
- Artefakt-Digests und Bildauswahl: [Prüfbeleg](release-evidence/reference-management-pr186-review.json).
- Offen nach Freigabe: aktueller Kollisionscheck, unveränderter Kandidat-/Mergebaum,
  kontrollierter Merge, vollständige Main-/Pages-/echte Drei-Engine-Livegates und Bilder.
- Physische Hardware/OAuth/Original-/Fachgates bleiben gemäß Detailcheckpoint separat offen.

## Externe Freigabegrenze / nächster Schritt

**Exakt nächste Aktion:** unveränderten PR186 nach finalem Kollisionscheck kontrolliert mergen;
anschließend Main-/Pages-/echte Drei-Engine-Liveabnahme vollständig abschließen.
Neue Referenzarchive verwenden portable Modell4-Metadatenversion2. Leser bis v196
lehnen solche Sicherungen ab; bisherige Sicherungen bleiben im neuen Leser lesbar.
Wiederherstellung aller Referenzen führt zu Metadaten1 (falls Buchungsarchive bestehen)
oder Modell3 zurück. Archivierung verändert keine Finanzgrundlagen.
Konkrete Nutzerantwort „freigabe“ am 28.10.2026 nach Erläuterung dieser Grenze;
Freigabe gilt für den geprüften PR186-Kandidaten, kein pauschaler späterer Freibrief.

Danach: REF186-RELEASE vollständig abschließen, beide Statusdateien aktualisieren;
erst dann nächstes tatsächlich offenes Vorgängerpaket gemäß bestehender Mastersequenz prüfen.
Kein FLH05-/PERF-Vorziehen; FLH-PROJ01 ausschließlich später dokumentiert.
PR157/161 bleiben geparkt; keine neuen parallelen Funktionsstränge.

## Verbindlicher Sitzungs- und Übergabevertrag

- Vor jeder schreibenden Aktion main/relevante Branches, offene PRs, aktive/queued Actions,
  letzten LIVE_ACCEPTED-Release, Detailcheckpoint und andere Writer prüfen.
  Unklare Übergabe: lesend bleiben und eindeutige Freigabe einholen.
- Maximal zwei Entwicklungsetappen je Sitzung; Richtwert 30–60 Minuten.
  Jede Etappe: ID, Ergebnis, Umfang, Abhängigkeiten, Abnahme, TODO/IN_PROGRESS/BLOCKED/DONE.
- Vor Start Release/main, PR/Branch, Ziel, Voraussetzungen und Blocker festhalten.
  Nach konsistentem Schritt bzw. spätestens etwa 30–45 Minuten gezielt prüfen/testen,
  sinnvoll committen und kollisionsfrei auf bestehendem Branch sichern.
- Nach Etappe beide Statusdateien möglichst atomar aktualisieren: Ergebnis, PR/Commit,
  bestandene/offene Tests, Releasezustand, genau nächster Schritt.
- Identische erfolgreiche Nachweise wiederverwenden; alle Pflichtgates vor Release erhalten.
  Keine CI-Duplikate, Retryschleifen oder parallelen Ersatzprozesse bei Rate Limits.
- Sitzung nach zwei Etappen am sicheren gesicherten Stopppunkt beenden; laufende
  Sicherheits-/Releaseabschlüsse regulär fertigführen. Keine Historie löschen.
- Neue Sitzung beginnt hier; nur relevante Detailabschnitte nachladen.
- Übergabe dieser Sitzung: REF186-QA und WORK-ORG01 DONE; REF186-RELEASE IN_PROGRESS nach ausdrücklicher Freigabe.
