# UI289 – korrigierter Integrationsbericht

Stand: 03.11.2026. Grundlage: Copilot-HEAD `00d8fafa59fe430ff4c94f2fc4706ea6bd704f16`, unabhängiges Review und aktuelle Nutzerentscheidungen. Integrationsbasis ist v274/Main `0765bab7cfcefae22ea47d12a80aaebd2a676314`. v274 ist LIVE_ACCEPTED. Der UI-Kandidat ist noch nicht veröffentlicht; finale CI-/Main-/Livebelege werden auf dem Checkpointbranch verlinkt.

Der [ursprüngliche Lieferbericht](https://github.com/joke0071/foliolab-open/blob/00d8fafa59fe430ff4c94f2fc4706ea6bd704f16/docs/ui-copilot-2026-11-03/REPORT.md) ist historisch. Seine widersprüchlichen Abnahme- und Restangaben gelten nicht als aktueller Abschlussnachweis.

## Umfang und Entscheidungen

| Anforderung | Tatsächlicher Stand / Prüfumfang |
| --- | --- |
| A: Long-Press in drei Listen | Verwalten plus genau gedrückter Eintrag. Linkes Positionssymbol als Checkbox, sonst Checkboxfallback; kein sichtbares zeilenweises „Auswählen“. Ghost Click nur auf Ursprungszeile beziehungsweise als Abschluss derselben Touch-Geste; unabhängiges sofortiges Fertig, zweite Berührung außerhalb der Liste, Pointertyp und vollständiger Listenerabbau zusätzlich geprüft. |
| B: Installation | Große Karte entfernt. Ein kleines Symbol pro Layout startet einen vorhandenen Prompt nur nach Tap oder öffnet eine nutzbare Installationshilfe. Standalone/appinstalled/Abbruch bleiben berücksichtigt. Speicherhinweis ist browser-/geräteabhängig qualifiziert, mit Backup- und Nichtlöschenhinweis. |
| C: Loader | Vorhandene sichtbare Blasenbewegung verstärkt; Startup, Reload, verzögerte Module/DB, Fehler, Timeout/später Erfolg und Reduced Motion geprüft. Keine künstliche Mindestladezeit. Historische Bewegungsbelege unter `img/loader-*`; unabhängiges Review bestätigte tatsächlich wechselnde Frames. |
| D: Listen / #257-B | Positions- und Buchungsdetails ausschließlich unter Verwalten; nach Fertig geschlossen und verborgen, Fokus zurück. Separate Dialogverwendungen behalten Details. Transferaktionen im Verwaltungsmodus erreichbar, einschließlich Vorschau, Beleg, Zustimmung, CAS und Undo. Tests verwenden den neuen sichtbaren Einstieg; fachliche Assertions bleiben bestehen. |
| E: Texte / Typografie | Veraltete drei Anbieterhilfen auf tatsächlich vorhandene Zugänge/Suche angepasst; kompakte Referenzquellzeilen, dezenter Historienhinweis, angeglichene „Gebuchte Vorgänge“-Typografie. |
| #257-A / Mehr | Kleine dekorative Konten- und Sicherheitssymbole im Stil des vorhandenen Settings-Symbols, keine Klickattrappen. Mobile Aktionen/Touchziele verdichtet. |
| L07 | Durch Nutzerentscheidung geklärt: Mehr → Automatische Kurse → Kursverläufe per CSV. Explizite Positionswahl ohne vorausgewählte Position oder Providerheuristik. Vorhandene lokale Quelle mit Währung/Anzahl sowie Import/Ersetzen/Entfernen sichtbar. Unveränderte bestehende Import-, Bestätigungs-, Speicher- und Entfernungswege; Positions-Einstieg bleibt erhalten. |
| Responsive / vergrößerte Schrift | Ursprünglichen 768→795-Headerüberlauf korrigiert. Eigenständiger Test verdoppelt tatsächlich berechnete Schriftgrößen bei 320/768 px und prüft drei Listen in beiden Modi sowie Mehr. Lange Statuswörter/Buttons, Verlaufssteuerung und Datumslabels passen sich an. |

Der nicht remote verfügbare Docs-Commit `25ebb89` wurde nicht blind übernommen. Seine Erläuterungen zu #257-B/L07 wurden vom Nutzer inhaltlich bereitgestellt und gegen aktuelle Codepfade geprüft; kein Produktcode daraus übernommen.

## Diff-Bereinigung und erhaltene Nachweise

Alle 250 ursprünglichen Pfade wurden klassifiziert. `_cap.mjs` und genau 127 Dateien unter `artifacts/gates/` waren ausschließlich im PR hinzugefügte temporäre beziehungsweise generierte Dateien. Diese 128 Pfade werden aus dem Produktdiff entfernt. Keine vorhandene Main-Datei wird dadurch gelöscht.

Benötigte Nachweise bleiben unter diesem Dokumentationsverzeichnis erhalten: synthetische Vorher-/Nachher-Bilder, Capture-/Sweep-Skripte und Loader-Bewegungsbelege. Originale Fehler-/Prüflogs, Manifest und entfernte Blob-Identitäten wurden separat gesichert. Neue Gateausgaben werden als Actions-Artefakte aufbewahrt und nicht erneut eingecheckt. Die übrigen 122 ursprünglichen Pfade sind acht ausgelieferte UI-Dateien, zwei Browser-Testdateien und 112 Dokumentations-/Nachweispfade; zusätzliche Owner-Korrekturen und Tests werden im finalen Kandidatendiff gesondert ausgewiesen.

## Prüfstatus vor Kandidaten-CI

- Lokale Umgebung: Node 24.22.1, Playwright 1.64.1, WebKit 27.2; vorhandene private Hostbibliotheken. Keine CI-/TLS-/Fristlockerung.
- Syntax und 1150 Units: PASS, keine Fehler oder Skips (einschließlich additiver CI-Vertragstests).
- WebKit: Drei-Listen-Gesten, Loading/PWA, UI07 (66 Scans), Chart-Tooltip, ABCE, Readability, 200%-Schriftprüfung sowie zentraler Kurs-CSV-Weg PASS.
- WebKit: vollständige UI-Qualitätskette und integrierte Transferzustände mit ursprünglichen Wirtschafts-/Zustimmungs-/CAS-/Undo-Assertions PASS.
- Die drei neuen Browsergates sind zusätzlich in Chromium, Firefox/WebKit und beiden Produktionspfaden verpflichtend. Die bisherigen versiegelten Workflow-Hashes bleiben unverändert; negative Kontrollen prüfen Auslassen, Duplizieren und reduzierte Engines.
- Vollständige finale Kandidaten-CI, Main und neue Produktionsabnahme: noch ausstehend. Lokale WebKit-Ergebnisse sind keine Chromium-/Firefox-/Liveabnahme.

Der historische 280-Scan-Sweep komprimiert Viewports. Er beweist keine echte 200%-Textskalierung und war durch die ursprünglichen CI-Überläufe widerlegt. Dafür gibt es jetzt den eigenständigen Schriftgrößentest; die alten Sweepdaten bleiben als historische Daten gekennzeichnet.

## Grenzen und weitere Pakete

Android-/iOS-Geräte, TalkBack und reale Bildschirmtastatur bleiben extern ungeprüft. Für VISUAL03/04/05/06/08, HERO-QUALITY03 und UI-TEXT03–10 sind Sichtung, vorhandene Regressionen und konkrete vorgenommene Deltas zu unterscheiden; kein pauschales Gesamt-DONE aus diesem UI-PR. UI-ALLOC01-Berechnung, BestGuess/Modellverlauf/Score/Projektionen, unklare Täglich/6×1-Wünsche und wirtschaftliche Löschberechtigungen werden nicht ausgeweitet. v5, Installation/Origin, Journal, Finanzberechnungen, Importparser, CAS und Backup/Restore bleiben erhalten.

## Erste Kandidaten-CI: tatsächlicher Touch-Befund

Kandidat `c1e72a8`, Lauf `41672608218`: Chromium scheiterte im echten CDP-Touchfall an „no details opened by the lifting finger“ (1 statt 0). Der Schutz darf nach dem Verwaltungs-Reflow nicht nur die vorherige Zeilen-ID betrachten: Der Abschluss derselben Geste kann ein anderes Detailziel treffen. Die Korrektur bindet den Abschluss zusätzlich an Pointer-ID/-Typ beziehungsweise die Release-Koordinaten; eine neue bewusste Pointeraktion ersetzt den Guard, Tastaturaktionen bleiben unabhängig. Ein zusätzlicher synthetischer Reflowfall und aufbewahrte echte Pointer-/Klick-/Bildbelege ergänzen die unveränderte strenge Chromium-Assertion. Keine laufende CI wird für diese lokale Korrektur abgebrochen oder ersetzt. Finale Abnahme bleibt offen.

Der zusätzliche WebKit-Cross2-Befund betraf die veraltete Assertion, die Auswahl müsse oberhalb des Zeileninhalts liegen (`browser-position-removal.mjs`). Sie wird durch strengere zielgerechte Geometrie ersetzt: exakt eine Checkbox im vorhandenen linken Symbol, innerhalb der Holding-Zeile, links vom Namen und mindestens44px. Keine wirtschaftliche Assertion des Entfernungsablaufs wird entfernt oder reduziert.
