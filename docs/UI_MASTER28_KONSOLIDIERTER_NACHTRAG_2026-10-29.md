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

## 14. Dashboard und Verlauf – bestehende Vereinbarungen erhalten

Nicht neu entwickeln: Abstand zwischen Gesamtvermögen und Willkommenskarte; Verlaufstrennlinien und drei Icons; kompakte Datenbasissteuerung; gemeinsamer Wochenfilter; Zeiträume 7T bis Max; Liquidität unter Anbietern; entfernte letzte Anbieter-Trennlinie; korrigierte Chart-Achseneinheiten; V192/V193-Auswahl- und Wordingkorrekturen; bestehende mobile Historienansichten.

Tatsächliche Restabweichungen prüfen: lange Anbieterlabels neben Beträgen, doppelte Hinweise, uneinheitliche Kartenabstände, Buttons auf Trennlinien, unnötig große Diagramm-Leerflächen, Umbruch der Vermögensänderungskacheln, kleine Bildschirmhöhen, Kalender- und Datenbasiszugang, Unterscheidung beobachteter und rekonstruierter Historien, fehlende Kurse und unbekannte Datenbasis. Vorhandene Releasebelege berücksichtigen.

## 15. Erträge, Abzüge, Transfers, Referenzen und Dialoge

Erträge und Abzüge: kompakte Kennzahlen, rechtsbündige Werte, verständliche ungeklärte Einträge, historischen synthetischen 490/400-Fall erhalten, keine irreführenden Nullwerte. Filter nur bei tatsächlichem Nutzen.

Interne Transfers: kompakte Leerzustände, deaktivierte Aktionen ohne Kandidaten, klare Sperrgründe. Keine Doppelzählung oder unzulässige wirtschaftliche Änderung.

Historische Referenzen: lesbare Datensätze, deutliche Herkunft, keine wiederholten Sperrtexte, kompakte Archivsteuerung und einheitlicher Normal-/Verwaltungsmodus. Bearbeitung/Rücknahme ausschließlich bei nachgewiesener Zulässigkeit.

Dialoge: kein doppeltes Scrollen, keine abgeschnittenen Bestätigungen, kompakte mobile Darstellung, gute Fokuswiederherstellung, vereinbarte Touchziele. CAS-, Backup-, Undo- und Restore-Verträge bewahren.

## 16. Appweite visuelle Konsistenz

Gezielt tatsächliche Deltas prüfen: Schriftfamilien, Größen, Gewichte, Zeilenhöhen, Überschriften, Tabellen, Beträge und Datum, Hilfetexte, Karten, Buttons, Trennlinien, Einrückungen, Tooltips, mobile Akkordeons, Leerzustände, Fokus und Accessibility. Keine umfassende Neugestaltung oder unnötigen Komponenten; vorhandene Muster wiederverwenden.

## 17. Verbindliche Prioritäten

Zuerst den laufenden FLH-PERF01-Prozess sicher abschließen.

P1: (1) wiederholte Sperrtexte, (2) gemeinsamer Normal-/Verwaltungsmodus, (3) klickbarer Bearbeiten-Text, (4) kompakte Verwaltungsleisten, (5) abgeschnittene Tooltips, (6) ausgewogene mobile Zeitraumwahl, (7) Liquidität auf Desktop, (8) überladene Positionsbuchungshistorie, (9) redundante Stichtagsbeschriftungen.

P2: (1) kleine Archiv-Dropdowns, (2) konfigurierbare Diagrammdarstellung, (3) zeitlich korrekte X-Achse, (4) permanenter Speicherstatus, (5) übrige Touch- und Kontrastprobleme, (6) mobile Tabellen/Dialoge, (7) Typografie, (8) responsive Karten/Chartcontrols.

P3 optional: Willkommensraster, unnötiger Leerraum und weitere klar belegte kosmetische Abweichungen.

Separat DELETE-MASTER28: erweiterte sichere Lösch-/Bearbeitungspfade für migrierte und automatische Referenzen, komplexere oder importgebundene Buchungen und wirtschaftlich verknüpfte Positionen. Vor Implementierung jeweils vollständigen Fachvertrag und Abhängigkeitsbeweis erstellen; Freigabe getrennt von visuellen Korrekturen. UI-A01–A08 bleiben integriert, keine Doppelentwicklung.

## 18. Test- und Abnahmematrix

Mindestens prüfen:

- Chromium, Firefox und WebKit; 320/390/430/768/1440 CSS-Pixel; kleine Höhen; 200 % Textvergrößerung.
- Touch, Maus, Tastatur, Axe, Fokus und Kontrast; lange Bezeichnungen; große und kleine Geldbeträge.
- Ein, zwei und viele historische Stichtage; regelmäßige und unregelmäßige Datumsabstände.
- 1, 8, 100 und über 200 ausgewählte Einträge; identische und gemischte Sperrgründe.
- Aktive und archivierte Positionen, Buchungen und Referenzen.
- Fehlende, unvollständige und vorhandene Liquiditätsangaben; mindestens 38 Positionsbuchungen.
- Alle drei Diagrammdarstellungen; linker und rechter Tooltiprand.
- Kontrollierte PWA, relevante Cache-/Service-Worker-Übergänge; leere und gefüllte Portfolios.

Konkrete Abnahme:

- Acht identische Gründe erscheinen einmal als Kategorie; 100 Buchungen erzeugen keinen seitenlangen Sperrtext.
- Normal- und Verwaltungsmodus in allen drei Bereichen visuell und funktional konsistent; Bearbeiten-Text statt Stift; kleines Dropdown Aktiv/Archiviert/Alle.
- Keine 6+2- oder 7+1-Anordnung, wenn 4×2 vorgesehen ist.
- Datum, Betrag und vollständige Tooltiperläuterung lesbar.
- Automatisch/Linie/Punkte ohne erfundene Zwischenwerte; tatsächliche Zeitdistanzen sichtbar.
- Kein redundantes „Erfasste Stichtage“ unter den beiden Vermögenscharts.
- Liquidität auf Desktop und Mobile auch ohne Zusatzangaben vorhandener Konten erreichbar.
- Kein permanentes „Lokal gespeichert“ im mobilen Header; kritische Speicherzustände bleiben sichtbar.
- Kompakte Buchungshistorie mit österreichischem Datum und konsistenter Typografie.
- Keine unerlaubte Löschung, stille Teillöschung oder finanzielle Mutation.

Alle bestehenden Finanz-, Import-, CAS-, Backup-, Restore-, Undo-, Mehrtab- und Offlinegates erhalten. Öffentliche Artefakte ausschließlich synthetisch. Browser-/Emulatornachweise niemals als physische Android-/iOS-/TalkBack-/VoiceOver-Abnahme ausgeben.

## 19. Vollständigkeitsabgleich

Diesen Vertrag gegen sämtliche bekannten Nutzerentscheidungen vom 25.–29.10.2026, UI-MASTER28, Issue #149, Sonnet-Audit und vorhandene Release-/Testbelege abgleichen. Pro Punkt dokumentieren:

- DONE: bereits implementiert und abgenommen.
- FIXED: neu korrigiert.
- PARTIAL: teilweise erfüllt.
- BLOCKED: gesperrt mit nachvollziehbarem Grund.
- NOT REPRODUCIBLE: aktuell nicht reproduzierbar, nur mit Gegenbelegen.
- OPTIONAL: kein notwendiger Produktfehler.

OPEN ist bei Übernahme die Kennzeichnung noch ungeprüfter konkreter Befunde. Keine vorzeitige Abnahme, kein still verlorener Nutzerwunsch, keine Doppelimplementierung und keine unbegrenzte neue Auditphase.

## 20. Dauerhafte Absicherung und Fortsetzung

Nach jeder Etappe und vor Limits, Unterbrechungen oder Kontextwechseln: Working Tree und Branch prüfen; sichere Änderungen committen und pushen; Remote-SHAs verifizieren; zentralen Checkpoint separat committen/pushen; PR-/CI-/Release-/Livebelege, DONE/PARTIAL/BLOCKED, offene Tests, externe Grenzen und exakte Fortsetzungsstelle dokumentieren. Fehlgeschlagenen Push transparent melden und keinen Remoteerfolg behaupten.

Historischen Dokumentationsbranch niemals als alten Produktcode nach main mergen. FLH05 und FLH-PROJ01 bleiben OPEN/PARKED. FLH03, DELETE-MASTER28, FLH04, IndexedDB, Backup/Recovery, Performance und sämtliche übrigen Masteranforderungen bleiben erhalten. Keine privaten Original-CSV-Dateien, Finanzdaten oder Secrets veröffentlichen; fremde Branches nicht überschreiben; Tests nicht abschwächen.

Diese Spezifikation ist der dauerhaft übernommene Sollvertrag und keine Implementierungsbehauptung. Konkrete Abnahmen werden nach Reproduktion und Tests im bestehenden Mastercheckpoint fortgeschrieben. PR200 ist ausdrücklich freigegeben; zusätzliche wirtschaftliche Löschumfänge oder spätere Releases erhalten dadurch keine pauschale Freigabe.
