# UI-POS02 – sichtbare Positionsansicht (2026-10-31)

Verantwortlich: Codex. Teilumfang UI-POS02; UI-BOOK03 bleibt offen.
Basis: main d28f535e7dc36ec0e2ac4aec8158dbefc3a1f41b (v234).

## Problem und Umsetzung

Archivierte Positionen waren erst nach „Verwalten“ über eine zusätzliche Schaltfläche sichtbar. Der neue dauerhaft sichtbare Filter „Ansicht“ bietet Aktiv, Archiviert und Alle, auch außerhalb des Auswahlmodus. Buchungen verwenden dieselbe Feldbeschriftung und dieselben kompakten Optionen.

Die Suche bleibt auf kleinen Displays über die volle Breite; Sortierung und Ansicht stehen ab 360 px nebeneinander. Bei 320 px erhalten beide lesbare volle Zeilen. Keine Schriftverkleinerung.

Die Auswahl der aktuellen Seite und des gesamten Such-/Filterergebnisses bezieht sich jetzt immer auf die gewählte Ansicht, vor der 100er-Paginierung. Eine aktive Ansicht darf nicht implizit unsichtbare archivierte Positionen neu auswählen. Bereits ausgewählte, später ausgeblendete IDs bleiben ausdrücklich gezählt und in der bestehenden Vorschau enthalten. Die alte ungefilterte implizite Auswahl aller Archivpositionen ist damit durch die Nutzerentscheidung UI-POS02 SUPERSEDED.

Der Bewertungs-Prüfaufruf zeigt bei betroffenen archivierten Positionen weiter automatisch Alle. Leere Archivansichten und durch die Archivansicht verborgene Prüfpositionen erhalten passende Hinweise.

## Sicherheitsumfang

Nur flüchtige Listendarstellung und Auswahlbereich ändern sich. Archivflags, Originalidentitäten, Bewertungen, Finanzjournal, Konten, Historie, Speicherformat und CAS bleiben unverändert. Die bisherige Helper-Option includeArchived bleibt kompatibel. Archivieren, Einzel-Restore, Abhängigkeitsprüfung, Löschvorschau und explizite Bestätigung verwenden unveränderte vorhandene Fachfunktionen. Kein zusätzlicher Löschfall wird freigegeben.

SW-Kandidat v235. Nicht als produktiv abgenommen deklarieren, bevor sämtliche aktuellen PR-/Main-Prüfungen und die echte Produktionsabnahme erfolgreich sind. Es gilt die neue autonome Releasefreigabe des Nutzers; historische Wochenendbeschränkungen sind aufgehoben.

## Gezielte Regression

- 994 Unit-Prüfungen einschließlich expliziter Active/Archived/All-Partition ohne Mutation; Syntaxprüfung.
- Bestehende Browser-Archivsuite bleibt mit sämtlichen Finanz-, Quotenfehler-, Transaktionsabbruch-, Mehrtab-CAS-, Offline- und Plain/Encrypted-Restore-Prüfungen erhalten. Nur Bedienselektoren werden an den neuen Filter angepasst.
- 401 Positionen: 201 aktiv, 200 archiviert; vollständige Auswahl vor Paginierung, Suche im Archiv, ausgeblendete Auswahl und Vorschau vollständig geprüft.
- Ausschließlich archiviertes Portfolio: Aktiv leer, Archiviert/Alle erreichbar, kein implizites Auswählen versteckter Archive.
- 320/360/390/412/430/768/1440 px, normal und Verwalten: alle drei Ansichten; sichtbare native Auswahlbeschriftung per tatsächlicher Textbreite samt Innenabstand und Pfeilreserve, mindestens 44 px Höhe, Lage zwischen fester Kopf-/Fußnavigation, Seitenbreite und Axe.
- Vorher/nachher vollständiger IndexedDB-Record einschließlich Revision identisch bei Ansichts-/Such-/Auswahlwechseln.
- Echte synthetische Screenshots visuell kontrollieren; vorhandene Referenzen und Toleranzen unverändert.

## Weiter offen

UI-POS02 ist PARTIAL: Bearbeiten neben den Bestandsdetails sowie sichere Löschvorschau aus dem Positionsdialog fehlen noch. UI-BOOK03 und UI-TRANSFER04 bleiben eigenständige Folgearbeit. Eine echte Android-/TalkBack-/PWA-Hardwareabnahme bleibt EXTERNAL.
