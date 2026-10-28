# FolioLab Open – aktueller Stand

Stand: 28.10.2026. Einstieg auf `feature/flh05-import-foundation`; keine zweite Roadmap.
Verbindliche Details: [WORK_RESTPAKETE_CHECKPOINT.md](WORK_RESTPAKETE_CHECKPOINT.md).
Bei Widersprüchen GitHub und konkrete Nachweise prüfen; ältere Einträge sind Historie.

- Letzter produktiv abgenommener Release: **v197 LIVE_ACCEPTED**.
- Aktueller main: `7b96a411925621f59021c36ad4d4a60a531c3a92` (PR186).
- [PR186](https://github.com/joke0071/foliolab-open/pull/186): gemergt, veröffentlicht, abgenommen.
- Kandidat: `c7d307c0eea079071adbce2add80780710ca1c8e`.
- Releasebaum: `2572b4aa3bab516f4a4b92c489684a4ad69609bb`, exakt geprüfter Kandidat/Mergebaum.
- Einziger Funktionsbranch: `feature/flh03-pchain-identity`; noch kein PR.
- PR157/161 bleiben unverändert geparkt.
- `feature/reference-management` bleibt als gesicherte Referenz erhalten; keine ungesicherten Codeänderungen.
- Arbeitspaket historische Referenzverwaltung / UI-Nachtrag: **REF186-RELEASE DONE**.
- Gesamtmaster: **PARTIAL**; P09-ID01 DONE, P09-ID02 IN_PROGRESS.

## Zuletzt abgeschlossene Etappen

- **REF186-QA: DONE** – finale CI, Artefakte/Mergebaum, begrenzter Quellreview und Bilder.
- **WORK-ORG01: DONE** – kompakter Einstieg, atomare Checkpoints, Etappen-/Übergabevertrag.
- **REF186-RELEASE: DONE** – notwendiger Abschluss nach konkreter Nutzerantwort „freigabe“.
  Backupvertrag für diesen Kandidaten ausdrücklich freigegeben; keine spätere Pauschalfreigabe.

## Letzte erfolgreiche Prüfungen

- PR-CI40681735312 und Wallet40681735033 SUCCESS.
- [Main/Pages/Live40687427813](https://github.com/joke0071/foliolab-open/actions/runs/40687427813)
  vollständig SUCCESS: Unit-/Syntax-/Chromium-/beide Firefox-WebKit-Shards, Deployment, Liveabnahme.
- 812/812 Units, 0 Fehler/Skip. Keine Gates, Workflows oder Pins gekürzt.
- Produktion: SW197, 112 exakte Dateivergleiche, sechs Kerngruppen, 18 Axe-Scans ohne Befund.
- Neue Referenzsuite tatsächlich auf Produktionsdomain in Chromium/Firefox/WebKit PASS:
  Originale/nicht-null TWR-XIRR, Herkunft/Korrektur/Neuanlage, Auswahl, CAS/Quota/Abort,
  kombinierte Archive, Plain/frischer Passwort-V2-Restore, Migration, Offline/Reload, fünf Breiten/Axe.
- Vier neue Produktionsbilder320/390/1440 tatsächlich angesehen; PASS.
- ProduktionsZIP-Digest vor Extraktion geprüft; [Releasebeleg](release-evidence/reference-management-v197-release.json).
- Keine offenen technischen Releasegates für den begrenzten PR186-Umfang.
  Physische Hardware/OAuth/Original-/Fachgates gemäß Detailcheckpoint separat offen.

## Aktuelle Etappen und nächster Schritt

- **P09-ID01 DONE:** [Adress-/Identitätsvertrag](https://github.com/joke0071/foliolab-open/blob/7d7fa3f9ae476dafcb8b1e3a4719b2ac8fc8400c/docs/FLH03_PCHAIN_IDENTITY_CONTRACT.md)
  vor Code separat gesichert: `7d7fa3f9ae476dafcb8b1e3a4719b2ac8fc8400c`.
- **P09-ID02 IN_PROGRESS:** reine Prüfhelfer/Tests gemäß Vertrag; keine aktive Walletintegration.
- Basis v197/main `7b96a411925621f59021c36ad4d4a60a531c3a92`; keine externen Blocker für diesen begrenzten Umfang.
- Exakt nächste Aktion: kanonische P-Mainnet-/Fuji-Adressprüfung und ausdrücklich
  kontextgebundene UTXO-Identität implementieren, gezielt testen, bestehende 3-Engine-Suite erweitern.
- Danach unveränderte Pflicht-CI/Review; bei Release volle Main-/Pages-/Liveabnahme.
- Übrige P-Chain-/Sonic-/Drive-Folge gemäß Detailcheckpoint; FLH05/PERF nicht vorziehen.
- FLH-PROJ01 bleibt ausschließlich später dokumentiert.

## Verbindlicher Sitzungs- und Übergabevertrag

- Vor jeder schreibenden Aktion main/relevante Branches, offene PRs, aktive/queued Actions,
  letzten LIVE_ACCEPTED-Release, Detailcheckpoint und andere Writer prüfen.
  Unklare Übergabe: lesend bleiben und eindeutige Freigabe einholen.
- Maximal zwei Entwicklungsetappen je Sitzung; Richtwert 30–60 Minuten.
  Jede Etappe: ID, Ergebnis, Umfang, Abhängigkeiten, Abnahme, TODO/IN_PROGRESS/BLOCKED/DONE.
- Vor Start Release/main, PR/Branch, Ziel, Voraussetzungen und Blocker festhalten.
  Nach konsistentem Schritt bzw. spätestens etwa30–45Minuten gezielt prüfen/testen,
  sinnvoll committen und kollisionsfrei auf bestehendem Branch sichern.
- Nach Etappe beide Statusdateien möglichst atomar aktualisieren: Ergebnis, PR/Commit,
  bestandene/offene Tests, Releasezustand, genau nächster Schritt.
- Identische erfolgreiche Nachweise wiederverwenden; sämtliche Pflichtgates erhalten.
  Keine CI-Duplikate, Retryschleifen oder parallelen Ersatzprozesse bei Rate Limits.
- Nach zwei Etappen am sicheren gesicherten Stopppunkt enden; laufende Sicherheits-/
  Releaseabschlüsse regulär fertigführen. Keine Historie löschen.
- Aktuelle Sitzung: P09-ID01 DONE, P09-ID02 IN_PROGRESS; höchstens diese zwei Etappen.
