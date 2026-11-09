# UI-R2 – begrenzte Taskkarte · Owner 39ca9a8217a6

Ziel: vorhandene Auswahlsteuerungen eindeutig und konsistent darstellen. Grundlage: kanonische UI-R2-Zeile in [Roadmap](KONSOLIDIERTE_ROADMAP.md), #300/#257/#149/#226 und private v300-Main-Vorbefunde. Keine zweite Roadmap.

Vor Patch Pointer-/Tastaturfokus gezielt reproduzieren. Geplante eng verwandte Deltas: sichtbarer unchecked-Auswahlhinweis am vorhandenen Positionsicon, konsistente native Checkbox-Akzentfarbe für Buchungen/Referenzen/Master, genau ein zugänglicher Master-Tastaturfokus. Globale normale .btn.outline-Kontur bleibt ohne belegte Doppelkontur unverändert. Eine semantische Checkbox behalten, keine neue Auswahlengine.

Betroffene Grenzen: vorhandenes styles.css, nur falls notwendig enges Auswahlmarkup in src/app.js; bestehende ui-alltag10-/management-parity-/selection-Browsergegenproben gezielt ergänzen; sw.js erst am vollständigen Kandidaten. Keine Finanz-/Speicher-/Manifest-/Workflowänderung. Risiko: begrenzte gemeinsame UI-Fläche; volle vorgeschriebene Integrations-/Main-/Livegates bleiben bindend.

Abnahme:
1. Unchecked/checked/disabled/indeterminate sowie Pointer/Tastatur klar;44px und320–1440px/200%-Text erhalten.
2. Eine native semantische Auswahl; sichtbarer Tastaturfokus ohne zusätzlichen Pointer-Ring; Forced Colors/Reduced Motion beachten.
3. Long-Press/Sofortauswahl/Scroll-Cancel/Ghost-Click/Filter/Pagination/Verwalten unverändert.
4. Löschschutz und kanonische IDB-Bytes/Revision bei reiner Auswahl exakt erhalten; vorhandene Finanz-/Storagegates unverändert.
5. Gezielte lokale Repros und drei Browser vor Freeze; Units/Syntax, exakter Kandidat, dann reguläre CI. Kein v300-Neulauf.

Nächster sicherer Releasepunkt: vollständig qualifizierter eigener UI-R2-Kandidat. Danach UI-R3 seriell. Geräteabnahmen bleiben externe Grenzen.
