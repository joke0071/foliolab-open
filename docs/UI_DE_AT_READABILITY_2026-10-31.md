# de-AT-Anzeigen und sehr kleine Mengen

Teilpaket zu UI-TEXT / Android-Lesbarkeit nach UI-TRANSFER04. SW241-Kandidat; kein Abschluss aller UI- oder Finanzpakete.

## Verhalten

- Buchungslisten, Positions-Buchungszeitleiste und Transferauswahl zeigen gültige Kalenderdaten als TT.MM.JJJJ. Originale ISO-Daten bleiben in Modell, Importidentitäten, Formularen und `time[datetime]` erhalten. Die Buchungssuche findet beide Schreibweisen. Kalenderdaten werden nicht in eine andere Zeitzone umgerechnet; ungültige Evidenz wird nicht normalisiert.
- Exakte Mengen in Buchungszeilen, Transferauswahl und Bestands-/Kursdetails erhalten sämtliche gespeicherten Dezimalstellen. Der Formatter verarbeitet die Dezimalzeichenfolge ohne Umweg über `Number`; Trennzeichen kommen einmalig aus `Intl.NumberFormat('de-AT')`. Sehr kleine Werte werden verlustfrei in wissenschaftlicher Schreibweise dargestellt, z. B. `0.000000000000000001` als `1E-18`.
- Der bereits gerundete Mengenformatter der kompakten Ansichten verwendet für Nichtnullmengen unter 1E-8 wissenschaftliche Schreibweise mit acht signifikanten Stellen, damit kleine Bestände nicht als Null erscheinen. Normale Mengen bleiben unverändert formatiert. Diese Funktion wird nur von Anzeigeoberflächen verwendet.
- Lange technische Bearbeitungs-/Löschsperrgründe stehen in normalen Buchungsdetails gesammelt unter „Einschränkungen ansehen“. Sie sind vollständig per nativer Tastatur-/Touch-Offenlegung erreichbar und beanspruchen nicht mehr die schmale Fakten-Spalte. Die fachlichen Sperren und Editorprüfungen bleiben unverändert.
- „Gebuchte Vorgänge“ erhält dieselbe kompakte Typografie und mindestens44px Bedienhöhe wie vergleichbare Detailzusammenfassungen.

Keine Änderung von Finanzberechnung, Journal, Kostenbasis, Kapitalflüssen, Transfermatching, Importidentitäten, Kursqualität, kanonischer Serialisierung, Persistenz, CAS, Migrationen, Verschlüsselung oder Synchronisierung. Formate werden ausschließlich beim Lesen für die Darstellung angewendet. Fehlende Mengen bleiben unbekannt; fehlende Kurse behalten ihren bestehenden Nicht-verfügbar-Pfad.

## Nachweise

- Kalender-/Schaltjahr-/ungültige Evidenz-Verträge, sechs Zeitzonen einschließlich DST-Grenzen.
- Exakte Rückrechnung der lokalisierten Mengen in dieselben Decimal-Units, einschließlich +/-1E-18 und großer Zahlen mit18 Nachkommastellen. Bestehende fachliche Zeitleistenprüfung bleibt erhalten und erwartet jetzt die gewünschte Datumsdarstellung.
- `tests/locale-display-browser-contract.mjs` ist Teil der bestehenden verpflichtenden `browser-ui-quality.mjs`-Suite. Dieser Vertrag läuft auch auf der tatsächlichen Produktion in Chromium, Firefox und WebKit. Echte ausgelieferte Module, echte Buchungsoperationen und kanonische IndexedDB: sechs Breiten320/360/390/412/430/1440, Axe, ISO- und de-AT-Suche, unverändertes `datetime`, winzige Bestände, exakte lange Dezimalmengen, Transferdialog und Zeitleiste; vollständiger IndexedDB-Datensatz einschließlich Revision bleibt durch Lesen/Suchen/Vorschauen exakt unverändert.
- Visuelle Screenshots unter `artifacts/gates/locale-display/`; bestehende komplette Lesbarkeits-/UI-/Transfer-/Speicher-/Finanzgates bleiben aktiv. Endgültige CI- und Produktionszuordnung steht im zentralen Checkpoint.

Browserprüfungen sind keine echte Android-/TalkBack-/Safari-Hardwareabnahme. Keine echte Google-OAuth-Abnahme in diesem Paket. Ausschließlich synthetische Testbestände in öffentlichen Belegen.
