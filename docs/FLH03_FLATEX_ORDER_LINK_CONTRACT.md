# Flatex: native Orderbeziehungen – reiner Fachvertrag vor Code

Basis v201 LIVE_ACCEPTED/main88508742db6bed9be57d6e907b2bfe56d61b1631.
Vorhandene Flatex-Beta, pairFlatexSettlements/auditFlatexSettlementAmounts und
native Originalprojektion zuerst geprüft. Neuer einziger Funktionsbranch
feature/flh03-flatex-order-links; alte PR191 und historische Flatex-Branches sind
bereits abgeschlossen. Zwei Etappen: dieser vorab gesicherte Vertrag, danach
geprüfte reine Zuordnungsgrundlage. Dialog-/Releaseintegration folgt separat.

## Wiederverwendung und Grenzen

inspectNativeFlatexOrderLinks im vorhandenen src/flatex-settlements.js ergänzen.
Kein zweiter CSV-/Finanz-/Journalpfad. Legacy-API/Rückgaben/Heuristik unverändert.
Bestehenden bounded Datumshorizont und pairFlatexSettlements für qualifizierte
1:1-Kandidaten wiederverwenden. Native Quellen nur aus readFlatexNativeBytes/
parseFlatexNativeCSV; keine Änderung von app.js/Quellparser/Finanz-/Storage-/Backupvertrag.
Keine wirtschaftliche Buchung, Gebühren-/Steuer-/Kosten-/EUR-/Saldo-/Cashflowannahme.

API-Eingang: bis20 native Dokumente (direkte Parserdokumente), zusammen maximal5000
Quellzeilen, maxDays standard7/0–30 wie vorhandener Matcher. Ausgabe deeply immutable,
ready=false/writeEnabled=false, ohne Import-/Mutations-API. Alle Eingangszeilen werden
über dokumentlokale sourceIndex/physische line-Lokatoren erhalten. Keine Originalzeile
deduplizieren, umsortieren oder künstliche Gegenbuchung bilden. Output keine Geldsummen,
keine aus Brutto-Netto-Differenzen abgeleiteten Gebühren und keine bestätigte Zuordnung.

## Drei verschiedene Referenzen

Bank-TA-Referenz ist je Seite und Quellkontext getrennt; Orderreferenz stammt aus dem
bereits bestätigten vollständigen Ordertext. Depot-Nummer und Konto-Felder bleiben
getrennt und sind keine bestätigte Portfolio-/Eigentumszuordnung. Alle Kennungen als
exakte Strings einschließlich führender Nullen; keine Number-Konvertierung.

Beziehungen zunächst anhand identischer Orderreferenz sammeln. Innerhalb einer
solchen Gruppe müssen Typ und ISIN eindeutig übereinstimmen; Widersprüche dürfen
nicht durch Schlüsselsplitting nach ISIN/Typ versteckt werden. Kein Fallback auf
gleiche ISIN, ähnlichen Betrag oder Tagesnähe bei fehlender/abweichender Orderreferenz.
Wiederverwendete Ordernummern, mehrere Kontexte/Ausführungen oder unklare Herkunft
bleiben Reviewfälle. Auch ein plausibles 1:1-Paar beweist keine globale Orderidentität
oder eigenes Verrechnungskonto.

## Quellidentität und Überlappungen

Bankidentität nur als vorläufiger dokumentlokaler Prüfkey aus Seite, Quellkontext und
Bank-TA-String; niemals als neue persistente Buchungsidentität. Fehlende Quellkontexte/
Bankreferenzen verhindern eine 1:1-Aussage. Wiederholungen mit gleicher Identität und
identischen fachlichen Quellfeldern (Nummer-Ordinalspalte bleibt separat, nicht als
wirtschaftlicher Payload verwendet) als Überschneidung markieren. Abweichende
fachliche Felder derselben Identität als Konflikt markieren. Alle Vorkommen erhalten
und sämtliche betroffenen Ordergruppen sperren; keine optimistische Teilzuordnung.
Keine Datumskomponente in der Identität, die eine geänderte Buchung zur neuen ID macht.

## Qualifikation und Status

Nur nicht stornierte ORDER Kauf/Verkauf mit vollständiger Orderreferenz/ISIN,
glaubwürdigem übereinstimmendem Quelltext und Depot-ISIN, gültigem Buchtag UND Valuta,
exakten nichtnulligen Nominal-/positiven Kurs- bzw. Cashbeträgen und deklarierten
Einheiten/Währungen kommen als Kandidaten in Frage. Nichtstornierte Geldrichtung:
Kauf belastet, Verkauf schreibt gut. Datumsabstände sowohl Buchtag als auch Valuta
innerhalb maxDays. Unterschiedliche/fehlende Währungen bleiben Review, keine FX-Annahme.
Keine Rohwerte aus unbekannten Projektionen als0 einsetzen.

- possible-single: genau ein qualifizierter Depotbeleg und ein qualifizierter Cashbeleg,
  eindeutige Quellen und gleicher deklarierter Währungskontext; vorhandener 1:1-Matcher
  bestätigt dieselbe mögliche Korrespondenz. Weiterhin ausschließlich Kandidat.
- multiple-cash-review: eine Order mit mehreren eindeutigen Cashbeinen; alle Beine
  getrennt zeigen, keine Betragsaddition, automatische Spesen-/Steueraufteilung oder
  endgültige Buchungsfreigabe. Gemischte Vorzeichen/Währungen/Zeiten blockieren.
- multiple-depot-review: mehrere Depotausführungen; keine Teile auf Cash verteilen,
  zu einem Kauf verdichten oder als Dubletten eliminieren.
- missing-depot / missing-cash: fehlende Seite sichtbar, keine Eröffnung ergänzen.
- conflict / overlap-review / cancelled-review / scope-review / source-review:
  konkrete kompakte Gründe statt stiller Teilzuordnung.

Storno-/Fusionsstornozeilen mit eindeutiger Orderreferenz sperren die gesamte Gruppe;
kein Netting und keine automatische Rücknahme. Fusion/Thesaurierung/Lagerstellenwechsel/
Split/unbekannte Ereignisse ohne belegte Orderbeziehung bleiben separat/unassigned.
Kein zeit-/betrag-/ISINbasiertes Anhängen fehlender Stornos oder Steuer-/Gebührenzeilen.
Mehrere Depot-/Kontoquellkontexte in derselben Ordergruppe bleiben scope-review.
Anzahl der Zeilen ist keine Anzahl vollständiger wirtschaftlicher Ereignisse.

## Nachweise

Nur synthetische öffentliche Fixtures: getrennte Bank-/OrderIDs/führende Nullen,
einzelnes Paar, mehrere Cashbeine, Teilausführungen, fehlende Seite/Ref/Scope,
falsche ISIN/Typ/Währung/Zeiten/Vorzeichen, Storno, gleiche/konfligierende TA über
Teil-Dateien und über Gruppen, abweichende Nummer-Ordinalspalte, mehrere Quellkonten,
Reihenfolgeunabhängigkeit, Größen-/Zeilen-/Datumsbounds, exakte Decimal-Grenzen,
alle Zeilen erhalten/deep immutability, unveränderte Legacy-Regression.

Private Referenzkopien getrennt lokal verwenden; aktualisierte Drive-Metadaten
entsprechen dem früher geprüften Stand. Neuer Helfer gegen die vorhandene unabhängige
Python-csv/Decimal-Referenzbeziehung prüfen. Keine privaten Zeilen/Kennungen/Mengen/
Zeiträume/Beträge/Fingerprints im Repository oder CI. Kein Historien-/Saldo-/Performance-
PASS aus dem privaten Orderziel ableiten.

Browser-Runtime über bestehenden UI-Quality-Einstieg in Chromium/Firefox/WebKit:
synthetische Quellen tatsächlich parsen, Gruppenkonflikte/Mehrfachbeine/Legacy-Gate,
exakter IDB-Record/Revision/Settings unverändert, keine externen Requests,
echter SW-Offline-Reload und Modulimport. SW202 für geändertes ausgeliefertes Modul,
volle unveränderte Pflicht-CI/Wallet/Quellreview; kein visueller UI-PASS ohne Dialogänderung.

Nach geprüftem Kandidaten beide Etappen dauerhaft sichern; UI-Anbindung und eigener
kontrollierter Release anschließend separat. Keine zusätzliche kritische Freigabe
für reinlesende Vertrag-/Helferarbeit; wirtschaftliche Integration benötigt später
eigenen belegten Fach-/Integritäts-/Releasevertrag. UI-MASTER28/DELETE-MASTER28
und übrige Roadmap bleiben erhalten; keine privaten Produktivdatenänderungen,
keine Vorziehung von FLH05/PERF oder PROJ01.
