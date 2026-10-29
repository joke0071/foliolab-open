# Verbindlicher konsolidierter Ergänzungsvertrag – Qualität, CI, Android, Drive und Datenintegrität

Nutzerauftrag vom29.10.2026. Ergänzt denselben FolioLab-Open-Master, UI-MASTER28, DELETE-MASTER28, FLH03, FLH04, FLH-PERF01 und IndexedDB/Recovery sowie sämtliche Nachträge25.–29.10.2026.
Repository https://github.com/joke0071/foliolab-open · Produktion https://foliolab.unperfekt.at/ · zentraler Checkpoint docs/WORK_RESTPAKETE_CHECKPOINT.md auf feature/flh05-import-foundation.

## 1. Fortsetzung, tatsächlicher Stand und Kollision

Kein Neustart, keine neue Roadmap, parallele Implementierung, Doppelentwicklung oder Umpriorisierung. ChatGPT Work allein für Implementierung, QA, Integration und Release. Vor Schreibaktionen tatsächlichen GitHub-Stand prüfen. Laufenden PR201 regulär abschließen, bevor neue konfliktträchtige Änderungen beginnen; vor Merge/Deployment eigene ausdrückliche Nutzerfreigabe.

Neuerer gesicherter Stand bei Übernahme:
- PR200 DONE/LIVE_ACCEPTED, Produktionv213/SW213, main6ec0cf9c6e28edf1b19993357c3b839106b8aa80. Großer synthetischer Produktionskaltstart3186,6→1611,3ms(-49,44%). Android-/gemischteWallet-/Hardwaremessungen separat offen.
- PR201 feature/ui-selection-reasons-v214, HEAD78dc4ca4784694e543cc46a525ef629bf93f9333, Tree74aa1231c62364b094416aa7dbf822784d7be70a. TECHNICALLY_ACCEPTED/REVIEW_READY, Pflicht40923950987 und Wallet40923951032SUCCESS,953Tests/dreiEngines. Noch nicht freigegeben, gemergt oder deployed; SW214unveröffentlicht.
- Sämtliche UI-, TradingView-/Kursoptionen- und Androidverträge dokumentiert. FLH05/FLH-PROJ01 OPEN/PARKED.
Dieser Nachtrag wird zunächst gesichert und danach in bestehende passende Pakete integriert; kein neuer Umsetzungszweig.

## 2. CI-/Playwright-Optimierung P2 erhalten

Auftrag vom26.10.2026 ausdrücklich erhalten. Repräsentative erfolgreiche und fehlgeschlagene Läufe messen: npm/Dependencies, Browserinstallation, Chromium/Firefox/WebKit, Unit/Syntax, Wallet/Blockchain, Artefakte, Testmerge/Releasegates, Deploy und Liveabnahme.

Prüfen: npm- und Browsercaching, Wiederverwendung installierter Dependencies, sinnvolle Parallelisierung/Sharding, weniger doppelte Installationen/Vorbereitung, zuverlässige Fixtures/Worker-Vorbedingungen sowie langsame/instabile Tests.
Vorhandenes Sharding und frühere CI-Verbesserungen nicht erneut bauen. Vorher/Nachher dokumentieren, nur nachweislich sinnvolle Änderungen. Aktueller Status PARTIAL: bestehende Shards vorhanden; weitere Laufzeitoptimierung am nächsten geeigneten Workflowcheckpoint.

WebKit-/Browser-Back-/Controller-/Offlinehistorie an aktuellen tatsächlichen Tests prüfen. Flakiness gezielt nach Ursache, niemals pauschal beforeunload/History/Sicherheit umbauen. Keine Tests schwächen, überspringen oder Releasegates reduzieren. PR201 hat konkrete Controller-Vorbedingungen mit strikten Originalprüfungen abgesichert; dies ersetzt nicht den gesamten CI-Auftrag.

## 3. Android- und PWA-Abnahme

Bestehender Androidvertrag vollständig erhalten. Zusätzlich: Chrome, installiertePWA, Offline-Kalt/Warm/Hintergrundwiederaufnahme, Update mit vorhandenen lokalenDaten, Workerwechsel, großeIDB, Systemschrift,Tastatur,kleineHöhen,AndroidZurück,TalkBack/Tastatur soweitzugänglich.

Ohne realesGerät ausschließlichEmulation; Hardware niemals alsDONE behaupten. NichtzugänglichesNutzergerät blockiert nicht pauschal unabhängige sichereReleases.

PWA: alten/neuenWorker,Cacheupdate,tatsächlichgeladeneCSS/JS,keineinkompatibleVersionsmischung,keineunnötigeDB-Neuinitialisierung,keineveraltetenFinanzwerte/Datenverluste beiUpdate/Wiederaufnahme undkeinefesthängendenLadeanzeigen prüfen. AktivePWA-Version beiFehleranalyse nachvollziehbar. Offline/CAS/Recovery unverändert.
Status: AndroidbaselineOPEN,HardwareEXTERNAL, bestehendePWA-Regressionen inCIerneutbestanden; keinepauschaleKomplettabnahme.

## 4. Mehrtab, Speicherfehler und Recovery

IndexedDB-only ohne Legacy-Umschaltung. AtomareWrites, CAS/Revisionen, konkurrierendeTabs, Quota,Abbruch/unterbrochenesSpeichern,Backup/Restore,Offline-Wiederaufnahme,Versionsübernahme und verständlicheFehler-Handlungsoptionen bewahren.

KeineErfolgsmeldung nachfehlgeschlagenemSave. KeinunkontrollierterFinanzcache undkeineveraltetenKurs-/Buchungs-/Konto-/Historienzustände nachÄnderung. Originaldatenbewahrung/Recovery erhalten.
BestehendeImplementierung und laufendeRegressionspflicht unterscheiden; einUI-Release schließt nicht alleRecovery-Themen.

## 5. FLH04 – unmittelbarer sicherer Ablauf nach Drive-Verbindung

Früheren Nutzerwunsch erhalten: Nach erfolgreichemOAuth soll vorhandener Backup-/Sync-Ablauf möglichst unmittelbar starten oder direkt angeboten werden, ohneunnötigeNavigation.

Fachvertrag prüft: tatsächlichenOAuth-Erfolg underteilteRechte,Passwort/erforderlicheVerschlüsselung,letztenlokalen/entferntenStand,Mehrtab/Konflikte,Offline/Online,Wiederaufnahme unterbrochenerVerbindung.
SindalleVoraussetzungen/Einwilligungen erfüllt,bereitsautorisiertenAblauf direkt auslösen. FehltSicherheitsentscheidung,diese unmittelbarverständlichanbieten.
KeineunbemerkteCloudüberschreibung,stilleunberechtigteSync,zweiteEngineoderzentralenSecrets. BestehenderFLH04-Vertrag,Revisionen/Recovery/VerschlüsselungundexterneOAuth-/Transport-/Operatorgrenzen maßgeblich. StatusPARTIAL/EXTERNAL nachbestehendemNachweis,keineImplementierung allein durchdiesenNachtrag.

## 6. Historische Qualität und Rekonstruktion

HistorischeWertpapier-/Kryptokurse,EUR-FX,damaligeMengen,CSV-Verläufe,Eröffnungen,Referenzen,unvollständigeBestandsbelege,fehlendeHandelstage,unbekannteKostenbasis,Kapitalflüsse/Gebühren erhalten.

NieheutigeKursestillhistorischverwenden,FXerfinden,fehlendeDatenalsNull,unbelegteInterpolation. Kursbeobachtung,PositionswertundPortfoliorenditetrennen; tatsächlicheAbdeckung,Quelle/Qualität nachvollziehbar.
Automatisch/Linie/PunkteändertnurVisualisierung,keinefinanzielleAussage. LangeKryptoperiodennurmitrealenDaten. AllebestehendenFinanzregressionenerhalten.

## 7. FLH03 – native Importe und Originalbelege

FLH05-ParkendarfaktiveNativeArbeitnichtverlieren:flatexAT,Bittr,Kraken,Bitpanda,LedgerLiveundTradeRepublic soweitbereitsimaktivenVertrag.

Fälle: unvollständigeflatexExporte,Depot-/Kontoumsätze,Reimport/Dubletten,PartialFills,getrennteGebühren/Steuern,Kryptotausch,Fiat-FX,interneTransfers,Kraken-Ledger/Wallet-Doppelzählung,historischeZuordnung,fehlendeOriginalangaben,sichereKorrektur/Rücknahme.

OriginalCSVnurf vorgeseheneValidierung. KeineechtenPersonendaten,Kontonummern,Beträge,Transaktionen,WalletadressenoderZugangsdaten inöffentlicheRepos/CI. Strukturellpassende synthetischeFixtures,keineBenutzerdateialsfestesBeispielportfolio.
UniverselleFLH05-CSVEngine bleibtOPEN/PARKED;notwendigeKompatibilitätnurbeiohnehinlaufenderFLH03-Arbeit,keineheimlicheVorziehung/neueUniversalarchitekturohneFreigabe. EinzelneNative-Fach-/Originalbeleggatesweitergelten.

## 8. UI- und DELETE-Verträge unverändert

Erhalten: Verwalten/Fertig,BearbeitenTextimNormalmodus,GmailDreistufenauswahl,kompakteGründe,kleineArchivdropdowns,sichereFolgenvorschau,Referenzverwaltung,LiquiditätaufDesktop/Mobile,kompakteGebuchteVorgänge,keineredundantenStichtagstexte,Diagrammmodi,mobileTooltips/Zeiträume,schlankerHeader,konsistenteTechnikeinstellungen.
TradingViewresponsiveOptimierungSUPERSEDED,vollständigeEntfernungOPEN/P2;nativeKurse/CSVOptionenbewahren.

DELETE-MASTER28OPEN fürmigrierteReferenzen/komplexeImportbuchungen: sichereQuellkorrektur/inverseRücknahmemitAbhängigkeitsbeweisweiterprüfen. KeinepauschaleFreigabe,unsichtbareTeillöschungoderzweiteFachlogik. PR201istnurkompakteDarstellung undkeineAbnahmeerweiterterLöschmöglichkeiten.

## 9. Weitere Restverträge

FLH04: verschlüsselteSync,OAuth,Konflikt,Restore,direkterautorisierterAblaufnachVerbindung.
Wallets/Staking: korrekteRekonstruktion,keineDoppelzählung,unterstütztePfadeundFehlerkommunikationbeiWallet-/Quellenausfall.
Konten/Vermögen: Vollständigkeit,Zuordnung,Eröffnungen,ungeklärteGeldflüsse;keinefalscheRendite-/Steueraussage.

FLH-PROJ01ausschließlichdokumentiert/PARKED:Sparrate,Horizont,Szenarien,Renditeannahmen,Inflation. EigeneNutzerentscheidungvorImplementierung. VorhandeneFestgeld-ZinsprognosensindnichtFLH-PROJ01.

## 10. Veröffentlichung und tatsächliche Abnahme

JeRelease:exaktfreigegebenerPR-HEAD,getesteterCommit,Merge-/Testmergebaum,allePflichtjobs,dreiBrowser,Main/Pages,WorkerVersion,tatsächlicheAssets,Produktionsfunktionen,Offline/Recoveryprüfen.
CIErfolgistkeineLiveabnahme.FreigabenPR-spezifisch;keineÜbertragung.UIerstproduktivbehauptennachtatsächlichemDeployundgeladenenAssets.
ErledigtePräsentations-/Websiteänderungennichtneuaufrollen,nurbelegteNeueFehleraufnehmen.

## 11. Status und bestehende Reihenfolge

Statusvokabular:DONE/LIVE_ACCEPTED,PARTIAL,OPEN,BLOCKED,EXTERNAL,PARKED,SUPERSEDED.
Lokalgetestet,CIgeprüft,reviewbereit,freigegeben,gemergtundlivegesondertführen.KeinepauschaleErledigungdurcheinRelease.

VerbindlicheReihenfolge:
1.PR201sicherabschließeninklusiveeigenerReleasefreigabe.
2.OffeneUI-P1gemäßbestehendemPlan.
3.AndroidperformancemessenundbelegteDeltaskorrigieren.
4.UI-P2undgeplanteFach-/Sicherheitsarbeitkonfliktfrei.
5.CI-OptimierungamgeeignetenWorkflowcheckpoint.
6.FLH04/FLH03nachbisherigerPrioritätundFreigaben.
7.Geparktesgeparktlassen.
KeinenneuenGesamtplanbeginnen.

## 12. Dauerhafte Sicherung

NachsichererEtappe/vorLimits/Unterbrechung/Kontextwechsel:main,Branches,PRs,CI,WorkingTreeprüfen;sichercommitten/pushen;RemoteSHAprüfen;Checkpointseparatcommitten/pushen;echteTest-/Releasebelege,Status,BlockerundexakteFortsetzungsstellesichern;Masterregulärfortsetzen.
HistorischenDokumentationsbranchniemalsalsaltenCodeinmainmergen.AlleQualitäts-,Performance-,Sicherheits-,Import-,Drive-undUI-AnforderungenimselbenMastererhalten.

DieserSollvertragdokumentiertdenvollständigenzusätzlichenUmfang,nichtdessenpauschaleErledigung. VorhandeneVersionen/NachweisehabenVorrangvorhistorischenAusgangsdaten.
