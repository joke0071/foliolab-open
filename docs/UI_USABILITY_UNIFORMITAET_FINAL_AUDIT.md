# UI07 – Abschließender Usability- und Uniformitätsaudit

Basis: main `8348a42c9d3bbd147a255b4730d7fe28e02fb476`, PWA v168. FLH01/IndexedDB B/AT03-B/AT05-A/AT01 (#137–141) integriert. AT04 als nachgewiesener No-Code-Abschluss: [Matrix und Tests](https://github.com/joke0071/foliolab-open/issues/128#issuecomment-6398005023). Keine Parallelfeatures oder Designneugestaltung.

## Tatsächlicher Erstbefund

Kombiniertes ausschließlich synthetisches Portfolio: 245 Käufe + vier Journalabgleiche, separate Trade-/Ertrags-/Gebührenkonten, Transfer-Ausgang mit zwei Teil-Eingängen und acht ausdrücklich bestätigte Stichtage. Tatsächliche Chromium-Ansichten bei 320/390/430/768/1024/1440px; 61 Axe-Prüfungen einschließlich geöffneter Positions-/Buchungs-/Historienbelege, Transferdialog und Anbieterformular. Tab/Escape/Fokusrückgabe, reduzierter Bewegungsmodus und tatsächliches 200%-CSS-Zoom-Rendering geprüft. Kein physischer Browserzoom oder echter Nutzertest behauptet.

36 wiederholte Kontrastbefunde über die sechs Breiten, keine Seitenüberläufe oder Dialogfokusfehler. Die Matrix fasst wiederholte Instanzen derselben Ursache zusammen. Erstlauf `UI07_PROBE=1` sammelt die Befunde, ist ausdrücklich KEIN bestandenes Quality-Gate; finale CI läuft ohne Probe-Modus mit unveränderter Nullbefund-Assertion.

| ID | Ansicht / Schritt | Ist / Auswirkung | Soll / Maßnahme | Priorität |
| --- | --- | --- | --- | --- |
| UI07-01 | Übersicht/Verlauf mit befüllten Diagrammen | Achsenbeschriftungen 3,13–3,29:1, kleine Schrift schlecht lesbar | Vorhandene dunklere Diagramm-Textfarbe verwenden, Zahlen/Zeiträume unverändert | P1 |
| UI07-02 | Übersicht, Allokationslegende | Sekundärwerte 3,07:1 | Bestehende dunkle Hilfstextfarbe, keine Geometrieänderung | P1 |
| UI07-03 | Positionen, inaktive Filter | Filtertext 3,41:1 | Nur Textfarbe korrigieren, aktiver Zustand unverändert | P1 |
| UI07-04 | Positionen, neutrale/Warn-Tags | Kleine Statuslabels unterschreiten 4,5:1 | Gleiche Grün-/Braunpalette dunkler, Semantik unverändert | P1 |
| UI07-05 | Geöffnete Positions-, Buchungs- und Historienbelege | Detailbezeichnungen 3,15:1 | Gemeinsame Detailtextfarbe korrigieren, keine versteckten Inhalte/abgeschwächten Scans | P1 |
| UI07-06 | Mehrere betroffene Positionen, Folgeaktionen | Gleiche Buttonnamen ohne Objekt im zugänglichen Namen | Positionsname in ARIA-Namen; sichtbare kurze Labels erhalten | P2 |
| UI07-07 | Gemeinsame Prüfsicht, kombinierter Filter ohne Treffer | Leertext wirkt allgemein statt filterbezogen | „Keine Positionen zu diesem Prüffilter“; Reset bleibt erreichbar | P2 |

## Abnahmeplan / Grenzen

Nur diese konkreten kleinen Korrekturen, Stil und existierende Komponenten erhalten. Danach exakt dieselben 61 Prüfungen auf dem korrigierten Stand wiederholen, zusätzliche Browser-/Visual-/Finanz-/Storage-/Backup-/PWA-/Offline-Gates auf kombiniertem Stand. Chromium, Firefox und WebKit tatsächlich ausführen. Bestehende Pixelreferenzen/Schutzassertions nicht zur Grünfärbung ändern.

E2E-Nachweise verbinden die neue breite UI07-Suite mit den bereits vorhandenen echten Anlegen/Bearbeiten-/Flatex-CSV-/Konflikt-/Wallet-History-/Kontostands-/Transfer-/Jahres-/Qualitäts-/Backup-/Mehrtab-/Offline-Suites. Deren finales Ergebnis wird nach vollständiger CI eingetragen. Reale Android/TalkBack/Safari-Hardware, Drive-Neugerät, OS-Crash/Eviction/physische Altversion bleiben separat #44, keine Ersatzbehauptung durch Simulation.

## Lokale Abnahme nach Korrektur
Alle sieben Ursachen gezielt behoben: nur vorhandene Palette dunkler; objektbezogene zugängliche Namen für Qualitätsaktionen und Buchungsdetails; filterbezogener Leertext. PWA v169. Finale Suite erweitert um fünf echte Leerzustände: **66 tatsächliche Chromium-Scans, null Befunde** über sechs Breiten einschließlich Dialoge, Tastatur/Fokusrückgabe, reduziertem Bewegungsmodus und 200%-CSS-Zoom. Read-only-Audit verändert weder Finanzdaten noch IndexedDB-Revision.

`npm test`: 633/633, kein Fail/Skip; `npm run check` bestanden. Tatsächlich zusätzlich lokal bestanden: Dialogkonsistenz, finanzielle Dialogauswahl (acht Breiten), Flatex-Import/Backfill, Jahresübersicht, Transfermatching, Qualitätsprüfung, Accessibility-Audit (elf Scans ohne Befund), Offline-Mobile (4x CPU, 240 Positionen/730 Stichtage), PWA-Updates. Visuelle Dialogsuite samt Vergleich: **20 freigegebene Referenzen, 256 räumliche RGB-Stichproben und exakte Abmessungen unverändert bestanden**. Der Vergleich benötigt zuvor erzeugte Screenshots; der erste isolierte Aufruf ohne diese Eingabe war kein Abnahmeergebnis. Synthetische UI07-Screenshots/JSON unter `artifacts/gates/ui07/`, in CI als Gate-Artefakt gespeichert.

## Endabnahme und Releaseempfehlung
**ABGESCHLOSSEN.** [PR #142](https://github.com/joke0071/foliolab-open/pull/142), geprüfter HEAD `4a6ff276c7eb731d7d5e3c9cb2221281e66995ad`; Merge `839b51e37b234cc4a7fe202eeb68118a786e0b78`, PWA v169. [PR-CI40197890130](https://github.com/joke0071/foliolab-open/actions/runs/40197890130) und [vollständige main-CI/Deployment40198408959](https://github.com/joke0071/foliolab-open/actions/runs/40198408959) erfolgreich. 633/633, Syntax, komplette fail-fast Chromium-/Firefox-/WebKit-Gates; je Engine **66 tatsächliche UI07-Scans, null Befunde**. Sämtliche sieben Befunde behoben; keine offenen P0/P1 oder bekannten unerledigten P2/P3 aus diesem Audit. 20 bestehende visuelle Referenzen unverändert.

[Synthetische Chromium-Screenshots/JSON](https://github.com/joke0071/foliolab-open/actions/runs/40198408959/artifacts/12601120580), [Firefox-/WebKit-Screenshots/JSON](https://github.com/joke0071/foliolab-open/actions/runs/40198408959/artifacts/12601115197), [Dialogreferenznachweis](https://github.com/joke0071/foliolab-open/actions/runs/40198408959/artifacts/12601075579). Zusätzlich unabhängig auf öffentlicher Produktion: 18 Axe-Scans ohne Befund, 98 identische Dateihashes, tatsächliche UI-Downloads/Restore und Offline-Speichern bestanden. [Finaler Releasebericht](FINAL_RELEASE_AND_LIVE_ACCEPTANCE.md).

Releaseempfehlung für den geprüften sicheren Umfang: freigegeben und produktiv nachgewiesen. Physische Android-/Safari-/Drive-/OS-Gates bleiben ausdrücklich #44; keine Simulation als Hardwarebeweis ausgegeben.
