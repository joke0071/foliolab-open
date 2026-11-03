# UI-Paket #288 – Bericht (Draft-PR #289)

Nur synthetische Daten. Kein Merge, kein Deployment; Checkpoint und Roadmap unverändert. Issues bleiben offen, kein pauschales „Fixes“.

## Anforderung → Änderung → tatsächlicher Test

| Paket | Vorheriger Stand | Änderung | Test | Offene Grenze |
|---|---|---|---|---|
| A Long-Press + linke Auswahl (Positionen, Buchungen, Referenzwerte) | nicht vorhanden; Auswahl nur über „Verwalten“, sichtbares „Auswählen“ | `attachRowLongPress` (jetzt in `src/booking-history-ui.js`, damit kein neues Modul in `sw.js` nötig ist), verdrahtet am Anfang von `initEvents`; linkes Symbol = `label.selection-mark` mit Checkbox (44 px); sichtbares „Auswählen“ entfernt, aria-label bleibt; bestehende Auswahl-Engines wiederverwendet | `tests/browser-ui-alltag10.mjs` (Chromium+Firefox, plus echte CDP-Touch-Geste in Chromium): Tap, Move/Cancel, Pointercancel, Multi-Touch, Maus, Unterelemente, Ghost Click, genau 1 Auswahl, Tastatur, Fertig, Axe, unveränderte Daten. Bestehend: reference-management, position-removal, reference-removal PASS | Reale Touch-Hardware nicht geprüft |
| B Install-Symbol | große Karte `#pwaHelp` | Karte entfernt; Icon-Button (aria-label „FolioLab als App installieren“, 44 px) nur bei gehaltenem `beforeinstallprompt` und nicht Standalone; Prompt nur per Tap; appinstalled/Abbruch/Standalone behandelt | `tests/browser-loading-pwa.mjs` angepasst (Chromium+Firefox PASS) | Die manuelle Installationshilfe (Text der Karte) entfällt bewusst → Produktentscheidung für Hauptowner. iOS/Safari-Installationshinweis fehlt nun |
| C Loader | vorhandene Flask-Animation kaum sichtbar | Keyframes/Größe/Blasenfarbe in `styles.css`, `index.html`, `src/loading-ui.js`; keine Mindestladezeit; Reduced Motion statisch | `browser-loading-pwa` (Reload, langsames DB/Modul, Timeout→später Erfolg, Fehler, Storage, Reduced Motion) PASS; Belege `img/loader-before|after-strip.png`, `loader-*.webm` | Offline-Start nur über den bestehenden Test abgedeckt |
| D Toolbars | — | mobile (≤767 px) Abstände/Labels/44-px-Buttons in `styles.css`; #257-Volltext-Labels der Ansicht bewusst nicht gekürzt | Sweep 320/360/390/412/430/768/1024/1440 × 100 %/200 % Text × Chromium/Firefox × Normal/Verwalten: 0 Überläufe, 0 Ziele < 44 px (Wegwerfskript, nicht eingecheckt) | — |
| E Texte | „Erfasste Stichtage“ doppelt; veraltete FMP/Twelve-Hilfen | Verlauf-Quellzeile bei gewählter Basis „Stichtage“ kompakt („Quelle: gespeicherte Referenzwerte“), Übersicht „Datenbasis: Stichtage“; 3 Hilfen (index.html, position-detail-ui.js, app.js) auf Alpha Vantage/Marketstack/EODHD-Worker bzw. tatsächliche Suche (Referenzliste + Alpha Vantage); „Historische Daten werden geprüft“ kleiner/gedämpft; „Gebuchte Vorgänge“ an Geschwister-Summary angeglichen | history-followup, ui-small-rests, flh02-release PASS | — |

## Erweiterte Pakete (Stand dieser Lieferung)

| Paket | Status |
|---|---|
| UI-VISUAL09 / #226, UI-POS02 / BOOK03 / #257 (Toolbars, Verwalten/Fertig-Parität) | Neu korrigiert (Toolbar-Verdichtung) und geprüft; Auswahl-/Archivsemantik unverändert (bestehende Tests PASS) |
| UI-VISUAL03 (Positionsdetail Typografie) | Teilweise neu korrigiert (E); Rest nicht bearbeitet |
| UI-VISUAL02 Mehr, VISUAL04 Header/Nav, VISUAL05 Dialoge, VISUAL06 Onboarding, VISUAL08 Verlauf-Akkordeons, HERO-QUALITY03, UI-TEXT03–10 | **Nicht bearbeitet** in dieser Lieferung (nur Sichtung ohne Befund in Overflow-/Target-Sweep). Weder umgesetzt noch als erledigt zu werten |
| L07 Kurs-CSV unter „Mehr“ | Nicht umgesetzt; Quellentscheidung nicht eindeutig ableitbar |

## Testergebnisse

- `node --test tests/*.test.mjs worker/tests/*.test.mjs`: 1134 pass, 0 fail (enthält Service-Worker-Cache-Test; er bestätigt, dass kein neues JS-Modul ergänzt wurde).
- Browser Chromium (+Firefox wo `*_ENGINES` gesetzt): ui-alltag10, loading-pwa, reference-management, position-removal, reference-removal, history-followup, ui-small-rests, flh02-release PASS.
- **Korrektur früherer Angaben / Reproduktion gegen main 8d590d1 (Chromium, Playwright 1.64.1, lokaler Server):**
  - `browser-booking-management.mjs` (Assertion „protected booking card uses full mobile row width“, `browser-booking-ui.mjs:50`): auf main **PASS**; auf dem PR-Stand b59d4e8 FAIL durch **meine** Buchungszeilen-CSS (44-px-Spalte links). Regel entfernt, jetzt PASS. Die frühere Aussage „auch auf main fehlschlagend“ war falsch.
  - `cross-engine (1)` auf b59d4e8: `booking-transfer-browser-contract.mjs:10` „direct booking transfer action has a usable touch target“ – gleiche Ursache; `browser-transfer-states.mjs` lokal jetzt PASS (Chromium). CI-Bestätigung steht aus.
  - `browser-accessibility-audit.mjs`: auf main **FAIL** (`label-content-name-mismatch` an `.donut-inner`); nach Behebung zusätzlich `#openCSVImport` (sichtbar „CSV-Import“ vs. aria-label „CSV importieren“) bei 1440 px. Beides reine Accessible-Name-/DOM-Reihenfolge-Korrekturen (`src/allocation-ui.js`, `index.html`), Allokationsberechnung unverändert; Audit jetzt 0 Verstöße.
- `npm run check` PASS; `npm test` 1142 pass/0 fail. Weitere Browser-PASS (Chromium, Firefox wo unterstützt): loading-pwa, ui-alltag10, booking-management, accessibility-audit, ui-audit-controls, ui-small-rests, transfer-states (nur Chromium). Vollständige Release-Gates und WebKit: **nicht ausgeführt** (fehlende Bibliotheken). Keine Android-/TalkBack-Prüfung. Playwright lokal 1.64.1, CI 1.56.1.
- Reduced-Motion-Loader: durch Test geprüft; kein separater Bewegungsbeleg abgelegt.

## Dateien

`index.html`, `styles.css`, `src/app.js`, `src/booking-history-ui.js`, `src/loading-ui.js`, `src/position-detail-ui.js`, `tests/browser-ui-alltag10.mjs` (neu), `tests/browser-loading-pwa.mjs`, `artifacts/gates/ui-alltag10/long-press.json`, `docs/ui-copilot-2026-11-03/*` (Bericht, `capture.mjs`, `loader-evidence.mjs`, `img/` Vorher/Nachher 320/390/1440 Chromium, Loader-Streifen/Videos).
Unberührt: `sw.js`, Manifest, Versionen, Workflows, Finanz-/Import-/Speicherlogik. Kollision mit PR #287 (Kraken): keine gemeinsamen Dateien.

## Hinweise für den Hauptowner

- Falls das Release-Gate eine SW-Revision (`sw.js`) verlangt, ist das offen; nicht angefasst, Gate nicht abgeschwächt.
- Installationshilfe: Ohne `beforeinstallprompt` öffnet das Symbol (nicht Standalone, nicht nach `appinstalled`) einen kompakten Hilfedialog (iOS/Safari: Teilen → Zum Home-Bildschirm; sonst Browsermenü); Prompt weiterhin nur per Tap. Auf Mobil nur ein Symbol (Header), auf Desktop nur das Seitenkopf-Symbol.
- Mehr (VISUAL02): einheitliche Aktionsanordnung ≤720 px (Einzelaktionen volle Breite, Paare geteilt, 44 px). Übrige Mehr-Bereiche gesichtet; kein weiterer konkreter Defekt belegt.
- **Nicht bearbeitet / offen:** VISUAL03/04/05/06/08, #257-Parität, HERO-QUALITY03, UI-TEXT03–10 nur gesichtet (Screenshots `img/*-s-*.png`, `capture-states.mjs`), keine weiteren Änderungen; L07 Kurs-CSV: Quellkontext nicht eindeutig → Produktentscheidung nötig (nichts implementiert); 8-Breiten-×-200%-Sweep und Firefox-Vorher/Nachher nicht vollständig durchgeführt.
- **CI-Integrationsschritt:** Job `test` scheitert am Gate „Require a service-worker cache revision“ (sw.js-Bump); vom Hauptowner bei Integration zu erledigen, nicht von mir verändert.
- Vorher-/Nachher nur Chromium; Firefox-Bilder nicht erzeugt.
