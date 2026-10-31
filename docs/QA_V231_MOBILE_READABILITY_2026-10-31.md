# v231: gezielter mobiler Qualitätsnachcheck · 31.10.2026

Owner: ChatGPT Work. Ausgangspunkt: main 1617bdd29da585c88fc713be16a19bea0ed55aba, SW231 LIVE_ACCEPTED. Dieser Kandidat trägt SW232, ist keine Veröffentlichung und ersetzt die Wochenend-Testbasis nicht.

## Reproduzierte Probleme und begrenzte Korrekturen

- Archiv-Auswahlwerte werden in schmalen Filterspalten abgeschnitten. Unter der unveränderten Beschriftung „Archiv“ stehen jetzt „Aktiv / Archiviert / Alle“. „Vorgang: Alle“ vermeidet redundanten Text. Filterwerte, Such- und Archivlogik unverändert. Unter 1100 px steht die Suche über den beiden Filtern, auch bei der schmalen Tablet-Inhaltsfläche neben der Sidebar.
- Der durch Visual-CSS von Grid auf Flex umgestellte Transfer-/Ertragskopf drängt Titel und Hilfetext nebeneinander. Mobil wieder zwei Textzeilen mit separater Chevron-Spalte, ohne zusätzliche Inhalte oder neue Akkordeons.
- Lange Anbieternamen lassen die Übersicht bei 320–412 px überlaufen. Flex-Kinder dürfen schrumpfen, Namen umbrechen; die Summe bleibt separat erhalten.
- Lange synthetische Beträge und exakte Dezimalmengen werden innerhalb ihrer Zahlen umgebrochen. Mobile Buchungstitel, Handelswerte und Mengen erhalten jeweils die volle verfügbare Breite; Datum und Vorgang teilen eine Zeile. Hotfix #238 (Inhalt über Schutz-/Aktionsbereich) bleibt erhalten.
- Beschriftungen der fünf unteren Navigationsziele bleiben einzeilig.

Keine Änderung an Finanzberechnung, Journal, Berechtigungen, Import, Speicherung, Schema, CAS, Backup oder Offlineverhalten. Keine Ausweitung von Löschrechten. Kein historischer Checkpoint-Branch in main.

## Regressionen und Grenzen

`tests/browser-readability.mjs` läuft über den vorhandenen Buchungsverwaltungs-Einstieg auch in Firefox/WebKit. Synthetische 252 Buchungen mit manuellen/importierten/technischen Einträgen, langen Namen/ISIN, positivem großem Handelswert, 18 Nachkommastellen und negativer Menge. Viewports: 320, 360, 390, 412, 430, 768 und 1440 px sowie 740×360.

Prüfungen: alle fünf Reiter; Inhaltsbreite, tatsächlich verfügbare Breite aller Archivwerte, DOM-Range-Zeilen einzelner Wörter, numerische Zeilenumbrüche, Bounding-Box/Scrollbreite sichtbarer Werte, Normal-/Verwalten-Modus, Archivfilter, geöffnete Buchungsdetails, vollständig geöffnete Mehr-Unterbereiche und simulierte 125-%-Textvergrößerung. Echte Screenshots werden zusätzlich erzeugt. Vorhandene Tests und Toleranzen bleiben erhalten; keine Bildreferenzen ersetzt.

Negativkontrolle: derselbe neue Test mit dem CSS direkt vor #238 schlägt bei 320 px mit „titles squeezed“ fehl. Damit erkennt die Prüfung das frühere Layoutproblem und prüft nicht nur die aktuellen CSS-Eigenschaftswerte.

Cloud-Browser: alle fünf produktiven Hauptreiter und geöffnete Backup-/Drive-/API-/Verbindungs-/Blockchain-/Datenschutzbereiche tatsächlich geöffnet. Die Cloud-Oberfläche bietet keinen dokumentierten Viewportwechsel; die exakte Größenmatrix wird deshalb mit den vorhandenen lokalen/CI-Browsertests ausgeführt. OAuth wurde nicht ausgelöst, Nutzerdaten nicht verwendet.

Lokale Chromium-Matrix und bestehende Buchungs-UI-Suite werden vor dem PR geprüft. Unit-/Syntaxbasis: 985/985 PASS. Verbindliche Freigabe bleibt der exakte PR-HEAD mit kompletter CI einschließlich Firefox/WebKit und vorhandenen Finanz-/Storage-/Offline-/Backup-Gates. Die Systembibliotheken der beiden weiteren lokalen Browser lassen sich in diesem Container nicht installieren; deren CI-Ergebnisse nicht vorwegnehmen.

## Weiterhin offen

Der Nachcheck ist gezielt, keine vollständige Abnahme sämtlicher UI-MASTER28-/Mehr-/Wallet-/Chart-/Import-/DELETE-/PERF01-Verträge. Echte Android-Systemschrift, Bildschirmtastatur, PWA-Adressleisten, TalkBack, Safari-Hardware, OAuth und Storage-Eviction bleiben EXTERNAL/BLOCKED bis zur tatsächlichen Prüfung. FLH03/Drive-Backup/PERF01 und weitere aktive Fachreste bleiben OPEN/PARTIAL; ausschließlich FLH05 und FLH-PROJ01 PARKED.

Nichtkritischer Kandidat: kein Merge/Deployment ohne konkrete Freigabe, v231 bleibt stabile Wochenendbasis. Nächster Schritt: exakten Kandidaten nach CI und visueller Prüfung vorlegen; anschließend priorisierte Praxisbefunde beziehungsweise nächste konfliktfreie P1-Text-/Fachreste bearbeiten.
