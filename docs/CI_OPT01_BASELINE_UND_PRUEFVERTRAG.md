# CI-OPT01 – Vorhermessung und Prüfvertrag

Status: **BASELINE GESICHERT / UMSETZUNG OFFEN**. Quelle: Main `3b00336d46c7212b6b1fbaec69fe2f83ff60c5ce`, Workflow und echte GitHub-Job-/Stepdaten. v221 ist vollständig LIVE_ACCEPTED. Auftrag: [Issue #229](https://github.com/joke0071/foliolab-open/issues/229) und [ursprünglicher Vertrag](CI_OPT01_AUFTRAG_2026-10-30.md). Dies ergänzt die bestehende Roadmap und eröffnet keinen zweiten Master.

## Tatsächliche Vorherwerte

[Maschinenlesbare Originaldaten und vollständiges Kommandoinventar](release-evidence/ci-opt01-before-baseline.json), Belegcommit `1fd4b2d3a07abb0987d7a0a6273e5948bd2cac04`.

| Messung | v221/Main, Versuch 1 | Vergleich v220, erfolgreich |
| --- | ---: | ---: |
| Unit + Syntax | 28 s | 26 s |
| Chromium-Teststufe | 575 s | 555 s |
| Firefox/WebKit Shard 1, Teststufe | 446 s | 424 s |
| Firefox/WebKit Shard 2, Teststufe | 740 s | 710 s |
| Chromium-Werkzeuge installieren | 6 s | 6 s |
| Cross-Browser installieren, Shard 1 / 2 | 39 / 71 s | 34 / 69 s |
| Vollständiger Hauptjob | 622 s | 596 s |
| Vollständiger Cross-Shard 1 / 2 | 493 / 821 s | 465 / 789 s |
| Pages-Job | 17 s | 18 s |
| Erfolgreicher Livejob | 656 s, gezielter Versuch 2 | 691 s |
| Summe Joblaufzeiten | 2.195 s im ersten Versuch + 656 s Retry | 2.559 s |

Der erste v221-Livejob endete nach 242 s mit belegtem HTTP503. Im erfolgreichen unveränderten Retry entfielen 172 s auf Chromium-Liveprüfungen, 434 s auf die Firefox/WebKit-Livestufe und 6 + 36 s auf Browserinstallation. Der zusätzliche Diagnoseabstand zwischen den Versuchen ist keine Rechenzeit. Historischer Diagnose-PR228: 1.912 Jobsekunden; ursprünglicher roter v221-Lauf41059923497: 1.955 Jobsekunden. Fehlgeschlagene und erfolgreiche Läufe sind keine kontrollierte A/B-Stichprobe.

Jobsekunden sind beobachteter Runner-Aufwand, keine abgerechneten Actions-Minuten oder Work-Credits. Verbrauchsdaten für Work-Credits stehen hier nicht zur Verfügung; daraus wird keine Euroersparnis errechnet. Geeignete getrennte Work-Proxys: Anzahl vollständiger Neuprüfungen, Diagnose-/Toolzyklen, wiederholter Gesamtanalysen und Artefaktinspektionen pro abgenommenem Kandidaten.

## Vollständiges Inventar und Grenzen

- Hauptjob: 100 direkte Testaufrufe, davon 99 Browsermodule und ein Live-Probe-Modul.
- Cross-Matrix: 37 unveränderte Aufrufe einschließlich expliziter Engine-Umgebungen.
- Livejob: neun direkte Aufrufe, teils mit beiden Cross-Engines.
- browser-ui-quality.mjs lädt zusätzlich 18 Module intern sequenziell. Diese Reihenfolge ist nach früheren Startfehlern ausdrücklich geschützt.
- Bestehende Tests bewahren das historische 30-Kommandomanifest und sieben spätere Ergänzungen. Eine neue Zuordnung muss dieselben Aussagen und Negativtests erhalten; der historische Beleg bleibt unverändert.
- Firefox und WebKit laufen teilweise gemeinsam innerhalb eines Aufrufs. Ihre Einzelzeiten lassen sich aus den vorhandenen Stepdaten nicht zuverlässig isolieren. Kommando-/Engine-Messung ergänzen, keine exakten Einzelwerte erfinden.
- Chromium nutzt Playwright1.56.1 mit Pixelbaselines, Cross-Engines1.64.1. Versionsangleichung ist eine eigene Kompatibilitätsprüfung.
- Der aktuelle Hauptworkflow hat keine expliziten Cache-Actions und das Projekt keinen Dependency-Lock. Reproduzierbare Installation und sichere Cachekeys müssen zusammen bewertet werden.

Lokale und produktive Ausführung derselben Finanz-/Storage-/UI-Suite sind unterschiedliche Nachweise. Sie werden nicht allein aufgrund identischer Dateinamen als unnötige Doppeltests gestrichen. Getrennte Browserprofile, Server und Artefakte müssen beim Sharding erhalten bleiben.

## Konsequenz für die Umsetzung

Der Engpass vor Deployment ist Cross-Shard2 mit 821 s Gesamtdauer. Nur Chromium aufzuteilen verkürzt diesen kritischen Pfad nicht. Zuerst die tatsächlichen Suite-Abhängigkeiten und Gewichte erfassen; dann unabhängige Gruppen auf isolierte Runner verteilen und jede Gruppe intern sequenziell lassen. Caching allein spart nur einen begrenzten Installationsanteil und darf keine große Gesamtersparnis versprechen.

Vor Änderungen ein vollständiges Ausführungsmanifest aus dem gesicherten Inventar ableiten. Es muss fehlende, doppelte oder in der Engine-Menge reduzierte Prüffälle erkennen. Jeder erforderliche Prüffall erhält eine nachvollziehbare Zuordnung zu Stufe, Risikoklasse und Komponente.

## Verbindliche Stufengrenzen

| Stufe | Regel |
| --- | --- |
| FAST | Nur frühe Entwicklung/Draft. Vollständige Units/Syntax und tatsächlich relevante Browser-/Responsive-/Axe-Prüfungen. Reine CSS-Änderungen benötigen Prüfung der betroffenen und gemeinsam beeinflussten Ansichten. Fehlende Integrationsnachweise ausdrücklich ausweisen. |
| INTEGRATION | Technisch fertiger Kandidat am exakten HEAD. Betroffene Komponenten in Chromium/Firefox/WebKit und alle erforderlichen Finanz-/Daten-/CAS-/Backup-/Sicherheitsgates. Produktive Assetänderungen brauchen die korrekte SW-Revision. Kritische oder unklare Änderungen lösen die volle Regression aus. |
| RELEASE | Vollständige bisherige Main-/Cross-/Pages-/Live-/Hash-/A11y-/PWA-/Offline-/IDB-/CAS-/Finanz-/Backup-/Restore-Prüfung. Kein reduzierter Standard. |

Die Umsetzung muss insbesondere den Wechsel Draft → reviewbereit abdecken. Ein früher FAST-PASS darf keine konkrete INTEGRATION-Freigabe oder einen erforderlichen SW-Bump ersetzen. Trigger, Checknamen, neue Änderungen nach einer Abnahme und vorhandene Repository-Regeln müssen gemeinsam geprüft werden. Ein vermeintlich grüner Draft mit ausgelassenen Pflichtnachweisen ist kein Integrationskandidat.

Finanzberechnungen, Buchungen, Wallets, IndexedDB/CAS, Backup/Restore, Löschen, Migrationen und PWA konservativ behandeln; transitive Abhängigkeiten berücksichtigen. Unbekannte Dateien und unklare Änderungen fallen auf den vollständigen Pfad zurück.

## Infrastruktur und Wiederverwendung

Der erste v221-Liveversuch belegt HTTP503/HTML für ein JavaScript-Modul und den dadurch blockierten Appstart. Nur dieser Befund begründete genau einen unveränderten Livejob-Retry. Kein pauschaler Retry bei Timeout, Assertionfehler, Finanzabweichung, Dateninkonsistenz oder IDB-Fehler. Originalfehler und Wiederholungsgrund bleiben sichtbar. Frühere ungeklärte Starts werden nicht rückwirkend derselben Ursache zugeschrieben.

Wiederverwendete Berichte müssen zu nachweislich identischen Commit-/Tree-/Asset-/Test-/Browserkontexten gehören. Kein fremder HEAD wird als aktueller PASS ausgegeben. Screenshots nur bei begründet gleichem Kontext wiederverwenden; echte Änderungen bleiben prüfpflichtig.

## Abnahme und offene Arbeit

Noch offen: belastbare Impact-Zuordnung, ausführbares Stufenmanifest, instrumentierte Zeiten, kontrollierter Canary-Kandidat, Nachhermessung und konkrete Nutzerfreigabe. Keine CI-Vertragsänderung, keine neuen Testläufe und keine Einsparung aus dieser Baseline behauptet.

Issue229 erlaubt, eine Option für höchstens zwei bis drei unabhängige CSS-Pakete gemeinsam zu bewerten. Es erlaubt keinen automatischen Sammelmerge. Jeder vollständig definierte gemeinsame Kandidat benötigt eigene ausdrückliche Freigabe, vollständige Tests und nachvollziehbaren Rollback.

CI-OPT01 nicht unbegrenzt zum Blocker machen: Bei unverhältnismäßigem Umfang sichere priorisierte Teilschnitte umsetzen und den übrigen Auftrag offen halten. UI-VISUAL06 und alle Masteraufgaben bleiben aktiv; nur FLH05/FLH-PROJ01 bewusst PARKED.
