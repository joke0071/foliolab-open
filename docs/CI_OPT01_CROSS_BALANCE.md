# CI-OPT01 – erster begrenzter Canary: Cross-Engine-Aufteilung

Status: CANDIDATE / NOT_MERGED / MEASUREMENTS_PENDING. Bezug: Issue229 und bestehende Baseline auf dem Master-Dokumentationsbranch. Keine vollständige CI-OPT01-Abnahme aus diesem Teilschnitt ableiten.

## Problem und Änderung

Auf Main3b00336d dauert Cross-Shard2 insgesamt821s, seine Tests740s. Chromium dauert622s insgesamt. Der langsame Cross-Shard begrenzt die Zeit bis zur technischen Abnahme.

Der bestehende zweite Shard wird an der Grenze vor browser-ui-quality.mjs auf zwei isolierte Runner geteilt. Shard1 bleibt unverändert. Jeder Runner hat seinen eigenen HTTP-Server, Browserprofile und Artefaktbaum. Die Reihenfolge innerhalb der neuen Gruppen bleibt erhalten; die18 intern sequenziell geladenen UI-Module werden nicht auseinandergerissen oder parallel gestartet.

Alle37 bisherigen Cross-Aufrufe samt Engine-Umgebungen bleiben exakt einmal erhalten. Das historische30-Kommandomanifest bleibt unverändert. Das zusätzliche v221-Manifest dokumentiert die bisherige vollständige Liste und ihre neue Zuordnung. Policytests lehnen fehlende oder doppelte Tests, reduzierte Engine-Mengen und einen fehlenden dritten Shard ab. Auch sämtliche Sicherheitsprüfungen der neuen dritten Gruppe werden einzeln durch negative Kontrollfälle geschützt.

Deployment wartet weiterhin auf den Hauptjob und die vollständige Cross-Matrix. Der Chromium-/Unit-/Syntax-/SW-Gate-Abschnitt und der gesamte Pages-/Liveabschnitt bleiben bytegleich. Keine Änderung an Produktcode, Finanzen, IDB/CAS, Backup, PWA-Version, Testassertionen, Testtimeouts, Browserpins oder Screenshots.

## Umfang und Stufengrenzen

Dieser priorisierte Teilschnitt aktiviert noch keine reduzierte FAST-Auswahl. FAST, INTEGRATION und RELEASE erhalten vorerst alle bisherigen Pflichtprüfungen; unbekannter Impact bleibt vollständig. Eine spätere reduzierte Auswahl muss separat den sicheren Wechsel von Draft zu reviewbereit, transitive Abhängigkeiten und unverwechselbare Abnahmekontexte nachweisen. Dieser PR ist keine Freigabe für diese spätere Vertragsänderung.

Caching, Versionsangleichung, Chromium-Sharding und automatische Infrastruktur-Retries sind hier nicht enthalten. Dadurch lässt sich die Wirkung dieser einen Änderung messen. CI-OPT01 bleibt insgesamt PARTIAL; weitere Teilschnitte dürfen den Master nicht unbegrenzt blockieren.

## Vorher/Nachher-Abnahme

Vorher: Main41080709085 Versuch1, Pflichtjobs622/493/821s, Summe1936 Runnersekunden. Ergänzende unveränderte Anwendungsbasis: PR228/41067814989 mit586/521/805s. Diese historischen Stichproben sind keine garantierte Laufzeit.

Nachher: genau einen vollständigen Canary-PR-Lauf auf dem endgültigen Kandidaten auswerten. Pflichtspanne vom frühesten Jobstart bis zum letzten erforderlichen Jobende, längsten Shard, Installations-/Test-/Artefaktzeiten und Summe tatsächlicher Runnersekunden vergleichen. Zusätzlicher Runner erzeugt zusätzlichen Setupaufwand. Einzelne Paarmessung und Runnerstreuung offenlegen; keine erfundene Work-Credit- oder Euroersparnis.

Jeder tatsächliche Bericht und die Artefakthashes müssen den getesteten Mergebaum belegen. Alle bisherigen Chromium- und drei Cross-Shards müssen erfolgreich sein; zusätzliche Policytests ebenfalls. Bei Fehlern erst Ursache ermitteln, keine blinden Wiederholungen oder Gateänderungen. Neue Artefakte nach Shard-ID getrennt sichern.

Vor Merge eigene konkrete Nutzerfreigabe des abschließend geprüften HEADs. Nach freigegebenem Merge vollständige bisherige Main-/Pages-/Liveabnahme. Produktion bleibt bis dahin v221/SW221 LIVE_ACCEPTED. Keine Freigabeübertragung von209/228 und keine Copilot-Sammelintegration.
