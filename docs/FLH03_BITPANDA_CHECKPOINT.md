# BP03 – Dialoganbindung in Prüfung · 28.10.2026

Basis main c28053a109ed0338cdb040d88758766a1888a535 / v199 LIVE_ACCEPTED.
Funktional vorhandener Branch feature/flh03-bitpanda-preview / PR190, Basis-HEAD e83d3bddc2132ea5a5632902f5971e97679b0818.
BP01/BP02 bereits geprüft (40720747693/40720747688 SUCCESS), keine Wiederholung.
Zentrale maßgebliche Übergabe weiterhin auf feature/flh05-import-foundation in docs/WORK_RESTPAKETE_CHECKPOINT.md.

BP03 IN_PROGRESS: native Vorschau im vorhandenen CSV-Dialog, vor generischer Header-/Breitenprüfung und Finanzmapping. Genau eine Datei, Misch-/Fremdmodi gesperrt, erzwungener Submit gesperrt; bestehender Dialog-/Generation-/Abbruchvertrag erhalten. 50-Zeilen-Paging und Fokus auf erste neue Zeile, vollständige geparste Quellfelder und Issues, exakte Mengen/Gebühren in deklarierter Währung, fehlende Steuer unbekannt. Vorspanninhalte nicht ausgegeben. Neues reines Anzeigemodul in SW200 vorgecached. Keine Finanz-/Storage-/Backupänderung, keine Originaldaten übernommen.

13 gezielte Parser-/Anzeigetests, 844/844 gesamte lokale Units (0 Fail/Skip) und Syntax PASS; Browser-/CI-Abnahme noch offen. Lokale Chromiuminstallation zunächst an unvollständigem ZIP gescheitert; kein Browser-PASS behauptet. Synthetischer Browsergate über bestehenden Drei-Engine-/Produktionspfad: Vorspann/18-17/Erkennung, exakte Werte/unbekannte Steuer, fünf Breiten/Axe/44px, Paging/Fokus/Abbruch/Neuöffnen, Misch-/Fremd-/Schema-/Submitguards, unveränderter IDB-Record/Revision/Settings, echter SW-Offline-Reload, keine externen Requests. Zusätzlich allgemeine Semikolon-CSV mit zitiertem Komma gegen Erkennungsregression.

Nächster Schritt: vollständige lokale Units und unveränderte Pflicht-CI/Quell-/Bildreview abschließen, Kandidatenstand zentral sichern. BP04 erst danach: kontrollierter Merge/Main/Pages/tatsächliche Drei-Engine-Liveabnahme samt Assets/Bildern. Zwei Folgeetappen BP03/BP04, dann sicherer Stopp. Master/FLH03-04 bleiben PARTIAL; wirtschaftliche Importfreigabe nicht erteilt. Original-/Flatex-/FLH04-/Hardware-/Fachgates getrennt erhalten, FLH05/PERF/PROJ01 nicht vorziehen.

---

# FLH03-04-BP02 – reiner Bitpanda-Parserkandidat

Basis v199 LIVE_ACCEPTED/main c28053a109ed0338cdb040d88758766a1888a535.
Einziger Funktionsbranch: feature/flh03-bitpanda-preview.
Vorabvertrag: e22a803ae03057744701587f421e11f724852dca / FLH03_BITPANDA_CONTRACT.md.

- BP01 DONE; BP02 IN_PROGRESS bis CI und Scope-Review.
- Gemeinsam extrahierter CSV-Zeichenautomat, generischer parseCSV bleibt strikt.
- Native bestätigte18/17-Spaltenform und begrenzter Vorspann; keine sensiblen Vorspannwerte im Ergebnis.
- Fehlendes/leer-/Strich-TaxFiat unbekannt, explizites0 bleibt0. Decimal18 exakt.
- Zeitoffset, Fiat/Asset/Feeasset/Spread/Product/In-Out erhalten, keine wirtschaftliche Ableitung.
- Alle Zeilen/doppelte/konfligierende IDs erhalten; tiefimmutable Ausgabe ohne Schreib-API.
- Noch keine Dialog-/Buchungsintegration. BP03 UI und BP04 Release separat.
- Originale privat, Fixtures vollständig synthetisch; kein Finanz-/Storage-/Migrations-/Backupumbau.
- Lokal21gezielte Tests/842gesamteUnits/0Fail/0Skip und Syntax PASS.
- Zusätzlich1529synthetische Vergleichsfälle bestätigen generische Ergebnisse/Ablehnungen gegen vorherigenParser.
- Browser- und finale Pflicht-CI noch offen, kein lokaler Browser-PASS behauptet.
- Neuer Runtimegate über vorhandenen UI-Quality-/Drei-Engine-/Produktionspfad.
- Unveränderte Pflichtgates/Pins/Workflows; csv-records/bitpanda-preview inSW200 vorgemerkt.
- SW200 unveröffentlicht, Produktion bleibtv199 LIVE_ACCEPTED.
- NächsterSchritt regulärePR-CI/3Engine-Runtime/Offline/exakteIDB-/Settings-Nullmutation prüfen,
  gesamtenDiff/identischeBäume reviewen; dann nachzweiEtappen zentral sichern/stoppen.
- Aktueller zentraler Nachweis auf feature/flh05-import-foundation ist bei späterer
  Statusfortschreibung maßgeblich; dieser Kandidatencheckpoint bleibt historischer Commitnachweis.
