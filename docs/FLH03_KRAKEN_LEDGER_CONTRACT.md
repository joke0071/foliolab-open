# FLH03-03 – begrenzte Kraken-Ledger-Vorschau vor Code

Basis v198 LIVE_ACCEPTED / main `8391dc0a8478af7e1aeb860b8b705217fdd24546`.
Einziger Funktionsbranch: `feature/flh03-kraken-ledger-preview`.
Der Vertrag wird vor Funktionscode separat gesichert.

| Etappe | Ergebnis / begrenzter Umfang | Voraussetzungen | Abnahme | Status |
| --- | --- | --- | --- | --- |
| FLH03-03-KRAKEN01 | Dieser native Ledger-/UI-/Nullmutationsvertrag | gesicherter Originalschemaaudit, vorhandener CSV-/Decimal-/Dialogkern | eigener Commit vor Code, eindeutige Grenzen | DONE nach Sicherung |
| FLH03-03-KRAKEN02 | Reine native Prüfvorschau und Tests | KRAKEN01 | Units, volle unveränderte Pflicht-CI/3 Engines, Nullmutation/Abbruch/Offline/Axe | TODO |

## Quelle und Wiederverwendung

Originalformataudit im zentralen Checkpoint/Originalformatbericht bestätigt den
16-Spalten-Dialekt. Keine Originalzeilen, Zeiträume, Häufigkeiten, Beträge,
Transaktions-IDs oder Fingerprints veröffentlichen. Tests ausschließlich erfunden.
Bestehende `parseCSV`-/`units`-/`exact`-Helfer und CSV-Dialog-/Submitguard/
Verwerfungs-/Fokusmechanik wiederverwenden. Kein zweiter Parser oder Journal.

Am28.10.2026 gelesene offizielle Kraken-Primärquellen:
- [Ledgerfelder](https://support.kraken.com/articles/360001169383-how-to-interpret-ledger-history-fields):
  Ledgerzeilen beschreiben Asset-Balanceänderungen; Zeit wird als UTC dokumentiert.
- [Ledger vs Trades](https://support.kraken.com/articles/115000302707-differences-between-ledger-and-trades-history):
  Ledger-/Ausführungsinformationen sind unterschiedliche Nachweise; gemeinsamer refid
  ist eine Referenzbeziehung, kein Ersatz für Order-/Ausführungs-/Vollständigkeitsbelege.

Der neue16-Feld-Export besitzt ausdrücklich feecurrency. Deklarierte Gebührenwährung
unverändert zeigen, auch wenn sie vom Asset abweicht; ältere allgemeine Feldbeschreibungen
nicht zum Überschreiben eines neueren Originalfeldes verwenden.

## Native Erkennung und Quarantäne

Exakt das bestätigte Headerset:
`txid,refid,time,type,subtype,aclass,subclass,asset,wallet,amount,fee,balance,amountusd,feeusd,balanceusd,feecurrency`.
Reihenfolge darf variieren; doppelte/fehlende/zusätzliche Header bleiben gesperrt.
Erkennbar unvollständige Kraken-Ledgers müssen vor generischem fee→feeEUR-Mapping
abgefangen werden. Signatur aus mehreren typischen txid/refid/aclass/subclass/wallet/
feecurrency-Feldern, kein Erkennen allein am Dateinamen oder Wort type.
Nur genau eine Datei pro nativer Vorschau; gemischte Stapel und expliziter falscher
Importmodus führen zum Fehler statt generischer Verarbeitung. Keine API-Abfrage.

## Reine Datenprojektion

Alle Zeilen im Quellablauf erhalten, keine Sortierung als Handelsreihenfolge,
keine stillen Drops oder automatische Deduplizierung. Rohspalten als geparste,
getrimmte Quellstrings erhalten; das ist ausdrücklich kein unveränderter Bytevertrag.
Beträge über bestehende18-Stellen-Dezimalengine exakt als Strings, nie Number-Summen.
Unlesbare Werte und fehlende Pflichtreferenzen bleiben sichtbar mit Issues.
Leerwert bedeutet unbekannt, nicht0. Gebühr ohne Währung/negative Gebühr ungeklärt.

Zeit lexikalisch und kalendergenau prüfen. Rohzeit anzeigen; Dokumentationshinweis UTC
explizit, keine lokale Browserzeitzone zur Interpretation. Ungültige Zeit bleibt sichtbar.
Assetcodes, Klasse/Subklasse, Wallet und USD-Zusatzwerte nicht zu Positionen, EUR-Werten,
Preisen, Kostenbasis, steuerlichen Werten oder Eröffnungsbeständen umdeuten.

txid ist eine Ledgerzeilenreferenz, kein Blockchain-Hash. Gleiche txid mehrfach im
Dokument: identische Wiederholung bzw. widersprüchliche Zeilen getrennt markieren,
beide erhalten. refid verbindet nur dokumentlokale Gruppen; fehlende refid führt zu
einer eigenen ungeklärten Gruppe je Zeile. Keine feste Zweizeilenannahme; alle Beine,
Typen und Subtypen sichtbar. Kein globales Konto-/Wallet-/Importidentitätsversprechen.

trade/deposit/withdrawal/transfer/spend/receive/earn und bekannte Subtypen erhalten
erklärende, vorsichtige Hinweise. Unbekannte Kombinationen werden ausdrücklich markiert,
nicht verworfen oder automatisch als Kauf/Reward/externer Cashflow klassifiziert.
Kein Mengen-/Werttotal über unterschiedliche Assets, Wallets oder Gruppen.

## Vorhandener CSV-Dialog

Automatische Erkennung und explizite Option Kraken – Vorschau im bestehenden Dialog.
Native Beschreibung, Quelldaten/Issues und refid-Gruppengröße sichtbar; kompakte
Disclosures, zunächst höchstens50Zeilen und bestehendes Weitere-anzeigen-Muster.
Keine neue Navigation, keine frei wählbare generische Spaltenzuordnung im nativen Modus.
Alle Quelldaten HTML-escapen; keine Netzwerkaufrufe durch Vorschau/Dateiinhalte.

Übernahme sowohl im Buttonzustand als auch Submitcallback und vorhandener
submitBlocked-Mechanik sperren, auch bei programmatischem Submit oder Moduswechsel.
Dateiwechsel/Abbruch/Escape/Neuöffnen verlieren die sitzungslokale Vorschau.
Asynchronen Auswahlgeneration-/Dialogwechselguard erhalten.
Nullmutation: vollständiger kanonischer IDB-Record inklusive Revision sowie Settings
bleiben exakt unverändert, auch bei Fehlern, Wiederholung und echtem Offline-Reload.

## Verbindliche Abnahme / Releasegrenze

Unabhängige synthetische Tests:16Spalten/BOM/Reihenfolge, partielle Erkennung, ungültige
Schemata, genaue kleine/große/negative Beträge, Leerwerte/zu hohe Präzision, Zeitzonen-
und Kalendergrenzen, unbekannte Typen/Subtypen, mehrere/fehlende refid und doppelte/
konfligierende txid, feecurrency≠asset/EUR, HTML und unveränderte Eingaben.

Browser: bestehender nativer CSV-Einstieg, Erkennung/Modusschutz/gemischter Stapel,
alle Beine/Issues/Fee-Währung,50erAnzeigegrenze, Keyboard/Fokus/Escape/Cancel,
320/390/430/768/1440/Axe/44px, hostile CSV/programmatischer Submit, Neuöffnen und
Offline-Reload mit exakten IDB-/Settings-Nullmutationen. Über vorhandenen UI-Quality-
Einstieg in allen Pflichtengines und tatsächlichem3Engine-Produktionspfad.
Keine Workflow-/Pin-/Gatekürzung. Volle bestehende Finance/CAS/Restore/Offline-CI.

Diese reinlesende Vorschau hat keine Speicher-/Finanz-/Backupmutation. Nach zwei
Etappen geprüften PR sichern und kontrolliert stoppen; Release als folgende Etappe.
Aktive wirtschaftliche Übernahme braucht eigene belegte Fach-/kritische Releasefreigabe.
Fehlende Trades/Balances/unabhängige Anfang-Endreferenzen bleiben konkret offen;
derzeit nicht verfügbare Originale nicht erneut pauschal anfordern.
FLH03-03 und Gesamtmaster bleiben PARTIAL; FLH05/PERF/FLH-PROJ01 nicht vorziehen.
