# UI-Paket #288 – Bericht (Draft-PR #289)

Nur synthetische Daten. Kein Merge, kein Deployment; Checkpoint und Roadmap unverändert. Issues bleiben offen, kein pauschales „Fixes“.

## Anforderung → Änderung → tatsächlicher Test

| Paket | Vorheriger Stand | Änderung | Test | Offene Grenze |
|---|---|---|---|---|
| A Long-Press + linke Auswahl (Positionen, Buchungen, Referenzwerte) | nicht vorhanden; Auswahl nur über „Verwalten“, sichtbares „Auswählen“ | `attachRowLongPress` (jetzt in `src/booking-history-ui.js`, damit kein neues Modul in `sw.js` nötig ist), verdrahtet am Anfang von `initEvents`; linkes Symbol = `label.selection-mark` mit Checkbox (44 px); sichtbares „Auswählen“ entfernt, aria-label bleibt; bestehende Auswahl-Engines wiederverwendet | `tests/browser-ui-alltag10.mjs` (Chromium+Firefox, plus echte CDP-Touch-Geste in Chromium): Tap, Move/Cancel, Pointercancel, Multi-Touch, Maus, Unterelemente, Ghost Click, genau 1 Auswahl, Tastatur, Fertig, Axe, unveränderte Daten. Bestehend: reference-management, position-removal, reference-removal PASS | Reale Touch-Hardware nicht geprüft |
| B Install-Symbol | große Karte `#pwaHelp` | Karte entfernt; Icon-Button (aria-label „FolioLab als App installieren“, 44 px) nur bei gehaltenem `beforeinstallprompt` und nicht Standalone; Prompt nur per Tap; appinstalled/Abbruch/Standalone behandelt | `tests/browser-loading-pwa.mjs` angepasst (Chromium+Firefox PASS) | Die manuelle Installationshilfe (Text der Karte) entfällt bewusst → Produktentscheidung für Hauptowner. iOS/Safari-Installationshinweis fehlt nun |
| C Loader | vorhandene Flask-Animation kaum sichtbar | Keyframes/Größe/Blasenfarbe in `styles.css`, `index.html`, `src/loading-ui.js`; keine Mindestladezeit; Reduced Motion statisch | `browser-loading-pwa` (Reload, langsames DB/Modul, Timeout→später Erfolg, Fehler, Storage, Reduced Motion) PASS; Belege `img/loader-before|after-strip.png`, `loader-*.webm` | Offline-Start nur über den bestehenden Test abgedeckt |
| D Toolbars | — | mobile (≤767 px) Abstände/Labels/44-px-Buttons in `styles.css`; #257-Volltext-Labels der Ansicht bewusst nicht gekürzt | Sweep 320/360/390/412/430/768/1024/1440 × 100 %/200 % Text × Chromium/Firefox × Normal/Verwalten: 0 Überläufe, 0 Ziele < 44 px (jetzt eingecheckt: `sweep.mjs`) | — |
| E Texte | „Erfasste Stichtage“ doppelt; veraltete FMP/Twelve-Hilfen | Verlauf-Quellzeile bei gewählter Basis „Stichtage“ kompakt („Quelle: gespeicherte Referenzwerte“), Übersicht „Datenbasis: Stichtage“; 3 Hilfen (index.html, position-detail-ui.js, app.js) auf Alpha Vantage/Marketstack/EODHD-Worker bzw. tatsächliche Suche (Referenzliste + Alpha Vantage); „Historische Daten werden geprüft“ kleiner/gedämpft; „Gebuchte Vorgänge“ an Geschwister-Summary angeglichen | history-followup, ui-small-rests, flh02-release PASS | — |

## Erweiterte Pakete – Befund, Änderung, Test, Grenze (Stand dieser Lieferung)

Methode: Sichtung der Zustände (`capture-states.mjs`, `img/*-s-*.png`), reproduzierbarer Sweep (`sweep.mjs`, Ergebnis `sweep-result.json`: 8 Breiten × Browserzoom 100/150/200 % mit Viewport = Breite/Zoom ≥ 320 CSS-px × Normal/Verwalten × Dialoge, Chromium+Firefox, 280 Scans) und bestehende Vertragstests.

| Paket | Tatsächlicher Befund | Änderung | Test | Offene Grenze |
|---|---|---|---|---|
| VISUAL02 / #210 Mehr + #257-A Symbole | Aktionen uneinheitlich (Einzelbuttons teils schmal/links); Kopfsymbole für „Anbieter und Konten“ und „Deine Daten“ fehlten (nur `#settingsGear`) | ≤720 px einheitliche Aktionsanordnung (Einzel voll breit, Paare geteilt, 44 px); dekorative Symbole `bank`/`shield` (`aria-hidden`, gleiche Größe/Farbe/x-Position wie Gear: 19 px, 341/390 px) | Sweep 0 Überläufe; accessibility-audit 0 Verstöße; ui-small-rests PASS | Kontextmenü-/Kontenzeilen-Kompaktierung nicht geändert (kein belegter Defekt) |
| VISUAL03 / #211 Buchungen, Positionsdetail | Sweep: Suchfeld Positionen 42 px, Anbieter-Zeile 43 px, Wizard-Button 40 px | `min-height:44px` (selektorspezifisch) | Sweep: nur noch Inline-Textlinks < 44 px (WCAG-2.5.8-Ausnahme); booking-management, ui-quality PASS | Typografie/Kartenrahmen: kein weiterer messbarer Defekt, keine Änderung |
| VISUAL04 / #215 Header/Nav | Doppeltes Installationssymbol (Header und Seitenkopf) auf Mobil | Ein Symbol je Layout (CSS) | loading-pwa Chromium+Firefox PASS; Sweep | Safe-Area/Notch nur emuliert, keine Gerätprüfung |
| VISUAL05 / #216 Dialoge | Sweep: Wizard und Wallet-Dialog passen in allen 8 Breiten/Zooms in den Viewport, kein Überlauf | keine | Sweep, onboarding-suggestions PASS | Bildschirmtastatur nicht prüfbar (Emulation ohne IME) |
| VISUAL06 / #217 Erststart | Leer-Zustände (Dashboard/Positionen/Buchungen/Verlauf) in Screenshots ohne Defekt | keine | browser-onboarding-suggestions PASS; Screenshots `img/after2-*-s-empty-*` | Szenarien „erster Anbieter/erste Position“ nicht separat neu geprüft |
| VISUAL08 / #224 Verlauf | Akkordeons: ein CSS-Chevron je Titel, keine Überläufe | keine | history-followup, reference-management PASS; Sweep history-open/manage | – |
| #257 B (Details nur in „Verwalten“) | Details sind im Normalmodus sichtbar | **nicht geändert – Konflikt**: bestehende Verträge (Transfer-Browservertrag öffnet `.booking-meta` im Normalmodus; UI-Qualität „archive visible without detail disclosure“) setzen das voraus; Änderung würde Tests abschwächen | – | **Produkt-/Vertragsentscheidung nötig** (Vorrang #257-Nachtrag vs. integrierte Transferdarstellung) |
| HERO-QUALITY03 | Hero-Kurzinfo, „Prüfbereich öffnen“, kein Auto-Open bereits implementiert | keine | browser-quality-review PASS (7 Breiten, Axe, Fokus) | – |
| UI-TEXT03–10 | Kein weiterer eindeutig offener Präsentationsrest belegt | keine | ui-quality, ui-audit-controls PASS | Wörtlicher Abgleich jedes TEXT-Vertrags nicht Zeile für Zeile durchgeführt |
| L07 Kurs-CSV | Quellkontext nicht eindeutig | **offen gelassen** | – | Varianten: (a) CSV-Einstieg im Positionsdetail belassen; (b) unter „Mehr“/erweitert bündeln, wenn keine automatische Quelle nutzbar. Fehlende Entscheidung: welches Signal „nutzbare alternative Quelle“ ist |

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


## #288 Einzelzuordnung

| Anforderung | Status | Beleg |
|---|---|---|
| Long-Press aktiviert Verwalten + wählt genau den Eintrag (3 Listen) | umgesetzt, geprüft (Chromium+Firefox, emuliert; Touch real nur Playwright-Touch) | `tests/browser-ui-alltag10.mjs` |
| Scroll/Cancel/Ghost-Click/Mehrfinger | umgesetzt, geprüft | ebenda |
| Tastatur/Checkbox-Semantik/linkes Symbol | umgesetzt, geprüft | ebenda, booking-management, reference-management |
| Kompaktes Install-Symbol + manuelle Hilfe | umgesetzt, geprüft | loading-pwa |
| Loader sichtbarer, keine Mindestzeit, Reduced Motion | umgesetzt, geprüft; Bewegungsbeleg `img/loader-*` | loading-pwa |
| Reload, langsam, Offline, Fehler, Timeout→Erfolg | geprüft | loading-pwa |
| Toolbars verdichtet | umgesetzt, geprüft | Sweep |
| Textreste / Anbieterhilfen | umgesetzt, geprüft | unit + ui-quality |
| WebKit / Android-Gerät / TalkBack | **nicht geprüft** | Umgebung fehlt |

Lokale Chromium-/Firefox-Läufe (Playwright 1.64.1; CI 1.56.1) sind weder WebKit- noch vollständige Releaseabnahme.
