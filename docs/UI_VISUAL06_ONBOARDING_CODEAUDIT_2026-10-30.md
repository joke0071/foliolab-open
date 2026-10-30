# FolioLab Open – UI-VISUAL06 / Issue #217: Erststart und Leerzustände – Code-/Kollisionsaudit · 30.10.2026

**Art:** Kleines Work-eigenes, konfliktarmes READ-ONLY-Arbeitspaket nach der vollständigen v222-Live-Abnahme. **CODEAUDIT_DONE / IMPLEMENTATION_OPEN**. Der verbindliche Scope steht in [Issue #217](https://github.com/joke0071/foliolab-open/issues/217): rein visuelle, responsive und A11y-Änderungen an vorhandenen Erststart-/Leerzuständen, **keine neuen Funktionen/Onboarding-Schritte und keine veränderten fachlichen Texte**. Aktueller `main` `8353a1cab3c528a389d2bd7893df819f3c284225`, v222/SW222 [LIVE_ACCEPTED mit geprüftem Beleg](release-evidence/v222-live-acceptance.json).

## Verifizierte Codeorte und bereits existierende Funktionen

| Stelle | Tatsächlicher Istzustand | Sichere Konsequenz |
| --- | --- | --- |
| `index.html` Z16 | `<div id="onboarding" class="panel onboarding hidden" aria-live="polite"></div>` in der Übersicht, vor den Statistiken. | **Vorhandene Karte erhalten**; keine zweite Willkommenskarte oder anderer Initialisierungscontainer. |
| `src/app.js` Z168–180 `renderDashboard()` | `#onboarding` ist nur sichtbar, wenn `model.providers.length===0`; vier **bestehende** Aktionen `start-wizard`, `start-provider`, `start-wallet`, `start-import`, jeweils echte Buttons. | Präsentation/Anordnung optimieren, **Sichtbarkeitsbedingung, Action-IDs, Text und Navigation unverändert**. Nach erstem Anbieter **verschwindet** die Begrüßung auch ohne Position: das ist aktuell bewusst der bestehende Vertrag und darf nicht stillschweigend erweitert werden. |
| `src/app.js` Z133–140 | Bei `loadFailure` wird Onboarding verborgen und die vorhandene `portfolio-unavailable-message` angezeigt; Aktionen werden nicht als normale Ersteinrichtung angeboten. | **P0-Sicherheitsgrenze**: „nicht lesbar“ niemals als leeres Portfolio/Null/Neuanlage umdeuten. UI217 darf Fail-closed-/Recovery-Grenzen nicht umgehen. |
| `src/app.js` Z449–452 | `#positionList`: ohne Positionen `Noch keine Positionen. Füge eine Anlage hinzu oder importiere vorhandene Daten.`; bei Filter ohne Treffer eigene Meldungen. | Vorhandene Text- und Filtersemantik erhalten, nur kompakte/leise Präsentation; keine Dummy-Aktionen oder neue Fachtexte. |
| `src/app.js` Z554–571 | `#bookingList`: ohne Buchungen `<div class="empty booking-onboarding">…</div>` und **keine zusätzlichen Buttons in diesem Container**; aktiver Filter ohne Treffer erhält anderen Text. | **Keine neuen CTA-Buttons** einfügen oder doppelte `Buchung hinzufügen`-Aktion; existierende `#addBooking`/`#openCSVImport` in Panelaktionen bleiben erreichbar. |
| `src/app.js` Z353–355 | Leerer Historienchart zeigt bereits eine kontextabhängige Meldung mit existierendem `start-wizard`-/`history-positions`-Button. | **Ausdrücklich aus #217 ausklammern:** Diagramm-/Verlaufs-/Zeitachse gehört zu anderen Work-Paketen; nur Regression prüfen, keine Modus- oder Datenänderung. |
| `styles.css` Anfangsbereich | Generische `.empty`-Regel: `padding:34px 15px`, zentriert, line-height 1.7. `.toolbar-buttons` ist bereits flex + wrap + 8px gap. | Vereinzelte große Leerflächen können aus diesem generischen Padding resultieren; **keine globale .empty-Änderung**, weil History, Import, Transfer und verschiedene Fehler-/Statuszustände ebenfalls betroffen sind. Ausschließlich z.B. `#positionsPage #positionList>.empty` / `#bookingsPage #bookingList>.booking-onboarding` und `#onboarding` scoped prüfen. |
| `styles.css` Z265–269, Z1145, Z1242–1244 | `.booking-onboarding` ist max-width 540px, `margin:auto`, eigener Text-/Absatzabstand; `#onboarding` hat `margin-top:20px`; Dashboard-Onboarding-Buttons sind bereits mindestens **44px**. | Keine bereits umgesetzten Touch-Targets oder mobilen Grid-/Abstandsregeln ersetzen; nur nach tatsächlichem Browserbild optimieren. |
| `src/onboarding-suggestions.js` | Provider-/Kontonamensvorschläge sind bereits offline, ohne automatische Konto-/Anbieterverwaltung und ohne externe Suche. | **Nicht im #217-Visualscope ändern**; alte Vorschlagsfunktion nicht neu implementieren. |

## Schon existierende Testabdeckung, die nicht doppelt erstellt werden soll

- `tests/browser-ui-audit-controls.mjs` prüft bereits **leere/gefüllte** Varianten aller fünf Seiten, unterschiedliche Breiten und explizit `#onboarding .btn` auf vorhandene Geometrie/44px; es prüft exakte unveränderte IndexedDB-Records.
- `tests/browser-booking-filters.mjs` garantiert den **einmaligen** `#addBooking`-/`#openCSVImport`-Pfad und ausdrücklich **0 zusätzliche Buttons innerhalb .booking-onboarding**; Text `Noch keine Buchungen erfasst` wird geprüft.
- `tests/browser-smoke.mjs` beweist, dass bei defekten/nicht lesbaren lokalen Daten **kein** normales Onboarding gezeigt wird. Das darf ein bloßer Visual-Pr nicht brechen.
- `tests/browser-onboarding-suggestions.mjs` und `tests/onboarding-suggestions.test.mjs` gelten den vorhandenen offline Vorschlägen, nicht neuen Erststart-Schritten.
- Bereits abgeschlossene v222-Live-Releasegates und die 66 Axe-Prüfungen je Engine sind Baseline, **nicht** Ersatz für neue Kandidaten-/Visualregression.

## Konfliktgrenzen zu offenen Copilot-Drafts

Offen und nicht integriert: [#213](https://github.com/joke0071/foliolab-open/pull/213) (Mehr; `index.html`, `src/app.js`, `styles.css`), [#214](https://github.com/joke0071/foliolab-open/pull/214) (Positionen/Buchungen; `styles.css`), [#218](https://github.com/joke0071/foliolab-open/pull/218) (Navigation; `styles.css`), [#222](https://github.com/joke0071/foliolab-open/pull/222) (Dashboard; `styles.css`), [#227](https://github.com/joke0071/foliolab-open/pull/227) (Filter; `styles.css`). Keine UI-VISUAL06-Neuinterpretation dieser Pakete. Eine global geänderte `.empty`-, `.panel`-, `.toolbar-buttons`- oder `.btn`-Regel kann die Drafts unbemerkt treffen; bevorzugt **eng geschachtelte CSS-Selektoren und bestehende Markupstruktur**.

Bei #213 steht der alte `bookingsPage`-Kicker `MANUELLE ERFASSUNG` lediglich im Hunk-Kontext; neue `BUCHUNGEN`-Überschrift aus v222 darf nicht zurückgesetzt werden. Wie im [Copilot-v222-Voraudit](COPILOT_V222_INTEGRATIONS_VORAUDIT_2026-10-30.md) beschrieben, nie alten `index.html`-Gesamtkontext übernehmen. #217 ist Work-owned und **keine** automatische Copilot-Integration.

## Kleinste mögliche Implementierung – erst nach Wochenendbefunden

1. Vor eigenem kleinen **Draft-PR** die neuen Praxisfunde (31.10.–01.11.) gegen bereits bestehende Sichtbarkeit/Touchziele abgleichen. Keine kosmetische Arbeit vor echten P0/P1.
2. Ausschließlich **scoped CSS** für `#onboarding`, `#positionsPage #positionList` und `#bookingsPage #bookingList .booking-onboarding` in aktuellem Main; `src/app.js` und `index.html` möglichst bytegleich. Die vier Willkommensaktionen müssen bei 320px und 200% Schrift dynamisch umbrechen, ohne dass einer verdeckt wird.
3. Szenarien: (A) frisch, 0 Anbieter/0 Positionen; (B) 1 Anbieter, 0 Positionen, Onboarding verborgen, aber Positions-/Buchungsleerzustände nachvollziehbar; (C) erste Position; (D) großes bestehendes Portfolio; (E) fehlerhafter/gesperrter Speicher – **keine** irreführende Ersteinrichtung. Filter-Nichttreffer von echter Datenleere unterscheiden.
4. 320/360/390/412/430/768/1440px, 200%-Schriftvergrößerung und mobile Bottom-Nav, 44×44px, sichtbarer Fokus/Tab-Reihenfolge, Axe und Screenshots 320/390/1440. Mindestens Chromium/Firefox/WebKit, Zero-IDB-Write-Assertion; keine neue Bibliothek.
5. Eigener Draft-PR + vollständige Kandidaten-Gates, **keine automatische Veröffentlichung**; vor Merge individuelle neue Nutzerfreigabe. Service-Worker-Revision bei tatsächlich neu veröffentlichten CSS/HTML entsprechend bestehendem Releasevertrag, nicht ohne geprüftes Gate.

**Ergebnis:** **CODEAUDIT_DONE**: tatsächliche DOM-/Render-/CSS-Stellen, schon bestehende Funktionen, unerwartete `loadFailure`-Schutzgrenze, vorhandene Tests und Copilot-Überschneidungen dokumentiert. **IMPLEMENTATION_OPEN**; keine UI geändert, kein PR/CI/Merge/Deploy. Nur FLH05/FLH-PROJ01 bewusst PARKED. Keine zusätzlichen kostenpflichtigen Work-Credits.
