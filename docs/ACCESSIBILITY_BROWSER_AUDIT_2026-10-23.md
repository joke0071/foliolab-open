# FolioLab Open – Browserkompatibilität und Accessibility-Audit

**Datum:** 23.10.2026 · **Ausgangsversion:** `6e2d7e5c` · **Branch:** `audit/2026-10-23-crossbrowser-accessibility`

## Prüfumfang

### Barrierefreiheit (WCAG 2.2 AA – automatisierte Teilprüfung)

- Prüfwerkzeug: axe-core 4.10.3 in Playwright/Chromium, Tag-Auswahl `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa`.
- Prüfansichten: Übersicht, Verlauf, Positionen, Buchungen, Mehr sowie Anbieter-Dialog.
- Fensterbreiten: 390 und 1440 px; zusammen **11 Scans**.
- Ursprüngliche Befunde: Regel `color-contrast` (serious) auf mehreren Seiten und in mehreren Hilfetexten, Links, Diagrammbeschriftungen und Navigationselementen.
- Korrekturen: gezielte Anpassung der bisher sehr blassen Textfarben auf kontrastreiches gedämpftes Grün, unverändertes Layout; danach war der automatische Audit bei Stand `63c2f66e` in allen 11 Ansichten **ohne Verletzung**.
- Zusätzliche Verbesserung: dunklere Tastatur-Fokusmarkierungen (alte globale Farbe `#a5cdb1` auf Weiß nur ungefähr 1,75:1, neue `#2d6946` ungefähr 6,5:1) und zunächst unsichtbarer, bei Fokus sichtbarer Link zum Hauptinhalt.
- Release-Gate: Ein automatischer Test versagt bei mindestens einer als `serious` oder `critical` eingestuften axe-Verletzung und prüft Tastaturzugriff auf den Skip-Link.

**Wichtig:** Null axe-Verletzungen bedeuten nicht vollständige WCAG-2.2-AA-Konformität. Insbesondere semantische Screenreader-Interaktionen, Textvergrößerung, reale Mobilgeräte, komplexe Formulare und sämtliche Dialogzustände benötigen zusätzlich manuelle Prüfungen.

### Firefox und WebKit

Ein neues Playwright-Gate führt auf **Firefox und WebKit** jeweils folgende End-to-End-Szenarien durch:

- Navigation und Layout auf 390 und 1440 px
- Anbieter und Konto anlegen
- Dialog öffnen und speichern
- ETF hinzufügen
- Persistenz nach Neuladen
- Lokalen JSON-Backup-Download auslösen
- Fortbestehenden Bestand und fehlerfreie Anwendungsausführung bestätigen

Die Cross-Engine-Jobs haben auf Stand `63c2f66e` beide erfolgreich abgeschlossen. Browseremulation ersetzt keinen physischen Android-/iOS-Gerätetest.

### CI und Deploy-Gates

- GitHub Actions installiert Browserwerkzeuge **nur für CI**; das Produkt erhält weder ein Framework noch neue Runtime-Abhängigkeiten.
- Der eigenständige Cross-Engine-Job wird zum verpflichtenden `deploy.needs`-Gate neben der bestehenden Suite.
- GitHub Pages veröffentlicht nur bei erfolgreich beendeten erforderlichen Jobs.
- Die vorhandene Kontrolle der Service-Worker-Cache-Version und der HTTP-Live-Verifikation bleibt aktiv.

## Verbleibende Prüfbereiche

1. Manuelle WCAG-Prüfung mit NVDA/VoiceOver/TalkBack einschließlich Fokusführung in sämtlichen Dialogen und tatsächlichem Zoom-/Reflow-Verhalten.
2. Vollständiger risikobasierter OWASP ASVS-/Client-Side-Sicherheitstest und externe Datenfluss-/CSP-Überprüfung.
3. Reproduzierbare Performance-Messungen mit großen Datensätzen auf echten Mobilgeräten.
4. Erweiterte Finanzreferenzfälle und mehrtab-sichere Speicherstrategie.

**Kein ISO- oder WCAG-Konformitätszertifikat:** Diese Notiz dokumentiert konkrete automatisierte Prüfung und Verbesserungen, nicht eine formale Zertifizierung.
