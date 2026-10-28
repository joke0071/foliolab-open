# FX-FORMAT01 abgenommen, FX-UI01-Kandidat in Prüfung · 28.10.2026

Geprüfte Grundlage PR191/56c0b1397b02aa3041daf4f434340f530aeeedde:
Pflicht40745005502/Wallet40745005842 vollständig SUCCESS, 853 Units und
Drei-Engine-Runtimeberichte tatsächlich geprüft; Artefaktdigests und testedSHA
bestätigt. Zentraler Beleg auf feature/flh05-import-foundation in
release-evidence/flatex-native-format-candidate.json. Diese Grundlage nicht wiederholen.
Vorab-UI-Vertrag separat vor Code auf Dokumentationsbranch gesichert:
25b061e0661c6f81b4ad15540f0118a9569126c3 / FLH03_FLATEX_NATIVE_UI_CONTRACT.md.

FX-UI01 IN_PROGRESS bis finale Pflicht-CI/Scope-/Bildabnahme. Derselbe Branch/PR191.
Neues Originalformat-Profil im vorhandenen CSV-Dialog, getrennte Depot-/Kontoeingänge,
einzeln/gemeinsam/mehrere Teil-Dateien; 20-Dateien-/2MB-/5000-Gesamtzeilengrenzen.
Native Erkennung vor generischem Mapping, tatsächliche arrayBuffer-Bytes und bestehender
verlustfreier Decoder. Alle Dateien/Zeilen getrennt, keine automatische Dedup-/Order-/
Cash-/Finanzzuordnung. Bisherige Legacy-Flatex-Beta und andere Profile erhalten.
Native Save-/Callback-/submitBlocked-Guards, Kategorien-/Schema-/Fremdmodussperren,
Inputwechsel ohne versteckte Dateien, Generation-/Abbruch-/Fokusmechanik, 50-Zeilen-Paging.
Neues reines Anzeigemodul im noch unveröffentlichten SW201 vorgecached.

855/855 lokale Units (0 Fehler/Skip), Syntax PASS. Neue Chromium-Abnahme PASS:
Auto/Explizit/CP1252/Leerheader/exakte Werte/Referenzen/Quelltext-Escaping,
getrennte/gemeinsame/Teil-Dateien, falsche Kategorien/Misch-/Fremd-/Schema-/harten Limits,
zehn Layoutzustände (Vorschau + zwei Eingänge bei fünf Breiten), Axe/44px,
Paging/Fokus/Escape/Cancel/Neuöffnen, erzwungener Submit, kontrolliert verspätete
Dateilesungen, echter SW-Offline-Reload, exakter IDB-Record/Revision/Settings unverändert,
keine externen Vorschaurequests. Lokale Bilder Eingänge320/Detail1440 angesehen, kein Blocker.
Öffentliche Fixtures rein synthetisch; keine neuen privaten Daten geöffnet oder verändert.

Nächster Schritt vollständige reguläre PR-CI/Wallet und tatsächliche neue Berichte/
Artefaktdigests/Bilder prüfen, finalen Scope und identische Bäume bestätigen und zentral
sichern. Danach FX-UI02 kontrollierter reinlesender Release nur bei grünen Gates,
volle Main-/Pages-/tatsächliche Drei-Engine-Produktionsabnahme. Zwei Folgeetappen
UI01/UI02 dieser Sitzung; danach sicherer Übergabestand. Produktion derzeit v200,
kein Merge/Deployment dieses Kandidaten begonnen. Order-/Mehrfachgegenbeinvertrag und
wirtschaftliche Integration gesondert. UI-MASTER28/DELETE-MASTER28 bleiben erhalten,
keine privaten Produktivdatenänderungen ohne ausdrückliche Freigabe; Master PARTIAL.

---

# Node20-Decodierung korrigiert, finale CI noch offen · 28.10.2026

Erstkandidat ee5795bcfd92b303dafbfd9e9f1048d1d097daa8: Wallet40743513720
fehlgeschlagen im neuen Eurozeichen-Test; Haupt-CI40743513733 läuft regulär weiter.
Node20.20.2-Decodierung von CP1252-C1-Bytes lokal unabhängig reproduziert:
0x80 wurde U+0080 statt U+20AC. Keine Behauptung einer unbewiesenen internen
Laufzeitursache, keine Assertion abgeschwächt.

Begrenzte Korrektur: explizite CP1252-C1-Zuordnung nach WHATWG-Primärindex
https://encoding.spec.whatwg.org/index-windows-1252.txt, bounded Chunk-Decodierung
und Kontrollzeichen-Issues. UTF8-Fatalprüfung und übriger Fachvertrag unverändert.
Alle 32 C1-Zuordnungen unabhängig als erwartete Zeichen im Unit-/Browsergate geprüft.
853/853 gesamte Tests unter Node20 und lokalem Node24, 0 Fehler/Skip, Syntax PASS.
Korrigierter Chromium-Runtime-/Offline-/exakter Nullmutationsgate und beide privaten
Originale mit vollständigem unabhängigen Feld-/Datum-/Decimalvergleich erneut PASS.

Keine weitere Produktänderung außerhalb FX-FORMAT01, SW201 unveröffentlicht.
Nach regulärem Ende des Erstlaufs korrigierten Kandidaten auf demselben PR191
sichern und volle unveränderte Pflicht-CI erneut prüfen. Dieser Commit allein
behauptet noch keine finale CI-Abnahme. Produktion v200, Gesamtmaster PARTIAL.

---

# FX-FORMAT01 – Kandidat in Prüfung, 28.10.2026

Basis main b2a07f4131a7b38d1fa7da40fab8ea58b72fd119 / v200 LIVE_ACCEPTED.
Einziger Funktionsbranch: feature/flh03-flatex-native-format.
Vorabvertrag separat vor Code gesichert: 412852f63091ece0d879e698c4fd65ba376ef63e.
FX-AUDIT01 DONE auf zentralem Dokumentationsbranch in 814a092b60ca802c049a7cd9c64de40244d1e147;
maßgeblicher Gesamtcheckpoint bleibt docs/WORK_RESTPAKETE_CHECKPOINT.md dort.

FX-FORMAT01 IN_PROGRESS bis vollständiger PR-CI und finalem Scope-/Runtime-Review.
Reine native 12-/10-Spaltenprojektion auf gemeinsamem CSV-Lexer/Decimal-Kern;
Blankspalten vollständig positionsgetreu, UTF-8/Windows-1252 ohne Ersatzzeichen,
getrennte Quellzahlen/Währungen/Daten/Referenzen, dokumentarische Ereignisse,
alle doppelten/konfligierenden Zeilen erhalten, tief immutable ohne Import-API.
Keine Änderung von app.js, parseCSV oder prepareFlatexImport, keine wirtschaftliche
Freigabe, kein Finanz-/Storage-/Migrations-/Backupumbau. SW201 unveröffentlicht.

Lokal 852/852 Units (0 Fehler/Skip), Syntax und neue Chromium-Runtimeprüfung PASS:
native Bytes tatsächlich decodiert, Blankspalten, exakte Zahlen, unbekannt/0,
getrennte Referenzen, negative Schemata, echter SW-Offline-Reload/Modulimport,
exakter IDB-Record/Revision/Settings unverändert, keine externen Requests.
Beide privaten Originale vollständig lokal gelesen; sämtliche Quellfelder und
Datum-/Decimal-Projektionen unabhängig mit Python-csv/Decimal geprüft und gleich.
Keine Originalzeilen, Kennungen, privaten Mengen/Zeiträume/Beträge/Fingerprints
in Repository/Fixtures/CI. Keine vollständige Historien-/Bestandsabnahme behauptet.

Nächster Schritt: reguläre vollständige Pflicht-CI/Wallet/Chromium/beide
Firefox-WebKit-Shards abwarten, tatsächliche neue Runtimeberichte/Artefaktdigests
und identische Kandidaten-/Merge-/Lokalbäume prüfen; zentral dauerhaft sichern.
Nach zwei Etappen Audit + Formatgrundlage sicheren Kandidaten übergeben.
Später nächster Schnitt: getrennte Depot-/Kontouploads und native Quarantänevorschau;
Order-/Mehrfachgegenbeinvertrag und wirtschaftliche Integration separat.
Kein Merge/Deployment dieser noch nicht dialoggebundenen Grundlage behauptet;
Produktion bleibt v200 LIVE_ACCEPTED. Gesamtmaster/FLH03-05 PARTIAL,
UI-MASTER28 und ursprüngliche Folge erhalten; FLH05/PERF/PROJ01 nicht vorziehen.
