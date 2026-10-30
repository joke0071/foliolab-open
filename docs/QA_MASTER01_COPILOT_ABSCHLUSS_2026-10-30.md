# QA-MASTER01 – Copilot-Abschlussbericht und Integrationsvertrag · 30.10.2026

Status: **COPILOT_DELIVERED / WORK_INTEGRATION_PENDING**. Übernahme des verbindlichen Nutzernachtrags, keine neue Masterpriorisierung. PR220 und dessen bestehende Freigabe-/Releasefolge haben Vorrang. Keine Tests, Merges, Deployments oder parallele Integration durch diese Dokumentationsübernahme auslösen.

## QA01: Accessibility und Draft223

[PR223](https://github.com/joke0071/foliolab-open/pull/223), HEAD `8377ed7814437137679c90635c78d968b35ab835`, Basis main `af8347054c9e5d50b854494f650e7d7675adcff6`, Draft/offen/nicht gemergt. Tatsächliche Dateien: src/allocation-ui.js und tests/allocation-ui.test.mjs.

Befund laut Copilot: Accessible Name der Donut-Mitte zwischen ursprünglichem Rendering und display()/Hover/Fokus/Pin inkonsistent. Sichtbare Labels „Portfolio“/„Nettovermögen“ sowie Prozentanteil fehlten teilweise. Gelieferter gemeinsamer Helfer allocationCenterName(label,share,value) soll Rendering und Aktualisierung vereinheitlichen, ohne Werte, Geometrie, Interaktion oder Fokus zu ändern. axe meldet die experimentelle Label-in-Name-Regel laut Bericht nicht zuverlässig.

Copilot meldet963/963Units, browser-allocation PASS und Accessibility-Audit0Verstöße. **Unabhängige Work-Abnahme ausstehend.** Prüfung auf aktuellem Main, Verhalten bei Rendering/Interaktionen, sichtbares Label im Accessible Name, exakte Werte und bestehende Crossbrowser-/A11y-Gates nachholen. Keine doppelte Implementierung; später separat kontrolliert integrieren, passende SW-Version und eigene konkrete Mergefreigabe.

Frischer GitHub-Stand: Pflicht41034682776 läuft noch; Testjob123992505286 FAIL im zwingenden SW-Revisionsgate, Crossjobs123992505743/123992505860 laufen. Wallet41034682685 SUCCESS. Keine Gesamtfreigabe aus Einzeltests ableiten, keine roten Pflichtgates abschwächen.

## Offene Label- und Heading-Punkte

- CSV-Import: sichtbarer Buttontext und aria-label weichen ab. **Erst nach Integration von PR213** aria-label und gegebenenfalls title auf „CSV-Import“ vereinheitlichen. Nicht vorher parallel index.html ändern: Mergekonflikt ist laut QA nachgewiesen.
- Heading-Order bei #positionListHead > h3: nur ergänzender Befund. Vor Änderung reproduzieren und in der tatsächlichen Seitenhierarchie beurteilen. Kein pauschaler Produktfehler aus einer erweiterten Prüfung.

## QA02: Dialog-Regression und Umgebungsgrenzen

Copilot verwendete **System-Chrome** auf mainaf834705, kein lokal verfügbaresFirefox/WebKit. Die20 bestehenden Referenzbilder unterscheiden sich in dieser lokalen Rendering-Umgebung; das allein belegt keinen Produktfehler. Aussagen zu vorhandenen Testfehlern bleiben auf diese geprüfte Umgebung begrenzt.

PR219 verursacht laut Vergleich echte Änderungen an12/20Dialogbildern, gemeldete Pixelabweichungen4,2–10,4%; Wallet-Dialoge bei390/1440um4pxhöher. **Nach Integration von219**:
1. Dialoge in der maßgeblichen GitHub-CI-Umgebung prüfen.
2. Tatsächliche Layoutänderungen fachlich und visuell beurteilen, von Umgebungsabweichungen trennen.
3. Ausschließlich akzeptierte Änderungen in tests/dialog-visual-pixel-baselines.json übernehmen.
4. Vollständige visuelle Regression erneut ausführen.

Keine blinden Snapshot-Updates, Assertions-/Timeoutlockerungen oder Umgehung roter Pflichtgates. FehlendeFirefox-/WebKit-/Accessibility-/Dialogprüfungen bei Work nachholen. RealeAndroidgeräte, Screenreader und installiertePWA nicht als geprüft behaupten, wenn nur Emulation/Markup vorliegt.

## QA03: Konflikte, Kaskade und PR208 erhalten

-208/209 überschneiden sich bei Zeitraum-CSS.208 enthält eigenständige Positionsdetail-Zeitraumänderungen und Tests; ausdrücklich erhalten, inhaltlich zusammenführen oder getrennt kontrolliert integrieren.
-213/214/218/222 können durch CSS-Ergänzungen am Dateiende Textkonflikte erzeugen.
-218 verändert globale Layoutabstände und kann222 beeinflussen.
-213/209 kollidieren in src/app.js. Vorgeschlagene Auflösung:209-Änderungen erhalten und driveOriginExample-Initialisierung aus213 ergänzen.
-Reiner Textmerge ist keine Abnahme: CSS-Kaskade, tatsächliche Darstellung, Bedienung und Fachfunktion nach jeder Integration prüfen.

## Integrationsreihenfolge und Freigaben

Copilot empfiehlt technisch209 →208 →219 →218 →222 →214 →213 →223. **Unverbindlicher Vorschlag, keine neue Masterpriorisierung und keine Mergefreigabe.** Work bestimmt die endgültige Reihenfolge nach aktuellem Main, Abhängigkeiten, Konflikten, vollständiger Regression und Releaseaufwand; begründete Änderungen dokumentieren. CSV-Labelkorrektur bleibt an213 gebunden.

Sechs visuelle Copilot-Drafts209/213/214/218/219/222 plus QA-Fix223 sind geliefert und jeweils zur kontrollierten **Einzelintegration** vorgemerkt.208 erhalten. SW-Versionen ausschließlich im tatsächlichen Releasekontext passend aktualisieren. Jeder konkrete PR benötigt gültige eigene Freigabe vor Merge/Deployment und anschließend vollständige tatsächliche Liveabnahme.

UI-VISUAL06/#217 und alle übrigen offenen UI-MASTER28-Aufgaben bleiben bei Work, ohne Copilot-Wartebedingung. **Nur FLH05 und FLH-PROJ01 bewusst PARKED.** Bestehender Master, Sicherheits-/Finanz-/Daten-/PWA-/Offline-/Backup-/Restore-/CAS-Vertrag unverändert.
