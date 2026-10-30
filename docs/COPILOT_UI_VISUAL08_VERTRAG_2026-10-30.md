## UI-VISUAL08 geliefert: Draft225 · 30.10.2026

**COPILOT_DELIVERED / WORK_INTEGRATION_PENDING.** HEAD `3415af87280b3f7e27a9c9c488cc3f4b40f33d1a`, Basis mainaf834705. Draft offen und ungemergt; tatsächliche Änderung ausschließlich styles.css plus30 Bilder. Kein JS/HTML/Test/SW geändert.

Copilots erfolgreiche Einzeltests sind keine vollständige Integrationsabnahme. Offen bleiben vollständige CI, Firefox/WebKit,200% Schrift, Fehlerzustände, Hardware und Screenreader. Pflicht41036969216 läuft zum Sicherungszeitpunkt mit rotem SW-Revisionsgate und erfolgreichem Cross1; Cross2 läuft. Wallet41036969100 erfolgreich. Kaskade und Funktion nach späterer Einzelintegration vollständig prüfen; passende SW-Version und eigene konkrete Releasefreigabe bleiben erforderlich.

PR220 behält unverändert Releasevorrang und wartet auf separate Mergefreigabe. Keine parallele visuelle Neuentwicklung; UI-VISUAL06 und alle anderen nicht delegierten Aufgaben bleiben bei Work. Nur FLH05/FLH-PROJ01 bewusst PARKED.

### Vollständiger gesicherter Lieferbericht

Closes #224. **Draft – kein Merge, kein Deployment, kein SW-Bump** (Gate „Require a service-worker cache revision“ bleibt unverändert und schlägt für diesen CSS-PR erwartungsgemäß an; Releasebehandlung bei Work).

## Änderung
Nur `styles.css` (angehängter Block, alle Selektoren auf `#historyPage` bzw. `#historyCoverage`, `#performanceDetails`, `#snapshotManager`, `.history-capital-comparison`, `#snapshotList`, `#referenceSelection*`) plus Screenshots in `docs/ui-visual08/`. Kein JS/HTML/Test geändert. Nicht angefasst: Diagramm, `.chart-period`, `.history-controls`, Kalender, `dashboard-ui.js`, Mehr-Reiter (#213), globale `.btn`/`.field`/`.performance-details`.

- Drei Akkordeons als zusammengehörige Gruppe: gleiche Zeilenhöhe (≥48 px), ein Chevron je Titel, gleiche Einrückung/Trennlinien, Fokusring 3 px.
- Vergleichs-Checkbox: Label-Zeile ≥44 px, Checkbox 20 px (vorher 13 px / 18–36 px Label); „Renditeerfassung beginnen“ ≥44 px.
- Referenz-Toolbar: mobil Filter volle Breite, „Stichtag hinzufügen“/„Verwalten“ 2-spaltig ≥44 px; Desktop eine Zeile.
- Referenzliste: kompaktere Zeilen, Umbruch langer Notizen/Dateinamen, tabellarische Beträge rechts, größere Auswahl-Checkbox.
- Warn-/Qualitätstexte unverändert (keine Farb-/Textänderung).

## Tests (lokal, Chromium = System-Chrome)
- `npm test` 962/962.
- Chromium: browser-reference-management, browser-reference-removal (inkl. Mehrfachauswahl, Archiv, Undo, Restore, 5 Breiten, Axe), browser-history-followup, browser-history-ui, browser-ui-quality (inkl. 150 % Text), browser-dashboard-polish, browser-chart-period-consistency, browser-accessibility-audit (0 Verstöße) – alle PASS. Diese Tests decken Vergleichscheckbox, Filter, Verwalten, Auswahl, Stichtag hinzufügen und Beschriftungen funktionsgleich ab.
- Eigene Messung (synthetische Daten, gefüllt/leer, offen/geschlossen) bei 320/360/390/412/430/768/1024/1440 px: kein horizontaler Überlauf, keine abgeschnittenen Container, keine interaktiven Ziele <44 px, Verwalten-Modus 320/390/1440 ohne Überlauf.
- Erster Entwurf mit gestapelten Beträgen bei ≤400 px verletzte die vorhandene Assertion „values stay right aligned beside the description“; Regel entfernt, Test unverändert.

## Screenshots
`docs/ui-visual08/before-*` / `after-*`: gefüllt und leer × alle drei Bereiche geschlossen/geöffnet × 320/390/1440, plus Verwalten-Modus (320/390/1440).

## Kollisionen
Basis: main af83470. #220 berührt nur Tests/Workflow; #208/#219/#223 mergen konfliktfrei. #209/#213/#214/#218/#222 melden nur den üblichen Append-am-Dateiende-Konflikt in `styles.css` (beide Blöcke behalten); keine Selektorüberschneidung. Erwartung: nach SW-Bump keine weiteren Gate-Probleme.

## Nicht geprüft
Firefox/WebKit (lokal nicht verfügbar), echte Touch-Hardware/Screenreader, 200 %-Text nur über browser-ui-quality (150 %), keine Fehlerzustände (Quota/Ladefehler) per Screenshot, CI-Lauf dieses PR (Gate-Abbruch erwartet).

---

# UI-VISUAL08 – gesicherter Copilot-Vertrag · 30.10.2026

Quelle: [Issue224](https://github.com/joke0071/foliolab-open/issues/224). Status bei Übernahme: offen, ausdrückliche Delegation; separater Draft noch nicht vorhanden. Kein Merge/Deployment. Bestehender Master und PR220 bleiben vorrangig; UI-VISUAL06 und übrige nicht ausdrücklich delegierte Aufgaben bei Work. Nur FLH05/FLH-PROJ01 bewusst PARKED.

Der folgende vollständige Issue-Inhalt ist die gesicherte Anforderung, keine neue Roadmap:

---

# Verbindliche Copilot-Delegation · 30.10.2026

**Ziel:** Den Reiter **„Verlauf“ unterhalb des vorhandenen Diagramms** zu einem konsistenten, ruhigen, gut lesbaren und mobilen Bedienbereich gestalten. **Größeres, aber fachlich eng isoliertes UI-/UX-Paket**. Separater Draft-PR, **kein Merge, kein Deployment**. Bestehender Master bleibt bei ChatGPT Work.

## 1. Exakter visueller Umfang

Alle drei bestehenden, eigenständigen Bereiche im `#historyPage` **einschließlich geöffnetem Zustand**:
1. `#historyCoverage` / `#historyCoverageBody` – „Datenabdeckung & Abgleich“: nachvollziehbare visuelle Hierarchie, kompakte Detailblöcke, klare Qualitäts-/Lückenhinweise, lange Quellen-/Datumsstrings umbrechen statt abschneiden.
2. `#performanceDetails`, `#performanceSummary`, `#performanceInfo`, `.history-capital-comparison` – „Rendite & Geldflüsse“: einheitliche Akkordeonzeile, Nebeninformationen und Checkbox, lesbare Statuserklärungen, vorhandene Aktionsschaltfläche korrekt erreichbar; keinerlei Änderung an Rendite-/Vergleichsberechnung oder Datenauswahl.
3. `#snapshotManager`, `.reference-toolbar`, `#referenceArchiveFilter`, `#addSnapshot`, `#manageReferences`, `#referenceSelectionTools`, `#referenceSelectionStatus`, `#snapshotList` – „Historische Referenzwerte“: mobile Filter-/Aktionstoolbar, kompakte Referenzlisten, Zeilenumbruch für lange Werte, klare Selektion/Archivdarstellung, Mehrfachauswahl und Zustände **nur optisch**; existierende Funktion und Fachlogik unverändert.

### Einheitliche visuelle Regeln
- Die drei Akkordeons wirken wie eine zusammengehörige Gruppe: ein Chevron pro Titel, klare optische Hierarchie, ruhige Abstände/Trennlinien, nicht mehrfach verschachtelte Rahmen. Analog zu bestehendem Designsystem, aber **nicht** die „Mehr“-Komponenten aus PR #213 doppelt ändern.
- Geöffnet/geschlossen, active/focus/disabled/empty/error/loading, lange Zahlen und große Schrift berücksichtigen. Kritische Datenqualitäts-/Warnhinweise dürfen weder verschwinden noch farblich bagatellisiert werden.
- Vorhandene Steuerungen und Referenzdaten vollständig sichtbar und bedienbar; 44×44 CSS-px Touchziele für interaktive Elemente, inklusive Checkbox-Label/Filter/Selektionsaktionen.
- 320/360/390/412/430/768/1024/1440 px, bis200% Text, keine horizontalen Überläufe oder abgeschnittenen Beträge, Charts/Bottom-Navigation nicht überdecken. Desktop kompakt, Mobile ein- oder zweispaltig entsprechend verfügbarer Breite.
- Vorhandenes Markup und CSS möglichst wiederverwenden; Änderungen bevorzugt **CSS-only in selektorspezifischen History-Blöcken**. Falls DOM-Anpassung unvermeidbar: minimal, begründet und separat auflisten. Finanz-/Referenzmanagement-JS darf nicht verändert werden.

## 2. Streng ausgeschlossen
- **Diagramm selbst, Chart-Perioden, X-Achse, Tooltip, Kalender, Stichtagsberechnung, Kursquellen, Datensemantik** und `src/dashboard-ui.js` / Zeitraumwahl (#208/#209) – keine parallele Arbeit.
- Änderungen an historischem Referenzwert-Lebenszyklus, Lösch-/Archivierungs-/Undo-/Auswahllogik, IDB/CAS, Speicherung, Qualitätswarnungen, Belegen, Rendite-/Geldfluss-/Währungs-/Finanzberechnungen.
- Backup/Restore, OAuth, Drive, CSV, Wallet, PWA, Service Worker, Routing, Positions-/Buchungslisten, „Mehr“-Reiter, Dashboard-Statistik. **Kein SW-Bump in diesem Draft.**
- Keine fachliche Umformulierung/Verkürzung von Hilfetexten, Fehlern oder Labels, keine neuen Zustände/Funktionen, keine Bibliotheken, keine Testabschaltungen.
- UI-VISUAL06/#217 (Onboarding) und alle anderen Rest-UI-Arbeiten bleiben bei **ChatGPT Work**. FLH05/FLH-PROJ01 bleiben PARKED.

## 3. Pflicht-Kollisionsschutz
Vor jedem Write GitHub `main`, aktuellen Work-PR #220, alle Drafts #208/#209/#213/#214/#218/#219/#222/#223, aktuellen Checkpoint `docs/WORK_RESTPAKETE_CHECKPOINT.md` auf Dokumentationsbranch und relevante `styles.css`-Blöcke prüfen. **Keinen laufenden Work-Prozess unterbrechen.**

Der historische Branch `feature/flh05-import-foundation` dient nur der Dokumentation; niemals alten Appcode übernehmen.

- Gemeinsame Datei `styles.css` ist wahrscheinlich. CSS-Selektoren **eng auf #historyPage und die drei benannten Akkordeons** begrenzen; keine globalen `.performance-details`-/`.btn`-/`.field`-Änderungen und keine Änderungen an `.chart-period` oder `.history-controls`.
- PR #209/208 betreffen Zeitraumwahl: **diese Selektoren nicht verändern**.
- Die vorliegenden Work-Pläne können die Fachlogik der Referenzverwaltung ändern. Falls neuere offene PRs denselben DOM-Bereich bearbeiten: **nicht überschreiben**, sondern konkrete Konflikte dokumentieren und betroffenen Teil auslassen. Keine parallele Fachimplementierung.
- Auf aktuellen main basieren; keine vorzeitigen Merges/Rebases fremder PRs, keine kosmetischen Massenrefactorings oder globalen CSS-Kaskadenänderungen.

## 4. Nachweise und Lieferung
1. Vorher-/Nachher-Screenshots **aller drei Sektionen offen und geschlossen** bei mindestens320/390/1440 px; **bei gefüllter Referenzliste und leeren/Fehlerzuständen**, sofern reproduzierbar mit rein synthetischen Daten; Screenshots unter `docs/ui-visual08/`.
2. Tests `npm test`, vorhandene relevante browser-Tests (History/Reference/Performance/A11y), Chromium/Firefox/WebKit soweit tatsächlich verfügbar, Touchmaße, Axe, Tastatur/Fokus. Nicht verfügbare Engine/Hardware ausdrücklich als ungeprüft kennzeichnen, keine Pass-Behauptungen.
3. Belegen, dass Vergleichscheckbox, Filter, Verwalten, Auswahl, Stichtag hinzufügen, alle Beschriftungen und Datenwerte vorhanden und in den bisherigen Szenarien funktionsgleich geblieben sind.
4. Separater **Draft-PR** inklusive präziser Dateiliste, Vorher-/Nachher, Testergebnisse, offener Prüfungen und Konflikte. **Kein Merge, kein Deployment.** Pflichtgate „Require a service-worker cache revision“ nicht abschwächen; dessen spätere Releasebehandlung bleibt Work.
5. **Nach Lieferung stoppen** und PR-Link ausgeben. ChatGPT Work verantwortet Review, Integrationsreihenfolge, Releasefreigabe, Tests und Liveabnahme.
