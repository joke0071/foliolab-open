# v294: gezielte Alpha-IDB-Ursachenuntersuchung nach PR314

Owner14118750c7bb hat am07.11.2026 nach frischer kollisionsfreier HND01-Prüfung allein übernommen. Main43d4e7ad42ceb36b12ebd377d3a299173a421f93/Treeb9e0345db3a1c0ceaa114d961220d3b17971cd71, PR314-HEADcfcbeaf43d9751895e6bddd77011d9cef0b855b2 unverändert. Keine neue Ausnahmefreigabe im Nutzerauftrag oder der leeren PR314-Diskussion.

## Unverändertes Releasegate

v293 bleibt letzte LIVE_ACCEPTED-Produktion; nicht erneut abgenommen. v294 ist NICHT DEPLOYED/LIVE_ACCEPTED. Originalmainlauf42378307203 Versuch1 bleibt FAILURE; Integration42383067257/Wallet42383067236 bleiben SUCCESS und werden nicht wiederholt. PR314 bleibt OPEN/FROZEN/UNMERGED. Der ursprüngliche Firefox-Open-Timeout ist weiterhin UNKNOWN. Kein Fix und keine Flakeheilung nachgewiesen.

## Neue, begrenzte Untersuchung

Das vollständige Originaljoblog128420432338 wurde erneut über das GitHub-Plugin gelesen. Es enthält weder Request-Lifecycle-Telemetrie noch Host-CPU-/I/O-Messungen für das ausstehende Open. Die Abstände der vier synthetischen Providerantworten und die spätere Contextschließung erlauben keinen Ursachenbeweis. Keine externe HTTP-Störung aus diesem Log ableiten.

143 aktuelle Produktmodule wurden gegen den exakten Gitbaum verifiziert und statisch untersucht: der Marktcachename ist in alpha-vantage.js konstant, das native Open fordert stets Version1 an. clearAlphaCache leert den Objectstore über eine Transaktion; es löscht nicht die Datenbank. Kein expliziter Cache-Upgrade- oder Deletepfad im normalen Alpha-Fixture identifiziert. Diese statische Eingrenzung beweist keinen historischen Browser-/Hostzustand.

[Ausführbare isolierte Scheduling-Matrix](repros/ALPHA_IDB_SCHEDULING_2026-11-07.mjs), Aufruf vom passenden Repositoryroot mit Playwright1.64.1:

```sh
node docs/repros/ALPHA_IDB_SCHEDULING_2026-11-07.mjs
```

[Maschinenbericht](release-evidence/v294-alpha-idb-scheduling.json). Lokal Firefox157/Playwright1.64.1, Containerkompatibilität MOZ_DISABLE_CONTENT_SANDBOX=1; keine reguläre CI-/Produktionsabnahme. Vier einmalige, gezielt induzierte Szenarien, keine Wiederholung eines fehlgeschlagenen Releasegates:

| Szenario | Tatsächliche Beobachtung |
| --- | --- |
| Gehaltene v1-Verbindung | Native Open-Antwort3ms; korrekter synthetischer Wert gelesen. |
| Aktive Schreibtransaktion für6200ms | Open3ms; anschließende Lesetransaktion wartet bis zum vollständigen Commit, Wert korrekt. Kein Open-Timeout. |
| close() bei noch aktiver6200ms-Schreibtransaktion | Open2ms; Lesen wartet bis zum Commit, Wert korrekt. Kein Open-Timeout. |
| Absichtlicher5300ms-Hauptthreadstillstand direkt nach echtem Open | Success nach5300ms; Gesamtoperation5302ms, Heartbeatlücke5311ms. Kein Timeout: das native Success-Ereignis wurde hier vor dem fälligen Schutz-Timer verarbeitet. |

Alle drei Verbindungs-/Transaktionsfälle prüfen echte native Requests und die unveränderte alphaCache-Implementierung. Der Stillstandsfall protokolliert die tatsächliche native Reihenfolge; er enthält bewusst keine Assertion, dass ein solcher Stillstand zwingend einen Timeout erzeugen muss. Seine beobachtete Nichtreproduktion darf keine Behauptung zu sämtlichen Schedulingreihenfolgen werden. Nach dem erfolgreichen Lauf wurde allein der Berichtsausgabepfad für den wiederverwendbaren Repro auf artifacts/gates/alpha-idb-scheduling.json verlegt; Syntax erneut geprüft, kein zweiter Browserlauf.

## Ergebnis und Evidenzgrenze

Lange normale Schreibtransaktionen oder eine dabei close-pending gesetzte Verbindung sind in diesen kontrollierten Fällen kein Mechanismus für den historischen Open-Timeout. Auch der kontrollierte Hauptthreadstillstand reproduzierte ihn nicht. Die schon vorhandenen Upgrade-/Delete-Queue-Repros ausPR314 bleiben gültige induzierte Mechanismen, aber ohne identifizierten Auslöser im ursprünglichen Fixture.

Der ursprüngliche Fehlerlauf wurde ohne diese Telemetrie ausgeführt; sein verlorener Request-/Browser-/Hostzustand kann nachträglich nicht rekonstruiert werden. Weitere identische grüne Gatewiederholungen würden die historische Ursache nicht beweisen. Kein blinder Retry, keine Timeoutverlängerung, kein Catch-and-PASS, keine Produkt-/Schema-/Finanz-/Cachebudget-/Workflowänderung. Alle Schutzverträge und privaten Originale erhalten.

## Konkreter Entscheidungsstand

Der vorhandene vollständig qualifizierte DiagnosekandidatPR314 liegt unverändert vor. Ein Merge startet die Main-/Releasekette. Solange keine Ursache nachgewiesen ist, erfordert dieser Schritt eine neue ausdrückliche Ausnahmefreigabe zum Release trotz UNKNOWN. Ohne diese Entscheidung bleibt v294 gesperrt. Eine weitere Diagnose ist nur mit einer neuen konkreten Hypothese bzw. einem instrumentierten echten Fehler sinnvoll; vorhandene qualifizierte CI weder duplizieren noch abbrechen.

Bei Ausnahmefreigabe zuerst Main/Tree/HEAD/Owner/Reviews/Actions frisch abgleichen, erwarteten PR314-HEAD mechanisch binden und vorhandene Belege wiederverwenden. Anschließend ausschließlich den automatisch entstandenen Mainlauf sowie vollständige Pages-/Deployment-/gewöhnlicheTLS-/Asset-/SWv294-/tatsächliche DreiEngine-Produktion einschließlich früher/später Finanzierung qualifizieren. Erst dann LIVE_ACCEPTED. UH05 und sämtliche übrigen Aufträge anschließend wie übergeben fortsetzen.

Referenz zum Algorithmus, keine Behauptung über den konkreten historischen Browserzustand: [W3C IndexedDB3, Verbindung öffnen](https://www.w3.org/TR/IndexedDB-3/#opening-a-database-connection). Die Verbindungsschlange ist von normalen Transaktionszugriffen zu unterscheiden.
