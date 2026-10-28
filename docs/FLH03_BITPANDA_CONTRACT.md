# FLH03-04 – Bitpanda: begrenzter reinlesender Formatvertrag vor Code

Basis: v199 LIVE_ACCEPTED / main `c28053a109ed0338cdb040d88758766a1888a535`.
Einziger neuer Funktionsbranch: `feature/flh03-bitpanda-preview`.
Dieser Vertrag wird vor Funktionscode separat gesichert.
Quelle: vorhandener privater Originalaudit, öffentlich abstrahiert in
`docs/original-formats/ORIGINAL_FORMAT_AUDIT_2026-10-28.md` auf dem zentralen Checkpointbranch.
Keine pauschale Abnahme anderer Bitpanda-Produkte/Jahre oder wirtschaftlicher Vollständigkeit.

| Etappe | Ergebnis / begrenzter Umfang | Abhängigkeiten | Abnahme | Status |
| --- | --- | --- | --- | --- |
| FLH03-04-BP01 | Dieser Vertrag vor Code | v199, gesicherter Originalaudit, bestehender CSV-/Decimalkern | eigener Remotecommit, eindeutige Grenzen | DONE nach Sicherung |
| FLH03-04-BP02 | Reiner nativer Parser mit gemeinsamem CSV-Lexer, synthetischen Unit-/Browser-Runtimeprüfungen | BP01 | volle unveränderte Pflicht-CI, drei Engines, exakte Nullmutation/Offline, Scope-Review | TODO |
| FLH03-04-BP03 | Anbindung an vorhandenen CSV-Dialog | geprüfter BP02, keine parallele Umsetzung | native Erkennung/Quarantäne vor generischem Mapping, Submitguards, fünf Breiten/Axe/Fokus/Abbruch/Offline | TODO |
| FLH03-04-BP04 | Kontrollierter Release und tatsächliche Liveabnahme | grüner geprüfter UI-Kandidat | volle Main-/Pages-/Produktionsgates und Bilder | TODO |

Diese Sitzungsgrenze umfasst BP01 und BP02. BP02 ist eine selbstständig prüfbare
Formatgrundlage ohne UI- oder Buchungsintegration; BP03/BP04 folgen in weiteren Sitzungen.
Keine neue Roadmap, lediglich begrenzte Etappen des bestehenden FLH03-04.

## Beobachteter Dialekt und Wiederverwendung

UTF-8/Komma, optionaler Vorspann, exakt diese 18 Header in bestätigter Reihenfolge:

`Transaction ID,Timestamp,Transaction Type,In/Out,Amount Fiat,Fiat,Amount Asset,Asset,Asset market price,Asset market price currency,Asset class,Product ID,Fee,Fee asset,Fee percent,Spread,Spread Currency,Tax Fiat`.

Keine alternative 16-Spalten-/API-/Pro-/Custodyvariante erfinden. Unbekannte, leere,
zusätzliche, doppelte oder umsortierte Header bleiben gesperrt. Schemaerkennung über
mehrere charakteristische Header, niemals Dateiname oder einzelne Wörter.

CSV-Zeichenautomat aus bestehendem `parseCSV` als gemeinsamen Lexer extrahieren:
BOM, Komma/Semikolon/Tab, escaped Quotes, CR/LF/CRLF und zitierte mehrzeilige Felder
bleiben identisch. Generischer `parseCSV` behält seine bisherigen strikten Header-/
Breiten-/5000-Zeilen-/Größengates und Rückgabestruktur; kein allgemeines Ragged-Padding.
Lexer kann für den nativen Vertrag begrenzt Quellzeilen ohne Headerannahme liefern.
Keine zweite CSV-Implementierung und keine Änderungen am Buchungs-/Journalpfad.

Native Grenze: maximal 2 MB UTF-8-Text, 5000 Datenzeilen, 20 nichtleere Vorspannrecords.
Header muss innerhalb dieses Fensters eindeutig sein; wiederholter Header bleibt Fehler.
Vorspanninhalte können Namen/Kontodaten enthalten: nur begrenzte Erkennung, keine Ausgabe,
kein Logging, keine Persistenz, keine Übernahme in das Parserergebnis. Quellzeilennummern
einschließlich zitierter Zeilenumbrüche korrekt erhalten. Keine neuen Dateiuploads/APIs.

## 18-/17-Feld-Behandlung ohne erfundene Steuerwerte

18 Felder sind die volle Form. Genau 17 Felder sind ausschließlich für die beobachteten
Typen `reward`, `transfer (stake)`, `transfer (unstake)` zulässig, und nur beim exakten
kanonischen Header. Das fehlende letzte Feld wird als fehlendes Quellfeld dokumentiert:
`Tax Fiat=null`, nicht als leerer String und niemals als0. Andere Breiten/verkürzte Typen
führen zum Schemafehler; keine Verschiebung innerer Felder oder Fehlersuppression.

Alle Datenzeilen bleiben im Quellablauf erhalten; kein Sortieren/Netting/Droppen.
Geparste getrimmte Quellwerte behalten, keine unveränderten Originalbytes versprechen.
Leerer String oder einzelner Strich bedeutet unbekannt. Numerische Projektion null,
inklusive Fee/Tax/Spread; nie optionalen Zahlparser mit Nullersatz verwenden.
Explizite0 bleibt exakt0 und unterscheidbar. Invalides Dezimalformat/zu hohe Präzision
bleibt Rohtext mit Issue. Bestehende18-Stellen-Decimalengine, keine Number-Summen.
Fiatbetrag/-währung, Assetmenge/-code, Marktpreis/-währung, Gebühr/-asset, Feepercent,
Spread/-währung und TaxFiat getrennt erhalten. Kein ableitbarer EUR-Betrag oder Kurs.
TaxFiat ist eine ungeprüfte Quellangabe, kein Steuerbescheid oder bestätigter Kostenwert.

Timestamp kalender-/uhrzeitgenau mit explizitem ISO-Zeitzonenoffset prüfen; Offset
nicht durch lokale Browserzone ersetzen. Quellstring behalten, keine neue Tagesbuchung.
Ungültige/offsetlose Zeiten mit Issue sichtbar. Produkt-ID/Assetklasse/In-Out getrennt
erhalten, keine automatische Zuordnung zu FolioLab-Positionen oder Beständen.
Bekannte Typen buy/sell/deposit/withdrawal/transfer/reward/stake/unstake beschreiben
lediglich Quellenereignisse; unbekannte Typen/Richtungen erhalten und kennzeichnen.
Keine automatische Behandlung als Kauf, externer Cashflow oder steuerpflichtiger Ertrag.

Transaction ID ist lediglich dokumentlokale Quellreferenz. Identische Wiederholungen
und widersprüchliche Zeilen mit gleicher ID an allen betroffenen Zeilen markieren;
keine automatische Deduplizierung oder globale Konten-/Buchungsidentität behaupten.
Keine erfundenen Gegenbeine/Transfers und keine Summen über Assets/Währungen.
Ergebnis tief unveränderlich, writeEnabled=false, ready=false, ohne Schreib-/Import-API.

## BP02-Prüfvertrag und Releasegrenze

Ausschließlich synthetische neue IDs, Beträge, Namen und Zeitpunkte. Keine Originalzeilen,
privaten Zeiträume/Häufigkeiten, Kontoinformationen oder Fingerprints in GitHub.
Gezielte unabhängige Tests: einspaltiger und mehrspaltiger Vorspann, ohne Vorspann,
BOM/Quotes/CRLF/mehrzeilige Felder/echte Zeilennummern, Headergrenzen und Mehrfachheader,
18/17-Zuordnung/fehlendes vs leer-/Strich-/explizites0, exakte große/kleine Zahlen,
Präzisions-/Kalender-/Offsetgrenzen, unbekannte Typen/Richtungen, doppelte/konfligierende
IDs, Nullmutation/Immutable-Ergebnis, harte Größen-/Zeilenbounds.
Bestehende generische CSV-Ergebnisse und Ablehnungen unverändert nachweisen.

Native Runtime über vorhandenen UI-Quality-Einstieg in Chromium/Firefox/WebKit prüfen:
reale veröffentlichbare Startseite, exakter IDB-Record/Revision und Settings unverändert,
hostile Strings bleiben Daten, negative Schemata, echter SW-Offline-Reload und Modulimport.
Modul im nächsten SW200 vorcachen. Keine neue Workflowdatei/Pins/Assertions reduzieren.
Volle bestehende Finance-/CAS-/Migration-/Backup-/Restore-/Security-/Accessibility-CI bleibt.
BP02 hat noch keinen Dialog; kein visueller Bitpanda-UI-PASS und keine Importfreigabe.

BP03 muss später erkennbare Bitpanda-Dateien vor generischem feeEUR/Taxmapping quarantänisieren,
genau eine native Datei akzeptieren, Misch-/Fremdmodus sperren, vorhandenen Generation-/
Dialog-/Submitguard und Paging/Fokus wiederverwenden. Alle Quellstrings escapen.
Keine neue Navigation und keine Portfolioänderung durch Vorschau.

Keine zusätzliche kritische Freigabe für den reinen Helfer nötig. Spätere wirtschaftliche
Übernahme benötigt eigenen belegten Fach-/Finanz-/kritischen Releasevertrag.
Unabhängige Anfang-/End-/Transfer-/Stakingreferenzen fehlen weiterhin konkret;
keine Eröffnungen, Ausgleichsbuchungen, Steuern oder Bestände erfinden.
Flatex ausdrücklich unvollständig; weitere Originale derzeit nicht verfügbar.
FLH03-04 und Gesamtmaster bleiben PARTIAL; FLH05/PERF/FLH-PROJ01 nicht vorziehen.
