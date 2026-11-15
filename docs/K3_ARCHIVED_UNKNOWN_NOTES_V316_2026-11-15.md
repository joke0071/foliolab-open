# K3 · archivierte Buchung mit unbekannten Kosten · v316

## Vorab festgelegte Prüffrage

Nutzerablauf: Buchungen → Ansicht „Archivierte“ → Verwalten → Bearbeiten → nur Notiz ändern → Vorschau abbrechen beziehungsweise bestätigen → zweite Seite derselben Origin/des Profils öffnen → im ursprünglichen, weiterhin offenen Fenster rückgängig machen → erneut öffnen.

Synthetisches Soll: Ausgangscash 100 EUR + manuelle Einzahlung 20 EUR = exakt 120 EUR. Gebühren und Steuern sind null/UNKNOWN, booking-a ist archiviert. Betrag/Datum/Löschen bleiben geschützt. Nur die Notiz ist erlaubt. Vorschau benennt unbekannte Kosten und unverändertes Vermögen. Abbruch schreibt nichts. Bestätigung erzeugt genau einen nativen Portfolio-Commit/eine CAS-Revision, bewahrt alle Finanz-, Archiv-, Herkunfts- und Historienfelder außer Notiz plus dokumentierendem Nullwirkungs-Audit. Wiederöffnung liest den exakt gespeicherten Record und die neue Notiz. Undo in derselben Sitzung stellt raw/settings exakt wieder her, mit genau einem weiteren Commit. Erneutes Öffnen bewahrt den rückgenommenen Record. Keine Zusage von Undo nach Sitzungsverlust.

## Abgrenzung vorhandener Nachweise

K3-Einstellungen v308, Wallet-Metadaten v304 sowie bestehende Archiv-/Finanz-/Undo-Abnahmen werden wiederverwendet. Der native Lauf 43567167015 (QA-Quelle 4249a698fda42896099db6e3b7321ba0434121f2, tests/browser-latest-native.mjs) prüfte unbekannte Gebühren/Steuern nur bis zur Notiz-Vorschau; kein Bestätigen in diesen Fällen. Bestehende browser-booking-management behandelt die normale EUR-Notiz mit bekannten Nullkosten; booking-unknown-costs charakterisiert die Berechtigung/Vorschau. Neu ist ausschließlich deren bislang unbelegte Integration mit archiviertem Datensatz, dauerhaftem Commit, Wiederöffnung und Undo.

## Unveränderlicher Laufvertrag

Produkt: v316 LIVE_ACCEPTED, Main 82ce984b1a0406ac37c8bdb5a2cf856afa4b7e69, Tree 11429de9e06d9d014875af624cb80bafafb38f20. QA-Head 0dd0f76d6791cc91924a28222d9c92b3f6c58c3e, direkter Elterncommit ist Produkt-Main. Genau drei neue QA-Dateien; kein Produktpatch. Isolierte Ref test/k3-archived-notes-v316-20261115, ein Ubuntu-24.04/Chromium-Workflow mit vorhandenem Playwright 1.56.1, eigenem synthetischem Browserkontext und aktivem Service Worker/Cache v316. Keine Deployment-/Release-CI. Archivzustand entsteht als Fixture über vorhandene Produkt-API, nicht als zusätzliche behauptete Archivierungsabnahme. Native IDB-put/complete-Beobachter reichen unverändert an Originalmethoden durch; sie ersetzen weder Save noch CAS. Unabhängiger readonly Recordvergleich und zweite Seite verhindern einen reinen UI-/In-Memory-Nachweis.

Vor Start: Fixture/Vertrags-Vorabcheck und Syntaxprüfung lokal PASS, kein nativer lokaler Browsernachweis. Jeder Laufabschnitt schreibt seinen Beginn in report.json; Fehlerzustand/DB/Screenshot werden soweit erreichbar gesichert; Cleanup separat bewertet. Originalartefakt enthält Report, vollständige Records, Quell-/Laufidentitäten, native Logs und drei Dialogbilder. Nach erstem Ergebnis betroffenen Job/Artefakt auswerten; keine blinde Wiederholung.

Ergebnis: NATIVER TEST AUSSTEHEND. Dieser vorab festgelegte Vertrag ist kein PASS.
