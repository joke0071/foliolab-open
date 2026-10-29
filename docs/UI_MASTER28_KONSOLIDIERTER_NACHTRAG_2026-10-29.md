# UI-MASTER28 – Verbindlicher konsolidierter UI-/UX-Nachtrag vom 29.10.2026

Quelle: vollständiger Nutzerauftrag „Verwaltung, Diagramme, Löschlogik und vollständige visuelle Vereinheitlichung“, nach ausdrücklicher Freigabe für PR200. Dieser Nachtrag ergänzt denselben Masterauftrag und ersetzt keine historischen Anforderungen oder Nachweise.

Repository https://github.com/joke0071/foliolab-open · Produktion https://foliolab.unperfekt.at/ · maßgeblicher Checkpoint docs/WORK_RESTPAKETE_CHECKPOINT.md auf feature/flh05-import-foundation.
Bezug: UI-MASTER28, DELETE-MASTER28, Issue149, abgeschlossener read-only Sonnet-Audit197, UI-A01–A08, sämtliche Entscheidungen vom25.–29.10.2026 und bereitgestellte Android-Screenshots.

## 1. Auftrag, Zuständigkeit und Kollisionsschutz

Bestehenden Master ohne Neustart, konkurrierende Roadmap, parallele Implementierung oder doppelte Entwicklung fortsetzen. ChatGPT Work ist allein für Implementierung, Integration, QA und Release verantwortlich. Frühere exklusive Claude-Implementierungsdelegation aufgehoben; Claude-Audit nur Qualitätsquelle. Bestehendes grün-weißes Erscheinungsbild, VanillaJS/HTML/CSS/PWA, keine große Neugestaltung, Frameworks oder unnötigen Komponenten.
Ziel: einheitlich, ruhig, intuitiv, kompakt und überzeugend auf Desktop/Mobile.

Laufenden FLH-PERF01, PRs, CI, Reviews und Releases zuerst regulär abschließen. Vor jeder schreibenden Aktion main, Branches, offene PRs, laufende Actions, tatsächliche Produktion und letzten Remotecheckpoint prüfen; fremde Writer berücksichtigen. Nachtrag am nächsten sicheren Checkpoint sichern, anschließend konfliktfreie UI-Schnitte. Ausgangspunkt v212/SW212 LIVE_ACCEPTED, PR200HEAD870f4c07/SW213 unveröffentlicht mit synthetischem Kaltmedian3113,9→1542,8ms(-50,45%). PR200 hiermit ausdrücklich freigegeben; produktive Performanceabnahme gesondert nachweisen.

## 2. Konkrete Abnahmereferenzen UX-01 bis UX-10

| ID | Verbindlicher Nutzerbefund | Initialstatus bei Übernahme |
| --- | --- | --- |
| UX-01 | Seitenlange wiederholte Sperrtexte bei Buchungsmehrfachauswahl | OPEN – gegen aktuelles Release reproduzieren |
| UX-02 | Achtfach wiederholte Sperrgründe für acht Referenzwerte | OPEN – deduplizierte Kategorien nachweisen |
| UX-03 | Mobile Zeitraumleiste unausgewogen6+2 statt4×2 | PARTIAL – v212-Regel vorhanden, tatsächlichen Androidzustand prüfen |
| UX-04 | Diagrammtooltip rechts abgeschnitten | OPEN – Grenzen aller nativen Charts prüfen |
| UX-05 | „Erfasste Stichtage“ unter Dashboard/Hauptverlauf entfernen | OPEN – beide Renderpfade |
| UX-06 | Liquidität & Fälligkeiten auf Desktop nicht sichtbar | PARTIAL – vorhandener Renderer verschwindet ohne cashTerms |
| UX-07 | Permanentes „Lokal gespeichert“ im mobilen Header unnötig | OPEN – normale/handlungsrelevante Zustände unterscheiden |
| UX-08 | „Gebuchte Vorgänge“ in Positionsdetails zu groß/lang/uneinheitlich | OPEN –38+-Vorgänge-Fixture |
| UX-09 | Migrierte Originalreferenzen weder bearbeitbar noch löschbar | BLOCKED – neue sichere inverse Fachverträge erforderlich |
| UX-10 | Uneinheitliche Verwaltung von Positionen/Buchungen/Referenzen | PARTIAL – bestehende Auswahlengine erhalten, Bedienung vereinheitlichen |

Ein vorhandenes CSS oder ein alter DONE-Eintrag gilt nicht als Abnahme der konkreten Nutzerbefunde.

## 3. Sperrgründe P1

Gilt für Positionen, Buchungen, historische Referenzwerte. Identische Gründe deduplizieren, fachlich gleichwertige Kategorien bilden, betroffene Einträge pro Kategorie tatsächlich zählen. Mehrfachzuordnung zu mehreren Kategorien korrekt; Kategorien nicht zu falscher Gesamtzahl addieren. Standard höchstens2–3 kurze verständliche Zeilen. Vollständige Einzelgründe nachvollziehbar hinter standardmäßig geschlossenem „Details anzeigen“; auch dort keine Wiederholungen. Keine riesigen DOM-Strukturen bei Massenauswahl.

Beispiele nur bei tatsächlich passenden Zahlen:
„8 ausgewählt · Löschen derzeit nicht möglich: 8 geschützte migrierte Originalwerte. Archivieren ist möglich.“
„100 ausgewählt · Löschen derzeit nicht möglich. Importierte Vorgänge und ungeklärte Abhängigkeiten vorhanden.“
Auswahlstatus bevorzugt „100 ausgewählt · 249 gefiltert“. Versteckte/veraltete Auswahl nur prominent erklären, wenn sicherheitsrelevant. Keine Sperre lockern oder verschleiern.

## 4. Einheitlicher Normal- und Verwaltungsmodus P1

In allen drei Bereichen dieselbe bestehende Auswahlengine, kein zweites System.
Normal: keine Checkboxen, keine dauerhaften Zeilenicons für Papierkorb/Archiv/Stift. Fachlich bearbeitbare Einträge rechts mit dezentem klickbarem Text „Bearbeiten“ zum bestehenden Dialog. Übrige Zeile behält Detail-/Chartfunktion. Geschützte Einträge kurzer verständlicher Sperrhinweis. Keine komplizierten neuen Aktionsmenüs.44px-Ziele, sichtbarer Fokus.
Verwaltung: „Verwalten“→„Fertig“, Checkboxen sichtbar, Bearbeiten-Text und Zeilenicons ausgeblendet. Zentrale kompakte Aktionsleiste mit Archivieren/Wiederherstellen/Löschen passend zur Auswahl. Keine redundanten Aktionen; Fertig beendet und setzt Normalzustand.
Gmail-Dreistufenauswahl unverändert:1aktuelle sichtbare Seite,2alle aktuell gefilterten,3zurücksetzen. Kein Auswahlfolgen-Dropdown. Kompakte Menge/Bereich. Paging, Filterwechsel, Auswahlbereinigung, Mehrtab und CAS bewahren.
Mobil: wenig Höhe, kompakte Kopf-/Aktionsleiste, keine großen Kacheln, keine doppelte Auswahl/Abbrechen-Bedienung, keine langen Erklärungen vor Liste; häufige Aktionen erreichbar,44px und Tastatur erhalten.

## 5. Kleine Archiv-Dropdowns P2

Positionen/Buchungen/Referenzen jeweils gleiches kleines dezentes Dropdown im vorhandenen Kopf/Filter: Aktiv(Standard),Archiviert,Alle. Ohne archivierte Einträge nicht zeigen. Bestehende Archivmodelle/Filter nutzen, kein zweites Archiv und kein großes neues Akkordeon. Auswahlbereinigung bei Filterwechsel konsistent. Wiederherstellen über vorhandene Verwaltungsaktionen. Archivierung ändert ausschließlich Sichtbarkeit, niemals Vermögen/Rendite/Buchungen/Historie.

## 6. DELETE-MASTER28 – eigenständige Fachverträge und Freigaben

Bearbeiten/Löschen grundsätzlich ermöglichen, wenn sämtliche Abhängigkeiten nachweisbar vollständig sicher behandelt werden. Herkunft allein ist keine pauschale Sperrbegründung, aber niemals freischalten ohne vollständigen Fachbeweis.
Referenzen: manuell/automatisch/migrierteOriginale/archiviert/Startstichtage/historischeRevisionen/Rendite-/Kapitalflussabhängigkeiten/Abgleiche/Wiederimport/automatischeNeuerfassung prüfen. Quellbezogene Korrekturen und inverse Rücknahmen untersuchen. Vorhandene Snapshot/Preview/Backup/Restore/CAS/Undo wiederverwenden. Wenn unmöglich: kurze Erklärung+sinnvolle Alternative.
Buchungen: manuell/importiert/journalgebunden/Ein-/Auszahlungen/Gebühren/Steuern/Transfers/Gegenbuchungen/technischeKorrekturen/archiviert. Zusammengehörige Vorgänge vollständig zurücknehmen; keine isolierte Teillöschung mit inkonsistentem Bestand/Kostenbasis/Historie/Journal/Kapitalfluss.
Positionen: vorhandene sichere Pfade behalten; historischeBestände/Buchungen/Kurse/Wallets/Eröffnungen/Kostenbasis beachten. Keine unkontrollierte Cascade.
Ablauf: Auswählen→Löschen→kompakte Folgenvorschau und erforderliches Backup→Bestätigen. Keine unnötigen Dialogschritte. CAS/Frische/Backup/Restore/Undo/ausdrücklicheBestätigung erhalten. Keine stillen Teillöschungen gemischter Auswahl.
Erweiterte Fachumfänge separat von rein visuellen Änderungen implementieren und freigeben; vor Implementierung vollständiger Abhängigkeitsbeweis. PR196/200-Freigabe ist keine universelle Löschfreigabe.

## 7. Diagrammdarstellung – verbindliche gemeinsame Einstellung P2

Unter Mehr→Einstellungen→Diagrammdarstellung kompakte Auswahl, lokal in bestehenden Einstellungen/IndexedDB und Backup/Restoreverträgen:
- Automatisch: Standard unkonfigurierter Portfolios; durchgezogene Linien nur zusammenhängende belegte Daten, isolierte Beobachtungen als Punkte, fehlendeZwischenwerte erkennbar.
- Linie: vorhandene Kontrollpunkte optisch verbinden; unbelegteZwischenräume ausschließlich deutlich gestrichelt. Tatsächliche Kontrollpunkte erkennbar, keine erfundene tägliche Entwicklung.
- Punkte: ausschließlich belegte Punkte, keine Verbindung.
Dashboard und Hauptverlauf dieselbe Präferenz. Weitere Charttypen nur fachlich passende Datenmodelle, kein Framework.
Zeitachse bei unregelmäßigen Abständen nach tatsächlicher Zeitdistanz statt Listenindex. Keine visuellen Gleichabstände vortäuschen. Keine historischen Zwischenwerte berechnen/speichern. Tooltips ausschließlich belegte Datenpunkte.

## 8. Zeitraumwahl P1

Androidbefund6+2 gegen tatsächlichen SW/CSS/MediaQueries/Spezifität/Container/Grid-/FlexOverrides/Geräteskalierung/Viewport prüfen. Cacheursache nur nach Beweis.
Acht Zeiträume mobil bevorzugt gleichmäßiges4×2; keine isolierten Buttons. Desktop kompakteZeile. Einheitliche Höhe/Schrift,44px,keinOverflow,keineKollision mit Kalender/Plus/Datenbasis. Zeiträume und Auswahlsemantik unverändert; Positions-/Marktchartoptionen fachlich respektieren.

## 9. Tooltips P1

attachChartInteractions() gezielt prüfen; Wallet-Sonderbehandlung passend für alle betroffenen nativen Charts: Dashboard/Hauptverlauf/Positionen/Wallet.
Vollständig innerhalb sichtbaren Viewports bzw geeigneten Containers; links/rechts nichts abgeschnitten. Datum/Betrag vollständig, langeDetails umbrechen,mobil kontrolliert mehrzeilig. Touch/Maus/Tastatur, exakteWerte zugänglich, kritischeBedienelemente nicht unbeabsichtigt überdecken. Keine fiktivenZwischenwerte.

## 10. Redundante Stichtagsbeschriftungen P1

Sichtbares „Erfasste Stichtage“ unter beiden Vermögenscharts entfernen: #miniHistoryStatus,#historySourceStatus,wealth.label-Renderpfade. Leerfläche reduzieren, keinen Ersatztext gleicher Art. Datenbasissteuerung im Diagrammkopf und fachlich erforderliche Auswahloption „Erfasste Stichtage“ erhalten. Herkunft/Qualität/Unvollständigkeit in bestehenden Datenbasis-/Datenabdeckungsansichten zugänglich. Keine Referenz-/Bewertungsänderung, keine fachlicheQualitätsinformation verlieren.

## 11. Liquidität & Fälligkeiten P1

renderDashboard()/renderCashTermsOverview() prüfen: derzeit keine Ausgabe ohne cashTerms. Bei vorhandenenKonten Bereich zuverlässig unter „Meine Konten und Depots“ anzeigen, Desktop/Mobil gleicheReihenfolge. Ursachen: Datenbedingung/Platzierung/CSS/sonstige reproduzieren.
Leerzustand „Noch keine Angaben zu Liquidität oder Fälligkeiten hinterlegt.“ plus kompakter Zugang zur vorhandenenKontobearbeitung.
Mit Angaben bestehende fachlicheStatuswerte freiVerfügbar/gebunden/unbekannt/bekannteFälligkeit/fehlendeFälligkeit/bereitsFälligKlärungOffen nutzen. Unbekannt niemals frei; Fälligkeit niemals automatischAuszahlung.
Bestehende Berechnung/Funktion nutzen, keine zweiteKontenkarte oder Zusatzvermögenssumme. KompakterKarten-/Akkordeonbereich, keine doppeltenLinien/großeLeerflächen. Nicht allein wegen fehlenderZusatzangaben verschwinden.

## 12. Headerstatus P2

#mobilePortfolioStatus,#localPortfolioStatus,syncPortfolioState() in src/app.js:
Normalzustand dauerhaftes „Lokal gespeichert“ im mobilenHeader ausblenden; Logo/Beta erhalten. Sidebar ebenso aufRedundanz prüfen.
„Wird gespeichert …“,SpeicherNichtVerfügbar,veralteterDatenstand/Mehrtabkonflikt,Speicher-/Restorefehler und sonstigeHandlungswarnungen bleiben sichtbar. Erfolg höchstens kurz und ruhig. Local-first weiter in Einstellungen/Datenverwaltung/Datenschutzhinweisen erklären.
Keine Änderung an IDB/Autosave/Konflikterkennung/Offline; Warnungen keinesfalls verlieren.

## 13. Gebuchte Vorgänge P1/P2

src/position-detail-ui.js,positionBookingTimeline(),.position-booking-history,.history-row:
Ruhige kompakteHistorienliste passend zu normalenBuchungen; kleinereDatums-/Typüberschrift,wenigerAbstand,konsistenteLinien/Typografie,österreichischesDatum stattISO. Beispiel „25.10.2026 · Korrektur“ und „−0,000097 5MVL · CSV-Import“. TechnischeKorrektur eindeutig vonKauf unterscheiden; neutralerkurzerHinweis/kleinesLabel optional. Mengen/Beträge präzise kompakt; Kauf/Verkauf/Korrektur/Einlieferung/andereTypen gleichartig.
Technikdetails standardmäßig unaufdringlich/beiBedarfaufklappbar; keine doppeltenBeleginfos oderlangenErklärungen.
38+-Vorgänge: sinnvolle neuesteTeilmenge(5–10), vorhandenenZugang zur vollständigenHistorie imReiterBuchungen nutzen; WeitereAnzeigen nur beiNutzen,kein endlosOffenerPositionskartenbereich.
Daten/Journal/Menge/Datum/Herkunft/Bestand/Kostenbasis/Rendite exakt erhalten. Keine Buchung ausDatenbasis entfernen. Desktop/Mobil getrennt prüfen.

## 14. Dashboard/Verlauf – Bewährtes bewahren, tatsächliche Deltas prüfen

Nicht neu entwickeln: AbstandGesamtvermögen/Willkommen,Verlaufstrennlinien,dreiIcons,kompakteDatenbasis,Wochenfilter,7TbisMax,LiquiditätunterAnbietern,entfernteletzteAnbieterlinie,korrigierteAchsen,V192/V193-Auswahl/Wording,mobileHistorien.
Prüfen: langeAnbieterlabels nebenBeträgen,doppelteHinweise,Kartenabstände,ButtonsaufLinien,großeChartleerflächen,Änderungskachelumbrüche,kleineViewportHöhen,Kalender-/Datenbasiszugang,beobachtetvsrekonstruiert,fehlendeKurse/unbekannteBasis. HistorischeReleasebelege berücksichtigen.

## 15. Erträge/Abzüge/Transfers/Referenzen/Dialoge

Erträge/Abzüge: kompakteKennzahlen,rechtsbündigeWerte,verständlicheUngeklärte,synthetischen490/400-Fall erhalten,keineirreführendenNullen,FilternurbeiNutzen.
Transfers: kompakteLeerzustände,deaktivierteAktionenohneKandidaten,klareGründe,keineDoppelzählung/wirtschaftlicheÄnderung.
Referenzen: lesbar,Herkunftklar,keinewiederholtenSperrtexte,kompaktesArchiv,Normal/Verwaltung,Bearbeiten/Rücknahmenurbelegtzulässig.
Dialoge: keinDoppelScroll,keineabgeschnitteneBestätigung,kompaktmobil,Fokuswiederherstellung,44px,bestehendeCAS/Backup/Undo/Restore.

## 16. Appweite Konsistenz – gezielte tatsächliche Deltas

Schriftfamilie/-größe/-gewicht/Zeilenhöhe,Überschriften,Tabellen,Beträge/Datum,Hilfetexte,Karten,Buttons,Linien,Einrückung,Tooltips,mobileAkkordeons,Leerzustände,Fokus/Accessibility. KeineGesamtneugestaltung,unnötigenKomponenten;bestehendeMuster wiederverwenden.

## 17. Verbindliche Reihenfolge

Zuerst laufendesPERF01 sicher abschließen.
P1:1Sperrtexte,2Normal/Verwaltung,3BearbeitenText,4kompakteLeisten,5Tooltips,6Zeiträume,7Liquidität,8GebuchteVorgänge,9Stichtagstexte.
P2:1ArchivDropdowns,2Diagrammmodi,3zeitkorrekteXAchse,4Headerstatus,5übrigeTouch/Kontrast,6Tabellen/Dialoge,7Typografie,8responsiveKarten/Chartcontrols.
P3optional:Willkommensraster,Leerraum,belegteKosmetik.
DELETEseparat:Fachbeweise/Freigaben fürmigrierte/automatischeReferenzen,komplexe/importgebundeneBuchungen,wirtschaftlichverknüpftePositionen. UI-A01–A08 weiterintegriert,keineDoppelentwicklung.

## 18. Verbindliche Test-/Abnahmematrix

Chromium/Firefox/WebKit;320/390/430/768/1440CSSpx;kleineViewportHöhen;200%Textvergrößerung;Touch/Maus/Tastatur;Axe/Fokus/Kontrast;langeLabels;kleine/großeGeldbeträge;1/2/vieleStichtage;regelmäßige/unregelmäßigeDatumsabstände;1/8/100/>200Auswahl;gemischte/identischeGründe;aktive/archiviertePositionen/Buchungen/Referenzen;fehlende/unvollständige/vorhandeneLiquidität;38+-Buchungen;alle3Diagrammmodi;Tooltiplinks/rechts;kontrolliertePWA/SW-/Cacheübergänge;leer/gefüllt.
KonkreteAbnahme:
-8gleicheGründe einmalKategorie,100Buchungen keinTextberg.
-Normal/Verwaltungvisuell/funktionalgleich,„Bearbeiten“stattStift,ArchivkleinAktiv/Archiviert/Alle.
-Zeiträumekein6+2/7+1wenn4×2vorgesehen.
-TooltipDatum/Betrag/vollständigeErläuterungsichtbar.
-3ModiohneerfundeneZwischenwerte,zeitlicheDistanzkorrekt.
-UnterbeidenChartskeineredundanteStichtagsbeschriftung.
-LiquiditätauchvorhandeneKontenohneZusatzinfoserreichbar.
-KeinNormalHeadererfolg,Warnungenbleiben.
-GebuchteVorgängekompaktösterreichischesDatum.
-KeineunerlaubteLöschung,stilleTeillöschung,finanzielleMutation.
BestehendeFinanz/Import/CAS/Backup/Restore/Undo/Mehrtab/Offlinegatesnichtabschwächen. ÖffentlicheArtefaktenursynthetisch. Emulator-/Browsernachweise niemalsalsHardware/iOS/Android/TalkBack/VoiceOverabnahmeausgeben.

## 19. Vollständigkeitsabgleich ohne unbegrenzte Auditphase

DiesenAuftrag gegenallebekanntenEntscheidungen25.–29.10.2026,UI-MASTER28,Issue149,Sonnet197,Release-/Testbelegeabgleichen.
JedenPunkt kennzeichnen:DONE(bereitsabgenommen),FIXED(neukorrigiert),PARTIAL,BLOCKED(mitGrund),NOTREPRODUCIBLE(nurmitaktuellenGegenbelegen),OPTIONAL. BeiÜbernahmeOPENfürnochungeprüfteKonkreta;keinevorzeitigeAbnahme.
KeinWunschstillverlieren,keineDoppelimplementierung,keineunbegrenzteAuditphase.

## 20. Dauerhafte Absicherung und übriger Master

NachjederEtappeundvorLimits/Unterbrechung/Kontextwechsel:WorkingTree/Branchprüfen,sichereÄnderungencommitten/pushen,RemoteSHAverifizieren,zentralenCheckpointseparatcommitten/pushen,PR/CI/Release/LivebelegeundDONE/PARTIAL/BLOCKED/offeneTests/externeGrenzen/exakteFortsetzungsstellesichern. FehlgeschlagenenPushtransparentmelden,keinenRemoteerfolgbehaupten.
HistorischenCheckpointbranchniemalsalsaltenAppcodeinmainmergen.
FLH05/FLH-PROJ01 OPEN/PARKED;FLH03,DELETE-MASTER28,FLH04,IDB/Recovery/Backup,PerformanceundsämmtlicheübrigenAnforderungenbehaltenihrePrioritätenundSicherheitsverträge. KeinePrivatdaten/OriginalCSV/Secretsöffentlich,keinefremdenBranchesüberschreiben,keineTestsabschwächen.

## Fortschrittsnachweise

Diese Spezifikation ist dauerhaft übernommener Sollvertrag, keine Behauptung der Implementierung. Konkrete Abnahmezeilen werden nach Reproduktion und Tests im bestehenden Mastercheckpoint fortgeschrieben. PR200-Mergefreigabe ist erteilt; zusätzliche fachliche Löschfreigaben oder spätere Releasefreigaben nicht daraus ableiten.
