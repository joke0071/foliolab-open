# PERF01 / PR #233 – zusätzlicher deterministischer Differenzialtest (30.10.2026)

**Kandidat:** [Draft-PR #233](https://github.com/joke0071/foliolab-open/pull/233), HEAD `4674c8a76f35d5385c01a4cd897663b0ba6e7b7a`, Base/Main `8353a1cab3c528a389d2bd7893df819f3c284225`; v222/SW222 LIVE_ACCEPTED bleibt unverändert.

## Tatsächlich lokal ausgeführter Vergleich

- **400** mit festem Seed erzeugte, ausschließlich synthetische gültige Cash-/ETF-Portfolio-Grundmodelle; je ein bereits nachgewiesener Kauf, vollständige oder absichtlich fehlende Eröffnung, wechselnde Kurslücken, **0–49** unterschiedlich datierte Referenzwerte pro Modell mit gemischter Reihenfolge und gleichdatigen Dubletten.
- **1.600** vollständige `assert.deepEqual`-Vergleiche zwischen Originaldatei aus dem v222-GitHub-Pages-Release und dem isoliert modifizierten PR233-Modul: pro Modell `projectHistoricalPortfolio()` und `historicalWealthView()` in den Modi `auto`, `partial`, `observed`. **Alle PASS, keine Differenz.**
- **9.837** synthetische Referenzzeilen insgesamt; **7.449** Dublettenbegegnungen; **80** bewusst lückenhafte Preisreihen; `JSON.stringify(model)` vor/nach allen Aufrufen **identisch**, kein Modell-/Portfolio-Write.
- Node.js v22.16.0, lokale gesamte Vergleichsdauer **791,02 ms**; explizit **kein** Kaltstart-, IndexedDB-, Browser-, Geräte- oder Performanceverbesserungsnachweis.
- Ursprüngliches lokal ausgeführtes Node-Programm `differential_qa.mjs` hatte SHA-256 `dcd659bf0fcb39347fc66405118ec9c27662171fccdbe8fc4d8da082e65cf2d6`; Ergebnis `pr233-differential-qa.json` SHA-256 `9bc5eaca6b03184192524108ca6f7f46aa4cc0146bf5ad05df68dcaa817c75b2`. Lokal in `/mnt/data/perf01_lab/` erzeugt (nicht als Remote-Testlauf ausgeben).

### Methodik / Reproduzierbarkeit

Original-`src/historical-portfolio-value.js` stammt aus veröffentlichtem v222-Build; Kandidat ist dieselbe reine Modulstruktur mit dem dreizeiligen `observationsByDate`-Eingriff von PR233. Seed: `i*15485863+101` pro Fall mit deterministischem Mulberry32; Referenzdaten aus 7 Kalendertagen, Zufallswerte 700–1499 EUR und Fisher–Yates gemischt. Eröffnungsdatum in jedem sechsten Fall entfernt; letzte Kurszeile in jedem fünften Fall entfernt. Beide Varianten werden für jedes Modell auf exakt demselben unveränderten Model-Objekt ausgeführt. Exception-Pfade werden ebenfalls mit derselben Meldung verglichen. Die Eingabemodelle sind künstlich; Nutzer-/Kontowerte und API-Schlüssel wurden nicht benutzt.

## Zusätzlich nachprüfbare CI-Artefakte zum Zeitpunkt dieses Audits

- [PR233-CI-Lauf 41134431156](https://github.com/joke0071/foliolab-open/actions/runs/41134431156), GitHub-Merge-Test-SHA `d161546818b118e118224f1b5d52e8d3618387e7`; `ci-stage`-Plan bestätigt `INTEGRATION/full:true`, Base `8353a1ca`, Head `4674c8a7`; heruntergeladenes ZIP SHA-256 `c0a987c5c1cea14c823a648da5ffc66f1aec4f24aea78192aea7bc3330ae790c`, ZIP-CRC OK.
- Cross-Engine-Shard 1: ZIP SHA-256 `03814e8d3c86f676263737818e4a6978a6ad17af06ff1d9de6d6bb8dadb1638c`, CRC OK, 210 Einträge, neun parsebare JSON-Berichte ohne FAIL/ERROR; die separaten UI07-Berichte zeigen **66 Axe-Scans in Firefox und 66 in WebKit**, keine Findings/Errors.
- Cross-Engine-Shard 2: ZIP SHA-256 `41ce05ac3c6e388e6a3f6e94e5e68b1d7f5f70a41993f11d49f09a0b72596a19`, CRC OK, 35 Einträge, sechs parsebare JSON-Berichte ohne FAIL/ERROR; u.a. PWA-Update im Cache `foliolab-open-v223` PASS.
- [Wallet-CI 41134431632](https://github.com/joke0071/foliolab-open/actions/runs/41134431632) SUCCESS.
- Cross-Engine-Shard 3 inzwischen **SUCCESS**; ZIP SHA-256 `84043fafd02ffcd306af82f7a028d5d7dec19bb5a5a7735bfeedb1e63dc37f29`, CRC OK, 269 Einträge, 22 parsebare JSON-Berichte ohne FAIL/ERROR. Somit **alle drei Cross-Engine-Shards erfolgreich** und ihre Artefakte einzeln verifiziert.
- **Hauptjob vollständig SUCCESS**; Node-TAP im tatsächlich abgerufenen Joblog mit **978/978 Tests, 0 Fehler** einschließlich der drei neuen PERF01-Regressionsfälle. `release-gates`-ZIP SHA-256 `1c26a38af226ddc3a334ae833cac82bcd9c72c0d7c17573b323a88488c33ebf1`, Größe 21.147.502 Bytes, ZIP-CRC OK, **299 Dateien und 31 parsebare JSON-Berichte ohne FAIL/ERROR**. `dialog-visual-reference`-ZIP SHA-256 `35ed0bcddefcaf3313181dd3a2603b9e552490a3556cc6aa9bcf46f9d4941803`, ZIP-CRC OK, 20 Bilddateien. Somit **alle 6 CI-Artefakte** nach SHA/CRC geprüft: ci-stage 1 JSON + release-gates 31 JSON + Cross-1 9 + Cross-2 6 + Cross-3 22 = **69 JSON-Berichtseinträge ohne Fehlstatus**.
- GitHub PR-[Run 41134431156](https://github.com/joke0071/foliolab-open/actions/runs/41134431156) insgesamt **SUCCESS**. Deploy und Live-Acceptance für den nicht veröffentlichten PR **korrekt SKIPPED**. Status nun **CI_ACCEPTED / DRAFT / NOT_MERGED / NOT_DEPLOYED**; das ist **keine** Kaltstart-Performance-Abnahme und **keine** Mergefreigabe.

**Freigabegrenzen:** vollständige CI/Gate-Abnahme, echte IndexedDB-Startup-Benchmark (bisher lokal per Chromium durch Sicherheitsrichtlinie blockiert), Wochenend-Praxisbefunde und eine **gesonderte konkrete Nutzerfreigabe** vor Merge und Produktion. Alle übrigen Copilot-PRs unverändert, nur FLH05/FLH-PROJ01 bewusst PARKED. **Status: ADDITIONAL_DIFFERENTIAL_QA_PASS / PR233_DRAFT_NOT_MERGED_NOT_DEPLOYED.**
