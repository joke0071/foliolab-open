# AT02-B – Finanzvertrag, Referenzen und Wiederaufnahme

Issue #126 · Master #124 · Basis main `01a681960c0823010efe7e3599eb1d8512383673` / Produktion v150. Branch `feature/at02-b-interest-scenarios`. Kein Merge/Deployment. AT02-A/AT03-A bleiben bestehen.

## Checkpoint 1 – Vertrag vor Implementierung

Reine unverbindliche Brutto-Szenariorechnung für zukünftige Tages-/Kontoguthaben mit konstant angenommenem Kapital in Kontowährung. Kapital am expliziten lokalen Berechnungsstichtag aus eindeutig zugeordneten, nicht ausgeschlossenen Standard-Cashpositionen dieses Kontos; Journalwidersprüche blockieren. Keine historische Rückprojektion, FX, Steuer, Zinseszinsen oder automatische Wiederanlage. Festgeld bleibt AT02-A; die Tagesgeldprognose gilt nicht für als Festgeld gekennzeichnete Konten.

- Methode pro Konto ausdrücklich `ACT/365F`, `ACT/360` oder `unknown` (Standard). Unknown kann gespeichert werden, blockiert aber jede Prognose. Beide zählen echte Kalendertage inklusive Schalttag; Nenner immer 365 bzw. 360.
- Zeitraum **[Start inklusive, Ende exklusive)**. Start frühestens Berechnungsstichtag; Enddatum danach, maximal 3660 Tage. Wechsel gilt ab Gültig-ab-Tag. Echte Kalenderdaten 1900–2199; UTC-Tagesnummern ohne DST-/Uhrzeitfehler.
- Optionales `interestTerms` am bestehenden Konto: `{version:1,dayCount,rates:[{fromDate,annualRateExact,knownThrough}]}`. Jahreszinssatz in Prozentpunkten (2.5 = 2,5 %), exakt bis 18 Nachkommastellen, −100 bis +100 %. Maximal 60 Einträge, chronologisch normalisiert; doppelte Startdaten, ungültige Daten oder überlappende bekannte Konditionen abweisen. Portfolioformat v3, keine Pflichtmigration.
- `knownThrough`: optionales vom Nutzer hinterlegtes **Bekannt-bis-Datum einschließlich**. Ohne Ende ist nur der Gültig-ab-Tag als konkrete Kondition hinterlegt; spätere Fortführung benötigt ausdrückliche Szenariozustimmung. Ein Eintrag ist kein unabhängiger Banknachweis oder Zukunftsversprechen. Neuer Eintrag ersetzt vorherigen Satz ab seinem Datum.
- Fehlende Startkondition blockiert auch mit Szenariozustimmung, niemals rückwärts auffüllen. Fehlende Zukunftskonditionen dürfen nur nach ausdrücklicher Zustimmung mit letztem Satz bis zum nächsten Wechsel fortgeführt werden; betroffene Teilperioden einzeln markieren.
- Fehlendes/uneindeutiges Kapital, Währungswiderspruch, unbekannte Rundung oder negatives Guthaben blockieren (keine Dispozinsengine). Nullsaldo ergibt bei vollständigen übrigen Daten null. Negative Zinssätze ergeben negative Bruttozinsen, keine Buchung.
- **Brutto = Kapital × Σ(Jahreszinssatz_i × Tage_i) / (100 × Jahresbasis)**. Bestehende `units`, `SCALE`, `exact`: Integer-Skalierung auf 18 Stellen. Produkte/Summen/Division bleiben BigInt-Rationalzahlen bis zur Endrundung; `mul`/`div` nicht verketten (Zwischenrundung).
- Einmalige Endrundung in ISO-Währungsuntereinheiten der vorhandenen Intl-Daten: EUR/USD/PLN 2, JPY 0, KWD 3. Nur erkannte Währungen; unbekannte/Edelmetall-/Testcodes oder fehlende Intl-Erkennung blockieren statt stiller 2-Stellen-Annahme. Kontodaten bleiben dabei gültig. Exakte Hälfte **von null weg**, auch negative Zinsen. Keine gerundeten Teilbeträge summieren.
- Parameter/Prognose flüchtig; nur Zinssatzmetadaten über bestehenden Konten-/Savepfad speichern. Niemals Prognose in Positionen, Vermögen, Journal, Cashflows, XIRR/TWR, Stichtagen, realisierten Erträgen oder automatischen Snapshots. Tatsächliche Zinsen nur über bestehende Buchungen.

## Primärquellen (25.10.2026)

[ISO 15022 MICO A004/A005](https://www.iso20022.org/15022/uhb/mt565-16-field-22f.htm): beide Jahresbasen. [ECMA-402 CurrencyDigits](https://tc39.es/ecma402/#sec-currencydigits): ISO-Unter­einheiten im Laufzeitformatierer; [SIX ISO-Standards](https://www.six-group.com/en/products-services/financial-information/market-reference-data/data-standards.html): offizielle Wartungsstelle. Keine Aussage über individuelle Bankvereinbarungen. Grenzen, Limits, Zustimmung und Rundung oben sind expliziter FolioLab-Produktvertrag, keine behauptete Bankabrechnungsnorm.

## Unabhängige Referenzen vor der Engine

`tests/reference/interest_reference.py` nutzt Python-Standardbibliothek, `Fraction` und tägliche Kalenderschleife, keine Appimports/Float. Sollwerte inkl. ungerundetem rationalem Wert in `tests/fixtures/interest-reference.json`. Reproduktion: `python3 tests/reference/interest_reference.py > /tmp/interest-reference.json`; mit Fixture vergleichen. JS wird stattdessen abschnittsweise rechnen.

| Referenz | Kapital/Währung | Zeitraum [Start, Ende) | Methode | Tage | Brutto |
|---|---|---|---|---:|---:|
| constant | 10000 EUR | 2026-01-01 – 2027-01-01 | ACT/365F | 365 | 250.00 |
| mid-month change | 10000 EUR | 2026-01-01 – 2026-02-01 | ACT/365F | 31 | 19.04 |
| year boundary | 10000 EUR | 2025-12-31 – 2026-01-02 | ACT/365F | 2 | 1.10 |
| leap day fixed denominator | 10000 EUR | 2024-02-28 – 2024-03-01 | ACT/365F | 2 | 1.37 |
| leap day 360 | 10000 EUR | 2024-02-28 – 2024-03-01 | ACT/360 | 2 | 1.39 |
| whole leap year fixed | 10000 EUR | 2024-01-01 – 2025-01-01 | ACT/365F | 366 | 250.68 |
| month 360 | 10000 EUR | 2026-01-01 – 2026-02-01 | ACT/360 | 31 | 21.53 |
| month 365 | 10000 EUR | 2026-01-01 – 2026-02-01 | ACT/365F | 31 | 21.23 |
| zero rate | 10000 EUR | 2026-01-01 – 2027-01-01 | ACT/365F | 365 | 0.00 |
| zero principal | 0 EUR | 2026-01-01 – 2027-01-01 | ACT/365F | 365 | 0.00 |
| tiny principal | 0.01 EUR | 2026-01-01 – 2026-01-02 | ACT/365F | 1 | 0.00 |
| large exact principal | 123456789012345678901234567890.12 EUR | 2026-01-01 – 2027-01-01 | ACT/365F | 365 | 4259259220925925922092592592.21 |
| USD no FX | 10000 USD | 2026-01-01 – 2027-01-01 | ACT/365F | 365 | 250.00 |
| JPY zero digits | 10001 JPY | 2026-01-01 – 2027-01-01 | ACT/365F | 365 | 250 |
| KWD three digits | 1 KWD | 2026-01-01 – 2027-01-01 | ACT/365F | 365 | 0.005 |
| half cent away from zero | 1 EUR | 2026-01-01 – 2027-01-01 | ACT/365F | 365 | 0.01 |
| below half cent | 0.999999999999999999 EUR | 2026-01-01 – 2027-01-01 | ACT/365F | 365 | 0.00 |
| negative rate half cent | 1 EUR | 2026-01-01 – 2027-01-01 | ACT/365F | 365 | -0.01 |
| no intermediate rounding | 1 EUR | 2026-01-01 – 2027-01-01 | ACT/365F | 365 | 0.01 |
| change at exclusive end ignored | 10000 EUR | 2026-01-01 – 2026-01-02 | ACT/365F | 1 | 0.68 |
| change at inclusive start | 10000 EUR | 2026-01-02 – 2026-01-03 | ACT/365F | 1 | 0.00 |

Zusätzliche Gates: fehlende Startkondition, unbekannte Methode, unbestätigte Zukunft ohne Zustimmung, ungültige/überlappende Daten, negatives Guthaben und nicht erkannte Währung blockieren. Nullzinssatz ist gültig, kein fehlender Wert.

## Checkpoints / Wiederaufnahme

1. Vertrag und Referenzen vor Engine in #126 sichern; committen/pushen, früh Draft-PR.
2. Reine Engine: gezielte Referenztests erst rot, dann Implementierung/grün; Commit/Push.
3. Optionales Kontomodell, Validierung, alte/verschlüsselte Backups und Finanzisolation; Commit/Push.
4. Bestehender Kontodialog, eingeklappter Zinsbereich, flüchtige Prognose; UI/Offline/Mehrtab/A11y in drei Engines. Keine neue Navigation.
5. npm run check/npm test und vollständige CI; finale SHA-/Test-/Resume-Nachweise in #126/#124 und PR. Kein Merge/Deployment.

Bei Wiederaufnahme zuerst #126/#124/PR, letzten Remote-Commit/Tests und main vergleichen, nur offene Schritte fortsetzen. Reale Drive-/Hardware-/Recoverygates #44. Alter CSP-Legendenfarbhinweis außerhalb dieses Pakets.

## Implementierte Bedienung / Checkpoint 4

Bestehender Kontodialog → standardmäßig eingeklappter Bereich „Zinssätze und Prognose“. Aktivierung ist optional. Pro Abschnitt Gültig-ab, Jahreszinssatz (%) und optional bekannt-bis einschließlich; Methode ausdrücklich, aktueller hinterlegter Satz als Text, weitere Abschnitte hinzufügen/entfernen. Erst Speichern persistiert die Metadaten. Bei neuen Konten ist die Vorschau nach dem Speichern verfügbar.

Die ebenfalls eingeklappte Hochrechnung nutzt die ungespeicherten Formularbedingungen als Vorschau und aktuelles erfasstes Kontoguthaben als Kapitalbasis. Zeitraum/Szenariozustimmung und Ergebnis bleiben flüchtig. Vorschau allein markiert den Kontoeditor nicht als ungespeicherte Metadatenänderung. Geänderte Eingaben oder fremder Tab verwerfen das Ergebnis; veralteter Tab darf weder rechnen noch speichern. Geänderte Kontowährung und Festgeldkennzeichnung blockieren die Vorschau. Keine neue Navigation, kein Diagramm, keine zusätzlichen Gesamtsummen.

`interest-scenario.js` ist die reine Rechenlogik; `interest-account.js` prüft heutige Kontobasis/Journal; `interest-ui.js` kapselt nur Formular/Anzeige. `createAccount` normalisiert optionale Daten, wodurch vorhandener Import/Restore dieselben Gates nutzt. Journal-/Backupengines bleiben unverändert; die bestehende Storageengine wird weiterverwendet. Bank-/Prognosebeträge werden niemals über JS-Number gerundet; Anzeige bleibt exakter Text in Kontowährung. Bestehende Positionsfactory unterstützt eine begrenzte Währungsliste: wenn Kontowährung und tatsächliche Cashposition nicht zusammenpassen, keine Prognose; kein Umwandeln von Kontowährungen. Neue Backups mit Zinsmetadaten mit dieser oder neuerer Version öffnen, ältere Appversionen kennen diese Felder nicht.

Neue Browserreferenz enthält zwei Tagesgeldkonten derselben Bank, echten gebuchten Zinsertrag als unveränderte Ausgangslage, unterschiedliche Konventionen/Sätze, Wechsel nach 15 Tagen, fehlende Methode/Zukunft, doppelte Daten, vergangenen Prognosestart, USD ohne belegte FX-Quelle/Datum, Festgeldblockade, Escape ohne falschen Änderungsdialog bei reiner Vorschau, 320–1440px/Axe, AT03-A-Vergleich, aktuelle verschlüsselte Vollsicherung und echte Datei-Restores (alt/neu), tatsächlichen HTTP-Serverausfall mit Offline-Neustart, echte Zweittabkollision und bestehende IndexedDB-Migration/Save/Reload.

Befunde vor Push: ein Testlocator war wegen vorhandener Kontenübersicht mehrdeutig (auf Kontenverwaltung begrenzt). Neue UI-Listener lebten zunächst am dauerhaften Editor-Form und verursachten nach Dialogwechsel Nullzugriffe; Bindung jetzt an austauschbaren Zinsbereich bzw. konkrete vorhandene Steuerelemente, bestehende AT02-A-Prüfung wieder grün. Browserfixture hatte zunächst künstlich `fxRate:null` direkt in kanonische Positionen geschrieben; vorhandene Factory normalisiert dies schon vor AT02-B auf Default 1. Browserfixture verwendet deshalb gültige bestehende Positionen ohne FX-Quelle/Datum, weiterhin ohne belastbare EUR-Grundlage; reine Kontorechnung wird zusätzlich mit null-FX auf unveränderte Eingaben getestet. Keine Änderung der vorhandenen FX-Engine oder Schwächung bestehender Assertions.

Der existierende AT02-A-Workerupgrade-Test war auf Zielcache v150 fest kodiert. Jetzt wird ausschließlich das neue Ziel aus sw.js ermittelt; tatsächlich gelieferter v149-Altworker ohne neue Module, Aktivierung, Entfernung des alten Caches und alle Offline-/Datenassertions bleiben erhalten. AT02-A-Produktcode unverändert. Branch-PWA v153 ist nur vorgeschlagen, Produktion weiterhin v150. Finale CI/SHAs stehen in #126/#133.

## Integrationsnachweise / Checkpoint 5

Neue lokale Gesamtzahl 588 Tests (555 Baseline + 26 Rechen-/Gate- + 5 Konten-/Backup-/Isolations- + 2 Darstellungsreferenzen), alle bestanden; Syntaxcheck bestanden. Der neue Chromiumtest und die bestehende AT02-A/AT03-A-Kombination inklusive tatsächlichem Workerupgrade sind lokal grün. Cross-Engine-Job aus CI 40173205761 am UI-HEAD c3eb891 erfolgreich; die finale CI muss auch den nachfolgenden Abnahmecommit prüfen.

Der erste vollständige UI-CI-Lauf stoppte ausschließlich an zwei beabsichtigt veränderten Kontodialogbildern: 640×738 statt 640×732. Bilder aus unveränderlichem Actions-Artefakt **12590762706**, Lauf **40173205761**, HEAD **c3eb891c04c212ba5080085eecc2127da0d3835c**, ZIP-SHA256 **b427c0820c1a75da8638b6966edc94f6be7634dbd386a8b6bb98af7b3227d196** separat angesehen: Kontrollen/Footer passen, Inhalt bleibt scrollbar. Genau diese zwei Referenzen aktualisiert; übrige 18 bytegleich, Größen-/RGB-/Fehlergrenzen und Tests unverändert. Lokaler Pixelvergleich aller 20 Bilder anschließend bestanden. Keine Baseline aus unkontrollierten aktuellen Screenshots erzeugt.

Geöffnete Prognose visuell geprüft: Betrag, Periode, Methode, Kapitalannahme, Szenarioabschnitte und Footer lesbar. Dabei blieb nach Entfernen einer doppelten Zinskondition eine veraltete Formularfehlermeldung stehen; jetzt löscht eine Änderung der Zinskonditionen diese alte Eingaberückmeldung, nicht den Speicher-/Mehrtab-Schutz. Gezielt mit gleicher Duplikatsblockade plus neuer Feedbackassertion erneut bestanden. Zwischenstand Branch-Cacheversion **v154**; keine Produktion verändert.

Finale Abnahme gilt erst nach vollständiger CI am letzten gepushten HEAD; genaue Referenz im PR/#126. Fremder paralleler Icon-PR #134 bleibt unberührt. Vor späterem Merge main, PRs, gemeinsame app.js/styles.css/sw.js/Workflow-Dateien und Cacheversion erneut prüfen. Kein Merge/Deployment Bestandteil dieses Auftrags.


## Zusätzliche Abschlussprüfung – Lesekonflikt im IDB-Modus

CI 40173627355 am HEAD 9a74fae war mit 588 Tests/Chromium/Firefox/WebKit vollständig grün. Der danach gezielt gelesene IDB-Pfad zeigte eine tatsächliche Lücke der neuen Prognose: normale IDB-Peercommits senden kein Legacy-storage-Event. Bestehendes CAS schützte weiterhin Schreibzugriffe, aber eine neue Prognose konnte einen veralteten In-Memory-Stand lesen. Neue echte Zweittab-IDB-Referenz reproduzierte zunächst rot (alte Prognose 202,16 EUR statt Blockade).

Minimaler Fix: `PortfolioStorage.assertCurrent()` liest nur vorhandene Legacy-Bytes bzw. IDB-Revision/Migrationsmarker und lehnt Abweichungen ab. **Kein** Übernehmen der neuen Revision, Reload, Finanzdatenmutation oder Schemawechsel. AT02-B ruft dieses Gate vor dem Rechnen auf; bestehende Speicher-/CAS-/Restorepfade bleiben unverändert. AT02-A/AT03-A-Produktcode unverändert.

Die Vorschau wartet nun auf diese Prüfung, sperrt währenddessen den Rechenbutton und verwirft asynchrone Ergebnisse bei zwischenzeitlichen Eingaben/Dialogwechseln. Browserprüfung wartet auf den tatsächlichen Abschluss, prüft auch sofortige Parameteränderung während des Lesens sowie den anschließenden unverändert wirksamen Schreibkonflikt. Neue Node-Referenz beweist unveränderte Bytes/Revision auch nach fehlgeschlagenem Lesegate; echter IDB-Beobachter bestätigt ebenfalls, dass keine Peerrevision übernommen wird.

Lokaler Abschlussstand: **589/589 Node-Tests**, Syntax, erweiterter Chromiumtest einschließlich beider Speichermodi und vorherige AT02-A-/Workerupdate-Prüfung grün. Branch-PWA jetzt **v155**, 91 Assets, Produktion unverändert v150. Vor Endabnahme volle CI am neuen finalen HEAD abwarten; SHAs/Resultate im PR/#126. Keine Erweiterung anderer Roadmappakete und kein Merge/Deployment.
