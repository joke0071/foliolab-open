# FLH03-05 – Nachtrag: universeller Flatex-Import

Aufgenommen am28.10.2026 während BP02/PR190. **Status TODO** im bestehenden Flatex-Paket.
Dieser Nachtrag unterbricht oder priorisiert laufende Arbeit nicht um.
Keine parallele Implementierung, keine neue Roadmap. Laufende PRs/CI/Releases zuerst
regulär abschließen; ursprüngliche Master-/Etappengrenzen bleiben erhalten.

## Neue private Referenzen und Auditgrenze

Der Nutzer meldet jetzt konsolidierte Originalreferenzen für Depot- und Kontoumsätze
im privaten Unterordner Flatex – konsolidiert des vorhandenen Originaldatenordners.
Dies ergänzt den früheren ausdrücklich unvollständigen Flatex-Export; dessen Befund
bleibt historische Evidenz. Die neue Verfügbarkeit ist gemeldet, noch nicht durch Work
geprüft. Keine behauptete Zugriffskontrolle oder private Referenzabnahme.

Gemeldete Formatmerkmale: Semikolon, Windows-1252, deutsche Daten/Dezimalkomma,
leere Headerpositionen; Depot12Spalten, Konto10Spalten. Exakte private Dateien,
Mengen/Zeiträume und der gemeldete vollständig verknüpfte Orderbestand nur privat
abgleichen, niemals als öffentliche Testfixtures/Actions-Artefakte/Logs veröffentlichen.
Originaldateien ausschließlich lesend verwenden. Bei fehlendem Zugriff dies dokumentieren,
keine Annahmen als Originalnachweis ausgeben. Bekannte private Sollwerte sind Prüfziele,
keine bereits bestätigten Parser-/Bestands-/Cashflowergebnisse.

## Nächster regulärer Flatex-Schritt: FLH03-05-FX-AUDIT01 TODO

Voraussetzungen: laufende Arbeit regulär abgeschlossen, frischer main-/Branch-/PR-/
Actions-/Writercheck; vorhandene Flatexparser, Reconciliation/Backfill/Importidentität,
Buchungsverwaltung und Fachverträge zuerst lesen. Keine vorhandene Funktion neu bauen.

Für jeden Punkt konkret **vorhanden / teilweise vorhanden / fehlt / fehlerhaft**
mit Quell-/Testnachweis erfassen; derzeit noch keine neue Istklassifikation behauptet:

1. Automatische Erkennung beider gemeldeter Originaldialekte.
2. Tatsächliche positionsgebundene Spaltenstruktur einschließlich leerer Header.
3. Windows-1252/UTF-8, deutsche Zahlen und kalendergenaue Daten.
4. Separater Depot- beziehungsweise Kontoimport.
5. Gemeinsamer Import und belegter Abgleich.
6. Überlappende/mehrere Exportdateien und Wiederholungsimport.
7. Originalreferenzen und deterministische Transaktionsidentität.
8. Tatsächlich vom Fachvertrag unterstützte Ereignistypen.
9. Schutz manueller Korrekturen beim erneuten Import.

Nur belegte Funktionslücken in vorhandener Architektur schließen. Originalbankdaten
und berechnete Portfolioereignisse logisch trennen; kein paralleles Importmodell.

## Gewünschte Bedienung und fachliche Grenzen

Zwei klar benannte Uploadfelder **Depotumsätze** und **Kontoumsätze**, gemeinsam oder
einzeln nutzbar; nach vorhandener Architektur optional mehrere Teil-CSVs je Kategorie.
Struktur-/Zeichensatzerkennung, verständliche Vorschau mit Anzahl/Zeitraum/Typen/
Dubletten/offenen Abgleichfällen, keine unnötigen Pflichtschritte bei einfachen Fällen.
Fehlende Cashdaten bzw. Stückzahlen sichtbar, keine Ergänzung durch Annahmen.

Bank-Transaktionsnummer, Orderreferenz, Depotbewegung, zugehörige Cashbuchung und
eigenständige externe Kapitalbewegung unterscheiden. Belegte Order-/ISIN-/Typ-/Datums-/
Betragsbeziehungen nutzen, mehrere Gegenbuchungen und fehlende Gegenbeine berücksichtigen.
Gemeldeten privaten Orderabgleich lokal gegenprüfen; gemeinsame Dateien dürfen denselben
Kauf/Verkauf niemals als zwei unabhängige Wertpapierereignisse oder externe Cashflows buchen.

Thesaurierungen/Ausschüttungen/Fusionen/Storno-Fusionen/Lagerstellenwechsel/Splits/
sonstige Kapitalmaßnahmen getrennt fachlich behandeln. Keine pauschalen Käufe/Verkäufe/
Einzahlungen. Thesaurierung kann Steuerereignis ohne neue Anteile sein. Fusion/Storno
gegebenenfalls verknüpfen; Lagerstellenwechsel ohne künstlichen Gewinn/Mehrbestand,
Split ohne fiktive Kapitalanlage. Unklare Sonderfälle bleiben im Staging prüfpflichtig.

Produktanforderung: historischer Start **01.01.2022**. Frühere Originale dürfen belegte
Anfangsbestands-/Kostenrekonstruktion unterstützen, keine fiktiven Eröffnungen/Einzahlungen.
ETF-Wechsel, Verkäufe alter und Käufe neuer Positionen bleiben interne Anlagevorgänge.
Vollständige Performance benötigt unabhängige Stichtagsbewertungen/korrekte Anfangsbestände;
bestehende aktuelle Bestände niemals unkontrolliert überschreiben.

## Integrität, Tests und Abnahme

Bestehende deterministische Quellidentitäten/Idempotenz/Dateiüberlappungsprüfung,
manuelle Korrekturen, Vorschau/Bestätigung, dokumentierte Konflikte/Provenienz,
atomaren Commit/Abbruch/Rückrollbarkeit wiederverwenden. Keine doppelten Cashflows
oder künstlichen Stückzahlkorrekturen. Finanz-/Storage-/Releasefreigaben bleiben separat.

Private Referenzprüfung ausschließlich lokal und nichtöffentlich, sofern zugänglich:
erkannte Quellbuchungen und fachlich verknüpfte Orders gegen private Sollwerte prüfen.
Öffentlich ausschließlich synthetische strukturelle Testfälle für:

- Einzelimport Depot, Einzelimport Konto, gemeinsamer Import.
- Überlappende Teil-Exporte und identische Wiederholung.
- Depot-/Cashbeziehungen mit mehreren bzw. fehlenden Gegenbuchungen.
- Verkäufe/Ausschüttungen/Gebühren/Thesaurierungen/Fusionen/Stornos/Splits.
- Blankheader, Encoding, Zahlen/Daten und unvollständige/unklare Eingänge.
- Manuell korrigierte/existierende Buchungen, Vorschau/Commit/Fehler/Abbruch.

Parser-PASS allein erlaubt keinen produktiven historischen Import. Bestands- und
Cashflow-Konsistenz sowie vorhandene Pflicht-/Drei-Engine-/Backup-/Restore-/Offline-/
Security-/Accessibility-/Livegates zusätzlich abnehmen. Zentral dokumentieren:
wiederverwendete Funktionen, tatsächliche Ergänzungen, bestandene Tests/Einschränkungen,
gemeinsame Importfähigkeit und konfliktfreier historischer Import ab2022.
Keine private Datenveröffentlichung, keine Umgehung bestehender Fachverträge.
