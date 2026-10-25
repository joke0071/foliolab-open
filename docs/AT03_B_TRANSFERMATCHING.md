# AT03-B – Fachvertrag vor Implementierung

Basis main c422dbd8e532127f738b24e07a9e5092fd865d84, FLH01/#137 und IndexedDB B/#138 integriert. AT03-A unverändert; C weiterhin Realbelege-Gate.

## Vorschläge und explizite Zuordnung

Nur vorhandene, journalbelegte `withdraw`/`deposit`-Cashbewegungen verschiedener eigener Konten. Kein neuer Saldo, keine neue Buchung, kein erneuter Bestandswechsel. Vorschlagsfenster sieben Kalendertage nach Buchungsdatum; Valuta wird ohne belegtes Feld nicht erfunden. Gleiche Beträge/Datum/Notiz sind nur Suchhilfen, kein Nachweis. Nutzer wählt Ausgang und einen oder mehrere Eingänge ausdrücklich aus, prüft Konten, Mengen, Währungen und Belege und bestätigt mit Referenz. Mehrdeutige Kandidaten werden niemals automatisch aufgelöst.

Teilmengen/Splits: mehrere ausgewählte Eingänge sind gemeinsam nur bei exakt gleicher nominaler Gesamtmenge und gleicher Währung zuordenbar. Unvollständige Gegenbewegung bleibt offen. Fremdwährungsbeträge dürfen nicht aus heutigen FX-Kursen geschätzt werden. Unterschiedliche Währungen, ungeklärte Gebühren, fehlende Journal-/Flowbelege und unplausible Zeitabstände blockieren die wertwirksame Zuordnung; sie dürfen als prüfbedürftige Bewegungen sichtbar bleiben. Separat gebuchte Gebühren bleiben separat und werden nicht als Teil des internen Betrags geschluckt. Unterschiedliche EUR-Buchwerte bei gleicher Fremdwährung werden nicht rechnerisch ausgeglichen oder als Gebühr erfunden.

## Bestehenden Finanzkern nutzen

Die bestehende `transactions.js`-Engine erhält die explizite Verknüpfungsoperation für schon gebuchte Bewegungen. Original-Buchungs-IDs/-Typen, Konten, Mengen, importierte Herkunft und manuelle Notizen bleiben erhalten. Journalpostings behalten sämtliche numerischen Mengen/Buchwerte; ausschließlich die Clearing-Klassifikation und verifizierten passenden externen Cashflows werden nach Bestätigung intern zugeordnet. Die Vorschau nennt diesen Effekt. Kein zweiter Journal-/Importkern.

Zuordnung als begrenzte optionale Metadaten der bestehenden Buchungen, keine neue Speicherengine oder Modellversion. Import-IDs bleiben stabil; ausdrücklich zugeordnete Importbuchungen werden durch bestehende Ownership-Regeln vor stiller Reimport-Überschreibung geschützt. Restore validiert vollständige wechselseitige Links. Wiederholte identische Bestätigung ist idempotent. Aufheben ist explizit möglich, stellt die ursprünglichen externen Flows/Journalrollen wieder her und verweigert sich nach zwischenzeitlichen Änderungen. Snapshotvergleich der Vorschau und vorhandener Storage-Freshness-/CAS-Guard schützen gegen veraltete Auswahl und parallele Tabs.

## Abnahme

Tests: mehrere Konten/Anbieter, 18-stellige Mengen, Betrags-Splits, kein/mehrdeutiges Matching, Gebühren/FX/Datumsgrenzen, fehlende Gegenbuchungen, unveränderte Bestände/Snapshots, exakte externe Flows, doppelte Bestätigung, Aufheben, geänderte manuelle Daten, Ownership/Reimport, alte v3-Backups, verschlüsselter Restore, atomare CAS-/Mehrtab-Gates; Chromium/Firefox/WebKit, 320/390/430/768/1440px, Axe, Escape/Fokus. Keine Brokerparser oder Steuerautomatik.

Status: Vertrag erstellt; Implementierung und Testnachweise folgen. Exakt nächste Aktion: reine Vorschau und atomare Zuordnungsoperation im bestehenden Transaktionskern implementieren, gezielt testen, dann UI.

## Lokaler Codecheckpoint

Implementiert im bestehenden Transaktionskern: rein lesende Vorschau, ausdrücklich bestätigte Zuordnung/aufhebbare Metadaten, idempotente Bestätigung, kompletter Restore-Validator und Schutz vor veralteter Vorschau. Originalpostings bleiben numerisch identisch. Unbekannte Gebühren/Steuern werden nicht als null angenommen. Die bestehende Import-Ownership schützt zugeordnete Bewegungen einschließlich echter CSV-Reimport-Regression. Rendite-/Kapitalreferenz-Gates berücksichtigen nur validierte interne Zuordnungen; Stichtage innerhalb des offenen Überweisungszeitfensters sperren die Rendite (kein erfundener Geld-unterwegs-Bestand).

Lokal 617/617 Unit-Tests und Syntax bestanden. 13 neue Finanztests: Splits mit 18 Nachkommastellen, explizite Bestätigung, Idempotenz/Undo, fehlende/mehrdeutige Gegenbewegung, Gebühren/FX/Datum, vollständige Belege und Mengen, unveränderte Bestände/Postings, Restore und beschädigte Gruppen, Ownership/echter CSV-Reimport, Performance bei abgeschlossenen/offenen Transfers. Chromium-UI mit 320/390/430/768/1440px/Axe/Fokus/Abbruch, tatsächlicher IDB-Zuordnung/Undo, verschlüsseltem vollständigem Restore inkl. optionalem synthetischem API-Key und echter veralteter Revision bestanden. Vorhandene Ledger-/FLH01-/P0-Importbrowsergates bestanden. Erste neue Testhilfe benutzte fälschlich `.model` statt des vorhandenen `.data`-Backupvertrags; korrigiert, keine Produktions-Backupengine geändert.

Nächster Schritt: exakten Feature-Tree remote sichern und komplette Chromium-/Firefox-/WebKit-CI abwarten. Noch kein Merge oder Paketabschluss. AT03-C bleibt blockiert.
