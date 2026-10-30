# UI-VISUAL09 – gesicherter Copilot-Vertrag · 30.10.2026

Quelle: [Issue226](https://github.com/joke0071/foliolab-open/issues/226). Status bei Übernahme: offen, ausdrücklich delegiert; separater Draft noch nicht vorhanden. PR220 und die Releasepriorität bleiben unverändert. Nur der benannte visuelle Teil ist delegiert; sämtliche Fachlogik und übrige Aufgaben bleiben bei Work. Nur FLH05/FLH-PROJ01 bewusst PARKED.

---

# UI-VISUAL09 – Such-, Filter-, Aktions- und Informationsoberflächen von Positionen und Buchungen

**Nutzerauftrag 30.10.2026.** Ein größeres, eigenständiges **rein visuelles/responsives/A11y-Paket** an GitHub Copilot, ohne Änderungen an fachlicher Funktionalität. Ein separater **Draft-PR**, **kein Merge, kein Deployment**. Work behält die vollständige Master-/Releaseverantwortung.

## Umfang – drei klar getrennte Teilbereiche

### A. Reiter „Positionen“: Kopfbereich, Filter, Suche und Kursinformationen
- `#positionsPage > .toolbar`, `#positionFilters`, `#positionsPage .toolbar-buttons.action-group` mit vorhandenen Aktionen Anlage/Aktualisieren/Wallet.
- `#positionsPage .position-search-tools` mit `#positionSearch`, `#positionSort`, sowie den existierenden Qualitäts-/Kontofiltern in `#qualityReviewTools` und ihrer Resetaktion.
- Bestehende, rein visuelle Status-/Informationsbereiche `#positionQuoteDetails`, `#listingReviewAction`, `#listingReviewPanel`, `#priceInfo` und `#refreshErrorDetails`. Darin niemals Warnungen, Details oder erforderliche Statusinformation unterdrücken; keine Texte umschreiben.
- Harmonisierte klare Hierarchie, kompakte responsive Anordnung von Filterchips, Suchfeld, Sortierung, Buttons, Status-/Kurs-Hinweisen. Mobil keine widersprüchlichen Icon-/Label-Zustände; vorhandene Aktionen weiter erreichbar.

### B. Reiter „Buchungen“: Aktions- und Filterkopf
- `#bookingsPage .panel-head-actions`, `#bookingsPage .panel-actions.action-group` mit CSV-Import und Buchung.
- `#bookingsPage .booking-filter-tools`, `#bookingSearch`, `#bookingFilterType`, `#bookingArchiveFilter`, `#bookingUndoActions`.
- 320–390px: ruhige, klare Anordnung, kein ungewollter Zeilenüberlauf und keine abgeschnittenen Aktionslabels; ≥44×44px Touchbereiche.
- **Keine Änderung der bestehenden CSV-Import-Button-Namen/Attribute in index.html**: der bekannte WCAG-2.5.3-Label-Nachtrag wird von Work ausdrücklich erst nach Copilot-PR #213 übernommen.

### C. Reiter „Buchungen“: ergänzende Auswertungsakkordeons
- Ausschließlich **Darstellung** der bereits vorhandenen `#bookingTransferDetails` („Interne Transfers“) und `#bookingIncomeDetails` („Erträge und Abzüge“) einschließlich ihrer geöffneten Inhalte: Zeilenabstände, visuelle Gewichtung, Tastaturfokus, lange Labels/Werte, mobile Darstellung, konsistente Trennlinien/Indikatoren und ruhige Leerzustände.
- Sämtliche Transferprüfungs-, Abgleich-, Rendite-, Ertrags-/Abzugs-/Konto-/Jahres-/Wertberechnungs- und Lade-/Fehlersemantik ist **strictly Work-owned**. Vorhandene Aktionen und Statusanzeigen bleiben vollständig erhalten.
- Falls diese DOM-Bereiche von Work zeitgleich fachlich umgebaut werden, **diesen Teil weglassen und als Work-Integrationsempfehlung dokumentieren**, keine parallelen Änderungen.

## Verbindliche fachliche Grenzen

- Möglichst **CSS-only**, präzise auf `#positionsPage` oder `#bookingsPage` gescopt; kein globales `.btn`, `.field`, `.toolbar` etc. Styling und kein Massenrefactoring. Wenn JS/HTML zwingend: STOP und begründeten minimalen Vorschlag statt eigenständiger Fachänderung.
- **Nicht anfassen:** Positionen-/Buchungskarten und Details aus UI-VISUAL03/#214, Mehrfachauswahl-/Aktions- und Lösch-/Undo-/Archivierungs-Logik, Historie/Verlauf UI-VISUAL08/#225, Mobile-Navigation UI-VISUAL04/#218, „Mehr“ UI-VISUAL02/#213, Dashboard UI-VISUAL07/#222, Dialoge UI-VISUAL05/#219, Chart-Zeiträume #208/#209, Donut #223, Onboarding UI-VISUAL06/#217 (Work).
- Keine Änderung an Finanz-/Qualitäts-/Daten-/IndexDB-/CAS-/PWA-/SW-/Backup-/Wallet-/CSV-/API-/Kurslogik, Textvertragssemantik, Quellen, Preisen oder Tests.
- Vor ersten Writes **frischen main**, offene PRs (insb. Work #220 und Copilot #208/#209/#213/#214/#218/#219/#222/#223/#225) und aktuellen Master-Checkpoint lesen; historischen `feature/flh05-import-foundation` nur als Dokumentationsquelle betrachten. **Bei echten Selektor-/DOM-Kollisionen mit laufendem Work: betroffenen Abschnitt nicht implementieren** und Konflikt melden. Nicht parallel am selben fachlichen UI-Bereich arbeiten.
- CSS-Append-Konflikte am Dateiende konkret dokumentieren, keine fremden PRs mergen/rebasen, keine SW-Versionsänderung oder Gate-Abschwächung.

## Nachweise und Abnahme

1. Vorher-/Nachher-Bilder für alle drei Teilbereiche bei **320/390/1440** in `docs/ui-visual09/`, zusätzlich Zustand mit aktiven Filtern, langen Suchbegriffen/Labels, ausgeklappten Info-/Transfer-/Ertragsbereichen und Fehler-/Leerzuständen soweit mit synthetischen Fixtures möglich.
2. Responsive 320/360/390/412/430/768/1024/1440px; 150–200% Text, lange Namen/Zahlen/Fehler, kein Horizontal-Overflow, keine verdeckten Aktionen, Labels/Auswahl erreichbar.
3. ≥44×44 CSS-Pixel für alle bedienbaren Ziele (bei Checkboxen Label-Ziel messen), Fokus sichtbar, Tastatur/Tab/Enter/Escape wo bisher vorgesehen, Axe.
4. `npm test`, relevante echte `tests/browser-*booking*`, `*position*`, `*filter*`, `*quality*`, `*accessibility*` in Chromium/Firefox/WebKit soweit verfügbar; Unterschiede zur aktuellen `main`-Baseline belegen. Keine falschen Hardware-/Engine-Behauptungen, keine Assertions/Timeouts ändern.
5. Ein **separater Draft-PR** mit Dateien, Screenshots, echten Testresultaten und fehlenden Prüfungen; **kein Merge/Deployment**. Nach Lieferung stoppen. Work prüft fachlich, integriert einzeln und führt vollständige Pflicht- und Releasegates mit eigener konkreter Freigabe aus.

**Nicht delegiert:** sämtliche übrigen UI-/MASTER28-Arbeiten einschließlich UI-VISUAL06/#217 bleiben bei Work. **Nur FLH05 und FLH-PROJ01 bewusst PARKED.** PR #220 / v220-Releasepriorität bleibt unangetastet.
