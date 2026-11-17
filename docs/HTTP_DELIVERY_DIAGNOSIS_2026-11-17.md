# FolioLab · HTTP-Auslieferungsdiagnose · 17.11.2026

Main: `494ed8f0f6b627d8be972a5ceb886005e5064b31`, SW v321. Bestehende Produkt-, Bitpanda-, Kraken- und Windows-Abnahmen übernommen. Alle Daten der neuen Browserproben sind synthetisch. Keine private Portfolioauswertung, Produktmutation oder Mergefreigabe.

## Gewöhnliche Nutzung

Die lokale Chromium-Ausführung scheiterte bereits bei about:blank an einer gesperrten Prozess-Singleton-Socketanlage, ohne Produktionszugriff. Die Beobachtung wurde auf einem dokumentierten Windows-Runner mit installiertem Google Chrome durchgeführt. Jeder Lauf nutzte genau ein neues persistentes Profil, Standard-TLS, erlaubten regulären SW, normale HTTP-Caches, keine Request-Routen, keinen Hash-Vorlauf und keine Antwortwiederholungen.

Erster Lauf 44032636941, Head 1653dcab11aae5a84e5bdaaa5085ed609309c97b, 17.11. 07:38:29.059–07:38:40.086 MEZ: Start, Navigation, normaler UI-Import von synthetischem EUR-Cash und genau ein Reload bestanden; 1000 EUR erhalten. SW bei Ende noch installing. Das ist keine Aussage über abgeschlossene SW-Installation.

Eine ergänzte passive SW-Aufzeichnung in Run 44033347474 war hinsichtlich der Aktivierungs-Wartebedingung fehlerhaft: eine asynchrone Browserprädikatfunktion wurde zu früh als erfüllt gewertet. Original bleibt erhalten, der betreffende PASS-Eintrag wird verworfen. Seine Vordergrundbeobachtungen werden nicht als weitere unabhängige SW-Abnahme gewertet.

Korrigierter finaler Collector: [Run 44034081383](https://github.com/joke0071/foliolab-open/actions/runs/44034081383), Head 3f2fd9df3e87c0817bfc1871f3998837c872f8fa, Job 133872641173. Google Chrome 156.0.8078.80, Windows Server 2025 Datacenter 10.0.26100, Image 20261103.298.1. Beobachtungszeit 17.11. 07:50:07.892–07:50:18.445 MEZ (06:50 UTC).

| Beobachtung | Ergebnis |
|---|---|
| Kaltstart bis bedienbereit | PASS, 2762 ms |
| Positionen, Mehr, normaler UI-Import, Dashboard | PASS |
| Ein normales Reload | PASS, 307 ms; synthetische 1000 EUR erhalten |
| Navigation nach Reload | PASS, 10 Navigationsaktionen verfügbar |
| SW-Installation | Anschließend ohne Eingriff activated, Controller /sw.js |
| Kontextseitige logische Seitenrequests | 290, maximal 93 überlappend; enthalten Cacheabrufe |
| Vollständiges Chrome-NetLog einschließlich Hintergrund-SW | 304 URL-Jobs, 300 HTTP-Transaktionsstarts; 299 Antworten 200, eine 304 |
| Netzüberlappung | Maximal 92 URL-Jobs offen, maximal 90 HTTP-Transaktionen bis zu Antwortheadern |
| Ressourcen-/Seitenfehler | Keine aufgezeichneten fehlgeschlagenen Ressourcen oder Seitenfehler |

Der Reload erfolgte vor SW-Kontrolle. Ein Reload unter bereits kontrollierendem SW wird hier nicht behauptet. Die Vordergrund- und SW-Beobachtung belegt diesen Ablauf. Der erfolgreiche Runner nutzte BFI-Edges, die Fehlerproben IAD-Edges; weder gleiche Auslieferungsstrecke noch allgemeine Zuverlässigkeit ist damit belegt. Startprobleme gewöhnlicher Nutzer wurden in diesen Besuchen nicht beobachtet. Der separate 503 bei einem initialen Modulabruf lässt sie weiterhin zu.

## Original 429: Anfrage- und Antwortzeiten getrennt

Originalartefakt 14274454228 aus Job 133638326346/Mainlauf 43956969224, Versuch 2. Die ersten fünf FX-Fälle waren vollständig PASS. Fall 6 `seven-days-boundary` hatte Seeding und erfolgreichen Refresh einschließlich Aktualisierungszustand bestanden; die abschließende Wiederöffnung wurde nicht ready. Das Diagnosekontextindex 5 gehört zu diesem sechsten Fall.

72 Modulantworten HTTP 429 wurden am 16.11. 21:51:47.147–21:51:47.182 UTC registriert: **35 ms Antwortfenster**. Die jeweils letzte vorhergehende gleichnamige Anfrage im selben Kontext begann im Observer 21:51:47.109–21:51:47.153 UTC: **44 ms Anfrageereignisfenster**. 22–56 ms bis zur Fehlerantwort, maximal 66 dieser betroffenen Anfragen gleichzeitig bis zur Antwort. Es sind Node-Kontext-Ereigniszeiten, keine Paketmessung. Keine Gleichsetzung von Antwortfenster und Anfragefenster.

Je erfolgreichem Fall entstanden 427 logische Requests, davon 426 gleichoriginig. Goto, Seed-Reload und Refresh-Reload laden jeweils einen kalten Modulgraphen. Isolierter Kontext und Service Worker blockiert; die FX-Antwort wird geroutet/gemockt. Playwright-Routing deaktiviert den HTTP-Cache (offizielle Dokumentation: https://playwright.dev/docs/api/class-browsercontext#browser-context-route). Deshalb wird der normale Cachevorteil zwischen den Reloads nicht genutzt. Die sechs Kontexte zusammen erzeugten 2529 gleichoriginige Anfrageereignisse; Spitze 697 in einem rollenden 1-s-Fenster.

429: Varnish, text/html, MISS, Retry-After 0, cache-iad-khef600072-IAD; Module anschließend ERR_ABORTED, kein SW-Controller. Die Originalaufzeichnung persistierte keine vollständige pageerror-Liste; deren Abwesenheit darf nicht behauptet werden. Header und Fehlerereignisse sind gesichert, fehlende originale Fehlerbodybytes werden nicht nachträglich erfunden. Eine konkrete CDN-Rate-/Zeitschwelle ist aus diesen Beobachtungen nicht ableitbar.

Workflowreihenfolge: Coreprüfung einschließlich Hashvergleich, dann Loading/PWA, UI-Alltag, Textskalierung, Preiswerkzeuge, Cash-UX, schließlich ETF-Suite, die FX-age importiert. Es gibt vorgelagerten QA-Verkehr. Die FX-Module selbst werden jedoch vom Browser angefragt, nicht vom Hashvergleich.

## Original 503: vor dem Hashvergleich

Originalartefakt 14276395300 aus Job 133642045451, Versuch 3: neuer Coreprozess und Browserkontext. `market.js`-Anfrage 16.11. 21:56:15.156 UTC, 503-Antwort 21:56:15.220 UTC. Die erste SHA-Anfrage kam erst 21:56:16.562 UTC, die letzte 21:56:16.928 UTC. Somit **1342 ms zwischen 503-Antwort und erstem Hashrequest**. Alle 155 Hashvergleiche bestanden später; die fehlende Bereitschaft fiel danach bei der Navigation auf.

Quellreihenfolge `tests/browser-live-acceptance.mjs`: initiales goto(networkidle), danach unabhängiger SHA-Vergleich mit bereits **acht** Workern, danach weitere UI-Aktionen. 155 erfolgreiche Dateien bedeuten keine Parallelität von 155. Der aktuelle Hashlauf kann den zeitlich davor liegenden 503 nicht verursacht haben. Früherer QA-/geteilter Egress-Verkehr ist damit nicht ausgeschlossen.

503: Varnish/text/html, MISS, Retry-After 0, cache-iad-khef600045-IAD, Content-Length 54887. Fastly-Request-ID `7ae69755357877f43ed7e215a6817533705689eb`, X-Timer `S1794866175.179191,VS0,VE9`. Die Clientbelege unterscheiden weder Edge-Erzeugung von weitergereichtem Originfehler noch dessen internen Grund. Keine Gleichsetzung mit 429 allein wegen gleichem späterem ready-Timeout.

## Eng begrenzter Kandidat und Gegenproben

Nur QA-Kandidat: 1000 ms nach vollständigem Schließen jedes erfolgreichen Live-FX-Kontexts außer dem letzten, ausschließlich HTTPS. Originalfälle, Reihenfolge, Engines, Mocks, Assertions, 30-s-ready- und 180-s-Suitefrist bleiben erhalten. Ein mechanischer Vergleich entfernt die vier hinzugefügten Zeilen und erhält exakt den Originalquelltext. Original-SHA256 fd20f3a32b895274fd8e1725dd2c76199c40b1bfa3fce9028b6c0aede4fd14d3, Kandidat 70a59193a0ef73b58a96b8cdc215f378a23cfa5d72b769c2e6dd292006df08ce. Nominell +7 s/Engine live, +21 s über drei Engines; lokale HTTP-Prüfungen unverändert. Kein Produkt-Retry und keine 503-Abhilfe.

26 gezielte Unit-Tests (FX-Response-Integrität, Refresh-Frequenz, UNKNOWN-FX) sowie TypeScript-5.8.3-Syntax-/Namensprüfung bestanden. Diese prüfen keine Auslieferungsverbesserung.

[Run 44034608089](https://github.com/joke0071/foliolab-open/actions/runs/44034608089), Job 133874350973, Ubuntu 24.04.5/Image 20261111.370.1, Node 22.23.4, Playwright 1.56.1 Chromium: ohne Hash-Vorlauf sieben vollständige FX-Fälle PASS, im achten 65 Modul-429, Timeout bei erstem Seed-Reload (ready Zeile 57), 38.713 s. Nach genau 60 s Diagnosepause lieferte schon das initiale HTML der gepaceten Variante 429. Der bestehende strikte External-Request-Vertrag brach beim Stylesheet der GitHub-Fehlerseite ab (github.github.com/pages-staticassets/primer-tiny.css statt api.frankfurter.dev); keine FolioLab-FX-Antwort. Dauer 0.418 s ist **kein** Laufzeitgewinn. Pacing wurde vor dem ersten Fallabstand überhaupt nicht erreicht. Der Vergleich qualifiziert keine Wirksamkeit.

Zur Vermeidung dieses Carryovers läuft genau eine gepacete Originalsuite auf frischem Runner: QA-PR352 Head f846dd3246dd3b6a854784dba01cd50c81e26ba1, Run 44035323660. Abschluss wird unten ergänzt. Kein vollständiger Live-Neulauf und keine unveränderte Retryserie.

## Endbefund und Entscheidung

[Frischer Kandidaten-Run 44035323660](https://github.com/joke0071/foliolab-open/actions/runs/44035323660), Job 133876727049, 17.11. 08:00:16.644–08:01:03.428 MEZ: wieder sieben identische FX-Fälle PASS, im achten `old-unknown-other-fx-saved` bereits initialer Kaltstart nicht bereit. 65 Module HTTP 429, erster Fehler 07:00:33.383 UTC, cache-iad-khef600095-IAD. Kein neuer 503. Ubuntu-Image identisch 20261111.370.1, neuer Runner/Region eastus3 statt eastus2; kein direkter Identitätsbeweis des Egresses.

Die gemessenen Abstände zwischen Kontextende und nächster Anfrage waren mit Kandidat 1040–1045 ms statt 35–46 ms. Rollende 1-s-Anfragespitze 424 statt 547. Beide Varianten waren dennoch im achten Fall rot. 46.784 s Kandidat gegenüber 38.713 s Baseline: beobachtet **+8.071 s**, davon nominell +7 s beabsichtigte Wartezeit; Rest ist nicht sauber von Runner-/Netzschwankung trennbar. Die unterschiedlich früh gescheiterten achten Fälle erklären unterschiedliche Gesamtrequestzahlen (3123 vs 3234 gleichoriginig); diese Differenz wird nicht als eingesparter Testverkehr ausgegeben. Alle acht Fälle waren vorgesehen, jeweils nur sieben fachlich vollständig bestanden.

**KEIN WIRKSAMER PR-KANDIDAT.** Das Pacing ist als Abhilfe nicht qualifiziert und wird nicht für Main vorgeschlagen. Produkt und regulärer Workflow bleiben unverändert. QA-PR351/352 sind reine Diagnosezweige gegen den Checkpoint, keine Mergeempfehlungen. Kein Full-CI zur Erzeugung eines grünen Signals und keine neue vollständige Liveprüfung gestartet.

Die Belege zeigen eine erhebliche QA-Amplifikation durch kalte, geroutete Modulabrufe und reproduzieren die Auslieferungs-429 auch ohne Hashvergleich. Eine konkrete interne Rate-Regel, deren Schlüsselfeld (IP, Host, Pfad, geteilte Runner-Nutzung), Zeitfenster oder Ursprungsebene ist jedoch nicht beobachtbar. Der HTTP-Cache ließe sich für diesen Fachtest nicht einfach behaupten, solange Routing aktiv ist. Weitere willkürliche Pausen, Retries, Hash-Drosselungen oder Produktumbauten wären derzeit keine belegte kleinste Abhilfe.

Der nächste unterscheidende Erkenntnisschritt ist eine **GitHub-Pages/Fastly-Auskunft bzw. eine korrelierte Hosting-/CDN-Anfragespur** für:

1. 503 `/src/market.js`, 16.11.2026 21:56:15.220 UTC, Fastly-Request-ID `7ae69755357877f43ed7e215a6817533705689eb`, Edge cache-iad-khef600045-IAD: von welcher Ebene stammt 503 und welcher interne Fehler/Backendstatus wurde protokolliert?
2. 429-Modulgruppen, 16.11. 21:51:47.147–182 UTC (cache-iad-khef600072-IAD), 17.11. 06:54:19 UTC (cache-iad-khef600070-IAD) und 07:00:33 UTC (cache-iad-khef600095-IAD), Host foliolab.unperfekt.at: greift ein Rate-/Miss-/Abuse-Limit, nach welchem Aggregationsschlüssel und Zeitraum? Ist es Host-/Origin- oder geteilt egressbezogen? Zusätzlich Dokument-429 am 17.11. 06:55:50.264 UTC, cache-iad-kcgs7200149-IAD.

Provider-/Supportantwort reicht, rohe Logs werden nicht vorausgesetzt, wenn sie bei GitHub Pages nicht zugänglich sind. Benötigt werden keine privaten Portfoliodaten oder Zugangspasswörter. Erst dieser Befund entscheidet zwischen einer gezielt dimensionierten QA-Verkehrsänderung, Hosting-Abhilfe oder einer produktseitig relevanten Auslieferungsgrenze. Bestehende akzeptierte Finanz-, Windows- und SW321-Befunde bleiben gültig.

## Originale

| Artefakt | SHA-256 des unveränderten ZIPs |
|---|---|
| 14274454228 · ursprüngliche 72 Modul-429 | 0acde8ac1ac5d357292c138d8d6ca55d196cadd929ee37aa971b6544937a01a7 |
| 14276395300 · ursprünglicher market.js-503 | 0546c4856e6f9e82ba1c9981287233a8110ed3b11f8ccc78079e7cc4f73be7f6 |
| 14306345290 · erster gewöhnlicher Besuch | 3638c64281e67a01e844c550368fe87403052b5a41b3b5f502c3ad835719f544 |
| 14306431202 · SW-Sammler mit verworfener Wartewertung | 96bf8885c4256ff6daf3d7b076f16d5ceb0a2ee4ca6e15532ec0a87c4c3b07dc |
| 14306422273 · korrigierter vollständiger Sammler | 57f14b0af94a1c2772b9348a3f81e15be1bebf9e613cebb85068d0b311a2429f |
| 14306816448 · ursprüngliche/anschließend gedrosselte Gegenprobe | 7356b1c80177529134154ad54c8d32cb5bf2b91fd8a5de7aa48260a1acd76952 |
| 14306234283 · frischer gepaceter Runner | 4a4682da9574780efcd2398e7f2baf6f7b6bbc3e30c57d82ad49488f04255276 |

Alle vorhandenen ZIPs unverändert gesichert und CRC-geprüft. Ergänzend: Originaljoblogs beider neuen FX-Läufe, Anfrage-/Antwortpaare, vollständiges NetLog und Berechnungsskripte. Die alten Originalpakete waren bereits gesichert; dieses Paket hält die relevanten ZIPs und neuen Befunde zusammen. Keine nachträgliche Abrufantwort ersetzt ein damaliges Original.
