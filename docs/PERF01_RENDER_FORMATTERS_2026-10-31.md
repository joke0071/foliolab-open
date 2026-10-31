# PERF01 – gemessene Start- und Verlaufsdarstellung

Owner: Codex Work. Begrenzter Nachfolger auf Main `8d3d6c9` / v237, SW238-Kandidat. Noch keine Produktionsabnahme dieses Pakets. PERF01 insgesamt bleibt PARTIAL; echte Android/PWA-Hardwareprüfungen sind EXTERNAL.

Das CPU-Profil der unveränderten Ausgangsversion zeigte etwa 2,14 s im historischen Portfoliopfad und 0,78 s Self-Time in wiederholter Datums-/Währungsformatierung. Deshalb werden ausschließlich identische Intl-Formatierungsobjekte wiederverwendet (Währungscache maximal 16 Schlüssel, keine Beträge) und ungeklärte Verrechnungseinträge einmal je reiner Portfolioprojektion ausgewählt. Datum und vollständige Journalvalidierung werden weiterhin geprüft. Keine Berechnung, Persistenz, CAS, Verschlüsselung, Importidentität oder Finanzpräzision geändert.

Kalenderdaten werden mit einem expliziten UTC-Formatierer und UTC-Mittag verarbeitet. So bleibt der ursprüngliche Kalendertag auch bei Geräte-Zeitzonenwechseln während einer geöffneten App erhalten; das ist ausschließlich Darstellung. 42 Vergleiche mit der bisherigen Anzeige über 6 Zeitzonen einschließlich Datumsgrenzen und ungültiger Eingaben bestanden.

## Frischer Vergleich auf dem tatsächlichen Main

Identische gespeicherte synthetische Eingabe: 19 gemischte Positionen, 10.000 Buchungen plus Journal, 1.825 Referenzen. Chromium 141 / Playwright 1.56.1 / Node 24 / Linux, 390×844, CPU 4×, fünf Proben je Variante. Eine geordnete A/B-Paarung, keine physische Android-Abnahme oder statistische SLA. Kalt bedeutet frischer Chromium-Prozess mit bestehender PWA/IndexedDB, warm bedeutet Reload im selben Prozess; zusätzlich tatsächlicher Offline-Reload unter aktivem App-Worker. Gemessen wird das geprüfte Dashboard plus zwei Renderframes und anschließend echte Reiterwechsel. Frühestmögliche Eingabe, FMP und Abschluss asynchroner Diagrammabrufe werden damit nicht gesondert belegt.

| Median | Main v237 | Kandidat | Veränderung |
| --- | ---: | ---: | ---: |
| Kaltstart |5696,6ms|4319,7ms|−24,17%|
| Warmstart |5166,5ms|3747,5ms|−27,47%|
| Offline-Start |5015,6ms|3555,7ms|−29,11%|
| Verlauf öffnen |1584ms|650ms|−58,96%|
| Übersicht öffnen |1406ms|567ms|−59,67%|
| Positionen öffnen |260ms|251ms|−3,46%|
| Buchungen öffnen |1150ms|1049ms|−8,78%|
| Mehr öffnen |183ms|200ms|kein Gewinn (+17ms)|

Alle Rohproben, Streuungen, Script- und Runtimehashes liegen unter [render-v238](perf-evidence/2026-10-31/render-v238/summary.json). Exakte gespeicherte Records einschließlich Settings und Revision je Lauf unverändert. Prozentwerte nicht mit früheren v213/v234-Ergebnissen addieren.

Ein kleiner vorgelagerter Kontrollfall (19 Positionen/10 Buchungen/30 Referenzen, CPU 1×, fünf Proben) zeigte kalt 267,5→231,2ms, warm 98,5→81,9ms und offline 91,2→91,7ms. Das war der isolierte Prototyp; vollständige Rohwerte auf feature/flh05-import-foundation unter formatter-small-*. Keine pauschale Beschleunigung jedes Reiters behauptet.

## Verträge und Reproduktion

331 Formatierungsfälle und fünf vollständige historische Projektionen sind exakt mit dem Parent identisch, einschließlich zurückliegender, zukünftiger und mehrfacher ungeklärter Verrechnungseinträge sowie ausgeschlossener Anlagen. Keine Modellmutation. Neue reguläre Regression verwendet echte ungeklärte Käufe und verlangt: kein Hinweis vor deren Datum, genau ein Hinweis danach, keine erfundenen vollständigen Summen und unveränderte frühere 999 EUR. Lokal 1.009 Unit-Tests und Syntax bestanden.

Die komprimierte Eingabe ist vollständig synthetisch, ohne Kontodaten oder Credentials. Nach Entpacken von fixture.json.gz muss die 10.582.038 Byte große JSON-Datei den SHA256 `1df791bf0273a265679fe3dff09a84d25716ed2a1f0872a349a434ed9e7378ef` haben. Für Reproduktion den Parent und Kandidaten getrennt auschecken, benchmark.mjs nach tests/ kopieren, je einen Checkout auf Port 4173 bedienen und sequenziell mit BENCH_FIXTURE_FILE, BENCH_OUTPUT und BENCH_SHA ausführen. Das Script muss in beiden Varianten identisch bleiben. Der Vertragsreproducer nimmt PERF_BASELINE_ROOT, PERF_CANDIDATE_ROOT, PERF_FIXTURE_FILE und optional PERF_CONTRACT_OUTPUT.

Vor Merge: vollständige exakte CI/Chromium/Firefox/WebKit und tatsächliche v237-Live-Abnahme; danach eigener Main-/Deployment-/Produktionsnachweis. Keine Gate- oder Toleranzabschwächung. FLH05/FLH-PROJ01 bleiben PARKED; übrige Masterpakete werden durch diesen Teilschnitt nicht geschlossen.
