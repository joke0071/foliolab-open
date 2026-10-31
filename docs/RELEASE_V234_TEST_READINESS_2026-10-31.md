# v234: begrenzte und diagnostizierbare Browser-Wartepfade

Der freigegebene v234-Produktcode und alle 121 auszuliefernden Dateien bleiben bytegleich zu #241, HEAD6baa5bc478b00a7dc77cbc3a4b1c21841234f0e4. Dieser Begleitkandidat enthält ausschließlich Test-/Diagnosecode und übernimmt #241 inklusive #239/#240 unverändert.

## Tatsächlich beobachtete Grenze

Der zusätzliche ready_for_review-Lauf41182528517 ist nach über20Minuten weiterhin in cross-engine(3), während Chromium und Cross1/2 bestanden haben. Derselbe v234-HEAD hatte zuvor vollständige CI41181354838 bestanden. Die API stellt Logs des laufenden Jobs nicht bereit; die öffentliche Browseransicht verlangt für Live-Logs eine Anmeldung. Deshalb wird keine konkrete blockierende Testzeile als bewiesen ausgegeben. Der bestehende Lauf wird nicht abgebrochen oder verändert.

Im betroffenen Paket gibt es nachgewiesen unbefristete `page.evaluate(()=>navigator.serviceWorker.ready)`-Wartepfade und dynamische Suiteimporte ohne eigene Zeitgrenze. Ein blockierter Promise kann so den gesamten Job offenhalten, ohne einen normalen Assertion-Fehler zu erzeugen.

## Gezielte Korrektur ohne schwächere Gates

- Native Kraken-/Bitpanda-/flatex-Tests im vorhandenen UI-Quality-Einstieg beobachten die **eigene Registrierung der Anwendung** jetzt über ein begrenztes waitForFunction: aktive Workerregistrierung mit Zustand activated, höchstens60s. Keine manuelle Registrierung eines Testworkers, keine alternative Erfolgsausgabe. Bereits vorhandene Controller-, Offline-, Cache-, Finanz- und IDB-Assertions bleiben bestehen.
- Dynamische UI-Quality-Importe melden Start/Pass und scheitern nach großzügigen5Minuten pro Phase explizit mit Exit1. Die anschließende eigene Suite hat10Minuten. Keine erfolgreiche Assertion wird durch Timeout, Retry oder Catch ersetzt.
- Der History-Worker-Test behält alle Responsiveness-/Abort-/exakten Replay-/echten Offline-Prüfungen, ergänzt eindeutige Phasen und einen3-Minuten-Fehlerausgang je Browser. Die Prüfung der app-eigenen SW-Aktivierung ist ebenfalls begrenzt.
- Eine neue Unitregression belegt explizit: blockierte Phase endet mit Fehler; abgeschlossene Phase beseitigt den Timer; spätere echte Fehler bleiben Fehler.

Lokal993/993 Unit-Tests und Syntax PASS; Chromium-History-Worker und native Kraken-Suite einschließlich Offline/Axe/Fokus/exakter Nichtmutation PASS. Alle regulären vollständigen Browser-/Finanz-/Storage-Gates müssen am neuen exakten HEAD bestehen. Keine Bildreferenz/Toleranz/Anwendungsberechnung oder Datenstruktur geändert. Kein SW-Versionssprung nötig, da kein ausgeliefertes Asset verändert wird; Ziel bleibt v234.

## Release und Nachfolge

Die neue Nutzerautorisierung erlaubt geprüfte Routinekorrekturen samt Release ohne erneute Freigabe. Wenn dieser kumulative Begleitkandidat vollständig bestanden ist, einmalig den identischen v234-Produktcode veröffentlichen, vollständige Main-/Live-Abnahme ausführen und Checkpoint sichern. Vorläufer #241/#240/#239 nicht zusätzlich einzeln veröffentlichen. Den alten offenen Wiederholungslauf weiterhin transparent dokumentieren; er wird nicht stillschweigend als bestanden oder abgebrochen ausgegeben.

Danach die bereits vorbereiteten UI-POS02/UI-BOOK03-Anforderungen aus Master-Issue#149 bearbeiten. Nur FLH05/FLH-PROJ01 PARKED; Budget zusätzlicher Work-Creditpakete0€.
