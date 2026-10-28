# FX-FORMAT01 – reiner Originalformatvertrag vor Code

Basis v200/main b2a07f4131a7b38d1fa7da40fab8ea58b72fd119.
Vorheriger Ist-/Originalaudit dauerhaft auf dem zentralen Dokumentationsbranch:
docs/FLH03_FLATEX_NATIVE_AUDIT.md, Auditcommit 814a092b60ca802c049a7cd9c64de40244d1e147.
Einziger Funktionsbranch feature/flh03-flatex-native-format. Alte Flatex-Beta und
gemeinsame Finanz-/CSV-/Identitäts-/Backfillfunktionen unverändert.

## Umfang und Wiederverwendung

Dieser Schnitt schließt ausschließlich die belegte Rohformat-/Encodinglücke.
Gemeinsamer readCSVRecords-Zeichenautomat, bestehende units/exact-Decimalengine.
Kein zweiter CSV-/Finanzkern und keine Lockerung von parseCSV.
Keine Dialogintegration, keine Änderung von prepareFlatexImport/Beta-Buchungen,
keine Cash-/Steuer-/Kosten-/Bestandsannahmen, kein Speicher-/Backupumbau.

Bestätigte Header in Quellreihenfolge, Blankheader sind echte eigene Spalten:

Depot12:
Nummer;Buchtag;Valuta;ISIN;Bezeichnung;Nominal;;Buchungsinformationen;TA-Nr.;Kurs;;Depot

Konto10:
Buchtag;Valuta;BIC / BLZ;IBAN / Kontonummer;Buchungsinformationen;TA-Nr.;Betrag;;Auftraggeberkonto;Konto

Nur diese exakten Schemata nach Trimmen/BOM; kein heuristisches Padding, Entfernen,
Umsortieren oder Ersetzen leerer Header. Alle Datenzeilen müssen exakt breit sein.
Keine erfundene Vorschau für unbekannte Dialekte; Legacy-Adapter bleiben separat.
Maximal 2 MB Eingang und 5000 Datenzeilen, kein Vorspann für diesen bestätigten Dialekt.

Byteeingang Uint8Array: UTF-8 mit fataler Decodierung versuchen; bei ungültigem UTF-8
Windows-1252. UTF-16/32-BOMs und NUL/binary ablehnen, nicht still als CP1252 lesen.
Encoding als Metadatum dokumentieren, keine exakte Byteidentität oder sichere
automatische Zeichensatzerkennung außerhalb dieses Vertrags versprechen.
Text-API nimmt bereits decodierte Strings; Ersatzzeichen ablehnen. Browser verwendet
später arrayBuffer statt verlustbehaftetem File.text(); hier noch keine UI.

## Reine, positionsgetreue Projektion

Alle Quellzeilen in Reihenfolge samt tatsächlicher physischer Zeilennummer, alle
getrimmten Quellfelder, stabile Spaltenkeys und originale Header einschließlich
Blankheadern erhalten. Nummer, Bank-TA-Referenz, Orderreferenz, Depot-/Kontofelder
getrennt als Strings. Keine Number-Konvertierung oder globale Identität ableiten.
Leere/Strichwerte bleiben unbekannt, niemals nullwertig ergänzen.

Deutsche Zahlen nur nach strikter Grammatik: optionale Vorzeichen, ungruppierte
Ziffern oder gültige Dreiergruppen mit Punkt, optionales Dezimalkomma; danach
bestehende maximal18-Stellen-Decimalengine. Ungültige/zu präzise Werte roh mit Issue
und numerischer Projektion null. Nominal, Kurs/Betrag sowie Einheiten und
Preis-/Betragswährungen separat; kein implizites EUR, kein Mengen-Vorzeichenmapping,
keine Multiplikation oder Gebühr aus Brutto-/Nettodifferenz.

Buchtag und Valuta kalendergenau als TT.MM.JJJJ prüfen, roh erhalten und getrennt
auf ISO projizieren; ungültige Daten bleiben Issue/null, nicht lokale Zeitzone.
Unbekannte/deutungsbedürftige Typen erhalten und markieren. Dokumentarische
Klassifikation für ORDER Kauf/Verkauf, Thesaurierung, Lagerstellenwechsel, Split,
Fusion und Storno/Fusionsstorno; KEINE wirtschaftliche Interpretation.
Ordertext nur bei bestätigter vollständiger Grammatik:
ORDER Kauf/Verkauf + ISIN + abschließende numerische Orderreferenz, optionaler
vorangehender Quelltext. Widerspruch zur Depot-ISIN markieren, kein Gegenbein bilden.

Doppelte/konfligierende Bank-TA-Felder an sämtlichen betroffenen Zeilen markieren,
keine Zeile deduplizieren. Fehlende Referenzen nicht gruppieren.
Ausgabe tief unveränderlich, ready=false/writeEnabled=false, keine Import-API.

## Prüf- und Releasevertrag

Öffentlich ausschließlich erfundene Header-strukturgleiche Fixtures.
Units: beide Schemata/Blankpositionen, Encoding UTF-8/CP1252 ohne Ersatzzeichen,
falsche BOMs/NUL/Schema/Breiten/Größen/Zeilen, Quotes/CRLF/physische Zeilen,
exakte große/kleine Zahlen/deutsche Gruppen, unbekannt vs explizit0,
Datum/Valuta/Schaltjahre, getrennte Referenzen/Ordertext/ISIN-Widerspruch,
Sonderereignisse/Storno, doppelte/konfligierende TA und tiefe Unveränderlichkeit.
Bestehende 55 Flatex- und generische CSV-Regressionsgates erhalten.

Private Originale separat lokal gegen unabhängige Python-csv/Decimal-Projektion
prüfen; keine Originalinhalte, Kennungen, Geldbeträge, private Mengen/Zeiträume
oder Dateifingerprints ins Repository/Actions. Privater Order-Sollabgleich ist bereits
separat bestätigt; nicht als neuer produktiver Matcher oder Saldoabnahme ausgeben.

Drei-Engine-Runtime über vorhandenen UI-Quality-Einstieg, native Bytes tatsächlich
im Browser decodieren, exakter IDB-Record/Revision/Settings unverändert,
keine externen Requests; echter SW-Offline-Reload und Modulimport.
Nächstes SW201 vorcachen. Unveränderte volle Pflicht-CI, Quellreview,
keine neue Workflowdatei/Pins/Assertionabschwächung.

Nach Audit + geprüftem FX-FORMAT01-Kandidaten diese zwei Etappen sicher übergeben.
Nächster Schnitt später: getrennte Depot-/Kontouploads und Quarantänevorschau;
Order-/Mehrfachgegenbeinvertrag und wirtschaftliche Integration getrennt absichern.
Keine zusätzliche kritische Freigabe für diesen reinen Helfer erforderlich.
FLH03-05/Gesamtmaster bleiben PARTIAL; neuer UI-MASTER28 offen, ursprüngliche
Roadmap erhalten, FLH05/PERF nicht vorziehen und PROJ01 nur später.
