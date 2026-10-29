# UI-MASTER28 / FLH-PERF01 – Android-Ergänzung · 29.10.2026

Verbindlicher ergänzender Nutzerauftrag, zweimal identisch übermittelt und einmal konsolidiert. Kein neuer unabhängiger Großauftrag. Repository https://github.com/joke0071/foliolab-open · Produktion https://foliolab.unperfekt.at/ · zentraler Checkpoint docs/WORK_RESTPAKETE_CHECKPOINT.md auf feature/flh05-import-foundation. Bezug: bestehender Master, konsolidierter UI-/UX-Auftrag, FLH-PERF01, Sonnet-Audit, Android-Screenshots vom25.–29.10.2026.

## 1. Ziel und Architektur

FolioLab auf Android kompakt, durchdacht und schnell bedienen: (1) sinnvoll responsive Inhalte, Diagramme, Listen und Aktionen; (2) schneller sichtbares, bedienbares tatsächliches Portfolio auch bei großer lokaler DB; (3) flüssige Navigation, Filter, Charts, Akkordeons und Verwaltung. Keine verkleinerte Desktopdarstellung, keine Gesamtneugestaltung oder neue Architektur.

VanillaJS/HTML/CSS, Local-first, IndexedDB-only, vollständig offline, keine verpflichtende Serverinfrastruktur oder zentralen privaten API-Schlüssel. Finanz-, Speicher- und Sicherheitsverträge uneingeschränkt erhalten.

## 2. Kollision und gesicherter Ausgangspunkt

Laufende Arbeit, PRs, Tests, CI, Reviews und Releases regulär abschließen; nicht abbrechen, neu starten oder umpriorisieren. Keine parallele Implementierung, keine doppelte Startoptimierung. Vor Arbeitsbeginn tatsächlichen GitHub-/Produktivstand rekonstruieren; vor Änderungen Branches/PRs/Writer/Actions/Checkpoint prüfen.

Nutzer nennt als historischen Stand v212, PR200HEAD870f4c07, unveröffentlichtenSW213 und synthetisch3113,9→1542,8ms(-50,45%). Neuerer nachgewiesener Stand bei Übernahme: PR200 freigegeben und **v213/SW213 LIVE_ACCEPTED**, main6ec0cf9c6e28edf1b19993357c3b839106b8aa80, Pipeline40916302834SUCCESS,950Tests/dreiBrowser/120Assethashes. Zusätzliche tatsächliche Produktionsmessung3186,6→1611,3ms(-49,44%) für1000Positionen/1825Referenzen. Kein Android-Hardwarebenchmark; nicht darauf übertragen. Belege docs/release-evidence/perf01-v213-live-accepted.json. Aktiver UI-Schnitt PR201 wird unverändert zuerst abgeschlossen.

## 3. Android-Layouts und Viewports

Alle fünf Hauptbereiche: Übersicht, Verlauf, Positionen, Buchungen, Mehr/Einstellungen.
Breiten320/360/390/412/430px, zusätzlich768/1440px. Hoch-/Querformat, dynamische Chrome-Adressleiste, installierte Standalone-PWA, Systemnavigation, Safe-Area-Insets, kleine Höhen, vergrößerte Systemschrift, Bildschirmtastatur, Browserzoom und Textvergrößerung berücksichtigen.
Kein horizontaler Überlauf, abgeschnittener Inhalt oder verdeckte Aktionen. Browser-/Viewport-/Touch-Emulation gesondert dokumentieren; echte Chrome-Adressleiste/Systemtastatur/Hardware nicht daraus ableiten.

## 4. Informationsdichte

Kartenhöhen und Innenabstände, verschachtelte Akkordeons, doppelte Linien, unnötige Rahmen, hohe Listenzeilen, lange Technikhinweise, Verwaltungsleisten, Dialoge, Positionsdetails, GebuchteVorgänge, Referenzwerte und Kontodatenstände gezielt prüfen.
Wesentliches und häufige Aktionen früh sichtbar; keine großen Leerflächen zwischen zusammengehörigen Angaben. Technik nachrangig; für Qualität/Sicherheit nötige Information nicht entfernen. Bereits beauftragte UI-Korrekturen gemeinsam nutzen statt doppelt implementieren.

## 5. Android-Startperformance P1 / FLH-PERF01

Bestehende Optimierung erhalten und nur tatsächliche Android-Deltas bearbeiten. Messen:
- Start bis erste sichtbare Oberfläche, tatsächliches Portfolio, vollständig interaktives Dashboard und historische Charts.
- IndexedDB-Laden, Rekonstruktion, initiale JS-Ausführung, DOM-/Chartrendering, Main-Thread-Blockaden und relevante Speicherbelegung.
- Kalt-/Warmstart getrennt; Seed und Cachezustand präzise definieren.

Szenarien:
A etwa20Positionen mit normalerHistorie.
B etwa100Positionen mit mehrerenTausendBuchungen und historischenPunkten.
C bestehendes1000Positionen/1825Referenzen-Stressprofil.
D Offline-PWA mit vollständig vorhandener lokalerDB.

Langsame Schritte durch echte Profile identifizieren; keine theoretische Optimierung. Oberfläche früh sinnvoll zeigen, keine unbestätigten/vorläufigen Finanzwerte als endgültig. Ruhige verständliche Ladezustände, keine unnötige Blockierung erster Interaktion.

## 6. Navigation P1/P2

Aktion→sichtbareReaktion messen: Übersicht→Verlauf→Positionen→Buchungen→Mehr→Übersicht; große Anbieterlisten und Positionsdetails öffnen.
Prüfen: Vollneuberechnung, unnötigeDOM-Erzeugung, wiederholtesFormatieren, teureSuche/Sortierung, wiederholteBewertung/Chartberechnung, Layout-Thrashing/Reflows, Listener und synchron blockierendeListen.
Nur bei Messbeleg gezielteTeilrenders, sichere unveränderteDarstellungsdaten, LazyRendering unsichtbarerDetails, effizienteDOM-Updates, Chunking, wenigerLayoutmessungen; Virtualisierung nur bei Notwendigkeit.
Keine unkontrollierten Finanzcaches. Jede Wiederverwendung bei Positionen/Buchungen/Kursen/Historien/Einstellungen/Datenrevisionen korrekt invalidieren. CAS/Mehrtab bewahren.

## 7. Diagramme und Touch P1/P2

Dashboard-Verlauf, Hauptverlauf, Positionen, Kryptocharts, Wallet-Historien und historischeDetails prüfen.
Messen: Zeitraumwechsel, Datenbasiswechsel, Diagrammmoduswechsel sobald implementiert, Punktantippen/-verschieben, Detailsöffnen, vielePunkte.
Keine unnötigenVollrenders, verzögerteTouchantwort, springenden/abgeschnittenenTooltips oder Pointer-Reflowketten. Fläche anBreiteanpassen, kompakteZeiträume.
Automatisch/Linie/Punkte nach Umsetzung integrieren. Keine erfundenen historischen Daten, fachlichen Interpolationen oder geänderten Finanzberechnungen.

## 8. Listen und Verwaltung

Filtern/Sortieren vonPositionen, Buchungssuche,100+Auswahl, Auswahl überFiltergrenzen, Archive, Referenzauswahl, Sperrkategorien, Verwalten/Fertig messen.
Keine sekundenlangenBlockaden bei einfacherAuswahl, unnötigenTausendenDOM-Elementen oderwiederholtenSperrtexten. Status effizient, Scrollposition stabil, nur fachlich sichere notwendigeTeile neu rendern.
BestehendeGmail-Auswahlengine, Löschberechtigungen, CAS, Archivsemantik und Integrität erhalten.

## 9. Touch, Scroll, Navigation

44×44CSSpx, keine überlappendenZiele oderDoppelaktionen. Akkordeonscroll, Scrollposition beiFiltern/Moduswechsel, Dialog mitTastatur, BottomNavigation/Systemleisten, AndroidZurück, Fokus/Tastatur, Layoutsprünge prüfen.
Dirty-Dialog-/Sicherheits-/Browsernavigationvertrag erhalten. Keine zusätzlicheHistoryTrap oder Back-Änderung ohne nachgewieseneNotwendigkeit.

## 10. Wahrgenommene Geschwindigkeit

Bei tatsächlich längererArbeit sofort erkennbareReaktion, kurze sachlicheLadeanzeige, nachvollziehbarerStatus. Keine endlosenSpinner, springendenLeer-/Gefülltkarten, unnötigeKomplettsperre, ErfolgvorCommit oder fälschlichendgültigeFinanzwerte.
Ladeanzeigen nurbei realerWartezeit. Keine dekorativenSkeletons/Animationen ohneFunktionsnutzen.

## 11. Messmethodik und Orientierungsziele

Vor jederPerformanceänderung reproduzierbareBaseline. GleicheFixture,Geräte-/Browserkonfiguration,Viewport,DB-Zustand und vergleichbarerCache; soweit praktikabel mindestens5Durchläufe/Szenario, Median+Streuung. Profiling voneigentlichenZeitmessungen trennen.
ErreichtePERF01-Verbesserung erhalten. AndroidStart separat messen und nur belegteEngpässe optimieren. Navigation/Interaktion ohneunnötigeBlockade.
Orientierung: visuellesFeedback möglichst≤100ms, normaleAktion möglichst≤200ms soweitkeineaufwendigeVerarbeitung; LongTasks>50ms untersuchen. **Optimierungsziele, keine unbelegten Erfolgsbehauptungen oder neuen Freigabegates ohneBaseline.** Fachlich notwendigeLänge verständlichkommunizieren, Sicherheitsprüfungen niemalsfürGeschwindigkeitentfernen.

## 12. Echte Android-Abnahme und externe Grenze

Automatisiert Playwright-Chromium, Firefox/WebKit fürallgemeineRegression. Soweit zugänglich echtesAndroid mitChrome und installierterPWA, langsames/gedrosseltesGerät, Netzwerkvariation/Offline,Systemschrift,Tastatur,Hoch-/Querformat.
BevorzugtesHardwaretestgerät OnePlusNord4. Aktuell **kein reales Gerät in dieser Ausführungsumgebung nachgewiesen zugänglich**: Hardwareabnahme bleibt BLOCKED/EXTERNAL, zulässigeMessungen nuralsEmulation kennzeichnen. Keine simuliertenErgebnisse alsHardwarePASS.

Regressionsszenarien: Kalt/Warm/Offline-Kalt, Hintergrundwiederaufnahme,5Reiter,großePositionsdetails,100+Buchungen,Zeiträume/Tooltips,langeListen,Tastaturdialog,Browser↔PWA. RealeGeräte-/Systemzustände gesondert dokumentieren.

## 13. Datenintegrität

Keine unkontrollierten asynchronenWrites. Finanzberechnungen, Journal,Kostenbasis,Referenzen,Quellenidentitäten,CAS/Mehrtab,Backup/Restore,Recovery und wirtschaftlicheImportübernahme unverändert. Keine veraltetenWerte oderwiederhergestelltenaltenRevisionen durchCaches. KeineprivateDaten/Keys inöffentlichenArtefakten.

## 14. Integration ohne neuen Großauftrag

FLH-PERF01: bestehendeStartoptimierung erhalten, fehlendeAndroidmessungen ergänzen, keinen gelöstenEngpass erneutbauen.
UI-MASTER28: Androidlayout,Informationsdichte,Touch/Scroll,Diagramm-/Listenperformance,Navigation/Interaktion.
Gemeinsam nutzen: kompakteLeisten/Gründe,einheitlicheModi,kleineArchive,Charts/Tooltips,nativeCharts ohneTradingView,mobileHistorien,wenigerKarten-/Akkordeonverschachtelung. FrühereTradingView-OptimierungSUPERSEDED,EntfernungseparatP2bereitsbeauftragt.

## 15. Reihenfolge, Test und Sicherung

LaufendenPERF01-/UI-Schnitt abschließen; diesenNachtrag sichern; bestehendeVerbesserungen feststellen; reproduzierbareAndroidbaseline; größtegemesseneVerzögerungenpriorisieren; Layoutdeltas mitbestehendenUIPaketen bündeln; kleine konfliktfreieÄnderungen; Vorher/Nachher; Chromium/Firefox/WebKit+Finanzregressionen; bestehendePR-/Releasefreigaben.
NachEtappe/vorLimits: commit/push,RemoteSHAverifizieren,Checkpointseparatcommit/push,PR/CI/Performance/Releasebelege,DONE/PARTIAL/BLOCKED/exakteFortsetzungsstellesichern.
HistorischenDokumentationsbranchniemalsalsaltenCodeinmainmergen.FLH05/FLH-PROJ01 OPEN/PARKED. AlleübrigenMasteranforderungenerhalten.

Übernahmestatus: **PARTIAL / BASELINE_PENDING; REAL_ANDROID_EXTERNAL**. Kein neuerProduktcode und keine neueHardware-/Androidleistungsabnahme durch diesenDokumentationsschritt. Doppelübermittlung erzeugt weder zweitenAuftrag noch paralleleImplementierung.
