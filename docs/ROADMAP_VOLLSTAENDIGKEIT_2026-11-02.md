# FolioLab – Vollständigkeits- und Umsetzungsabgleich

**Datum:** 02.11.2026. **Auftrag:** Roadmap nachziehen und prüfen, ob Nutzeranforderungen fehlen oder nur teilweise umgesetzt sind. **Art:** Dokumentations-/Quellcodeaudit; kein Produktpatch, keine zweite Entwicklungsübernahme und keine neue vollständige Laufzeit-, Finanz-, Originaldaten- oder Hardwareabnahme.

## 1. Prüfbasis und Grenzen

Gelesen wurden der jüngste zentrale Checkpoint, Roadmap-/Prioritätsköpfe, die vorliegenden Detailpläne und die Nachträge in #149/#257; ergänzend wurden frühere ausdrückliche Nutzerentscheidungen abgeglichen. Autoritativer Produkt-Snapshot für die unten genannten Codebefunde ist **Main `f02c4ef277ba727eeecfee07e7b4261ab3b7a4bb` / v269**.

Der veröffentlichungsbezogene `github-pages`-Workflowartefakt **13177404245** aus Lauf **41521172914** wurde tatsächlich über GitHub geladen und entpackt. Sein ZIP-SHA256 ist exakt **`9fc92eb1d2f8088a850632b774e84409ea04c4d540e46d96c0acb47f55c98a7d`** und stimmt mit dem GitHub-Artefaktdigest überein. Die enthaltenen 140 Tar-Einträge wurden als statische Prüfgrundlage genutzt. Das ist **kein eigener erneuter HTTPS-Bytevergleich der Nutzerinstallation** und keine Bestätigung, welche gecachte Version auf einem konkreten Handy läuft.

Dokumentationssnapshot vor Änderung: Branch `feature/flh05-import-foundation`, HEAD `6a0245cc59e0bf37a194c2583ad137e5a86567b0`, Tree `f521f6b8c360ed54d1bdd145ef563d1a6f697a7b`. Der gelesene Checkpointblob ist `cb015def94cef61bc31cf8ac45a4acb84f5e204d`; Owner **b42fafd72edf** bleibt unverändert zuständig. Keine privaten Portfolios, Original-CSVs, Walletkennungen, Zugangsdaten oder Passwörter für diesen Audit verwendet/veröffentlicht.

**Evidenzklassen:** CODE = konkreter statischer Quellbefund; DOC = bestehender dokumentierter Auftrag/Abnahme; VERIFY = fehlender eigener Laufzeit-/Gerätenachweis oder noch abzusichernder Kontext. Eine Textsuche allein beweist keine gesamte fachliche Implementierung. Die folgenden bestätigten Befunde werden deshalb von breiteren Prüfaufträgen getrennt.

## 2. Konkrete Befunde und erforderliche Restabnahme

### L01 – Long-Press und linke Symbolauswahl fehlen gegenüber dem neuesten Auftrag

**Status: OPEN, CODE + DOC.** Der [erste Nachtrag zu #257](https://github.com/joke0071/foliolab-open/issues/257#issuecomment-6554725106) wird bezüglich Erstauswahl durch die [neuere Nutzerentscheidung](https://github.com/joke0071/foliolab-open/issues/257#issuecomment-6554799285) präzisiert: Ein langer Druck auf Position/Buchung/Stichtag aktiviert **Verwalten und wählt genau diesen Eintrag sofort aus**.

Im geprüften ausgelieferten Quellbestand gibt es keine entsprechende Listen-Gestenbindung; die gefundenen `pointerdown`-Handler betreffen Diagramm und Geheimfeld-Auge. `src/app.js:487` und `:628` erzeugen weiterhin sichtbares **„Auswählen“** neben den Positions-/Buchungscheckboxen. Referenzwerte besitzen bereits eine Checkbox ohne diesen sichtbaren Text (`:265`), aber damit ist die Drei-Listen-/Symbol-/Gestenanforderung nicht erfüllt.

**Abnahme:** 3 Listen × Normal-/Verwalten-Modus; langer Druck wählt ersten Eintrag, kurzer Tap bleibt normal; Scroll/Pointer-Cancel/Ghost Click verhindern; bestehende linke Symbolfläche als echte bedienbare Checkbox, Fallback ohne Symbol; kein doppeltes Auswahlfeld, kein Zeilentext „Auswählen“, Sammelaktion darf bleiben; Tastatur/Screenreader/44px; keine Finanz-/Speichermutation durch Auswahl.

### L02 – Gewichtung ist nur im Detail vorhanden, nicht als gewünschter Prozent-Ring in der Positionszeile

**Status: OPEN, CODE + DOC.** [UI-ALLOC01](https://github.com/joke0071/foliolab-open/issues/149#issuecomment-6562657245) verlangt sofort sichtbare Depot-/Kontogewichte. `src/dashboard-ui.js:68–76` rendert derzeit Name, EUR-Wert und Chevron, aber keinen solchen Ring/Prozentwert. `src/position-detail-ui.js:49–50` zeigt bereits einen Balken **„Anteil am Anbieter“** im geöffneten Detail. Das ist weder die gewünschte Sichtbarkeit noch zwingend derselbe Nenner.

**Abnahme:** klarer Depot-/Kontobezug, vollständiges synthetisches 40/30/20/10-Depot, mehrere Konten bei einem Anbieter, fehlende Kurse/Null/negative Werte/Ausschlüsse/Archiv/FX/Cash; keine falschen 100%, keine neue API-Abfrage, keine Finanzwrites; 320–430px und Desktop. Nicht mit PORT-COMP01 verwechseln.

### L03 – Installationskarte noch vorhanden, kompakte zustandsabhängige Aktion nicht abgeschlossen

**Status: OPEN, CODE + DOC.** [PWA-INSTALL02](https://github.com/joke0071/foliolab-open/issues/149#issuecomment-6585862423). `index.html:62` enthält weiterhin `#pwaHelp` / „FolioLab als App verwenden“. `index.html:14` enthält den bisherigen Textbutton `#installButton`. `src/app.js:2550` besitzt einen einfachen `beforeinstallprompt`-Pfad, aber keinen vollständigen Abschluss des neuen UI-/Zustandsvertrags; im Quellbestand wurde kein `appinstalled`-Handler gefunden. Die Standalone-Abfrage am Dateiende aktualisiert den Hilfetext, nicht diesen neuen Installationssymbolvertrag.

**Abnahme:** große Karte weg; kleines beschriftetes/touchfähiges Symbol im passenden Browser nur bei tatsächlich nutzbarem Prompt; echter Nutzertap; Abbruch/Annahme/Installation behandeln; in Standalone keine Aktion; kein funktionsloser Button, kein automatischer Dialog. Keine globale Installationsbehauptung aus unzureichender Erkennung und keine Daten-/Identitätsänderung.

### L04 – Ladegrundlage vorhanden; neuer Reload-/Sichtbarkeitswunsch ist keine abgeschlossene Teilabnahme

**Status: Basis vorhanden, Nachtrag OPEN/VERIFY, CODE + DOC.** [Reload-Nachtrag](https://github.com/joke0071/foliolab-open/issues/149#issuecomment-6585904942), [Wahrnehmbarkeitsnachtrag](https://github.com/joke0071/foliolab-open/issues/149#issuecomment-6585953631). `index.html` enthält das Boot-Markup vor der App; `src/startup.js` läuft unabhängig vom Modul-/DB-Pfad, `src/loading-ui.js` die kleine Variante. Ein vollständiges Neuladen durchläuft dieses HTML grundsätzlich erneut: **nicht pauschal behaupten, Reload sei überhaupt nicht implementiert, und keinen zweiten Loader bauen**.

`styles.css:1893–1906`: Einblendung nach 300ms; Flüssigkeitsbewegung 1px/2° über 4s; Bläschen 3,8s, im SVG Radien 1–1,5. Das passt zur Möglichkeit kaum wahrnehmbarer Bewegung, beweist aber nicht die konkrete Ursache auf dem Nutzergerät. `prefers-reduced-motion` und verzögerter Fehlerzustand deaktivieren Animation absichtlich.

**Abnahme:** echte Android-PWA und Browser, langsamer isolierter DB-/Boot-Test und echter Reload, sichtbares ruhiges Sprudeln in der ersten etwa 0,5–1s der sichtbaren Phase, kurzer Start ohne künstliche Verzögerung, kritisches Laden vs. nicht blockierende Hintergrundupdates, Offline/Fehler/Timeout/später Erfolg. Video/zeitversetzte Frames statt Einzelbild als Bewegungsbeleg; Reduced Motion bleibt statisch. Keine künstliche Mindestladezeit.

### L05 – Entfernte APIs werden noch aktiv in Hilfetexten empfohlen

**Status: OPEN COPY-DEFECT, CODE.** Im selben Produktstand gibt es widersprüchliche Hinweise:

- `index.html:60`: Hilfe zu bestätigten Kursen nennt weiterhin FMP/Twelve Data als einzurichtende Zugänge.
- `src/position-detail-ui.js:71`: fehlender nativer Verlauf empfiehlt weiterhin FMP/Twelve Data.
- `src/app.js:987`: Wertpapiersuche empfiehlt direkten EODHD-/FMP-/Twelve-Schlüssel.
- Demgegenüber erklärt `index.html:154` die Entfernung korrekt. `src/retired-providers.js` entfernt die alten Schlüssel; `src/model.js` importiert die Bereinigung, `defaultSettings()` enthält die entfernten Schlüssel nicht mehr. Speicher-/Backup-/Restore-Anbindungen sind im Quellbestand vorhanden.

**Folge:** Historische Roadmapaussage „Altanbieterbereinigung noch gar nicht implementiert“ nicht fortführen; den vorhandenen Kern nicht erneut bauen. Die drei konkreten Nutzerhilfen an tatsächlich verfügbare Funktionen anbinden und gezielt testen. **Historische Kursbelege, Quellenmetadaten und alte Instrumentzuordnungen ausdrücklich erhalten**; nicht jedes Vorkommen von FMP/Twelve im Quellcode löschen. Keine neue reale Provider-/Free-Tier-/CORS-Abnahme durch diesen Audit behaupten.

### L06 – „Erfasste Stichtage“ ist noch als Historienquelle sichtbar möglich

**Status: OPEN/VERIFY UI-DELTA, CODE + Nutzerauftrag.** `index.html:36`, `src/app.js:287`, `src/historical-portfolio-value.js:57/62` enthalten den Text; `src/app.js:383–386` schreibt die Quellenbezeichnung in `#historySourceStatus` und versteckt sie nicht generell, sondern zustandsabhängig. Damit ist die verlangte Entschlackung nicht pauschal erledigt. Typografie von „Historische Daten werden geprüft“ und „Gebuchte Vorgänge“ ebenfalls gezielt am aktuellen UI prüfen, nicht nur anhand Stringpräsenz bewerten.

**Abnahme:** beanstandete redundante Zeilen in Übersicht/Verlauf entfernen bzw. kompakt kontextabhängig ersetzen, ohne Datenbasis zu verschleiern. Die Erwägung einer Entfernung der gesamten Stichtagsverwaltung ist **keine** erteilte Daten-/Funktionslöschfreigabe. XIRR/TWR nicht eigenmächtig streichen.

### L07 – CSV-Kursimport noch allgemein statt quellabhängig angeboten

**Status: OPEN, CODE + Nutzerauftrag.** `src/position-detail-ui.js:54–56` baut den CSV-Bereich für Wertpapiere/Krypto allgemein; die Bedingung unterscheidet nicht, ob bereits eine passende alternative Quelle nutzbar ist.

**Abnahme:** häufigen Standardweg entrümpeln; CSV bei Bedarf unter „Mehr“/erweitert, bestehende importierte Quelle weiterhin erkennbar, Ersetzen/Entfernen erreichbar und sicher. Keine Löschung von Kursreihen, keine Abschwächung von Provenienz-/Lückenprüfungen.

### L08 – Zwei Detailwünsche benötigen richtigen Kontext statt stiller Umdeutung

**Status: VERIFY_CONTEXT.** Aus früherem Nutzerauftrag bleibt **„Täglich als Standard“** erhalten; der wiedergefundene Gesprächskontext bezieht sich auf eine Automatik-/Aktualisierungsauswahl, nicht auf eine neue Chartabtastrate. Im Quellsnapshot ist „Täglich“ als Drive-Backup-Intervall vorhanden (`index.html:119`); daraus allein folgt nicht, dass dies die gemeinte Zielauswahl war. Vor einer Änderung die Originalreferenz im Arbeitskontext zuordnen, gespeicherte Präferenzen/Einwilligung erhalten und keine automatische Übertragung ungefragt aktivieren.

Auch der notierte **„6×1“-Anbieterwunsch** bleibt als gezielt nachzuprüfender UI-Auftrag erhalten. Exakter Bereich/Breakpoint wurde in diesem Audit nicht unabhängig aus der Originalreferenz bestätigt. Keine pauschale Sechs-Spalten-Umsetzung auf Mobil und kein falsches DONE.

### L09 – Modellverlauf, Best-Guess, tatsächliche Historie und Score sind getrennte Pakete

**Status: PARTIAL/OPEN bzw. VORSCHLAG.** Vorhandene belegte Rekonstruktion und heutige Bestands-/Kursansichten ersetzen keine fertig abgenommene ausdrücklich auswählbare Modell-/Best-Guess-Variante. Best-Guess ist rein visuell zu markieren und darf keine bestätigten Stichtage, Buchungen, Kostenbasis oder Renditen verändern. Ein Modell mit heutigen konstanten Stückzahlen ist nicht die tatsächlich erzielte persönliche Rendite.

[PORT-COMP01](https://github.com/joke0071/foliolab-open/issues/149#issuecomment-6562561993) ist ausdrücklich ein Vorschlag mit offener Scoreformel/-gewichtung. UI-ALLOC01 dagegen ist der konkrete freigegebene Gewichtsauftrag. FLH-PROJ01 #252 ist ACTIVE/PLANNED und nicht mehr PARKED. Diese drei Umfänge nicht vermischen.

### L10 – Backup-/Synchronisierungs- und Hardwaregrenzen sichtbar erhalten

**Status: implementierte Teile + OPEN/EXTERNAL.** `src/header-status.js` besitzt Zustände für lokal/Drive/erneut verbinden. `src/drive-backup.js` hat Autorisierung und `maybeAuto()` nach Verbindung; das ist vorhandene Backupfunktion. Kein daraus abgeleiteter Beleg für vollständige revisionssichere Mehrgeräte-Synchronisierung FLH04.

Echte Android-Launcher-/Standalone-/TalkBack-/Kaltstart-/Wiederaufnahmefälle, reale OAuth-/Neugeräte-/Mehrtab-/Tokenablauf- und OS-/Quota-/Evictionfälle bleiben separat offen, soweit kein tatsächlicher Nachweis vorliegt. Früher bestandene synthetische Performance-/Browserprüfungen bleiben gültige Teilbelege, werden aber nicht zu Hardwarebelegen umetikettiert.

### L11 – Importteilabnahmen schließen weder UH03 noch den vollständigen Master ab

**Status: PARTIAL.** UH02 ist als begrenzte Kette dokumentiert abgenommen. UH03 enthält bereits produktive Kraken- und einen weitergehenden deployed Bitpanda-Schnitt; historische Endbelege, unabhängige Originalabgleiche, Kraken-Zeilenreihenfolge, Gebühren-/Transfer-/Chain-Kombinationen und selektive Rücknahme bleiben offen. UH04 ist vorhandener Flatex-Kern plus noch offene vollständige Integration, nicht ein Neubau. UH05 muss reale kombinierte Alltagsketten abdecken, nicht nur Parser/Preview.

Die priorisierten fünf Anbieter ersetzen **nicht** sämtliche FLH03/FLH05-Aufträge; Trade Republic und weitere freigegebene Profile bleiben ausdrücklich im Gesamtbestand. Keine Originale pauschal neu anfordern, keine generierten Bestände als unabhängige Quellenbelege ausgeben.

### L12 – Veraltete Releaseköpfe und pauschale DONE-Angaben korrigiert

**Status: Dokumentationskorrektur.** Vor dem Audit führten Roadmap/Priorisierung #283 noch als Kandidat und den 25-Minuten-Livebudgetfehler als aktuellen Blocker. Der neuere Checkpoint enthält bereits den Merge, die Firefox-Navigationsdiagnose und den gezielten Retry. Die neue Übersicht verweist deshalb bei volatilen Statusdaten auf den aktuellen Checkpoint, statt historische Blöcke als Gegenwart zu wiederholen.

UI-LOAD01/PWA-FULL01 „DONE“ gilt nur für den v267-Grundumfang; spätere Nachträge sind offen. #257-Grundverwaltung ist nicht Long-Press. API-Retirement ist nicht mehr unimplementiert, hat aber Copyreste. Gesamterledigt wird nur ein nachweislich abgegrenzter Vertrag.

## 3. Vollständiger beibehaltener Arbeitsbestand

Die [aktuelle Roadmap](KONSOLIDIERTE_ROADMAP.md) führt zusätzlich zu den konkreten Befunden ausdrücklich weiter: UI-POS02/BOOK03, sichere Buchungs-/Positions-/Referenzmutationen, Transferintegration, Hero-Prüfbereich, UI-TEXT-/Mehr-/Onboarding-/Leerzustands-/Toolbar-/Filterverträge, Cash-/Festgeld-/Konten-UX, Datenquellen/Free-Tier und Geheimfelder, Drive-Backup und separat FLH04, REL-RECOVERY01 #254, FIN-E2E01 #255, PERF01 #177/PERF-ANDROID03 #256, reale Geräte-/A11y-/Dirty-Dialogfälle #44/#157, Wallet-/Staking-/AT-/Settlement-/Kapitalmaßnahmenreste, HIST-VIS01, FLH-PROJ01, PORT-COMP01, NAM01/COPY01 und CI-OPT01/EFF01/HND01. Historische Details bleiben verlinkt vollständig erhalten.

Das ist eine **Scope-Abdeckung**, keine Behauptung, jeder dieser Teilfälle sei heute funktional neu getestet worden. Unklare oder externe Nachweise werden als VERIFY/EXTERNAL und nicht als erledigt geführt. Frühere ersetzte Entscheidungen (PARKED, Wochenendsperre, alte Namens-/4×2-Layouts) nicht reaktivieren; neue Funktionalität nicht aus bloßen Assistentenvorschlägen als freigegeben ableiten.

## 4. Dokumentationsänderung und sichere Integration

Nur die Roadmap-/Prioritätseinstiege und dieser Bericht werden geändert/ergänzt. Die beiden vorherigen vollständigen Dokumente werden unter neuen Dateinamen mit **denselben Git-Blob-SHAs** erhalten; relative Detail-/Beleglinks bleiben im selben `docs/`-Verzeichnis verwendbar. Keine historische Anforderung geht durch eine Zusammenfassung verloren.

**Nicht verändert:** Produktcode, Tests, Workflows, Service Worker, Manifest, Datenformat, aktiver Owner, CHECKPOINT-Inhalt, bestehende CI oder Deployment. Veröffentlichung dieser Dokumentation ist weder ein Produktrelease noch LIVE_ACCEPTED. Branchfortschreibung nur ohne Force und mit erwarteter HEAD-SHA; bei Konkurrenz neu lesen und den aktuellen Checkpoint erhalten. Den historischen Checkpointbranch niemals vollständig nach Main mergen.

**Nächster Schritt des aktiven Owners:** aktuellen Releaseabschluss gemäß Checkpoint, UH03 → UH04 → UH05; die konkreten neuen UI-/Copy-Deltas am passenden konfliktfreien Schnitt berücksichtigen. Keine neuen großen Test-/Recherchezyklen nur wegen dieses Statusabgleichs. Vor dem Schließen eines Teilpunkts Anforderung, Code, gezielte Tests, Commit/PR, Deployment, echte Abnahme und verbleibende Grenzen verknüpfen.

## Primärbelege

- [Geprüfter Produktcommit](https://github.com/joke0071/foliolab-open/commit/f02c4ef277ba727eeecfee07e7b4261ab3b7a4bb), [zugehöriger Mainlauf](https://github.com/joke0071/foliolab-open/actions/runs/41521172914).
- [index.html](https://github.com/joke0071/foliolab-open/blob/f02c4ef277ba727eeecfee07e7b4261ab3b7a4bb/index.html), [app.js](https://github.com/joke0071/foliolab-open/blob/f02c4ef277ba727eeecfee07e7b4261ab3b7a4bb/src/app.js), [dashboard-ui.js](https://github.com/joke0071/foliolab-open/blob/f02c4ef277ba727eeecfee07e7b4261ab3b7a4bb/src/dashboard-ui.js), [position-detail-ui.js](https://github.com/joke0071/foliolab-open/blob/f02c4ef277ba727eeecfee07e7b4261ab3b7a4bb/src/position-detail-ui.js), [styles.css](https://github.com/joke0071/foliolab-open/blob/f02c4ef277ba727eeecfee07e7b4261ab3b7a4bb/styles.css).
- [UI-Master #149](https://github.com/joke0071/foliolab-open/issues/149), [Verwaltung #257](https://github.com/joke0071/foliolab-open/issues/257), [laufender Checkpoint](WORK_RESTPAKETE_CHECKPOINT.md), [gemeinsamer Importplan](IMPORT_HISTORY_UNIFIED_PLAN_2026-11-01.md).
