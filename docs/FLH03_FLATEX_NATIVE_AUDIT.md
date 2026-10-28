# FX-AUDIT01 – Originalformat-Abgleich, 28.10.2026

Basis: main b2a07f4131a7b38d1fa7da40fab8ea58b72fd119 / v200 LIVE_ACCEPTED.
Private Originale ausschließlich lokal lesend geprüft; keine Originalzeilen, Kennungen,
Beträge, Mengen, Zeiträume oder Fingerprints in diesem Bericht. Öffentliche neue Tests
müssen vollständig erfunden sein.

## Rekonstruierter vorhandener Stand

PR97 ist geschlossen/gemergt; sein historischer Branch ist kein Vorfahr des heutigen
main, aber alle vorhandenen Flatex-Module und Tests wurden quellseitig verglichen:
nur die später ergänzte Importherkunft in flatex-import.js unterscheidet den heutigen
Stand, übrige Flatex-Adapter unverändert. Kein alter Branch wird als offene Arbeit
wiederbelebt. Vorhandene Beta, Journal-/CAS-/Backfill-/Backup-/Korrekturschutzverträge
bleiben erhalten. 55 bestehende Flatex-Unit-Tests bestanden (0 Fehler/Skip).

## Neun verbindliche Istpunkte

| Nr. | Einstufung | Konkreter Quell-/Testnachweis und tatsächliche Lücke |
| --- | --- | --- |
| 1 Erkennung beider Originaldialekte | Teilweise vorhanden | detectFlatexCSV erkennt bekannte Legacy-Depot-/Kontospalten. Beide neuen Originale werden schon vorher von parseCSV wegen leerer Header abgewiesen. |
| 2 Positionsgebundene Spalten | Fehlerhaft für bestätigte Originale | Depot hat 12, Konto 10 Spalten; leere Header bezeichnen eigene Quellspalten. Der strikte generische Objektparser darf dafür nicht global gelockert werden. Nummer, Einheiten-/Währungsspalten und beide Kontoreferenzen getrennt erhalten. |
| 3 Encoding, Zahlen, Daten | Teilweise vorhanden | exactDate/singleAmount und bestehende Tests unterstützen deutsche Daten/Zahlen. Beide Originale sind Windows-1252; File.text() ersetzt ungültige UTF-8-Bytes. Sichere Byte-Decodierung fehlt. Präzision/Quellwährungen im nativen Vertrag gesondert sichern. |
| 4 Separate Exporte | Teilweise vorhanden | prepareFlatexImport unterstützt bekannte Depot-/Kontovarianten einzeln; Kontoumsätze bleiben read-only. Neue Originale scheitern an Nr.2/3; die geforderten getrennten Uploadkategorien fehlen. |
| 5 Gemeinsamer Abgleich | Teilweise vorhanden | Gemeinsame Legacy-Inputs und pairFlatexSettlements/auditFlatexSettlementAmounts vorhanden. Matcher nutzt Bank-TA-Referenz bzw. ISIN/Datum und nur 1:1. Orderreferenz im Text ist eigenständig; mehrere Cashgegenbeine und eindeutiger Originalabgleich fehlen im Produkt. |
| 6 Teil-/Wiederholungsimporte | Teilweise vorhanden | Referenzbasierte Dedup-/Konflikttests in flatex-import.test.mjs, Batch-/Provenienzschutz vorhanden. Neue Originaldialekte nicht angenommen; Identität und mehrere Gegenbeine benötigen getrennte Nachweise. Keine automatische Verdichtung anhand gleicher Ordernummer. |
| 7 Referenzen/Identität | Teilweise vorhanden | StableKey/externalId/parsed.sourceIdentities und import-identity.js vorhanden. Banktransaktionsreferenz, Ordertextreferenz und Depot-Nummer sind verschiedene Felder. Neue Quelle muss sie getrennt und ohne Number-Konvertierung bewahren. |
| 8 Ereignisse | Teilweise vorhanden, bewusst begrenzt | ORDER Kauf/Verkauf werden Beta-Kandidaten, sonstige Depotereignisse bleiben unsupported. Originale enthalten auch Thesaurierung, Lagerstellenwechsel, Split, Fusion/Storno. Keine automatische wirtschaftliche Freigabe; zunächst dokumentarische Klassifikation und rohe Quellwerte. |
| 9 Schutz manueller Korrekturen | Vorhanden im gemeinsamen Kern; native Integration offen | previewCSV/sourceUnmodified/bookingOwnership sperren geänderte oder konfliktbehaftete Herkunft, csv-batch-Tests belegen Schutz/Nullmutation. Kein neues Update-/Overwrite-Modell bauen. Native End-to-End-Abnahme noch nicht erbracht. |

## Private Prüfung und Grenzen

Beide Rohdateien vollständig lokal materialisiert und ohne Ersatzzeichen decodiert.
Header/Breiten/Einheiten-/Währungspositionen geprüft. Unveränderter Produktparser weist
beide wegen Blankheadern ab; dieser Fehler wurde reproduziert.

Separates temporäres Python-csv/Decimal-Verfahren hat den vom Nutzer vorgegebenen
Handelsorder-Sollabgleich über die **exakte Ordertext-Tupelreferenz aus Typ/ISIN/Ordernummer**
unabhängig bestätigt, mit eindeutiger Gegenzeile und Datums-/Vorzeichenprüfung.
Direkte Banktransaktionsnummern stimmen nicht zwischen Depot und Konto überein.
Privater Sollwert und Zeilen bleiben ausschließlich privat. Das ist weder ein
unabhängiger Bestands-/Kontosaldobeleg noch ein vollständiger Cashflow-/Performancebeweis.

Ein rein lokaler Diagnoselauf mit umbenannten Blankheadern zeigt, dass der bestehende
Legacy-Kern die isolierten Handelsdaten grundsätzlich liest und Sonderereignisse
quarantänisiert; diese temporäre Anpassung ist KEINE Produktunterstützung und wird
nicht als neue Importabnahme ausgegeben. Sein bestehender Matcher erreicht den
Original-Sollabgleich nicht vollständig.

## Nächster begrenzter Schnitt: FX-FORMAT01

Reine native Formatprojektion mit bestehendem CSV-Lexer und Decimal-Kern:
bestätigte 12-/10-Spaltenschemata einschließlich Blankheadern positionsgetreu,
UTF-8/Windows-1252-Byteeingang, exakte deutsche Zahlen/kalendergenaue Daten,
alle Quellzeilen und getrennte Referenzen. Keine Buchungen oder Finanzsummen,
kein Aufweichen des generischen Parsers oder des vorhandenen Flatex-Beta-Pfads.

Anschließend getrennte Upload-/Vorschauintegration und Order-/Mehrfachgegenbeinvertrag,
danach belegte wirtschaftliche Übernahme und vollständige Bestands-/Cashflow-/Releasegates.
Historischer Zielstart 01.01.2022; ältere Originale nur für belegte Anfangsbestände/Kosten.
Keine fiktiven Eröffnungen, Kosten, Steuerwerte oder externen Einzahlungen. UI-MASTER28
bleibt offen; FLH05/PERF/PROJ01 werden nicht vorgezogen.
