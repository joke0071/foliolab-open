# FX-UI01 – native Flatex-Quarantänevorschau vor Code

Geprüfte Grundlage FX-FORMAT01: PR191/56c0b1397b02aa3041daf4f434340f530aeeedde,
853 Units und vollständige Pflicht-CI/Drei-Engine-Runtime grün.
Einziger Funktionsbranch bleibt feature/flh03-flatex-native-format, PR191 weiterverwenden.
Vorabvertrag auf dem zentralen Dokumentationsbranch separat sichern; keine zusätzliche
Status-/Vertrags-CI im Produkt-PR vor dem konsistenten UI-Commit erzeugen.

Vorhandenen CSV-Dialog, Lexer, readFlatexNativeBytes und Dialog-/Generation-/Submit-/
Fokus-/Abbruchmechanik wiederverwenden. Neues klar bezeichnetes Originalformat-
Vorschauprofil mit zwei Uploadfeldern Depotumsätze und Kontoumsätze, einzeln oder
gemeinsam, optional mehrere Teil-Dateien je Kategorie. Insgesamt maximal20 Dateien,
je2MB und zusammen5000 Datenzeilen. Falsche Kategorie, fremde oder gemischte Dialekte
sperren; alle Zeilen/Dateien getrennt erhalten, keine dateiübergreifende Dedup-/Summen-
oder Matcherbehauptung. Dateiherkunft, Zeile, Encoding, Einheiten/Währungen, Bank- und
Orderreferenzen sowie Issues sichtbar; bestehende Disclosure-Styles, 50-Zeilen-Paging
mit Fokus auf erste neue Zeile, Quelltexte vollständig escapen/Anzeige begrenzen.

Automatische native Erkennung vor striktem generischem Header-/Finanzmapping.
Erkennbare Originale auch im falschen Profil quarantänisieren; keine Umdeutung zu
generischen Buchungen oder zur bestehenden Flatex-Beta. Native Datei-Bytes über
arrayBuffer lesen; allgemeine/Legacy-CSV-Semantik erhalten, keine globale CP1252-
Interpretation fremder Formate. Getrennte Kategorieeingänge nur im neuen expliziten
Profil anzeigen. Beim Wechsel zwischen dieser Eingangsart und allgemeiner Dateiauswahl
alte Dateiauswahl sicher zurücksetzen; kein versteckter dateiübergreifender Zustand.

Native Vorschau ist immer read-only: Save deaktiviert, submitBlocked und eigener
Callbackguard; auch bei fehlgeschlagener Prüfung, erzwungenem Submit, schneller neuer
Auswahl, Abbruch/Escape/Neuöffnen oder verspätetem Lesen kein Finanzwrite.
Keine Konto-/Positionszuordnung, kein Bestandsersatz, Gebühren-/Steuer-/EUR-Annahme,
keine automatische Order-/Cashverknüpfung oder wirtschaftliche Freigabe.

Öffentliche Tests ausschließlich synthetisch. Unit-/Browsergates für Auto/Explizit,
Windows1252/Leerheader, getrennte/gemeinsame/Teil-Dateien, falsche Kategorien/Mischung,
harte Limits, exakte Werte/Referenzen/unbekannt/0, Escaping, Paging/Fokus, fünf Breiten/
Axe/44px, erzwungener Submit/Abbruch/Neuöffnen, verspätete Dateilesung/Generationsschutz,
echten SW-Offline-Reload und exakten IDB-Record/Revision/Settings ohne Änderung.
Vorhandene generische, Flatex-Beta-, Ledger-, Kraken- und Bitpanda-Gates unverändert.
Volle Pflicht-CI/Quell-/Bildreview; danach FX-UI02 kontrollierter reinlesender Release
mit voller Main-/Pages-/tatsächlicher Drei-Engine-Produktionsabnahme. SW201 noch
unveröffentlicht und bis zum Merge konsistent weiterverwenden.

Zwei Folgeetappen dieser Sitzung: FX-UI01 und gegebenenfalls FX-UI02 nach bestandenen
Gates. Order-/Mehrfachgegenbeinvertrag und wirtschaftlicher Import folgen getrennt.
UI-MASTER28 und DELETE-MASTER28 bleiben nächster passender Verwaltungsauftrag,
keine Parallelumsetzung oder private Produktivdatenänderung. Gesamtmaster PARTIAL;
bestehende Roadmap/Abhängigkeiten und FLH05/PERF/PROJ01-Vorrangregeln erhalten.
