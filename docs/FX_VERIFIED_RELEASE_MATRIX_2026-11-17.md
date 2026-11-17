# FX-Prüfverkehr: vollständige Fachmatrix und echte Domainkontrollen

Main-Basis 494ed8f0f6b627d8be972a5ceb886005e5064b31 / SW321. Keine Produktdatei oder SW-Version geändert. GitHub Support Ticket #5016095: angekündigte Schließung ohne technischen Befund, laut Jochen. Interne 429-Regel und eigenständiger market.js-503-Ursprung bleiben unbekannt. Die Änderung ist keine Hosting-Reparatur und keine Behauptung allgemeiner Fehlerfreiheit.

## Bestehende Aussagen und Zuordnung

Kanonischer Fachvertrag: `K2_FRANKFURTER_AGE_2026-11-15.md`. Historische tatsächliche Abnahme: Checkpoint-Branch `PR344_MAIN_RELEASE_ACCEPTANCE_2026-11-16.md`. Dort sind 24 Fälle auf ausgelieferten Produktbytes dokumentiert, keine gesonderte Anforderung an einen neuen CDN-Miss für jede Kombination. Native API-, Origin-, Refresh-, vollständige Record-/Scheduler- und Reopen-Aussagen sind bindend und bleiben pro Fall bestehen. Historische volle Domainausführungen werden nicht nachträglich anders bezeichnet.

| Fall (je drei Engines) | Unveränderte fachliche Assertion | Beweis im Kandidaten | Zusätzlich echte Domain |
|---|---|---|---|
| old-known | Alle USD-Felder samt Kurs0.9/Datum erhalten, kein Save/Revision/Snapshot | Vollständiger ursprünglicher nativer UI-/IDB-Fall auf byteverifizierten Dateien | Gemeinsamer echter Transport-/Reload-/Originbeleg; keine datumsabhängige HTTP-Auslieferungsregel behauptet |
| old-unknown | Null/UNKNOWN erhalten, vollständiger Record unverändert, Fehlerstatus | Derselbe vollständige Fall | UNKNOWN-Erhalt zusätzlich im gemischten Domainfall |
| eight-days-known | Acht UTC-Tage werden abgewiesen, keine Mutation | Derselbe vollständige Fall | Datumsgrenze ist deterministischer Produktcode, keine Provider-Liveantwort |
| today |0.85, Datum, Uhr, Erfolg und Completion tatsächlich gespeichert | Derselbe vollständige Fall | Zusätzlich vollständiger identischer Domainfall pro Engine |
| weekend-friday | Freitag am Sonntag akzeptiert, tatsächliches Datum gespeichert | Derselbe vollständige Fall | Gemeinsamer Transportbeleg; keine echte Markt-/Providerantwort |
| seven-days-boundary | Genau sieben UTC-Tage akzeptiert | Derselbe vollständige Fall | Gemeinsamer Transport-/Reopenbeleg; historischer 429 an dieser Stelle bleibt Fehlerbeleg |
| old-known-other-fx-saved | USD vollständig erhalten, GBP1.1 gespeichert, kein Gesamterfolg/USD-Completion | Derselbe vollständige Fall | Gemischte Commit-/Fehlersemantik zusätzlich im UNKNOWN-Domainfall |
| old-unknown-other-fx-saved | UNKNOWN erhalten trotz echtem GBP-Save; Teilcompletion, Wiederöffnung korrekt | Derselbe vollständige Fall | Zusätzlich vollständiger identischer Domainfall pro Engine |

In allen24Fällen unverändert: normale Refresh-Schaltfläche, native Web Locks, IndexedDB, feste Uhr/Antworten, Journal-/Cashflowgleichheit, exakter vollständiger nativer Record nach Reload, exakter Schedulerzustand nach Reload, keine Seitenfehler und genau erwartete USD-/GBP-Provideraufrufe. Der gesamte relevante Fixture-/Assertion-Block wurde mechanisch bytegleich verglichen. Einzig `attempt.scope` wird beim Vergleich zwischen zwei unabhängigen Installationen als installationsbezogener Fingerprint normalisiert; seine ursprünglichen Assertions und sein eigener Reopenvergleich bleiben in jedem Durchlauf unverändert.

## Bytebindung und Auslieferungsgrenze

Der bestehende unabhängige Core-Hashlauf bleibt unverändert: alle155Einträge einschließlich SW, acht Worker, echte HTTP-Antworten und Originalstatus. Erst dessen vollständiger PASS ohne TLS-Ausnahme, mit exakt aktuellem RELEASE_SHA, Base und SW-Revision autorisiert die neue Phase. Jeder erforderliche Pfad muss genau einmal im Report stehen. Alle lokalen Bytes werden erneut gegen die dort gemessenen SHA256 geprüft und anschließend als unveränderliche Buffer gehalten. Fehlende, zusätzliche, doppelte, fremde oder geänderte Bytes brechen ab; kein Netz-Fallback und kein unvollständiges Proof-PASS.

Die24Fachfälle laufen auf genau diesen Bytes und weiterhin der sicheren Produktivorigin in getrennten Browserkontexten, mit nativen Speicher-/Lock-APIs. Die Auslieferung dieser Phase wird ausdrücklich als `verified-published-byte-replay` protokolliert: keine24neuen unabhängigen CDN-Kaltstartproben behauptet. Das ist keine allgemeine HTTP-Cacheänderung und keine zweite Anwendungs-/Finanzimplementierung.

Anschließend bleiben sechs vollständige Domainfälle (today und old-unknown-other-fx-saved je Engine) mit unverändertem Originaltransport, regulärem TLS, Reload und vollständigem Record-/Schedulervergleich. Bestehende Core-Modulbody-/Dateihash-, echte SW-/Offline-/Update-/Reload-, UI-Backup-/FreshRestore- und sonstige ETF-Provider-/Refreshgates bleiben ungekürzt. Der FX-Fachtest blockiert den SW wie bisher; ihm wird keine SW-Abnahme zugeschrieben. Der180-s-Gesamtdeckel wird über beide FX-Phasen erhalten. Keine Pause und keine Antwortwiederholung.

Verloren geht allein die wiederholte Beobachtung eines ungemockten CDN-Kaltstarts für jede einzelne deterministische Datums-/Bestandskombination. Diese Zufallsstichproben werden nicht als eigene fachliche Assertion des K2-Vertrags geführt. Ihre bisherige Fehlerdiagnose bleibt erhalten. Falls künftig ein Fehler eine gerade solche Kombination abhängig von Origin-/Deliveryverhalten betrifft, muss dessen konkreter Reproduktionsfall zusätzlich direkt auf der Domain bleiben. Die jetzige Änderung heilt weder das Hostinglimit noch den separaten initialen market.js-503.

## Vergleich vor Merge

[Lokaler Vergleich 44039980251](https://github.com/joke0071/foliolab-open/actions/runs/44039980251), QA-Head e964d2ab4289de48ba891a4677515d6d80db5b03: keine Produktionsanfrage, Original und Kandidat jeweils acht Fälle pro Engine vollständig PASS, Resultate gleich. Das ursprüngliche Assertion-/Reopensegment ist identisch. Tatsächliche Engineversionen:

| Engine | Playwright | Browser | Original lokal | Verifizierter Replay |
|---|---|---|---|---|
| Chromium |1.56.1|141.0.7390.37|9.049s|8.242s|
| Firefox |1.64.1|157.0|15.807s|14.852s|
| WebKit |1.64.1|27.2|17.392s|8.419s|

Ein Vergleich pro Variante, gleiche Engine auf demselben Runner; Dateisystemwarmup/Umgebung können Reihenfolgeeffekte erklären. Kein garantierter Zeitgewinn aus diesen Zahlen. Pro vollständiger Matrix3408/3432/3432gleichoriginige logische Apprequests, in beiden lokalen Varianten ohne Produktionsnetz. Das entspricht den in Original-Livediagnosen beobachteten426Requests je Chromiumfall. Diese lokalen Requestzahlen sind keine neu gemessenen Produktionsantworten.

Beweisbindung im Vergleich: erforderliche Felder exakt aus erfolgreichem ursprünglichem Corebericht von Main494 übernommen, Artefakt14274454228/SHA2560acde8ac1ac5d357292c138d8d6ca55d196cadd929ee37aa971b6544937a01a7; vollständiges Original bleibt erhalten. Der reguläre Kandidatenworkflow nimmt den Bericht desselben neuen Releases, keine fest eingecheckte alte Hashliste. Vier zusätzliche Integritätstests verwerfen falschen SHA/Base/TLS/Ergebnisstatus, fehlende/zusätzliche/doppelte Dateien und nachträgliche Änderungen. 26 bestehende gezielte Fachtests und begrenzter TypeScript5.8.3-Preflight PASS.

[Gezielte Domainprobe44040401966](https://github.com/joke0071/foliolab-open/actions/runs/44040401966): Chromium und WebKit jeweils zwei Fälle PASS. Firefox wurde nach einem zusätzlichen Sammlerfehler gezielt in [44040894083](https://github.com/joke0071/foliolab-open/actions/runs/44040894083) vollständig mit zwei Fällen abgeschlossen. Beim ersten Firefoxlauf war der fachliche today-Fall bereits PASS; die Diagnose forderte zusätzlich null Requestabbrüche und verwarf einen beim Reload abgebrochenen favicon-Request `NS_BINDING_ABORTED`. Dasselbe Icon war zweimal200/hashkorrekt geliefert worden. Der Sammler wurde ausschließlich für exakt diesen nachgewiesenen Navigationsabbruch mit bereits hashkorrekt gelieferter gleicher Ressource präzisiert; ursprüngliche Seitenfehler-/Fachassertions und sämtliche HTTP-Fehlerbodyprüfungen unverändert. Original und Mehrverbrauch bleiben sichtbar.

| Engine | Echte Produktionsrequests | Höchste Starts/1s | Domainlauf | Status |
|---|---|---|---|---|
| Chromium |852|535|3.254s|2Fälle PASS, alle852Antworten200/hashgleich|
| Firefox |858|351|5.389s|2Fälle PASS, alle858Antworten200/hashgleich|
| WebKit |858|376|12.385s|2Fälle PASS, alle858Antworten200/hashgleich|

Zusammen2568tatsächliche Produktionsrequests. Eine vollständige Originalmatrix hat lokal exakt dieselbe Requeststruktur von10272Appabrufen ergeben; daraus folgt75%weniger Produktionsabrufe bei gleicher Struktur, keine neu ausgeführte erfolgreiche10272-Request-Livebaseline. Gesicherte ältere Originale bestätigen426Requests pro erfolgreichem Chromiumfall; ursprüngliche Maxima547bzw697Starts/1s bleiben separate Messungen. Die neue Spitze535liegt im bisherigen Bereich: keine wirksame Spitzendrosselung oder erfundene Limitergrenze. Neu fallen18von24wiederholten kalten Domainfällen weg; ihre Fachassertions laufen weiterhin vollständig gegen die byteverifizierte Veröffentlichung.

Kritischer Pfad: reguläre Integrationsjobs bleiben unverändert, daher keine neue Verbesserung der knapp18Minuten Integrationszeit behauptet. Beide FX-Phasen liegen nach Deployment seriell im bestehenden Livejob. Summe der gemessenen Replaylaufzeiten31.513s plus Domainkontrollen21.028s ergibt52.541s, verglichen mit42.248s lokaler Originalmatrix. Diese10.293sDifferenz ist **kein gepaarter End-to-End-Produktionsvergleich** (lokale Baseline gegenüber Replay+verschiedenen Domainrunnern), sondern das beobachtete Teilbudget. Sie rechtfertigt keine schnellere reguläre Live-Gesamtdauer. Runner-Provisionierung, Paketinstallation und der Diagnose-Firefoxwiederanlauf gehören nicht zum regulären Kandidatenbudget. Zusatzverbrauch des versehentlich erneut ausgelösten rein lokalen Vergleichs44040401793 wird als Diagnoseaufwand geführt; dritte lokale Auslösung44040894121 wurde übersprungen. Kein zusätzlicher Full-Live-Lauf.

Der robuste gemessene Vorteil ist die Eliminierung der mehrfachen Produktionsabrufe, bei vollständig erhaltenen24Fachfällen plus sechs direkten Domainfällen. Eine grüne Domainstichprobe beweist nicht allgemeine CDN-Zuverlässigkeit. Der market.js-503 wird weder abgefangen noch mit Retries kaschiert; sein Core-Originaltransport und seine Fehlerbefunde bleiben eigenständig.

Reguläre PR-CI wird einmal für den qualifikationsreifen endgültigen Head gestartet. Exakter Head und Endstatus werden im Checkpoint geführt; Merge bleibt Jochens Entscheidung.
