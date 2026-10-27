# Aktuelle erfolgreiche PR179-Messung · nur lesend

Finaler Lauf40594291174: test441s (Browser401s, Installation6s, Units/Syntax26s), Cross1 402s (Tests344s, Installation51s), Cross2 368s (Tests308s, Installation52s). Pflichtprüfungen vollständig grün, keine CI-Implementierung oder Leistungsverbesserung behauptet. Unterschiedliche Testumfänge und Runnerstreuung erlauben keinen Optimierungsvergleich gegen PR178/PR176. Bestehende Entscheidung bleibt: kleine Zwischenoptimierung DEFERRED, vollständiges abschließendes Paket OPEN; aktiver UI-Abschluss wird nicht verlängert.

# Sichere CI-Zwischenoptimierung · nur lesend · 27.10.2026

Status: **DONE Laufzeitsichtung / DEFERRED Implementierung.** Niedrige Priorität gegenüber PR179. Keine Workflow-/Branch-Protection-/Cacheänderung, kein neuer PR/Entwicklungsstrang, kein Run abgebrochen, neugestartet oder ausschließlich zur Messung ausgelöst. Die abschließende vollständige CI-/Performanceoptimierung bleibt offen.

PR176 ist bereits abgeschlossen:30 unveränderte Cross-Engine-Kommandos auf zwei verpflichtenden Shards; Pflichtspanne667→391s (11,12→6,52min;−41,38%), Runner1063→1102s (+3,67%). Diese vorhandene Baseline wird weiterverwendet, keine neue Grundanalyse.

## Tatsächliche erfolgreiche Läufe

| Lauf / Job | Gesamt | Browserprüfungen | Browserinstallation | Units/Syntax |
| --- | ---: | ---: | ---: | ---: |
| PR178 ·40575706366 · Chromium/test |341s /5,68min|305s|5s|20s|
| PR178 · Cross1 |402s /6,70min|331s|61s|—|
| PR178 · Cross2 |346s /5,77min|251s|76s|—|
| PR179 ·40587872054 · Chromium/test |376s /6,27min|339s|5s|19s|
| PR179 · Cross1 |485s /8,08min|418s|59s|—|
| PR179 · Cross2 |382s /6,37min|316s|52s|—|

Quelle: originale GitHub-Actions-Job-/Step-Zeitstempel über /actions/runs/{id}/jobs, nicht die vereinfachte Connectorprojektion ohne Zeiten. Beide Läufe vollständig grün; PR179 hat zusätzliche Buchungs-/Dialog-/Backup-Gates und766 statt757 Units. Deshalb **kein vergleichbarer Vorher-Nachher-Performancegewinn oder -verlust aus diesen unterschiedlichen Testumfängen behauptet**. Fehlgeschlagene Zwischenläufe sind Fehlnachweise, keine Performancebaseline.

Größter Anteil ist tatsächliche Testausführung, nicht Chromiuminstallation. Firefox/WebKit-Setup52–76s ist ein möglicher späterer Ansatz. Browser-/npm-Caching erfordert nachgewiesene Versions-/OS-/Abhängigkeitskompatibilität, sichere Schlüssel, Invalidierung und eigene vollständige Validierung; kein ungeprüfter Cache jetzt.

Entscheidung gemäß Nutzerpriorität: Zusätzliche Workflowänderung samt Vergleichsläufen würde den aktiven UI-Abschluss verlängern. Daher nur dokumentieren und am nächsten regulären konfliktfreien Checkpoint erneut gegen den dann aktuellen kritischen Pfad prüfen. Keine Tests kürzen/überspringen, keine Shards zurückbauen, kein Supply-Chain-/Releasegate ändern. Die nachstehende Planung ist historische PR176-Dokumentation; deren damaliger ausständiger Status ist durch die oben genannten tatsächlichen Abschlussnachweise übersteuert.

---

# CI-Optimierung — konfliktfreier separater Checkpoint

Basis main/v188 ca1fa8fd46b3060d10a13095400bc3d33b0f3c42, Anwendung unverändert. PR175 ist nach vollständiger grüner CI nur durch fehlende aktuelle visuelle Abnahme/Work-Umgebung geparkt; dort keine weitere Implementierung oder laufende Tests. FLH05-A bleibt zurückgestellt. Einziger aktiver technischer Schnitt: CI-Cross-Engine-Aufteilung. PR157 bleibt unverändert geparkt, einschließlich seiner abweichenden Workflowdatei und ursprünglichen Firefox-Nachweise; keine D-Funktion oder D-Tests aus diesem nicht freigegebenen PR übernehmen. PR161 bleibt Dokumentation.

## Wiederverwendete Baseline und kleinster Schnitt

PR172-Kommentar6441822234 wird wiederverwendet: SetupChromium5–6s, Firefox/WebKit41–69s; Crossjobs433/552/623/649s. Kein erneuter Baseline-Testlauf. Für den tatsächlich vergleichbaren v188-Stand vorhandenen erfolgreichen Mainlauf40534397532 verwenden: test397s, cross-engine666s, gemeinsame Pflichtregressionsspanne667s =11,12min (frühester Jobstart bis spätestes Pflichtjobende). Deployment/Live werden nicht mit einem PR-Lauf ohne Deployment vermischt.

Die30 tatsächlich vorhandenen Cross-Engine-Kommandos werden unverändert auf zwei unabhängige Runner aufgeteilt. Jede Suite startet ihre eigenen Browserkontexte; je Runner eigener HTTP-Server/Dateisystem/Artefaktpfad. Relative Reihenfolge innerhalb jedes Shards bleibt. UI07, Lösch-/Archiv-/Buchungs- und UI-Qualitätsläufe nach beobachteten langen Segmenten verteilen; Schätzgewichte dienen nur Planung, sind kein Performancegewinn. fail-fast=false erhält bei Fehlern die anderen Pflichtnachweise. Artifactnamen enthalten Shard-ID; deploy.needs bleibt test und die gesamte cross-engine-Matrix. Bestehende Chromium-/Unit-/Deploy-/Liveabschnitte bytegleich erhalten.

Keine Tests, Browser, Assertions oder Snapshots entfernt/abgeschwächt. Versionspins, OS-Pakete, TLS/Signaturen, Berechtigungen und Trigger unverändert. Neue Manifest-Policytests prüfen sämtliche30 früheren Kommandos/Engine-Umgebungen exakt einmal und beide Pflichtshards; Negativfälle beweisen Erkennung fehlender/duplizierter/reduzierter Prüfungen. Kein neuer Kurs-/Finanz-/Backup-/Storage-/UI-Code. Keine Dependency- oder Containerübernahme, keine unsicheren OS-/Browsercaches. Setup ist gegenüber Testserialisierung klein; zusätzliche Containerpulls/Cacheinvalidierung ohne belegten Vorteil nicht aufnehmen. Zwei Runner wiederholen Setup: möglicher Compute-Mehrverbrauch wird neben tatsächlicher Wall-Time ausgewiesen.

## Noch keine Abnahme / Messung

Vollständige reale neue GitHub-CI einschließlich zusätzlicher Policytests, Chromium, beider Firefox/WebKit-Shards und unveränderter Pflichtsuiten muss erfolgreich sein. Danach Job-/Stepzeiten über GitHub-API messen: Pflichtregressionsspanne, längster Cross-Shard, Summe Runnersekunden, Setup/Test/Artifactanteile; Minuten und Prozent mit obiger unveränderter v188-Basis. Queue/Runnerstreuung offenlegen, kein statistisches Hardware-SLA aus einem Paar. Eine fehlgeschlagene Ausführung gilt nicht als Performanceabnahme. Keine Testkürzung bei Fehlern.

Erst nach überprüfbarem Diff, tatsächlich grünen finalen Gates und dokumentiertem Nutzen eigene CI-Releaseentscheidung. Keine ungeprüfte Veröffentlichung, keine implizite neue Finanz-/Syncfreigabe. Ein später wiederaufgenommener D157-Workflow muss dieses Manifest kontrolliert integrieren; Originalfehlnachweise bleiben erhalten. Lokale Ausführungsumgebung weiterhin nicht verfügbar; keine lokalen Test-/Browser-Pässe behauptet. Remote-CI ist der tatsächliche Nachweis.
