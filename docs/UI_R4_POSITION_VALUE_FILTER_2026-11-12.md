# UI-R4 – vorbereiteter Kleinstbestandsfilter

**Fortschreibung nach PR334-Integration:** Gegen Main fa705d04e338364040c60957fff9632309afefe6 abgeglichen; dessen Runtime-/Test-/Workflowdateien sind gegenüber der geprüften v311-Basis unverändert. Der isolierte Vorbereitungsbranch enthält den erforderlichen SW-Bump auf v312. Noch kein PR, Freeze oder finale CI; Mainlauf43315231787 hat Vorrang. Die folgenden SW-offen-Angaben dokumentieren den ursprünglichen Vorbereitungsstand.

Basis: Main `8ecc49f91c2c193e9391ef6f15460e6a40eb10c2` / v311. Dies ist der einzige unabhängig vorbereitete Folgeschnitt während PR334. Noch kein eingefrorener Kandidat, PR, Full-CI- oder Release-PASS. Vor eigener Freigabe gegen den akzeptierten Main abgleichen und den erforderlichen SW-Bump setzen.

## Nutzerablauf

Eine frei einstellbare, nichtnegative EUR-Schwelle filtert ausschließlich die primäre Positionsliste. Standard ist alle sichtbar. Der Vergleich verwendet die vorhandene exakte Decimal-/FX-Bewertung; eine Position genau auf der Grenze bleibt sichtbar. Fehlender Kurs, UNKNOWN-FX, ausgeschlossene Bewertungen und Verbindlichkeiten werden nicht als Kleinstbestand versteckt. Bekannter Nullwert kann bei positiver Grenze ausgeblendet werden.

Die Schwelle gehört wie Suche und Sortierung zur laufenden Ansicht: Navigation erhält sie, ein frischer Reload zeigt wieder alle Positionen. Keine neue persistente Präferenz und keine Änderung an showSmall, Modell, Schema, Summen, Allokation, Importidentität oder Journal. Ungültige Eingaben bleiben mit Fehlermeldung sichtbar; die bisherige angewandte Grenze bleibt aktiv.

Anbieter-/Archiv-/Suchfilter und Paging bleiben erhalten. Bestehende ausgewählte IDs werden beim Ausblenden nicht entfernt; die vorhandene Auswahlstatuszeile weist versteckte Auswahl weiterhin aus. Keine neue Lösch- oder Archivfreigabe.

## Tatsächliche lokale Prüfung

- Fünf Unitfälle in der bestehenden position-search.test.mjs bestanden: bestehende Suche/Sortierung sowie Parser/Negativfälle, exakte Grenze, UNKNOWN/Null und Reinheit, 205 Positionen mit Archiv-/Auswahlabgleich.
- V2-Vorprüfer auf den drei neuen/geänderten .mjs-Dateien: STATIC_NAME_AND_SYNTAX_ONLY PASS; sonstige Typdiagnosen außerhalb Scope.
- Danach der tatsächliche geteilte Browservertrag gezielt in Chromium 141 / Playwright 1.56.1 und Firefox 157 / Playwright 1.64.1 bestanden. Host Node 24.22.1 weicht von CI22 ab.
- 111 aktive und eine archivierte Position: Default/Paging, exakte Schwelle und Dezimalkomma, UNKNOWN/fehlender Kurs, echter Nullwert, versteckte Auswahl, ungültiger Entwurf, Suche/Archiv, Navigation und frischer Offline-Reload. Exakte Raw-/Revisions-/Settingsinvarianz.
- Fünf Breiten 320/390/430/768/1440, Axe, 44px und Fokus. Chromium 320/1440 direkt angesehen.
- WebKit lokal BLOCKED vor Teststart: libGLESv2.so.2 fehlt. Kein WebKit-, CI-, Produktions-, Android- oder Release-PASS.

Der kleine neue Vertrag wird vom bestehenden browser-ui-quality.mjs je Engine aufgerufen, damit derselbe Ablauf später PR/Main und tatsächliche Produktion abdeckt. Kein neues Framework oder Workflow. Die ursprüngliche browser-position-selection.mjs ist bytegleich wiederhergestellt; der neue Ablauf wird dort nicht zusätzlich ausgeführt.

## Erhaltene Erstbefunde

1. Getrennter HTTP-/Browser-Netzraum: ERR_CONNECTION_REFUSED vor Appstart. Bekannter begrenzter Transport mit identischen Appdateien im selben Nodeprozess; kein Produkt-/Assertion-/Fristpatch.
2. Ein früher Selektor traf auch versteckte Dashboard-Elemente mit derselben data-position-id. Korrektur auf die primäre Positionsliste, Prüfaussage unverändert.
3. Neuer Input zunächst unter 44px. Ausschließlich am neuen Eingabebereich min-height:44px ergänzt; Gate unverändert.
4. Früher Cross-Versuch mit Playwright1.56.1 fand den Firefox-Binärstand nicht. Mit dem vorgesehenen Cross-Controller1.64.1 bestand Firefox; WebKit bleibt am genannten Bibliotheksmangel blockiert.

Lokale Originale und Zwischensourcen werden im privaten Vorbereitungscompanion erhalten. Keine dieser Grenzen erklärt den unabhängigen ursprünglichen CSV-44px-Fehler von PR332.

## Nächste Aktion

PR334 zuerst vollständig abschließen. Danach diesen vorbereiteten Scope gegen dessen akzeptierten Main abgleichen, SW-Revision setzen und als einen regulären vollständigen UI-R4-Kandidaten qualifizieren. Keine zweite finale CI parallel. Bereits gültige identische gezielte Belege nicht wiederholen; geänderte Testskripte vor Freeze mit V2 prüfen. Alle PR-/Main-/Produktions-/Original-/Versions-/Readback-/Restoregates bleiben erhalten. PR332 BLOCKED, PR157/161 und historische Queues geschützt.
