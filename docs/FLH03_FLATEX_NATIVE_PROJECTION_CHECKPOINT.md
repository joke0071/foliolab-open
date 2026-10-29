# Native Flatex-Übernahme: Zielgrößenkorrektur vor neuer voller CI · 29.10.2026

042076d2 wurde NICHT final abgenommen: Pflicht-CI40845406706 regulär abgeschlossen,
test/Cross1 SUCCESS, Cross2 FAILURE beim strikten44px-UIgate. Wallet40845406728
SUCCESS, kein Merge/Deployment. Befund zentral vor Korrektur ina8177cc9 gesichert.

Tatsächliche lokale Firefox157-Reproduktion auf unverändert archiviertem042076d2:
768px, flatexSimulationRun BoundingBox43.99998474121094 bei computed min-height44px.
Passender Playwright1.64.1/Firefox157 installiert; Browser zunächst Content-Sandbox-
Crash in dieser isolierten Containerumgebung, lokale Probe mit deaktivierter
Content-Sandbox erfolgreich. Dies ist keine Änderung an CI-/Produktschutzgates.
Gezielter CSS-Mindestwert45px ausschließlich für neue Simulationscontrols ergibt
45 bzw44.99998474121094px. Strikte >=44Assertion unverändert. Zusätzliche gemessene
Zielgrößen in Browserbericht, genaue Engine/Breite/Control/Geometrie bei Fehler.

Lokale korrigierte Chromium-Simulation/append/backfill und Firefox157-Simulation/
append/backfill inkl. aller neuen Backup-/Quota-/post-put-/CAS-/Undo-/Restore- und
Offlinegates PASS. Syntax PASS. Finanz-/Schreibpfad unverändert; nur CSS/SW208 und
präzisere Testdiagnostik. Vollständige neue aktuelle CI/Wallet/3Engine-/Artefakt- und
visuelle Abnahme steht aus. Produktion v204 unverändert. Keine Gates abgeschwächt,
keine neue Implementierungsrichtung. Eigene Nutzerentscheidung vor aktivem Release.

---

# Historischer aktiver Übernahmekandidat vor CI

Vorabvertrag für aktive Übernahme vor Code dauerhaft8bf23669 auf zentralem
Dokumentationsbranch gesichert, jetzt auch im PR. Read-only-UIkandidat a8adc396
vollständig abgenommen/zentral7d41718c: Pflicht-CI40842974152/Wallet40842974124,
939Units/3Engines/Artefakte/visuelle Bilder/Quellreview PASS. Kein Merge/Deployment.

Neuer aktiver Kandidat verwendet unveränderte prepareNativeFlatexPreview und
importCSV/PortfolioStorage-CAS. Nach zulässiger Simulation: aktuelles Backup ohne
Keys inklusive Historie, separate konkrete Übernahmebestätigung. Modus-/Quell-/
Konto-/Datei-/Simulationswechsel verwirft Backupbezug und Zustimmung. Vor Submit
Revision/Baseline/Generation und vollständige native Qualifizierung erneut prüfen;
Finanzzeilen müssen exakt der bestätigten Simulation entsprechen. Auf Clone
vorbereiten, vorhandenen aktuellen Snapshot/Undo wiederverwenden. Während des
atomaren Saves Dialogfelder inert; nach Fehler Zustimmung/Entwurf verwerfen.
Keine Cash-/Kosten-/Eröffnungsfiktionen oder Teilauslassung. Keine neue Engine.

Lokale939Units/0Fail/0Skip, Syntax und echte Chromium-Übernahme append/backfill PASS:
Backupinhalt/Keyausschluss/gesonderte Zustimmung/Resets/forciertes Submit, exakte
Endmenge/geschütztes zweites Depot gleicher ISIN/unbekannte Nebenkosten/keine
externen Cashflows, echte Quota und post-put-Abbrüche mit exaktem unverändertem
Record/Revision/Settings, genau eine akzeptierte CASrevision, nativer Replay ohne
neue Revision, exaktes UI-Undo samt Stichtag, gespeicherte Provenienz über Plain- und
EncryptedRestore, echter konkurrierender Schreiber NACH Frischeprüfung am CASpunkt
abgewiesen, Dialogfelder während Save tatsächlich inert, Offline-UIcommit.
Fünf Breiten/Axe/Fokus/44px und horizontale Aktionsgrenzen PASS;320px-Visuellerstbefund
zu lange Buttontexte durch kurze passende Beschriftungen korrigiert und erneut geprüft.
Bestehende Chromium-NativeUI-/Bindungs-/Betrags-/Simulationsgates ebenfalls PASS.

SW207 unveröffentlichter Kandidat. Aktuelle volle neue CI/Wallet/Firefox/WebKit- und
Artefakt-/Quellabnahme noch OFFEN. **Eigene konkrete Nutzerentscheidung vor Merge/
Deployment neuer wirtschaftlicher Buchungsmutationen erforderlich**; keine private
Originaldatei/Produktivdaten verändert. Vollständige Original-/Cash-/Sonderfälle
bleiben offen. Nach finalen Gates konkrete Releaseentscheidung vorlegen, keine
Freigabe für übrigen Master/FLH05/PROJ01 daraus ableiten. Diese bleiben geparkt,
UI-/DELETE-MASTER28/PERF01/FLH04/übrige Roadmap erhalten. Gesamtmaster PARTIAL.

---

# Historischer UIkandidat vor CI

Fortsetzung auf demselben Branch/PR195 nach abgenommener Grundlage631db637 und
regulär erfolgreicher Dokumentations-CI40841159604/Wallet40841159516. Vorabvertrag
03f60896 remote gesichert. Zentraler Mastercheckpoint auf
feature/flh05-import-foundation hat weiterhin Vorrang.

Neue lokale UIintegration DONE als Kandidat: ausdrücklich gewähltes append/backfill,
aktuelle bestehende Konto-/Quellbestätigung, bestehende prepareNativeFlatexPreview
ohne Änderung der Finanzlogik, exakte Mengen vorher/nachher und unbekannte Kosten.
Jeder Cash-/Sonder-/Konfliktfall blockiert den ganzen Stapel. Keine Auslassungsoption.
Frischeprüfung vor Simulation und vor Darstellung; Modus-/Konto-/Bestätigungs-/
Datei-/Format-/Dialoggeneration verwerfen Ergebnisse, Storagehinweis invalidiert
die Ansicht sofort. Kein aktiver Submit oder neuer Speicher-/Backupvertrag.

939 lokale Units/0Fail/0Skip und Syntax PASS. Neuer echter Chromium-Dialogtest
PASS: append leer/geschützter Bestand/backfill exakte Endmenge, unbekannte Kosten,
ganzstapelige Cash-/Sonderblockierung, verzögerte Kontoprüfung/Modus-/Datei-/
Escape-/Wiederöffnung, echter konkurrierender IDB-Schreiber zwischen beiden
Frischeprüfungen, erzwungenes Submit, echter SW-Offlinereload, exakter IDB-/Revision-/
Settings-Nullmutationsnachweis und keine externen Requests. Fünf Breiten/Axe/44px/
Fokus/hostile Namen PASS; tatsächliche320/1440Screenshots visuell geprüft.
Bestehende Chromium-NativeUI-/Bindungs-/Betrags-/Projektions-/CASgates ebenfalls PASS.
Neuer Dialogtest im bestehenden Drei-Engine-Einstieg; Workflows/Pins unverändert.

Noch OFFEN: vollständige neue aktuelle CI/Wallet/Firefox/WebKit-/Quell-/Artefaktabnahme.
SW206 unveröffentlichter Kandidat, Produktion main3e9f4877/v204 unverändert.
Aktive Übernahme bleibt separater nächster Schnitt nach diesem geprüften
UIkandidaten: Backup-/Bestätigung-/Baseline-/CAS-/Undo-/Kosten-/Bestandsschutzvertrag,
konkrete Implementierung und vollständige Kandidaten-/Releaseabnahme. Kein privater
Import. Native Originalgesamtdateien/Nicht-Handels-/Cash-/Sonderbelege weiter offen.

FLH05-Zukunftskompatibilitätsnachtrag875b49ff berücksichtigt: ausschließlich
bestehende gemeinsame Komponenten/Verträge wiederverwendet; keine zweite Engine,
Zusatzphase oder Refactoring. FLH05 und PROJ01 geparkt, PERF01 weiter essentielleP1.
UI-/DELETE-MASTER28/FLH04/übrige Roadmap erhalten. Gesamtmaster PARTIAL.

---

# Historischer Projektionskandidat vor CI

Basis main3e9f4877/v204 LIVE_ACCEPTED, Vertrag vor Code c4d9a330 gesichert. Maßgebliche aktuelle Übergabe immer docs/WORK_RESTPAKETE_CHECKPOINT.md auf feature/flh05-import-foundation; dieser Paketcheckpoint beschreibt den Kandidaten vor vollständiger PR-Abnahme.

Einziger Funktionsbranch feature/flh03-flatex-native-projection. Native EUR-Stückhandelsprojektion im bestehenden flatex-import.js; streng bestätigte reine Simulation über bestehende reviewNativeFlatexBindings/previewCSV/prepareFlatexBackfillPreview im flatex-backfill.js. Alle Quelllokatoren/Probleme erhalten, Cash/Sonderereignisse/Quellenkonflikte/Intraday/FX/Präzision blockieren den ganzen Stapel. Gebühren/Steuern bleiben unbekannt/null; kein Cashkonto/FX/Eröffnung/Kosten erfunden. Append nur leere ungeschützte Ziele oder unveränderte Source-Replays; Backfill bewahrt vorhandene beobachtete Endmenge und schützt Kosten/Journal/Stichtage. Kein aktiver UI-/Schreib-/Speicherpfad, äußere ready/writeEnabled false.

937Units unter Node20/0Fehler/Skip und Syntax PASS,17neue Fokusfälle. Chromium tatsächliche Modulsimulation/Replay/Manual-/Quellen-/Baseline-/Undo-/Offlineprüfung PASS, Primärprofil exakt IDB/Revision/Settings unverändert, separater synthetischer CAS-Kontext genau eine akzeptierte Revision und konkurrierender Entwurf abgelehnt. Plain-/Encrypted-Restore über bestehenden Kern getestet. Öffentliche Tests/Artefakte synthetisch.

Privater unabhängiger Python-csv/Decimal-/Namespacevergleich gegen native Originalprojektion PASS; ganze Originaldateien wegen Nicht-Handels-/Cash-/Prüffällen korrekt nicht qualifiziert. Alle Zeilen erhalten, keine Originalwerte/IDs/Zeiträume/Fingerprints veröffentlicht, keine private Produktivmutation. Keine vollständige historische/Bestands-/Kosten-/Cashflow-/Performancefreigabe.

Aktuelle volle PR-CI/Wallet/Drei-Engine-/Quell-/Artefaktabnahme steht vor abschließender Abnahme noch aus. SW205 nur unveröffentlichter Kandidat, Produktion v204. Zwei Etappen Vertrag + geprüfte Grundlage; UI-/Übernahme-/Releaseintegration separat. UI-MASTER28/DELETE-MASTER28/FLH04/P0/P1/PERF/ursprüngliche Roadmap und historischeStart01.01.2022/keine Fiktionen erhalten, PROJ01 Backlog. Gesamtmaster PARTIAL.
