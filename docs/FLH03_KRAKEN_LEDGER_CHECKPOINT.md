# FLH03-03 – Kraken-Ledger-Prüfvorschau, Kandidatenstand

Basis v198 LIVE_ACCEPTED / main `8391dc0a8478af7e1aeb860b8b705217fdd24546`.
Einziger Funktionsbranch `feature/flh03-kraken-ledger-preview`.
Vertrag vor Code: `314c4fc6a2c44ff1e1698cb62efaf0de007fb720`,
[FLH03_KRAKEN_LEDGER_CONTRACT.md](FLH03_KRAKEN_LEDGER_CONTRACT.md).

**KRAKEN01 DONE. KRAKEN02 IN_PROGRESS:** Implementierung und lokale Fachprüfung bestanden,
finale Pflicht-CI/Browser-/Quell-/Bildabnahme noch offen. SW199 unveröffentlicht.

## Begrenzte Implementierung

- Reine native16-Spalten-Projektion über vorhandenes parseCSV und Decimal.
  Alle Quellzeilen, Mehrbeingruppen, doppelte/konfligierende txid sowie fehlende
  Referenzen bleiben erhalten; keine automatische wirtschaftliche Zuordnung.
- Mengen/Gebühren/Saldo und USD-Zusatzwerte als genaue Dezimalstrings; Leerwert bleibt
  unbekannt. Deklarierte feecurrency unverändert, keine automatische EUR-Umrechnung.
  UTC ist als Quellenbeschreibung benannt; keine lokale Browserzeitzone unterstellt.
- Typ/Subtyp/Klasse/Datum/Referenz-/Präzisionsprobleme sichtbar. Native partielle oder
  falsch gewählte Formate vor generischem Mapping gesperrt, nur eine Datei.
- Bestehender CSV-Dialog mit Auto-/Kraken-Vorschauoption, Disclosures/50erSeite/
  Weitere-Anzeigen, HTML-Escaping und begrenzter Anzeige ungewöhnlich langer Felder.
  Gemeinsame Dialog-/Submit-/Generation-/Cancel-/Fokusmechanik wiederverwendet.
- Submit sowohl per Buttonzustand, bestehendem submitBlocked als auch Callback
  gesperrt. Keine Buchungen, Bestände, Cashflows, Einstandswerte, Steuerbasis oder
  dauerhafte Import-/Backupdateien. Kein neuer Journal-/Storage-/CASpfad.
- Vorhandenen UI-Quality-Einstieg um Kraken-Browsergate ergänzt; damit alle bisherigen
  Pflichtengines und tatsächlicher Drei-Engine-Produktionspfad erhalten.
  Keine Workflow-/Pin-/Gateänderung. Zwei neue Module im SW199-Precache.

## Belegte lokale Nachweise

Zehn neue unabhängige Fachtests PASS; vollständige831/831Units/0Fail/0Skip und
Syntaxprüfung PASS. Exakte große/kleine/signierte Beträge, leere/ungültige Werte,
Kalendergrenzen, schemagebundene Quarantäne, unbekannte Typ-/Subtypkombinationen,
Mehrbeine/fehlende Referenzen, doppelte/konfligierende txid, Gebührenwährung,
unveränderte/deep-frozen Ausgabe, hostile Texte/50erAnzeigegrenze.
Ein früher lokaler Gesamtlauf lieferte keinen belegbaren vollständigen Abschluss;
daraus kein PASS behauptet. Finaler explizit abgewarteter Lauf831/831 ist maßgeblich.

Lokaler Browsernachweis nicht behauptet: erwartete Playwright-Binärdatei in der
übernommenen Umgebung fehlt nach vorigem Checkpoint. Reguläre Pflicht-CI liefert
den tatsächlichen Nachweis; keine Download-/Retryschleife oder Testumgehung.

## Offene Gates und nächste Aktion

Finale reguläre CI und Chromium/Firefox/WebKit, tatsächliche Screenshots,
exakter Kandidat-/Mergebaum und unabhängiger Quellscope prüfen. Browserfälle:
native Erkennung, Fee-Währung/alle Beine, Quarantäne/partielle Schemata/Moduswechsel/
gemischte Dateien, hostile Quellen,50/100Anzeige/Fokus,5Breiten/Axe/44px,
forcedSubmit/Escape/Cancel/Neuöffnen und echter Offline-Reload; vollständiger
kanonischer IDB-Record/Revision und Settings unverändert, keine externen Previewrequests.

Nach zwei Etappen geprüften Kandidaten auf bestehendem PR/Branch und zentralem
Checkpoint sichern; Release als nächste Etappe. Vor tatsächlicher Liveabnahme kein
v199 LIVE_ACCEPTED behaupten. Fehlende Trades/Balances/unabhängige Stichtage bleiben
offen. Aktiver wirtschaftlicher Import braucht eigene kritische Freigabe.
Originale bleiben privat; nur erfundene Fixtures. FLH03-03/Master PARTIAL.

