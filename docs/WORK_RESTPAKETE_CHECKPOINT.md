# Aktueller sicherer Checkpoint · PR179 / WebKit-Bildbefund · 27.10.2026

HEAD `b6b84d374ca8f034da70462341fe2115916556b0`, Tree `7ef9133af734fa17e8ea96939a1d32b6f98723ff` lokal/remote exakt. PR179 bleibt DRAFT, kein Merge/Deployment. Produktion unverändert v190/main7b7fae7.

Vorstand b0d0f6: CI40587872054 und Wallet40587871906 vollständig SUCCESS,766/766 Units0fail0skip, Chromium+beideFirefox/WebKit-Shards, neue und bestehende Buchungs-/Finanz-/CAS-/Quota-/Abbruch-/Offline-/Restore-/Undo-/Axe-Gates. Nach tatsächlicher Bildprüfung dennoch **WebKit320-Textüberlauf der oberen gemeinsamen Auswahlcheckbox erkannt**. Deshalb keine voreilige visuelle/Releaseabnahme. Minimaler gemeinsamer Grid-Layoutfix statt Flex, zusätzliche Bounding-Prüfung für Text innerhalb des Touchziels in allen fünf Breiten. Aktuell CI40589392451 und Wallet40589392368 laufen; vorher sämtliche Jobs regulär beendet, nichts abgebrochen oder neugestartet.

Neuer niedrig priorisierter CI-Nachtrag nur lesend abgeschlossen und in CI_OPTIMIZATION_CHECKPOINT.md dokumentiert: PR176-Shards/Baseline wiederverwendet; tatsächliche erfolgreiche Job-/Stepzeiten aus40575706366/40587872054, Testausführung größter Anteil; Setup52–76s versus5s Chromium. **Keine Workflowänderung**, weil zusätzlicher Optimierungs-/Validierungsschnitt den aktiven Abschluss verlängern würde. Vollständige CI-Optimierung bleibt abschließend offen; kein zweiter Entwicklungsprozess.

Eigene konkrete Nutzerfreigabe für das neue Opt-in-Modell4/Speicher-/Backup-Vertrag bleibt vor Merge/Deployment erforderlich. Erst alle aktuellen Gates und neue WebKit-Bilder prüfen, dann reviewfähigen Kandidaten zur Releaseentscheidung vorlegen. Vollständige fachliche Grenzen/Nachträge unverändert erhalten. FLH05-A/PERF01 weiterhin nicht vorgezogen.

---

# Aktueller Buchungs-UI-Kandidat · PR179 · 27.10.2026

**PARTIAL / DRAFT / RELEASE GESPERRT:** [PR179](https://github.com/joke0071/foliolab-open/pull/179), HEAD `b0d0f62729c92c9b38f948b7f9fadd2e0ed3f0c2`, Tree `21823d841cd0eeab3a2315b947ec7a498aef531d` lokal/remote exakt. Produktion unverändert v190/main7b7fae7. Einziger aktiver funktionaler Strang gemäß Rang3; FLH05-A/PERF01 weiterhin zurückgestellt.

Lokal766/766 Units/check PASS. Aktueller vollständiger PR-Lauf40587872054 und Wallet40587871906 laufen. **Noch keine vollständige Browser-/visuelle Abnahme und keine Merge-/Deploymentfreigabe behauptet.**

Erste drei Läufe40585032435/40585906272/40586826976 bleiben als Fehlnachweise erhalten: neue Testannahme zu explizit manuellen technischen Notizen präzisiert (wirtschaftliche Felder gesperrt), Handler für unveränderten Dialog korrekt begrenzt, Restore-Test auf den tatsächlichen aktuellen Backup-V2-Tresor umgestellt. Keine Finanz-/Schutzassertions entfernt. Jeweilige unabhängige Cross-Engine-Blöcke2 und Walletchecks bestanden; sämtliche laufenden Jobs vor jedem Branchupdate zu Ende laufen gelassen.

Erste synthetische Chromium-Bilder bei320/390/430/768/1440 tatsächlich angesehen. Dabei nachgewiesenen engen Fünfspaltenumbruch bei768px mit vorhandener Zweispaltenlogik behoben; Betragsausrichtung trotz Herkunftszeile wiederhergestellt. Finale Bilder einschließlich neuem Kontextdialog in fünf Breiten/3Engines noch prüfen. Artefakt des dritten Laufs12771502492, ZIP-SHA2562653bbe2a2c52cb35b0109dcb545dde21cdda566346909f45832673f23a3d48b; kein bestandener Gesamtgate dadurch behauptet.

Umfang: direkte gleiche Zeilenicons/Toolbar/Selektion; vorhandene sichere manuelle Notiz-/EUR-Cash-Korrekturen; Sichtbarkeitsarchiv ohne finanzielle Wirkung, mit Bestätigung/CAS/Undo/Reimportschutz. Breitere Import-/API-Interpretation, weitere Bearbeitungsfelder, Sammelbearbeitung und fachlicher Ausschluss bleiben OPEN.

**Eigenes kritisches Releasegate:** Opt-in Modell4 mit streng validiertem bookingPresentation erst bei bestätigter Archivierung; alte Leser lehnen vor Metadatenverlust ab, kein Startupgrade/IDB-Schemawechsel. Eigene konkrete Nutzerfreigabe für Speicher-/Backup-Vertrag vor Merge/Deployment erforderlich. v188-Freigabe wird nicht erweitert. Dokumentierte Nachträge #149/#165 vollständig erhalten.

---

# Verbindlicher Master-Checkpoint nach v190-Live-Abnahme · 27.10.2026

**DONE: PR178 / begrenzte native Ledger-Vorschau produktiv und LIVE_ACCEPTED.** Aktueller main `7b7fae74d864914c9c4f4dab6a2300c8ee0e0ef5`, geprüfter Tree `eb11131cbf0e64b2ec6492796180cccd536480f1`. [Releasebeleg](release-evidence/ledger-live-v190-release.json), [Ledger-Fachcheckpoint](LEDGER_LIVE_CHECKPOINT.md). Dieser aktuelle Master-Dokumentationsstand liegt auf dem erhaltenen Branch feature/flh05-import-foundation; keine zusätzliche Integration dieser Abschlussdokumentation in main behauptet.

- Finale PR-CI40575706366 und Wallet40575705811 SUCCESS; Main/Pages/Live40577138273 SUCCESS:757/757 Units,0Fehler/0Skip,Chromium/Firefox/WebKit,Deployment,109exakte veröffentlichteSHA256/SW190,6Kerngruppen/18Axe sowie bestehende UI-/History-/Transfer-Livegates.
- Zusätzliche tatsächliche native Ledger-Produktionsabnahme40578647542 aufQA-only6fcb4274543666a3629d5de2f498dde6fc6c0b25 SUCCESS:12Appquellen exakt geprüft; veröffentlichte App/Testassertionen unverändert; keinerlei Request-Interception;3Engines,320/390/430/768/1440,Axe,44px/Footergeometrie,Fokus,Dateierkennung,Wallet-/Bittr-Referenzen,HostileCSV,Reimport/Mixed-source-Guards,Submitblock,Escape/Cancel,echterOfflinereload und exakt unveränderter kanonischerRecord/Revisionsstand.
- Finale tatsächliche Produktionsbilder Chromium320/390/430/1440,Firefox320/1440,WebKit320/1440 visuell PASS. Ausschließlich synthetische Daten in frischen isolierten Browserkontexten. Keine privaten Originale/Adressen/Hashes/Dateifingerprints veröffentlicht.
- Frühere Fehlläufe40573650180 und40574522241 erhalten, keine CI unterbrochen. Alter ABCE-Resize-Nav-Test stabilisiert; echter Offlinepfad ohne Request-Interception geprüft; tatsächlicher320px-Footerfehler durch kurzesLabel'Nur Vorschau' samt zusätzlichen Geometrieassertionen behoben. Keine Assertions oder Pflichtgates entfernt.

**PARTIAL: vollständige Ledger-Verbuchung/#159.** Produktiv ist bewusst nur native Erkennung und lokale Prüfvorschau. Keine neuen Buchungen, Bestände, Cashflows, Einstandswerte, Historien oder sonstigen Daten werden übernommen. BestehenderCSV-/Decimal-/Wallet-/Bittr-Kern wiederverwendet, kein zweiter Finanzkern. Vorhandene lokale Originalschema-/Bittr-Belege nicht erneut analysiert; keine neue vollständige Originaldatei-/Bestands-/Historienabnahme behauptet. Finanzielle Übernahme erfordert pro unterstütztem Fall konkrete Netzwerk-/Ereignis-Locators, Eigentums-/Fee-/Transfersemantik, unabhängige Sollwerte und eigene kritische Releaseentscheidung. Hash/Ticker/Countervalue allein genügen nicht; native Fee-/Failed-/Staking-/Swap-Fälle bleiben ungeklärt statt erfunden. #159 bleibt offen.

**Nächster zulässiger bestehender Strang: UI-/UX #149 und Buchungsverwaltung #165.** Der konsolidierte neueste Nachtrag steht vollständig in [BOOKING_MANAGEMENT_CHECKPOINT.md](BOOKING_MANAGEMENT_CHECKPOINT.md) und ersetzt frühere widersprechende UI-Vorgaben: direkte rechte Icons **Bearbeiten, Löschen, Archivieren/Wiederherstellen**, gemeinsamer kontextabhängiger Dialog; gleiche Auswahlleiste/Komponenten/Zweispalten-Mobile wie Positionen. Archivieren = reversible reine Sichtbarkeit ohne Finanzwirkung; Ignorieren = getrennte belegpflichtige Fachmutation. Breitere Felder/Herkünfte nur nach Zulässigkeits-/Original-/Gruppen-/Reimport-/CAS-/Audit-/Undo-/Restorevertrag, keine Scheinfunktion oder stillen Teiländerungen. Noch keine Umsetzung dieses neuen UI-Nachtrags behauptet. Danach übrige realeUI17-09/10/1W und Vorgänger gemäß [Roadmap](KONSOLIDIERTE_ROADMAP.md).

Gesamtaudit DONE nur als Bestandsaufnahme, Gesamtumsetzung weiterhinPARTIAL. FLH03-Gesamtabgleich,Drive-Duecheck,FLH04-Verträge/Tests und realeOriginal-/Hardware-/OAuth-/AT-Fachgates offen gemäß Matrix. PERF01/#177 ohne App-Startbaseline/Implementierung an dokumentierter Stelle. **FLH05-A bleibt zurückgestellt**, konsolidierte Spezifikation mit allen12Vektoren unverändert. Neue kritische Finanz-/Migrations-/Backup-/Syncfunktionen benötigen eigene konkrete Nutzer-Releasefreigabe; keine pauschalev188-Erweiterung. Keine parallele Implementierung und kein Redesign.

---

## Historische Release-, Kandidaten- und Auditcheckpoints (neuester Stand oben)

# Laufender sicherer Releaseabschluss Ledger-Vorschau / PR178

PR178 nach vollständigen finalen Gates und Scope-/Fach-/Integrationsreview kontrolliert gemergt: main7b7fae74d864914c9c4f4dab6a2300c8ee0e0ef5, Treeeb11131cbf0e64b2ec6492796180cccd536480f1 exakt identisch mit bestandenem PR-Merge. VollePR-CI40575706366 und Wallet40575705811 SUCCESS:757/757 Units,0Fail/0Skip,Chromium/Firefox/WebKit; nativePreview/echterOfflinereload/5Breiten/Axe/44px/Footer/Nullmutation/keineexternenRequests3Engines. Finale8synthetischeScreens tatsächlich visuell PASS. Alte Fehlläufe erhalten, keine CI unterbrochen. Beleg: [Ledger-Kandidat](release-evidence/ledger-live-v190-release.json).

**Main/Pages/Live40577138273 läuft noch; v190 ist nicht abschließend produktiv abgenommen.** Danach zwingend gezielte tatsächliche Ledger-Produktion in3Engines und finaleBildprüfung. Bis dahin Produktcode eingefroren, keine paralleleUI-Implementierung. Letzte vollständige Live-Abnahme bleibtv189. Releaseentscheidung betrifft ausschließlich rein lesende lokale Vorschau ohne neue Finanz-/Storage-/Backup-/Syncmutation unter bestehendem Masterauftrag; keine neue kritische Nutzerfreigabe unterstellt. Vollständige nativeVerbuchen-Funktion/#159 bleibtPARTIAL/BLOCKED nach dokumentiertem Locator-/Fee-/Ownership-/Transfervertrag, Original-/Sollwert- und kritischen Freigabegates.

Neuer konsolidierter UI-Nachtrag149/165(Bearbeiten/Löschen/Archivieren-Wiederherstellen; Archiv reinvisuell vs Ignorieren eigenefachlicheAusnahme; Herkunfts-/Feld-/Reimport-/Gruppen-/Rollbackvertrag) in BOOKING_MANAGEMENT_CHECKPOINT.md ab674249 gesichert. Umsetzung erst nach sicherem Ledgerabschluss/-Blockercheckpoint gemäß unveränderterGesamtroadmap. FLH05-A bleibtzurückgestellt,12Vektorenunverändert;PERF01nichtvorgezogen.

---

## Frühere Kandidaten- und Auditcheckpoints (neuester Stand oben)

# Aktiver Vorgängerschritt: Ledger #159 / Draft-PR178 · 27.10.2026

Produktion unverändert vollständig abgenommenesv189/main8ac0b2f9cba4a5fdbc61632f7b2cec2720e12261. Einziger aktiver funktionaler Strang: bestehender Ledger-WIP auf demselben Branch feature/ledger-live-preview mit v189 integriert, HEAD9b91ff72d826db0cb2ef3627da79d0c988a109bd, Treeeb11131cbf0e64b2ec6492796180cccd536480f1. Original-WIP0c292c8 als Commitvorfahr erhalten. Draft-PR178, aktuelle CI40575706366 und Wallet40575705811 laufen; noch keine Releasebereitschaft/kein v190 behauptet.

Begrenzter rein lesender nativer12-Spalten-CSV-Preview: bestehender CSV-/Decimal-/Wallet-/Bittr-Kern, explizite Walletzuordnung, referenzierte vorhandene Beleggruppen. Eigentums-/Ticker-/Tokenwidersprüche hängen keine fremden Wallet-/Bittr-Referenzen mehr an. Ledger-Countervalues bleiben Marktbeobachtungen, keine Kauf-/Steuerbasis. Failed/Delegation/Unbonding/Swaps/Fees ungeklärt sichtbar. Keine native Persistenz/Bestands-/Journal-/Cashflow-/Kostenbasisübernahme. Gemischte Stapel und generische Umgehung gesperrt; Submitguard hält Übernahme auch nach provoziertem Formsubmit deaktiviert.

Lokal757/757 Units,0Fehler/0Skip und Syntax PASS. Neuer Native-Browsergate in bestehendem CSV-Batch-Suitepfad: alle3Engines/5Breiten/Axe/44px/Zuordnung/Bittr/HostileCSV/Reimport/Abbruch/Escape/Offline/exakt unveränderter kanonischer Record. Keine Workflow-/Policyänderung oder alter Test entfernt. Lokale Browserinstallation gescheitert(leere/ungültige Downloadarchive); kein lokaler Browserpass behauptet. Volle PR-CI und visuelle Evidenz ausstehend. Branchcheckpoint docs/LEDGER_LIVE_CHECKPOINT.md mit Fachmatrix und konkreten Grenzen.

Erhaltene erste Fehlläufe:40573650180 Chromium757/NativePASS, Cross2 alter Resize-Navigationshelfer und Cross1 neuer FirefoxOffline-Test rot;40574522241 Chromium757/NativePASS und Cross2PASS, Cross1FirefoxOffline weiter rot. Kein Job unterbrochen, keine Assertion abgeschwächt. Sichtbare Navigation wird im Test bei jedem Klick neu ausgewertet; aktueller Native-Test beobachtet Netzwerk statt Request-Interception und verlangt echtenSW-Controller/Offlinereload/Dateiauswahl/Nullmutation in allen3Engines. Tatsächliche erste Chromiumbilder zeigten bei320px einen angeschnittenen Abbrechen-Button; minimale Produktbeschriftung nun'Nur Vorschau', neue strikte Footer-Geometriechecks. Finale Bilder/Gates ausstehend, SW190 nicht veröffentlicht.

Vorgänger-Gesamtaudit weiterhin DONE nur als Inventar, Gesamtumsetzung PARTIAL. #159 bleibt PARTIAL; vollständige native Übernahme braucht belegte Ereignislocators/Fee-/Transfer-/Ownershipsemantik pro unterstütztem Fall, unabhängige Sollwerte und gesonderte kritische Releaseentscheidung. Frühere lokale Originalschema-/Bittr-Belege wiederverwendet, keine privaten Originale/Kennungen/Dateifingerprints publiziert. Nach sicherem Ledgerabschluss/-Blockercheckpoint reale UI-/1W-/weitere Vorgängerdeltas gemäß Roadmap. PERF01 nicht vorgezogen; FLH05-A weiterhin zurückgestellt, Spezifikation/12Vektoren unverändert.

---

## Konsolidierter UI-Nachtrag #149/#165 aufgenommen · Umsetzung nach Ledgercheckpoint

Verbindlicher neuester Vertrag in [BOOKING_MANAGEMENT_CHECKPOINT.md](BOOKING_MANAGEMENT_CHECKPOINT.md): direkte rechte Zeilenicons **Bearbeiten/Löschen/Archivieren-Wiederherstellen**, ein kontextabhängiger Bearbeitungsdialog statt separater Hauptaktionen; gleiche Auswahlleiste/Styles/Zweispalten-Mobile wie Positionen. Frühere drei Korrekturbuttons und der frühere Ausschluss von Buchungsarchivierung dadurch ersetzt. Archivieren ist reine reversible Sichtbarkeit mit Archivfilter und unveränderten Finanzwerten; Ignorieren/Berechnungsausschluss ist getrennte belegpflichtige Fachmutation. Breitere Felder/Herkünfte nur nach Zulässigkeitsmatrix, Original-/Source-Replay-/Referenz-/CAS-/Audit-/Restore-/Undo-Vertrag. Keine stille Reaktivierung gelöschter/ausgeschlossener Quellen beim Reimport, keine Teilgruppen oder fiktiven Gegenbuchungen, keine stillen Teilerfolge. Konkrete synthetische Fall-/Mobile-/Axe-/Rollbackgates im verlinkten Vertrag. Neue kritische Funktionen erfordern eigene Releasefreigabe, v188 nicht pauschal erweitert.

#149Kommentar6452285529/#165Kommentar6452285941 sind die konsolidierte Vorgabe; ältere Kommentare6452174228/6452174628 bleiben als Verlauf. Noch keine UI-/Finanz-/Archivierimplementierung. Laufende Ledger-CI bleibt unberührt; Reihenfolge unverändert und FLH05-A weiter zurückgestellt.

## Letzter vollständig abgenommener Release und Gesamtaudit

# Verbindlicher Master-Checkpoint nach v189-Live-Abnahme · 27.10.2026

**Laufender sicherer Teilschritt abgeschlossen: PR175/v189 LIVE_ACCEPTED.** main `8ac0b2f9cba4a5fdbc61632f7b2cec2720e12261`, geprüfter Mergebaum `1101b31800f0237427f090169f586be32675d1c9`. Rein lesende Kontonachweise aus bestehenden Qualitäts-/Historien-/Importquellen; keine neue Finanzengine oder Persistenz. Beleg: [v189-Live-Abnahme](release-evidence/account-evidence-v189-release.json).

- Finale kombinierte PR-CI40567910132 und Wallet40567910143 SUCCESS.
- Main/Pages/Live40569298229 SUCCESS:743/743 Units,0Fail/0Skip;Chromium/Firefox/WebKit;107 exakte veröffentlichte SHA256/SW189;6Kerngruppen/18Axe plus bestehende UI-/Historien-/Transfer-Livegates.
- Zusätzliche tatsächliche Konto-Produktionsabnahme40571543151 SUCCESS auf QA-only070bb4ec0d6a4c7622d184ccd3faccfc03966cff: sieben Appquellen erneut exakt verifiziert; originale Testassertionen erhalten; drei Engines und320/390/430/768/1440px;Axe,44px,Keyboard,Fokus,Kontosprung,Filter,eigene Auf-/Zu-Pfeile,exakt unveränderter Datensatz/Revisionsstand bei Ansicht.
- Finale tatsächliche Produktionsbilder Chromium320/390/430/1440 undClosed320,Firefox320,WebKit320/1440 visuell PASS. Nur synthetische Fixtures in isolierten Browserkontexten; zwei nicht veröffentlichte Testressourcen lokal bedient, keine Appressource ersetzt. Frühere reine QA-Vorbereitungsfehler40571222052(Tests nicht veröffentlicht) und40571419622(zu flacher Checkout) bleiben ausdrücklich erhalten und zählen nicht als Abnahme.
- Keine CI unterbrochen. Keine neuen Finanz-/Storage-/Backup-/Syncmutationen oder kritischen Freigaben abgeleitet.

**Vorgänger-Gesamtaudit DONE ausschließlich als Bestandsaufnahme; Gesamtumsetzung PARTIAL.** Vollständiger Deltaaudit ccd7dd879b720a02ff218f3239f33c579a01a388:19FLH03,12UI17/#149,5AUD,24BENCH sowieFLH04/Drive/AT/R/WP/PLUS/#165/#44/#52/#177. Details in [Audit](KONSOLIDIERTER_RESTARBEITEN_AUDIT.md) und [verbindlicher Reihenfolge](KONSOLIDIERTE_ROADMAP.md). Dieser aktuelle zentrale Checkpoint liegt auf dem erhaltenen Dokumentationsbranch feature/flh05-import-foundation; Integration dieser neuen Dokumentation in main wird nicht behauptet.

**Nächster bestehender funktionaler Strang:** Ledger18/#159 auf erhaltenemWIP0c292c8 fortsetzen, vom nun abgenommenenmain integrieren und SW-Kandidat neu auf190 abstimmen. Keine Wiederholung bereits belegter Originalschema-/Bittr-Prüfung. Danach tatsächliche UI17-09/10/1W und übrige ohne externe Blocker ausführbare Vorgänger gemäß Roadmap. Vollständiger Broker-/Kontoabgleich bleibt durch diese readonly Übersicht nicht erledigt.

Drive-Fälligkeitsprüfung bei durchgehend sichtbarer autorisierter Sitzung bleibt konkret OPEN; FLH04-Sicherheits-/Revisions-/Konfliktvertrag und Tests OPEN, echte OAuth/Transport-/Neugerät-/Recovery-Gates getrennt. Hardware/Original-/AT-Fachvalidierung explizit extern. PERF01/#177 bleibt ohne App-Startbaseline/Implementierung an dokumentierter Stelle nach ausführbaren Vorgängern. CI176 ist abgeschlossene begründete Checkpoint-Ausnahme(667→391s Pflichtspanne;Runner+3,67%), kein App-Performancebeleg und keine weitere Vorziehungserlaubnis. **FLH05-A bleibt zurückgestellt**; Spezifikation mit allen zwölf Vektoren unverändert(Blob953f816c648ebabec42476be80cd0bf481fe6a2e). Keine parallele Implementierung.

---

## Historische Audit- und Arbeitscheckpoints (oben hat Vorrang)

# Aktueller verbindlicher Auditabschluss vor weiterer Implementierung

**Vorgänger-Gesamtaudit DONE als Bestandsaufnahme, Gesamtumsetzung PARTIAL.** Vollständiger aktueller Deltaabschluss in [KONSOLIDIERTER_RESTARBEITEN_AUDIT.md](KONSOLIDIERTER_RESTARBEITEN_AUDIT.md), verbindliche Sequenz in [KONSOLIDIERTE_ROADMAP.md](KONSOLIDIERTE_ROADMAP.md), maschinenlesbare Abdeckung in [release-evidence/predecessor-audit-v188.json](release-evidence/predecessor-audit-v188.json). Alle19FLH03-/12UI17-/5AUD-/24BENCH-IDs und FLH04/Drive/AT/R/WP/PLUS/#165/#44/#52/#177 abgedeckt; keine Umsetzung als DONE aus bloßer Planung behauptet.

Aktueller main433ab1585e475b8560694959b210b40a250f2cb6, Anwendung weiterhinv188; CI176 einschließlich Main/Pages/Live40563994432 tatsächlich SUCCESS. Begründete CI-Vorziehung abgeschlossen; keine weitere Performance-/CI-Implementierung vor der dokumentierten Gesamtsequenz. PERF01/#177 P1 integriert, noch keine App-Startbaseline/Optimierung/30%-Abnahme. Konkretes bislang offenes Drive-P1: regelmäßige Fälligkeitsprüfung bei durchgehend sichtbarer gültiger Sitzung fehlt; reale OAuth-Gates separat. Nächste sichere Aktion: bestehenden PR175 gegen neue Main-/CI-Basis kombiniert prüfen und live abschließen, danach Ledger18 und echte UI-/weitere Vorgängerdeltas gemäß Roadmap. **FLH05-A weiterhin gesperrt.** Während dieses Auditschritts keine Produkt-/Workflow-/Finanz-/Storageänderung.

---

## Frühere laufende Checkpoints (neuere Auditabnahme oben hat Vorrang)

# Aktiver Master-Checkpoint ab v188 — 27.10.2026

Aktueller main: `433ab1585e475b8560694959b210b40a250f2cb6` (ausschließlich CI). Letzte vollständige Produktionsabnahme: v188/ca1fa8fd46b3060d10a13095400bc3d33b0f3c42; Main/Pages/Live40563994432 auf433ab15 läuft noch. SW188 bleibt unverändert. PR173 nach konkreter Nutzerfreigabe gemergt und vollständig live abgenommen: Main/Pages/Core/UI-CI40534397532 sowie zusätzliche gezielte Drei-Engine-Mutations-Live-CI40536412182 SUCCESS;735 Unit-Tests,106 exakte veröffentlichte Assethashes,6Kerngruppen/18Axe. Keine laufenden Releases oder funktionalen Parallelstränge beim FLH05-Einstieg. Persistenter Releasebeleg: `qa/v188-live-targeted:docs/release-evidence/booking-management-v188-release.json` /6bbe2b7cf52283a3cc133895c554915cdba2cb3d.

Dieser Block ist der aktuelle fortlaufende Status. Die unveränderten historischen Nachweise darunter bleiben erhalten und sind keine offene Wiederholungsarbeit. Bestehende konsolidierte Auditmatrix/Roadmap wird referenziert, nicht neu erfunden.

| Paket | Tatsächlicher Status | Abhängigkeit / Restrisiko | Priorität / nächster Schnitt |
| --- | --- | --- | --- |
| v188 / #165 / Auswahl-UI | DONE für freigegebenen begrenzten Cash-/Notiz-/Auswahlumfang | Breitere Trade-/Import-/Wallet-/Transfermutationen bleiben gesperrt; sitzungslokales Undo | Erledigt, nicht erneut entwickeln |
| FLH05-00 / #174 | IN PROGRESS: öffentliche Quellen, konkrete Codepfade/SHAs/Lizenzen gelesen; Formatkatalog in Arbeit | Exportexistenz ≠ Spaltenvertrag ≠ echter Bestandsabgleich | ZURÜCKGESTELLT: nur laufende Konsolidierung abschließen; Vorgänger zuerst |
| FLH05-01/02 | OPEN/PARTIAL: vorhandener CSV-/Batch-/Mapping-/Identitykern wiederverwendbar | Encoding/Headerposition/Mehrdeutigkeit, sichere lokale Templates ergänzen | Nach00: Input-/Profilvertrag, kleine Inkremente |
| FLH05-03–06 | PARTIAL: vorhandene Exact-/Journal-/CAS-/Preview-/Undo-/Transfer-/Historienbausteine produktiv | Mehrbeine/PartialFills/mehrere Fee-Währungen/Quellenabgleich brauchen Beweise; P0-Simulation vor Commit | Finanzintegrität vor neuer Formatbreite |
| FLH05-07–09 | OPEN: strikte JSON-Profile, reproduzierbare10k/50k/100k-Benchmarks und erweiterte Securityfälle | Keine eval-Regeln, automatische Communityinstallation oder ungeprüfte Bibliothek | Sequenziell nach gemeinsamem Vertrag |
| FLH05-10 / Originale | PARTIAL/BLOCKED je Dialekt | Ledger-/Bittr-Schemata früher lokal validiert; neue End-to-End-Abnahme gesondert. Native flatex Depot+Cash, Kraken, Bitpanda/TR noch konkret nachweisen | Dateianforderung vorbereiten; sichere Vorarbeit fortsetzen |
| #159 Ledger Live | OPEN, früher Vorschauversuch geparkt/unveröffentlicht | Branch `feature/ledger-live-preview` /0c292c8d94b4f1ce95b1173873d0b713da56549b;11lokaleUnits, keine Browser-/Original-/Releaseabnahme | Als bestehendes FLH03-Vorgängerpaket prüfen; vorhandenen Branch erhalten |
| FLH03-07/16, AT/BENCH/#124 | PARTIAL: belegte Cash-/Transfer-/Historien-/Jahres-/Kontoprüfungen erhalten | Anbieterübergreifende Gesamtsynthese und Originalabgleich offen; keine zweite Engine | Nach verfügbaren gemeinsamen Eingängen |
| 1W Vermögenszeitraum | OPEN; Marktcharts haben bereits7T | Gemeinsame Wealth-Perioden erweitern, vorhandene Diagramme erhalten | Kleiner unabhängiger späterer Schnitt |
| #44 Reliability | DONE für bereits abgenommene lokale IDB/CAS/Recovery/Restore-Pakete; reale Gates PARTIAL | Physischer Crash/Eviction/Android/TalkBack/Safari/Google OAuth nicht durch Emulation belegt | Bestehende Vertragsregressionen weiterführen |
| #52 / AT-Steuer-/Kapitalmaßnahmen | PARTIAL/BLOCKED | Gemischter Barausgleich/steuerliche Basis erfordert Originalbelege und Fachvalidierung | Keine spekulative Steuerengine |
| FLH04/#160/#161, Drive | PARTIAL: Backup und Sicherheitsarchitektur vorhanden, Sync nicht implementiert | Operator/OAuth/Remote-Parallelwriter/Neugerät/Recovery und eigene kritische Freigabe | Bestehenden Draft erhalten, Backup ≠ Sync |
| Krypto-/Staking-/Kursrest | PARTIAL/BLOCKED pro Protokoll/Quelle | P-Chain/Sonic-Auszahlungen/Tokenidentität/CORS/Lizenz nur nach Primärbeleg | Einzelne belegbare Schnitte, keine Pflichtworker |
| #149 UI/UX | DONE für v187/v188-Befunde | Neue konkrete Fehler separat reproduzieren; kein Redesign | Nur reale Deltas |
| CI-Optimierung | OPEN, vorhandene Baseline erhalten | Getrennter PR nach sicherem funktionalem Checkpoint; keine parallelen Workflowänderungen | Tatsächliche Vorher/Nachher-Minuten/% ohne schwächere Gates |
| D/P2/#157 | BLOCKED/geparkt | Unveränderte Firefox-/Cross-Origin-Fehlnachweise; keine neue Browser-Evidenz | Blockiert andere Arbeit nicht |
| FLH06 PDF | OPEN, nur Recherche/Architekturvorbereitung beauftragt | Lokale Textextraktion/Versions-/Beleg-/CSV-Dedupevertrag, keine große Implementierung vor CSV | Nach CSV-Prioritäten vorbereiten |

## Verbindlicher Vorrang bestehender Masterpakete — aktueller Deltaabgleich

27.10.2026 direkt geprüft: main weiterhin ca1fa8f/v188; offene PRs ausschließlich #157 und #161; jüngste zwölf Actions-Läufe alle beendet, finale Release-/Walletläufe erfolgreich. Offene Issues #44/#52/#119/#124/#126/#127/#129/#148/#149/#159/#160/#165/#174 einschließlich jüngster Kommentare berücksichtigt. Alte Issue-Bodies und v179-Matrix sind historische Ausgangspunkte, kein Beleg dafür, dass produktiv erledigte AT-/UI-Pakete noch fehlen. Ursprüngliche FLH03-v4-/BENCH-/UI17-Vollzuordnung bleibt in KONSOLIDIERTER_RESTARBEITEN_AUDIT.md und KONSOLIDIERTE_ROADMAP.md erhalten.

| Vorgänger / Reihenfolge | Tatsächliches Delta / Nachweis | Status und nächster Abschluss |
| --- | --- | --- |
| 0: v188, #165, Positions-/Buchungsnachträge | ca1fa8f; CI40534397532 + gezielte Live40536412182; Auswahl/obere Icons/Cash-/Notizmutationen/Undo/CAS/Restore/Offline in3Engines | DONE im freigegebenen Umfang. Kein erneuter Aufbau. Weitere Mutationen benötigen erst belegten inversen Fachvertrag; nicht pauschal freigegeben. |
| 1: FLH03-07/16 / BENCH005/014/016 | Bestehende Qualitäts-/History-/Transfer-/Cashquellen, aber keine kompakte kontoweise Synthese | PARTIAL, **einziger aktiver funktionaler Strang: Draft-PR175/dd6ec31bf7687b833442f247d150130f1ac5f8b3**. Rein abgeleitete Kontoübersicht, konkrete Datenlücken/Aktionen, keine Vollständigkeitsprozente/Finanzwrites.741 lokale Units/Check PASS. Finale volle CI40558301803 und Wallet40558301991 SUCCESS:741/741/0Fail/0Skip, vollständige Chromium-/Firefox-/WebKit-Gates. Frühere Fehlläufe/gezielte Korrekturen im PR dokumentiert; vorheriger voller Chromiumjob122375074384 SUCCESS, keine neue Gesamtabnahme behauptet. Vollständiger Provider-Endabgleich bleibt belegabhängig. |
| 2: FLH03-18/#159 | Remote geparkter nativer Read-only-Vorschauversuch, lokale Unit-Nachweise, keine Browser-/Releaseabnahme | OPEN: bestehenden Branch weiterprüfen, fehlende sichere Vorschau-/Zuordnungs-/Abbruch-/Original-/Browsergates ergänzen. Wirtschaftliche ungesicherte Fälle explizit gesperrt. Keine zweite Journalengine. |
| 3: UI17/#149 und Nachträge | AUD-A/B/C/E, C1–C6 und Auswahl in v187/v188 umgesetzt; alte Drop-down-Anforderung ersetzt | DONE nur für belegte Korrekturen. Fünf-Bereiche-Abschluss DONE: PR172-Kommentar6441822234, Main/Pages/Live40501460504, fünf Breiten/3Engines/Axe/Nullmutationen. UI17-09-Schreibweise Foliolab statt FolioLab und UI17-10-fehlende Kontofortsetzung nach Anbieteranlage im aktuellen Code bestätigt; andere UI17-04/07/08-Reste nur nach neuer konkreter Reproduktion bearbeiten; nur reale Deltas, kein Redesign. Mobile320/390/430/Desktop/44px/Axe als Zielgates. |
| 4: 1W-Vermögenszeitraum | chart-periods.js wealth beginnt noch bei month; Markt7T vorhanden | OPEN und unabhängig ausführbar: gemeinsamer Zeitraum für Übersicht/Verlauf, Grenzdatum/Nullmutation und Browsergates. |
| 5: Drive-Backup / FLH04/#160/#161 | Backup vorhanden; bestehender Architektur-PR unverändert. Kein produktiver Sync | PARTIAL: sichere lokale Architektur-/Krypto-/Revision-/Konflikttests und bestehendes Backup gezielt weiterprüfen. OAuth-/Betreiber-/Remote-Parallelwriter-/Neugerät-/Recoverybeweise und konkrete Syncfreigabe fehlen; nicht das gesamte Paket allein deshalb DONE/BLOCKED nennen. |
| 6: CI/Playwright | PR176/c5a760d vollständig geprüft, gemergt433ab15; alle30 bisherigen Kommandos unverändert auf2 Pflichtshards | Kandidat-CI40562584805/Wallet40562585201 SUCCESS,737Units/3Engines. Pflichtregression11,12→6,52min:−4,60min/−41,38%; Runnersekunden+3,67%. Neuer Main/Pages/Live40563994432 noch offen. Keine App-/Rechte-/Dependencyänderung. |
| FLH03-02/03/04/05, AT03-C | Native TR/Kraken/Bitpanda und vollständiger Flatex Depot+Cash-Abgleich fehlen als End-to-End-Nachweis | PARTIAL/BLOCKED je Original-/Semantikgate. Generischer Import und Flatex-Beta bleiben vorhanden. Spätere FLH05-Forschung ersetzt keinen fehlenden realen Abgleich. |
| FLH03-09/10/11, Wallet/API | P-Chain-Eigentum/öffentlicher Transport; Sonic-Auszahlungs-/Unbondingereignisse; optionale Lizenz-/CORS-/Tarifnachweise | OPEN/PARTIAL: erst konkrete offizielle Capability-/Semantiknachweise, danach kleinster sicherer Schnitt. Neue Scanner/Kursanbieter nicht aus FLH05 ableiten. Kein Pflichtworker. |
| #44/AT06/FLH03-13 und UI-Hardware | IDB/CAS/Recovery/Restore schon produktiv und breit bestanden | PARTIAL: echte Android/TalkBack/nativeSafari/OS-Crash/Eviction/Drive-Neugerät/große reale Archive extern offen. Emulation ist keine physische Abnahme. |
| #52/AT05-B/FLH03-12 | Sichere Ablehnung und dokumentierende Jahresübersicht vorhanden | BLOCKED für neue AT-/OeKB-/Cash-in-lieu-Semantik: Originalsettlements und unabhängige Fachvalidierung. Keine erfundene Steuerbasis. |
| D/P2/#157 | Unveränderte Firefox-Fehlnachweise, keine neue Browser-Evidenz | BLOCKED/geparkt, nicht erneut identisch testen. Keine History-Traps. |
| BENCH018/019/024 | Bewusst zurückgestellte optionale Komfort-/Diagnose-/Skalierungsideen ohne neuen Engpass/Nutzwertbeleg | OPEN/bedingt, keine Pflicht zur spekulativen Neuentwicklung. Konkreten Nutzen-/Privacy-/Messbeleg zuerst prüfen. |
| FLH05-A–E/#174 | Einzige konsolidierte Spezifikation, zwölf Testvektoren, technische Ist-Schnittstellen gesichert | ZURÜCKGESTELLT bis sämtliche ohne externe Blocker ausführbaren beauftragten Vorgängeranteile abgeschlossen sind. Keine neue A-Recherche/Parserimplementierung jetzt. |

Kein Paket wird allein wegen fehlender Produktionsfreigabe als technisch unmöglich erklärt: erst vollständig reviewbaren sicheren Kandidaten und tatsächliche Gates herstellen. Releaseentscheidung bleibt konkret separat. Eine fehlende externe Abnahme blockiert unabhängige Vorgängerarbeit nicht. Nur ein funktionaler Hauptstrang; Recherchezwischenstände/PR157/PR161 nicht unterbrechen.

## Technischer Wiederaufnahme-Checkpoint

PR175/dd6ec31bf7687b833442f247d150130f1ac5f8b3 (Tree2802cc931fa6bd10344a693b923f3107e94f55a7):741/741/0Fail/0Skip, vollständige CI40558301803+Wallet40558301991 und3Engines bestanden. Arbeitsumgebung wieder verfügbar. Aktuelle finale Bilder tatsächlich angesehen: Chromium320/390/430/1440 plusClosed320, Firefox320 undWebKit320/1440; volle Inhaltsbreite/Pfeile/48px-Kontrollen/Lesbarkeit ohne weiteren blockierenden Befund. Vorheriger Umgebungsblocker erledigt. PR175 reviewbereit, noch nicht gemergt/deployt.

Nach diesem sicheren Checkpoint einzig aktiver technischer Strang CI176, keine parallele Produktimplementierung. Alte PR157-Workflowdatei und Firefox-Fehlnachweise unverändert erhalten. Unabhängiger Scope-/Kommandoreview bestätigt außerhalb cross-engine bytegleichen Workflow;30 frühere Kommandos exakt einmal, beide Engines, alle bestehenden Gates/Berechtigungen/Trigger/Pins unverändert. CI40562584805+Wallet40562585201 SUCCESS,737Units inklusive2 Schutztests. Gemessene Pflichtregression667→391s (11,12→6,52min),−276s/−41,38%; Runneraufwand1063→1102s (+3,67%). Einzelnes reales Paar bei identischer v188-App, kein statistisches SLA. Eigene begrenzte CI-Releaseentscheidung positiv, Merge433ab1585e475b8560694959b210b40a250f2cb6. Vollständiger Main/Pages/Live40563994432 läuft noch; kein neuer Anwendungsrelease behauptet.

Nach tatsächlichem CI-Releaseabschluss PR175 gegen neue main-/Workflowgrundlage kombiniert prüfen (2 neue Policytests → erwartete743Units); bisherige reine Appdateien unverändert lassen. Erst nach finalen kombinierten Gates kontrollierten read-only Release und tatsächliche neue Konto-Live-Abnahme3Engines. FLH05-A bleibt zurückgestellt; übrige Vorgänger/Original-/Hardware-/OAuth-/Fachvalidierungsgates unverändert offen. Belege: [Kontokandidat](release-evidence/flh03-account-evidence-candidate.json), [CI-Messung](release-evidence/ci-cross-engine-shards-measurement.json).

## FLH05-Reihenfolge und Freigabe

Einzige verbindliche Spezifikation: [import-formats/SPECIFICATION.md](import-formats/SPECIFICATION.md). Phasen A Recherche/Architektur → B Parser/Mapping → C Transaktionen/Reconciliation → D Simulation/Sicherheit/Performance → E Originalvalidierung/Abnahme. Alle alten Nummern und zwölf gehärteten Testvektoren sind dort zugeordnet. **Neue Reihenfolgekorrektur: FLH05-A bleibt zurückgestellt; zuerst sämtliche ohne externe Blocker ausführbaren Vorgängerarbeiten abschließen.** Bereits gesammelte Recherche nicht als abgeschlossene Phase ausgeben. Nächster Schritt: bestehende Gesamtmatrix mit aktuellen Issuekommentaren und v188-Nachweisen abgleichen, dann kleinstes offenes P0/P1-Vorgängerinkrement; kein neuer Parallelstrang.

Quellen/Katalog/Gap/Architektur liegen unter `docs/import-formats/`. Neue finanz-, migrations-, backup- oder sicherheitskritische Produktionsänderungen sind ohne eigene konkrete Freigabe nicht erlaubt. Die v188-Freigabe autorisiert keine weiteren Parser-/Journalmutationen oder Sync. Zwischen abgeschlossener Recherche und sicherer Implementierung ist keine zusätzliche pauschale Wartefreigabe nötig. Private Originale ausschließlich lokal, öffentliche Fixtures rein synthetisch; keine Kontodaten/Adressen/Dateifingerprints veröffentlichen.

---

## Historische Checkpoints (unverändert)

# Sequenzieller Abschluss der offenen Arbeitspakete

Basis: main 7c050e49c0316cf9685870b35215c448007dc080, v157; #133/#134/#135 integriert. Keine offenen PRs beim Start. Ausschließlich synthetische Daten.

| Paket | Status | Nächster Schritt |
| --- | --- | --- |
| FLH01 | ABGESCHLOSSEN: #137, Merge 91f83909e6453de40ef7a4be21477eb7864e01e5 | CI 40189609001 vollständig grün, 604/604 + Chromium/Firefox/WebKit |
| IndexedDB B | ABGESCHLOSSEN: #138, Merge c422dbd8e532127f738b24e07a9e5092fd865d84 | CI 40190283807 vollständig grün, 604/604 + alle Engines; technische Recovery erhalten |
| AT03-B | ABGESCHLOSSEN: #139, Merge 26a2460f7640464b323de8a031599f76c17bd680 | CI 40191726918 vollständig grün, 617/617 + alle Engines; C bleibt separat blockiert |
| AT05-A | ABGESCHLOSSEN: #140, Merge ad1d966ec98dff9eafba00dc262af0f5ad7ee894 | CI 40194079825 vollständig grün, 627/627 + alle Engines; Stufe B separat blockiert |
| AT01 | ABGESCHLOSSEN: #141, Merge 8348a42c9d3bbd147a255b4730d7fe28e02fb476 | CI 40195398684 vollständig grün, 633/633 + alle Engines |
| AT04 | ABGESCHLOSSEN: No-Code-Audit, #128 | 133 fokussierte Unit-Tests, acht Browser-Suites, bestehende Capability-Matrix bestätigt; [Nachweis](https://github.com/joke0071/foliolab-open/issues/128#issuecomment-6398005023) |
| UI07 | ABGESCHLOSSEN: #142, Merge 839b51e37b234cc4a7fe202eeb68118a786e0b78 | CI40197890130 und main40198408959 vollständig grün; 66 Scans je Engine, keine Befunde |
| FINAL-GATE | ABGESCHLOSSEN für Anwendungsrelease v169 / 839b51e37b234cc4a7fe202eeb68118a786e0b78 | main-CI/Deployment40198408959 erfolgreich; unabhängiger Live-Smoke, 98 Dateihashes, 18 Axe-Scans, beide UI-Restore-Formate und Offline bestanden |

## FLH01 Fachvertrag
Read-only-Projektion vorhandener Buchungen/Journalpostings. Tatsächliche Journal-Deltas haben Vorrang; eine Korrektur-Zielmenge ist niemals Handelsvolumen. Technische Journalvorgänge ohne separate Buchung bleiben sichtbar. Positions-ID statt ISIN-Vermutung trennt Depots. Brutto-Kaufvolumen enthält nur Käufe, keine Korrekturen. Fehlende Beträge werden separat ausgewiesen, keine Rendite/XIRR/TWR oder Steuerbasis erfunden.

Absolute Bestände nur bei vollständiger Journalzuordnung und erfolgreichem bestehendem Mengenaudit samt Eröffnung. Undatierte Eröffnungen explizit gekennzeichnet. EUR-Werte nur mit passendem lokalem EUR-Schlusskurs am belegten Ereignistag. Kein neuer Kursabruf, keine Fortschreibung, keine erfundenen Zwischenwerte. Bestehende Marktdiagramme bleiben in den Positionsdetails; Historie zeigt nachgewiesene Tages-/Ereigniszeilen.

Walletmodell/Coverage/Preview/Persistenz/Resume unverändert; Aktionen nur für vorhandene BTC/HD, ETH-Mainnet, SOL/SPL-Implementierungen. Gespeicherte Historie heißt „Historie anzeigen“. Kein neuer Wallet-/Speicher-/Backup-/Journal-Schreibpfad.

## Nachweise / Grenzen
Baseline 595/595; jetzt 604/604 Node-Tests, 0 Fail/Skip; npm run check bestanden. 245 synthetische Käufe + vier technische Korrekturen, Kontentrennung, fehlende Mengen/Kosten, orphan Journal, HTML-Escaping und portable Restore geprüft. Browsergates mit 320/390/430/768/1440px, Axe, Dialogfokus/Escape und Nullmutationen für Chromium/Firefox/WebKit in CI ergänzt. Lokale Chromium-Abnahme inzwischen bestanden (Playwright 1.56.1, Headless Chromium 141): fünf Breiten, 245+4, Axe 0 Verstöße, Tastatur/Fokusrückgabe, belegter EUR-Wert und keine Portfolio-Schreibvorgänge. Screenshots visuell geprüft. Erster Cross-Engine-Lauf fand fehlenden Korrekturfilter (behoben); zweiter Lauf fand CSP-inkompatible Axe-Injektion der neuen Testhilfe (auf bestehendes addInitScript-Verfahren umgestellt, produktive CSP unverändert). Beide roten Zwischenläufe gelten nicht als Abnahme. Finale CI 40189609001 vollständig bestanden; #137 integriert (91f8390).

Keine echten Nutzerbackups verwendet. Android/Safari-Hardware, Drive-Neugerät, Crash/Eviction bleiben reale Gates #44. AT03-C/AT05-B/#52 weiterhin durch Realbelege blockiert.

## Abschlussprüfung des bisherigen Work-Auftrags · 25.10.2026

**Die sieben beauftragten Pakete und das FINAL-GATE sind abgeschlossen.** Anwendung: PWA `foliolab-open-v169`, Feature-Merge `839b51e37b234cc4a7fe202eeb68118a786e0b78`. [Finaler Releasebericht](FINAL_RELEASE_AND_LIVE_ACCEPTANCE.md), [unabhängiger Live-Nachweis](release-evidence/v169-live-acceptance.json). Der anschließende Abschluss-/Evidenzcommit `7eafd492fad33b383565073078ac0c8c0165b85f` enthält **keine ausgelieferten App-Dateien**, nur Dokumentation, synthetische Evidenz und manuelle Browser-Testhilfe.

**Zusätzliche echte Verifikation nach dem Work-Abbruch:** [main-Workflow 40199246504](https://github.com/joke0071/foliolab-open/actions/runs/40199246504) auf exakt `7eafd492fad33b383565073078ac0c8c0165b85f`: `test` erfolgreich, `cross-engine` erfolgreich, `deploy` erfolgreich (einschließlich „Verify published homepage and matching service-worker version“); Abschluss am 25.10.2026 um 13:52 UTC. Auf GitHub zum Prüfzeitpunkt keine offenen PRs. Der eigenständige ursprüngliche Live-Assetvergleich (98 Hashes), UI-Restore- und Offline-Smoke wurde bereits auf dem unveränderten Anwendungsrelease v169 bestanden. Nicht erneut als brandneuer Live-Browserdurchlauf ausgeben.

**Exakt nächste Aktion:** Für diesen Auftrag nur noch die Abschlussquittung mit dem tatsächlich letzten Dokumentations-HEAD und dessen erfolgreichen CI-/Deployment-Lauf in [#124](https://github.com/joke0071/foliolab-open/issues/124) festhalten; bereits integrierte Pakete niemals wiederholen. Nachfolgende zusätzliche dokumentarische Commits sind ebenfalls gegen ihre eigene abschließende main-CI zu prüfen. Neuer gesonderter Auftrag: FLH02 auf dem dann aktuellsten `main` beginnen, aber nur nach Delta-/Kollisionscheck.

**Weiterhin externe, nicht als erledigt behauptete Gates:** #44 (reale Android/Safari/Drive/Crash-/Eviction-/Archivproben), AT03-C, AT05-B und #52 (Realbelege/Fachvalidierung). #124 bleibt als übergeordnetes Tracking-Issue deshalb offen; diese Themen blockieren nicht rückwirkend den produktiv abgenommenen v169-Auftrag.
