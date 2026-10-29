# UI-MASTER28: Mobile Zeitraumwahl und Diagrammdarstellung · 29.10.2026

Status: OPEN / zur bestehenden UI-Restarbeit hinzugefügt. Keine neue Roadmap und keine parallele Implementierung. Die laufende PWA-Korrektur PR202 und ihre Tests/Releasegrenzen bleiben unberührt.

## 1. Verbindliche Änderung der Zeitraumwahl

**Die bisherige verpflichtende mobile 4×2-Vorgabe ist durch ausdrückliche Nutzerentscheidung SUPERSEDED.** Dass das Raster technisch 4+4 erreicht, ist keine ausreichende visuelle Abnahme. Der Nutzer beanstandet Höhe, Rahmen und die fehlende gestalterische Integration.

Ziel ist bevorzugt eine einzige kompakte horizontale Zeile mit 7 T, 1 M, 3 M, 6 M und 1 J. Max bleibt schnell erreichbar; 3 J und 5 J werden in einer dezenten erweiterten Zeitraumwahl angeboten. Eine dort gewählte Option muss anschließend eindeutig als aktiv erkennbar sein. Der äußere Containerrahmen entfällt. Dezente Auswahlflächen und geringe Abstände verwenden; keine großen Lücken zwischen Reihen. Tatsächliche Touchziele von mindestens 44×44 CSS-Pixeln bleiben erhalten. Auf sehr schmalen Displays adaptiv verdichten, ohne horizontalen Seitenüberlauf. Desktop zeigt möglichst alle acht Zeiträume in einer Zeile.

Bestehende Zeitfilter, aktive Auswahl, Datenbasis-, Kalender- und Plusaktionen erhalten. Für native Positions-/Marktcharts gelten weiterhin ihre tatsächlich zulässigen und belegten Zeiträume; keine scheinbar verfügbare Historie anbieten.

## 2. Lesbare Diagrammachsen

Unnötig präzise kompakte Angaben wie „€196,883 Tsd.“ vermeiden. Bevorzugte Darstellung beispielsweise „201.000 €“, „197.000 €“, „193.000 €“; alternativ eine konsistente, sinnvoll gerundete Tausenderdarstellung. Keine gemischten Einheiten oder unnötigen Dezimalstellen. Achsenlabels müssen unterscheidbar bleiben. Ausschließlich die Anzeigeformatierung ändern: tatsächliche Finanzwerte, Diagrammskalierung, Bewertungslogik und gespeicherte Daten bleiben unverändert.

## 3. Kompakter Tooltip

Tooltip deutlich schmaler; Datum und exakten Betrag klar hervorheben. Die Erklärung „Erfasster Kontrollpunkt, keine interpolierte Tagesbewertung“ nicht bei jedem Antippen als breiten Textblock wiederholen. Die fachliche Erklärung an einer geeigneten vorhandenen Datenbasis-/Datenabdeckungsstelle nachvollziehbar erhalten. Echte relevante Datenqualitätswarnungen und exakte Werte dürfen nicht verloren gehen.

Tooltip innerhalb der Diagrammfläche halten und möglichst wenig Kurven-/Punktfläche verdecken. Touch, Maus, Tastatur und sichtbarer Fokus bleiben bedienbar. Linken und rechten Rand sowie lange notwendige Details prüfen. Die schon beauftragte allgemeine Tooltipbegrenzung wird hierdurch präzisiert, nicht doppelt implementiert.

## 4. Wenige historische Kontrollpunkte

Belegte Punkte korrekt zeigen und tatsächliche zeitliche Abstände berücksichtigen. Keine fiktiven Tageswerte, gespeicherten Zwischenwerte oder unbelegte finanzielle Interpolation erzeugen. Unnötig leere beziehungsweise optisch zerrissene Flächen gezielt reduzieren. Die gemeinsame Einstellung Automatisch/Linie/Punkte beachten, soweit bereits implementiert; eine noch offene Einstellung nicht als vorhanden behaupten. Die bestehende fachliche Unterscheidung zwischen belegten Beobachtungen und Rekonstruktion bleibt erhalten.

## 5. Integration, Tests und Absicherung

Dieser Nachtrag ersetzt nur die mobile 4×2-Pflicht und präzisiert die vorhandenen Diagrammaufträge. Alle sonstigen Masteranforderungen, Sicherheits- und Prioritätsverträge gelten weiter. Keine Unterbrechung laufender PRs/CI/Releases und kein erneuter Start bereits erledigter Arbeiten.

Bei sicherer Umsetzung 320/360/390/430/768/1440 CSS-Pixel prüfen. Android-Chrome-Nachweise anhand tatsächlicher Screenshots oder ausdrücklich gekennzeichneter Emulation; keine Hardwareabnahme erfinden. Bestehende Browser-, Accessibility-, Offline-, Finanz-, Import-, CAS-, Backup-/Restore- und Undo-Gates erhalten. Änderungen committen, über GitHub sichern, Remote-SHA prüfen und den zentralen Checkpoint separat aktualisieren.

Zuordnung: UI-MASTER28 / UX03 (neuer Sollzustand), UX04 (Tooltip), UI-A01 (Achsenformatierung präzisiert), bestehende Diagrammmodi und zeitlich korrekte X-Achse. Umsetzung noch OPEN. Die ältere 4×2-Baseline bleibt historische technische Gegenprobe und ist kein aktueller Gestaltungsauftrag.
