# PERF01: gemischte große Datenbanken – reine Dezimalumwandlung · 31.10.2026

Owner ChatGPT Work. Separater kumulativer Kandidat auf #240/#239, SW234 ausschließlich Kandidat. Produktion bleibt v231. Keine Integration ohne konkrete Wochenend-Freigabe und vollständige exakte CI.

## Messung vor Änderung

Der unveränderte v231-Test umfasst 19 gemischte ETF-/Cash-/Walletpositionen, 1.000/10.000 Buchungen samt Journal und 1.825 Referenzen, echte IndexedDB-Datenbanken von 1,40/10,58 MB. Je drei frische Browserprozesse und entsprechende Warmstarts, 390×844, CPU1x/4x, Navigation und LongTasks. Vor/nach Start/Navigation identischer vollständiger IDB-Recordhash inklusive Revision. Rohdaten/Generator und CPU-Profil sind separat im Checkpoint-Branch unter docs/perf-evidence/2026-10-31 gesichert.

Das CPU-Profil zeigt viel wiederholte Arbeit in `units`/`expand` während vollständiger Journalprüfungen. Diese Prüfungen werden nicht entfernt oder verkürzt.

## Eng begrenzte Umsetzung

`units` bewahrt höchstens 128 erfolgreich geparste kurze primitive Eingaben auf. Ergebnisse sind unveränderliche BigInts. Fehler werden niemals gespeichert; Objekte werden weiterhin bei jedem Aufruf genau einmal konvertiert. Zahlen-/Präzisions-/Bereichs-/Journal-/Import-/Berechtigungsregeln bleiben erhalten. Keine Modelle, Validierungsfreigaben, Kontoidentitäten oder Portfoliozustände im Cache. Kein persistenter Cache, keine IDB-/CAS-/Schema-/Backup-/Offlineänderung.

## Direkter A/B-Nachweis

Identischer #240-Runtime-Dateibaum, ausschließlich src/decimal.js unterscheidet sich (SHA256 beider Dateien im Bericht); SW233 in beiden Messungen, erst Kandidat anschließend auf SW234 gesetzt. Chromium141.0.7390.37/Playwright1.56.1/Node24.22.1. 10.000 Buchungen, CPU4x, jeweils3Kalt-/Warmproben ohne aktivierten Profiler. Synthetischer Lastfall, keine Android-Hardwareabnahme.

| Median | Vorher | Kandidat | Verbesserung |
| --- | ---: | ---: | ---: |
| Kaltstart bis nutzbare Übersicht + zwei Frames | 7,48 s | 5,13 s | 31,4 % |
| Warmstart derselben Übersicht | 7,47 s | 5,04 s | 32,5 % |
| Navigation zu Buchungen | 1,35 s | 0,92 s | 32,1 % |

Vollständige Rohwerte und Runtime-Dateihashes: [A/B-Beleg](perf-evidence/2026-10-31/ab-summary.json), [Basis](perf-evidence/2026-10-31/baseline233.json), [Kandidat](perf-evidence/2026-10-31/parser-cache-candidate.json). Reproduktionsskript tests/benchmark-mixed-startup.mjs: BENCH_BASE/BENCH_SHA/BENCH_OUTPUT, Server und Script im gleichen lokalen Netzwerk-/Prozesskontext starten. Serverdateibaum muss dem angegebenen SHA entsprechen. Der Generator begrenzt nur temporäre Clone-Arbeit in synthetischen Batches; ursprüngliche Eröffnungen und sämtliche Einträge werden zusammengeführt und vor Speicherung regulär vollständig validiert. Die gespeicherte Datenbank wird nicht verkleinert.

## Regressionen und offene Grenzen

991/991 Unit-Tests und Syntax lokal PASS. Zusätzlich unabhängiger Integer-Koeffizienten-Oracle mit 5.000 Zahlen/25.000 Parsevergleichen über Vorzeichen, 0–18 Nachkommastellen, Exponenten, Leerraum und Komma. Fehler nach Warmup, Bereich/Präzision, BigInt-Semantik, Objektkonvertierung und lange Eingaben geprüft. Bestehende Finanz-/Browser-/Speicher-/Backup-/Offline-Gates bleiben vollständig; exakte CI für diesen Kandidaten erforderlich.

Die früheren −49,44 % aus PR200/v213 werden nicht mit diesem anderen Lastfall verrechnet. Große echte Wallet-Historien, native Android-/Speicher-/PWA-Grenzen und weitere LongTasks bleiben OPEN/EXTERNAL. Rund fünf Sekunden CPU4x-Kaltstart sind weiterhin verbesserungswürdig: PERF01 insgesamt PARTIAL, nicht abgeschlossen. Kein Gesamttempo- oder Hardwareversprechen.
