## Aktueller Vorbereitungsschnitt · 13.11.2026

Owner work-35ee9471eef2-20261113; Nutzer hebt die globale Entwicklungssperre ausdrücklich auf. **PR_CANDIDATE_PREPARED / NOT_FROZEN / RELEASE_BLOCKED**, kein PR/CI/Deploy/LIVE_ACCEPTED. Der nachstehende alte Hinweis „erst Main vollständig schließen, dann vorbereiten“ ist für isolierte Vorbereitung durch den neuen Auftrag ersetzt; Releasegates bleiben offen.

Gegen Main a27cde2f802c26bfec41190911d88bd1d7d8e325 / Tree e55ffa96f641345759eb3779b00de6187c8671b8 abgeglichen. Gemeinsame Basis fa705d04e338364040c60957fff9632309afefe6; seitdem auf Main ausschließlich PR335-Dokumentidentitätsvertrag samt Diagnosepapier, keine Runtimeänderung. Diese beiden Main-Dateien werden unverändert in den bestehenden UI-R4-Branch übernommen. Alle acht bestehenden UI-R4-Produkt-/Testblobs einschließlich SW312 bleiben bytegleich; nur dieses bestehende Scopepapier wird aktualisiert. Keine Prozessänderungen auf dem Produktbranch, kein zweiter Folgeschnitt.

### Fachlicher Vollständigkeitsabgleich

| Bestehendes Kriterium | Implementierung und vorhandener Nachweis | Offene Grenze |
| --- | --- | --- |
| Frei wählbare EUR-Schwelle, Default alle | positionValueThreshold; leere/Null-Eingabe, Dezimalkomma und präzise Grenzwerte in position-search.test.mjs | Finale Gesamtgates |
| UNKNOWN/fehlender Kurs von echtem Nullwert trennen | filterSmallPositionValues bewahrt UNKNOWN/fehlenden Kurs, Ausschluss und Verbindlichkeiten; vorhandene exakte Bewertung wiederverwendet | Keine neue Finanz-/Steuerfreigabe |
| Suche/Anbieter/Archiv/Paging/verborgene Auswahl | Filter nach vorhandenem Such-/Archiv-/Anbieterscope und vor Paging; Auswahlstatus erhält versteckte IDs | Drei-Engine-Integration und Produktion offen |
| Nur Darstellung, Summen/Journal/Restore unverändert | Keine Modell-/Settingsmutation; vorhandener Browservertrag vergleicht exakten IDB-Record/Revision vor/nach und Offline-Reload | Historischer lokaler Chromium/Firefox-PASS kein neuer Kandidaten-/Produktions-PASS |
| Bedienung/A11y/kurze Ansicht | Vorhandener Vertrag fünf Breiten/Axe/44px/Fokus, 320x360/200%-Text und lange Eingabe | Aktuelle native Browserfähigkeit fehlt; Android/WebKit/Hardware offen |

Keine konkrete Produktrestlücke aus diesem Abgleich gefunden; keine künstliche Neuimplementierung. Lokale Eingaben aus gepinnten GitHub-Dateien materialisiert;77 benötigte Quellen/Tests exakt gegen Gitblobs verifiziert. Node24.22.1 (abweichend von CI22/Wallet20), fünf bestehende gerichtete Units PASS/0Fehler/0Skips und node --check auf den drei UI-R4-.mjs-Dateien sowie position-search.js PASS. Dieser lokale Lauf wurde nach exaktem Byteabgleich einmal bestätigt; kein gesamter Unit-/Browser-/Release-PASS.

Capability: AF_UNIX-Erzeugung EPERM; Chromium nicht wieder gestartet. Vorhandener Laufzeitcompiler TypeScript5.8.3 hier nicht auffindbar; kein Installations-/Umgehungsversuch. Historischer V2-Namensprüfungsnachweis bleibt für die bytegleichen drei Testblobs historisch wiederverwendbar; aktueller Namensprüferlauf nicht behauptet. Syntaxprüfung allein ersetzt diesen oder native Tests nicht. Reguläres Browser-TLS/Proxy und aktuelle private Transfer-/Readback-/Restorefähigkeit ungeprüft.

### Fertiger PR-Entwurf (erst bei zulässiger Qualifikation eröffnen)

Titel: UI-R4: kleine Positionswerte mit frei einstellbarer Anzeigegrenze filtern

Die Positionsliste kann kleine bekannte EUR-Werte unter einer frei wählbaren Grenze ausblenden. Standardmäßig bleiben alle Positionen sichtbar; unbekannte Bewertungen, fehlende Kurse und Verbindlichkeiten werden erhalten. Der Filter bleibt in der Sitzung, erhält Suche/Archiv/Paging und verborgene Auswahl und verändert weder Finanzwerte noch gespeicherte Daten.

Vorhandene fünf Units und Syntaxprüfungen bestanden. Historische gezielte Chromium-/Firefoxprüfungen auf bytegleichem Produkt-/UI-R4-Vertrag vorhanden; aktuelle Browserausführung ENVIRONMENT_BLOCKED. WebKit, vollständige PR-/Wallet-/Main-/Produktionsabnahme sowie neue Original-/Sicherungs-/Readback-/Restoregates offen. Mainrun43332355188 bleibt FAILURE/Produktionsursache UNKNOWN; kein Merge oder Release als Umgehung.

### Genau nächste zulässige Qualifikation

Keinen PR allein zur Sichtbarkeit eröffnen: der unveränderte import.yml-Trigger reagiert auch auf opened/converted_to_draft und startet bei diesem Funktionsdiff die vollständige Pflicht-CI; Wallet-CI reagiert ebenfalls auf pull_request. Ein Draft wäre kein CI-freier Ablageort. Ein einziger Kandidatenbranch und dieser fertige Entwurf genügen zur reviewbaren Vorbereitung. Vor Freeze Main/Owner/Refs/Reviews/Kommentare/Actions erneut abgleichen; geeignete Ausführungsfähigkeit und Sicherungsweg klären. Der geparkte Produktionsblocker muss vor abhängiger Integration/Release sicher geschlossen werden. Kein unveränderter Retry, keine Workflowänderung oder Sicherheits-/Fristlockerung.

Die spätere frühe SW-Diagnostik aus dem Effizienzplan bleibt bis zum sicheren Blockerabschluss zurückgestellt und wird nicht in UI-R4 hineingemischt. Bereits vollständig qualifizierte identische Belege erhalten; neue Kandidaten-/Main-/Produktionsgates niemals ersetzen.

## Unveränderter Vorbereitungsnachweis

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


## Ergänzende kurze Ansicht

Der tatsächliche geteilte Vertrag wurde anschließend in Chromium141 und Firefox157 mit 320×360, synthetisch verdoppelten Textgrößen und einer 31-stelligen EUR-Eingabe ausgeführt: vollständiger Eingabewert und gültiger Zustand, kein horizontaler Seitenoverflow, fokussiertes mindestens44px-Feld frei von Kopf- und Fußnavigation, Axe und exakte IDB-Invarianz PASS. Beide kurzen Ansichten direkt gesehen. Das ist berechneter Textstress, keine physische Zoom-/Android-/Safariabnahme. Vorher neue/geänderte.mjs-Dateien mit V2 geprüft. WebKit bleibt lokal vor Start blockiert; keine zusätzliche finale CI.
