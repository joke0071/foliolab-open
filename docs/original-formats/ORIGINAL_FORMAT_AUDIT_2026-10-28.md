# FLH03 – Originalformat-Abgleich am regulären Checkpoint

Stand 28.10.2026, nach v198 LIVE_ACCEPTED / main `8391dc0a8478af7e1aeb860b8b705217fdd24546`.
**FLH03-ORIG01 DONE für lesenden Format-/Parserabgleich; wirtschaftliche Vollabnahme bleibt PARTIAL.**

Die neu bereitgestellten vier privaten Originalexporte wurden lesend geprüft. Genaue private
Zeiträume/Häufigkeiten stehen im privaten Prüfbericht. Hier erscheinen nur abstrahierte
Schema-/Semantikbefunde; keine Originalzeilen, Kontodaten, Adressen, Transaktions-IDs,
Anlagebestände, Geldbeträge, Datei-Fingerprints oder privaten Library-IDs.
Die Dateien sind keine neu behaupteten Referenzsalden.

## Tatsächlicher Format-/Parserabgleich

| Quelle | Bestätigte Schemaform | Vorhandener Parser / tatsächliches Ergebnis | Offene Grenze |
| --- | --- | --- | --- |
| Bitpanda | UTF-8/Komma; Vorspann vor Header; 18 Headerfelder, 18-Feld-Handels-/Transferzeilen und 17-Feld-Staking-/Rewardvarianten; Timestamp mit Offset | `parseCSV` lehnt Originalstruktur wegen wechselnder Spaltenanzahl ab; kein nativer produktiver Adapter | Fehlendes Feld nicht still ergänzen oder als Steuer0 ausgeben. Fiat/Asset, Feeasset, Spread/Steuer, Produkt und In/Out getrennt. Reward/Stakingtransfer kein pauschaler Kauf/Cashflow. |
| Kraken | UTF-8/Komma, 16-Spalten-Ledgers mit txid/refid/time/type/subtype/aclass/subclass/asset/wallet/amount/fee/balance/amountusd/feeusd/balanceusd/feecurrency | `parseCSV` strukturell erfolgreich; kein nativer Ledgers-/Trades-/Balancesadapter. `inferMapping` deckt Zeit/Mengen/Referenzen nicht vollständig und schlägt fee→feeEUR vor | Nicht-EUR-feecurrency belegt: generisches Gebührenmapping ist keine Freigabe. Mehrzeilige refid-Gruppen statt fester Zweizeilenannahme. Kein Kurs/Einstand aus USD-Zusatzspalten erfinden. |
| Bittr | UTF-8/Komma, bestehender 13-Spalten-Kaufbelegdialekt, UTC-Zeit mit Z, Fiat-/Servicefee-/Brutto-/Miningfee-/Nettofelder | `parseCSV` und bestehendes `parseBittrEvidence` akzeptieren den Originalexport vollständig; bestehende Mengen-/Gebührenvalidierung und Ausschluss privater Zusatzfelder bestätigt | Kaufbelegvalidierung ist keine zusätzliche Bestandsbuchung/Wallet-/Kostenbasisabnahme. Bestehendes FLH02 wiederverwenden, nicht neu bauen. |
| Flatex | Semikolon, positionsgebundene 13-Spalten-Depotvariante mit drei unbenannten Währungs-/Einheitenfeldern; deutsche Daten/Zahlen, kein gültiges UTF-8 | `detectFlatexCSV({headers})` erkennt Depot; `parseCSV` und dadurch `prepareFlatexImport` lehnen leere/doppelte Header ab | Encoding separat klären; positionsgebundene Spalten erhalten. Original umfasst Käufe und Thesaurierungen, keine pauschale Trade-/Cash-/AT-Steuerumdeutung. |

Bitpanda hat zusätzlich Transaction ID, Transaction Type, In/Out, Amount Fiat/Fiat,
Amount Asset/Asset, Asset market price/currency, Asset class, Product ID, Fee/Fee asset/
Fee percent, Spread/Spread Currency und Tax Fiat. Der bisherige Recherchekatalog
eines 16-Feld-Dialekts ersetzt diesen konkret beobachteten 18/17-Feld-Vertrag nicht.
Staking-/Unstaking-/Rewardzeilen sind die verkürzte Form; die wirtschaftliche Bedeutung
des fehlenden letzten Feldes ist nicht aus bloßer Position als Null ableitbar.

Kraken enthält trade/deposit/withdrawal/transfer/spend/receive/earn sowie
tradespot/spotfromfutures/autoallocation/reward/delistingconversion. Die Zeitspalte
enthält keine eigene Zeitzonenkennung. Diese Typnamen rechtfertigen keine automatische
Futures-/Earn-/Delisting-/Trade-Verbuchung. Vorhandene stabile txid/refid-Felder
sind ein konkreter Einstieg für lokale Vorschau; Zeilen aus einer refid-Gruppe nicht
pauschal als genau einen zweibeinigen Handel behandeln.

Flatex: `Buchungstag;Valuta;Bezeichnung;ISIN;Nominal (Stk.);;Betrag;;Kurs;;Devisenkurs;TA.-Nr.;Buchungsinformation`.
Die lesende Prüfung nutzte eine CP1252-Decodierung. Die Unterscheidung zu ISO-8859-1
ist ohne eindeutige Bytebelege nicht bewiesen; keinen globalen Encodingvertrag erfinden.

## Verbleibende Daten-/Abgleichprobleme

- **Flatex ausdrücklich unvollständig:** laut Nutzer nur einzelne exportierte Seiten,
  weitere Originale derzeit nicht verfügbar. Kein vollständiges Depot, kein gepaarter
  vollständiger Cash-/Settlementexport und keine unabhängigen Anfangs-/Endsalden.
- Kraken: Ledgerdatei vorhanden; keine gleichzeitige vollständige Trades-/Balances-
  Originalreferenz. Laufende balance-Spalten sind keine unabhängigen Bestandsstichtage.
- Bitpanda: Schemaoriginal vorhanden; vollständige unabhängige Anfang-/End-/Transfer-/
  Stakingreferenzen fehlen. Quellenfelder nicht als belegte Steuer-/Einstandsbasis behandeln.
- Bittr: früher vorhandene Schema-/FLH02-Belege bestätigt, keine erneute Scanner-/Bestands-
  oder Mehrjahres-Vollabnahme. Outputzuordnung und unabhängiger Endbestand bleiben separat.
- Keine künstlichen Eröffnungen, Ausgleichsbuchungen, Nullsteuern oder stillen Zeilendrops.
  Fehlende Originale nicht erneut pauschal anfordern, wenn derzeit nicht verfügbar.
  Sichere lokale Vertrags-/Vorschauarbeit bleibt möglich.

## Ausschließlich synthetische Beispiele / Prüfung

[synthetic-examples.v1.json](synthetic-examples.v1.json) enthält vollständig erfundene
Identitäten, Daten, Beträge und Namen. Nur die Schemaformen stammen aus dem Formatabgleich.
Lokale Prüfung gegen unveränderte v198-Parser: Bitpanda-Ragged-Rejection, Kraken-Lexing
mit expliziter EUR-Fee-Mappinggrenze, Bittr-Allowlist/Netto-/Feeprüfung und Flatex-
Blankheader-Rejection. Das sind dokumentierende Beispiele, keine neu unterstützten Adapter.
Keine Produkt-/Parser-/Workflowänderung oder zusätzliche vollständige CI ausgelöst.

## Exakt nächste reguläre FLH03-Aktion

Nach aktuellem Kollisionscheck FLH03-03 am nun bestätigten Kraken-Ledgerdialekt fortsetzen:
vor Code einen begrenzten **reinlesenden Ledger-Vorschauvertrag** mit refid-/txid-
Herkunft, Mehrbeinen, Fees in deklarierter Währung, unbekannten Subtypen und explizit
unbewiesener Vollständigkeit sichern. Bestehende CSV-/Decimal-/Preview-/Journal-/CAS-
Mechanik wiederverwenden; noch keine vollständige wirtschaftliche Übernahme.
TR/fehlende gepaarte Referenzen bleiben konkrete externe Gates. Danach vorhandene
Bitpanda-/Flatex-Lücken entsprechend bestehender Sequenz, keine neue Gesamtroadmap.
Die schon gelesene P-Chain-Mehrseiten-/Ankerliteratur bleibt erhaltene Vorarbeit;
FLH05/PERF nicht vorziehen, FLH-PROJ01 weiterhin ausschließlich dokumentiert.
