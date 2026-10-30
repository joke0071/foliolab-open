# PERF01 / Draft-PR #233 – tatsächlicher synthetischer Chromium-/IndexedDB-Startvergleich

**Datum:** 30.10.2026 (UTC), **Status:** `IDB_ABBA_MEASURED_PASS / PR_CI_ACCEPTED / DRAFT / NOT_MERGED / NOT_DEPLOYED`.

- **Unveränderte Ausgangsbasis:** `main`/v222/SW222 `8353a1cab3c528a389d2bd7893df819f3c284225`.
- **Unveränderter Performancekandidat:** [PR #233](https://github.com/joke0071/foliolab-open/pull/233), HEAD `4674c8a76f35d5385c01a4cd897663b0ba6e7b7a`, vorbereiteter, *nicht veröffentlichter* SW223.
- **Vergleichsrunner:** eigenständiger, nur auf Diagnose-Branch ausgelöster GitHub-[Actions-Lauf 41136700915](https://github.com/joke0071/foliolab-open/actions/runs/41136700915), **SUCCESS**; Run-HEAD `a276e0ba45969cac7e5e4081c724ff897a916c77`, Workflow `.github/workflows/perf01-idb-abba-diagnostic.yml` auf `perf/perf01-v222-benchmark-runner`. **Kein PR-Code geändert, kein Merge oder Deployment, keine zusätzliche kostenpflichtige Work-Ausgabe.**
- **Verifiziertes GitHub-Artefakt:** `perf01-idb-abba-diagnostic`, Artifact-ID `13016537929`; heruntergeladenes ZIP **SHA-256 `c6db1b08d6035561ec43a13ac36ceb2044a3ca3308999728c6289d1ee0c8b7e5`** = bei GitHub gemeldeter Digest, ZIP-CRC **OK**, 10 Dateien (4 JSON-Rohberichte, 4 Konsolenlogs, 1 Vergleichs-JSON, 1 lokales HTTP-Serverlog). Enthält ausschließlich synthetische Fixtures und Messwerte.

## Reproduzierbare Methodik

Der bereits in `main` vorhandene, **identische** `tests/benchmark-startup.mjs` (Script-SHA-256 `a486bc44f69ab6081fea132049f4697b686a3bf7705b31572ea36cb6942e42a0`) läuft für beide Quellstände auf **demselben** GitHub-Ubuntu-24.04-Runner mit Node **v22.23.4**, Playwright **1.56.1** und tatsächlichem Chromium. Verwendet wird das echte transaktionale `PortfolioStorage`/IndexedDB und eine aktiv installierte PWA. Keine lokalen Browserrestriktionen im Runner; kein öffentliches Produktions-URL und keine echten persönlichen Daten oder API-Keys.

Durchlaufreihenfolge **v222 → PR233 → PR233 → v222 (ABBA)**. Pro Durchlauf: **19** und **1.000** synthetische ETF-Positionen mit je **1.825** manuell beobachteten Stichtagen; **5 frische Browserprozesse** mit je *Cold*, *Warm* und kontrolliertem *Offline*-Reload. Messendpunkt: `IndexedDB aktiv` + verifizierter `10.000`-EUR-Übersichtswert + zwei Browser-Renderframes. Vor und nach allen drei Reloadtypen werden die vollständigen kanonischen Daten, Settings und **Revision** per `readPortfolioRecord` auf exakte Gleichheit geprüft. **Jede** der acht Szenarioreihen meldete `exactRecordUnchanged: true`.

Die Prozentwerte nutzen den **arithmetischen Mittelwert der zwei jeweiligen 5er-Durchlaufmediane**; *negative Veränderung bedeutet schnellere Kandidatenversion*. Keine Rauschbereinigung, keine Ausreißerentfernung, kein Timing-Gate zu Grünzwecken.

## Ergebnis (Millisekunden)

| Portfolio | Variante | v222 Median A / B | PR233 Median A / B | v222 Mittel | PR233 Mittel | Veränderung |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| 19 Positionen/1825 Stichtage | Cold | 495,6 / 499,1 | 470,7 / 474,5 | **497,35** | **472,60** | **−4,98 %** |
| 19 Positionen/1825 Stichtage | Warm | 360,6 / 327,0 | 325,8 / 276,6 | **343,80** | **301,20** | **−12,39 %** |
| 19 Positionen/1825 Stichtage | Offline | 374,3 / 328,2 | 341,2 / 290,9 | **351,25** | **316,05** | **−10,02 %** |
| 1000 Positionen/1825 Stichtage | Cold | 1366,5 / 1353,9 | 1324,0 / 1323,4 | **1360,20** | **1323,70** | **−2,68 %** |
| 1000 Positionen/1825 Stichtage | Warm | 1294,5 / 1274,2 | 1242,6 / 1212,1 | **1284,35** | **1227,35** | **−4,44 %** |
| 1000 Positionen/1825 Stichtage | Offline | 1365,9 / 1274,8 | 1274,6 / 1258,2 | **1320,35** | **1266,40** | **−4,09 %** |

**Unmittelbare Einordnung:** Alle **sechs** kontrollierten Szenarien zeigen einen positiven Effekt; der große Kaltstart verbessert sich jedoch nur um **36,5 ms / 2,68 %**, nicht um 30 %. Die vorherigen lokalen *Berechnungs*-CPU-Werte 36,67→18,51 ms für reine Historienprojektion sind **kein** gleichwertiger Nachweis der Gesamtladezeit und dürfen nicht vermischt werden. Die frühere große v213-PERF01-Optimierung (historisch ~49 % bei eigenem Testaufbau) ist bereits ausgeliefert; dieser PR ist nur eine **inkrementelle** Folgeoptimierung gegenüber v222.

## Integrität und bewusste Grenzen

- Vollständige, unabhängige PR-[CI 41134431156](https://github.com/joke0071/foliolab-open/actions/runs/41134431156) **SUCCESS** mit **978/978 Unit-Tests** und 3 Browser-Shards, Wallet-[CI 41134431632](https://github.com/joke0071/foliolab-open/actions/runs/41134431632) **SUCCESS**, alle sechs CI-Artefakte SHA/CRC-verifiziert (siehe [Differenzial- und CI-Audit](PERF01_PR233_DIFFERENZQA_2026-10-30.md)). Zusätzliche 400 synthetische Modellkonstellationen / 1600 Original-/Kandidat-Deep-Equal-Vergleiche PASS, keine Finanzwerte/Referenzen verändert.
- **Kein statistischer Konfidenztest** und keine echte Android-/WebKit-/Firefox-Ladezeitmessung; Chrome auf einem geteilten GitHub-Runner ist kein normales Smartphone. Kleine prozentuale Unterschiede können von Betriebssystemlast, Caching und Ausführungsreihenfolge beeinflusst sein.
- Fixture ist ETF-/Stichtags-lastig, **nicht** repräsentativ für komplexe Wallets, DeFi-, FX- oder Journal-Massenhistorien. Die verwendete Start-Ready-Prüfung ist ein funktionaler Indikator nach zwei Frames, kein umfassendes Main-Thread-Long-Task-/Interaktionsprofil. Ohne diesen Nachweis kein allgemeiner Nutzen für alle Benutzer behaupten.
- Keine zusätzliche Optimierung an `safeImport`, IDB-Validierung, CAS, Backup/Restore, Ledger, Wallet oder Datenmodell. Keine Verschlechterung oder Unterdrückung von Sicherheitsprüfungen.
- Zusätzliche Work-Credits **0 €**. `main` und Produktions-PWA **v222/SW222 LIVE_ACCEPTED** bleiben geschützt; Diagnoseworkflow existiert ausschließlich auf separatem Nicht-Merge-Branch und ist nicht Teil des Kandidaten-PR.

## Konkreter nächster Freigabeschritt

**Technisch:** PR233 ist durch CI und echten synthetischen IDB-ABBA-Vergleich positiv, aber mit eher kleinem Gesamtstartvorteil. **Entscheidung:** Wochenend-Praxistest 31.10.–01.11. zuerst; reale P0/P1-Befunde vor diesem P1-Feinschnitt. Falls keine gegenläufigen Befunde auftreten, kann dieser klar abgegrenzte Kandidat **später** ausdrücklich zur Merge-/Deploymentfreigabe vorgeschlagen werden. Bis dahin **DRAFT / NICHT GEMERGT / NICHT LIVE**, keinerlei automatische Produktion. Die positiven ABBA-Werte ersetzen weder separate Nutzerfreigabe noch Produktions-Live-Abnahme nach einem späteren Release.

**Prioritäten:** PERF01 nicht künstlich mit weiteren Datenmodell-Umbauten aufblasen; `FLH05` und `FLH-PROJ01` weiterhin bewusst zurückgestellt, übrige Work-/Copilot-UI-Pakete nach Nutzungsauswirkung und Konflikten fortsetzen.
