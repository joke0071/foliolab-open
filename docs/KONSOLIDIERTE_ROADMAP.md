# Aktueller Masterstand und verbindliche Arbeitsteilung · 29.10.2026

Dieser neue Abschnitt übersteuert ältere Rang-/UI-/OPEN-Angaben darunter,
ohne Anforderungen oder historische Belege zu entfernen. Gesamtmaster **PARTIAL**.
Zentral maßgeblich: WORK_RESTPAKETE_CHECKPOINT.md; keine zweite Masterplanung.

| Bereich | Aktueller Stand / Zuständigkeit |
| --- | --- |
| Produktion / abgeschlossener Vorgänger | main6fe75a997a076d0c17e5200b0bb7ee09532d7044 / v208; PR195 vollständig LIVE_ACCEPTED |
| Aktueller Work-Schritt | PR196 feature/reference-removal-safe-subset / be860237af019deab0c4e393dbcc022976bb5c1f / SW211-Kandidat technisch abgenommen; Pflicht40883912046 und Wallet40883911994 SUCCESS,946Units/3Engines. Eigene konkrete Merge-/Deploymentfreigabe fehlt; Produktion unverändert |
| UI-VISUAL-CLAUDE | **DELEGATED / OPEN**, exklusive Implementierung GitHub Copilot mit Claude Sonnet5.5, [Issue197](https://github.com/joke0071/foliolab-open/issues/197). Vollständiger Vertrag [UI_VISUAL_CLAUDE_HANDOFF.md](UI_VISUAL_CLAUDE_HANDOFF.md). Kein Agentlauf/Branch/PR gestartet; Modellwahl über verbundene GitHub-Schnittstelle nicht verifizierbar |
| Work behält | FLH03 native Importe/Reconciliation, sichere Buchungs-/Positions-/Referenzverwaltung, DELETE-Fachlogik/CAS/atomare Rücknahme, IndexedDB, Backup/Restore/Recovery, FLH04 und essentielleP1-PERF01 sowie alle anderen freigegebenen Sicherheitsarbeiten |
| Sicherheitskritische UI | Zwingend zu Work-Fachpaketen gehörige Bestätigungs-/Auswahl-/Lösch-/Backup-/Restore-/Stale-/Mehrtab-/Undointeraktionen und Tests bleiben Work. PR196 regulär abschließen; reine CSS-/Typografie-/Dashboardpakete danach nicht mehr selbst beginnen |
| Geparkt | FLH05 universelle CSV-Engine und FLH-PROJ01 OPEN/PARKED bis ausdrücklicher erneuter Freigabe; notwendige FLH05-Kompatibilität nur durch gemeinsame bestehende Verträge, keine Zusatzphase/Refactorings |

## Delegierter Restumfang, keine Wiederholung fertiger UI

Claude übernimmt ausschließlich tatsächliche nach dann aktuellem main bestätigte
Restbefunde: A Typografie/Abstände/Beschriftungen/Buttons/Trennlinien,
Zahlen-/Datums-/Tabellendarstellung, visuelle Redundanzen/Leerflächen;
B Dashboard-/Verlaufsteuerung/Icons/Liquiditätszugang/Trennlinien sowie konkrete
Chart-Leerzustands-/Hinweis-/Responsive-Reste; C rein visueller Overflow/Clipping,
Karten/Tabellen,44px-Ziele/sichtbarer Fokus, offene Akkordeons und nicht kritische
Dialoge bei320/390/430/768/1440px. Keine fachliche Datenbasis-/Rechen-/Präzisions-
/Zeit-/Speicher-/Importänderung oder neues Redesign.

**Schon implementiert und erhalten:** kompakte Datenbasis im Chartkopf,
Auto/Observed/Partial und7T–Max, drei Verlaufsicons (shield-Key zeichnet Haken),
Liquidität & Fälligkeiten nach den Anbietern, letzte Anbieterlinie entfernt und
Zwischentrennlinien bewahrt. Aktuelles main enthält diese Änderungen bereits;
browser-history-followup bestätigt sie erneut in3Engines. Seine spezielle
Matrix320/390/768/1024/1440 ist keine spezifische430px-Abnahme sämtlicher
geöffneter Zustände; Claude bestätigt diese Breite bei tatsächlichen Deltas.
Bestehende Wochenfilter/Leer-/Teil-/Auswahl-/Archiv-/Restorekorrekturen nicht
erneut aus alten #149/UI-MASTER28-Texten implementieren.
Ältere Aussagen unten über noch fehlenden Referenzarchiv-Restore sind historisch
und durch aktuelle vorhandene Restore-/Sicherheitsnachweise überholt.

## Kollisions- und Aktivierungsgrenze

Zuerst PR196 einschließlich erforderlicher Nutzerentscheidung und Releasegates
sicher abschließen. Danach frischer Remote-/Writer-/main-Abgleich, verlangtes
Copilot-Modell tatsächlich verifizieren und eigener Claude-Branch/PR.
Die Nutzerdelegation gilt bereits; es wird keine zusätzliche pauschale
Startfreigabe erfunden. Technisch fehlen derzeit jedoch die verifizierbare
Modellwahl/Dispatchmöglichkeit und die freie gemeinsame Integrationsbasis.
Kein Ersatzmodell oder vorzeitiger kollidierender Codingauftrag.

src/app.js, styles.css und Browser-Tests können trotz verschiedener Branches
kollidieren. Vor paralleler Schreibarbeit konkrete Funktionen/Selektoren/Hunks
abstimmen; Work-/Claude-Branches gegenseitig nicht ungefragt ändern.
PR196-Referenzlöschdialoge und zugehörige kritische Tests bleiben Work.
Claude-PR erst nach frischer Integration gegen dann aktuellen main, vollständigen
Pflichtgates und erforderlicher Releasefreigabe mergen. Delegation bewirkt keine
automatischen Deployments oder Merges. Historischen Dokumentationsbranch
feature/flh05-import-foundation niemals als Appcode nach main übernehmen.

Die verbleibende ursprüngliche Mastersequenz bleibt bestehen, wobei rein visuelle
Umsetzung aus dem Work-Umfang herausgenommen ist. FLH-PERF01 bleibt essentielleP1
für tatsächlich interaktiven Appstart großer IndexedDB-Portfolios mit belegbarem
30%-Medianziel; CI-Beschleunigung ersetzt ihn nicht. Alle Hardware-/AT-/OAuth-/
Originaldaten-/Fach-/P0/P1/BENCH-Grenzen bleiben erhalten. Nach jeder Etappe
Commit/Push, separater Checkpoint, Remote-SHA- und Fortsetzungsnachweis.

---

# v195 sicher abgeschlossen; ein konsolidierter UI-Nachtrag folgt · 28.10.2026

Sonic-Nachweis PR184/main4671382a ist begrenzt LIVE_ACCEPTED: vollständiger Main/Pages/Live40669589568 SUCCESS,799Units/3Engines/111Hashes/SW195/neuer Produktions-Zustandsgate/Nullmutation und drei Kernbilder geprüft. Keine aktive Guthaben-/Historienintegration, Sonic10 insgesamt PARTIAL. Aktiver Release wurde nicht wegen der Nachträge unterbrochen.

Jetzt nächster regulärer konfliktfreier UI-Checkpoint: einen konsolidierten Auftrag bearbeiten, ältere Wiederholungen sind keine zusätzlichen Pakete. Reine Darstellung möglichst gebündelt; notwendige Referenzarchiv-/Verwaltungs-/Herkunfts-/Delete-/Persistenzsicherheit sauber getrennt vollständig absichern (aktueller Snapshot-Restore bewahrt Archivstatus noch nicht). Zentraler Detailvertrag mit allen Normal-/Verwaltungs-/Auswahl-/Archiv-/CAS-/Backup-/Migrations-/TWR/XIRR-Grenzen ist maßgeblich. Historische Originale und Berechnungen bleiben erhalten, kein zweiter Auswahl-/Finanzkern. Danach ursprüngliche Gesamtsequenz; Positions-/Buchungsauswahl v192 nicht wiederholen.

FLH-PROJ01 nur spätere Dokumentation, keine Vorziehung während FLH03/FLH04/FLH05. Später vierter geschlossener Verlaufbereich mit trending-up, separatem Prognosediagramm/keinem neuen Hauptreiter; Sparrate/Horizont/Startvermögen, transparente drei Szenarien/nominal-real, Auto/Historisch/Manuell mit qualitätsbelegter annualisierter TWR als Referenz und klar getrenntem XIRR, keine ungeprüfte1:1-Fortschreibung. Geeignete langfristige Anlageklassenannahmen/Quellen/Unsicherheit, Gebühren/Steuern ausdrücklich (ohne Modellierung keinNetto); Entnahme und MonteCarlo erst mögliche spätere Erweiterungen. Keine realen Datenänderungen oder Scheingenauigkeit, Local-first erhalten. Keine neue konkurrierende Masterplanung.

# Konsolidierter nächster UI-Checkpoint: Verlauf und Referenzwerte · 28.10.2026

Nach regulärem vollständigem Abschluss des alleinigen PR184/Sonic-Schnitts die bereits vorgemerkten UI-Deltas gemeinsam prüfen: kompakte Datenbasis in der Diagramm-Kopfsteuerung bei erhaltenen Optionen/Auto-Standard und7T–Max; drei dekorative Lucide-Icons; Umbenennung in Historische Referenzwerte (weiter standardmäßig geschlossen); Liquiditätszugang auf allen Breiten; letzte Anbieterlinie ohne Änderung der Zwischentrennlinien. Bereits abgenommene Positions-/Buchungsauswahl v192 nicht wiederholen.

Referenzverwaltung: Normalzeilen ohne dauerhafte Edit/Delete/Checkboxen; Hinzufügen+Verwalten oberhalb; im Modus Fertig, sichtbare Checkboxen/Master-indeterminate, Auswahlanzahl und kompakte zulässige Archiv-/Restore-/Delete-/Clear-Aktionen, Edit nur zulässig und im Modus. Herkunft/Originale/migriert-ungeprüfte Werte erhalten. Archiv nur Listen-Sichtbarkeit, niemals Berechnungsfilter; Restore/Backup/Migration vollständig, keine Änderung von Kurven/Renditen/Beständen/Flows. Manuelle Korrektur nur Vorschau/Bestätigung, migrierte und automatische Quellen geschützt; Löschung nur ausdrücklich unabhängig, nach Abhängigkeits-/Auswirkungsprüfung und atomarem CAS, keine stillen Teilmassenlöschungen. Keinen neuen „aus Berechnungen ausschließen“-Mechanismus bauen.

Möglichst ein kleiner konsistenter UI-PR; nötige zusätzliche Fach-/Persistenzarbeit sauber trennen und vollständig absichern.320/390/1440/Mobile/Desktop/A11y und sämtliche bestehenden3Engine-/Finance-/Import-/Backup-/Restore-/CAS-/Livegates. Danach Mastersequenz selbstständig fortsetzen. FLH-PROJ01 unverändert ausschließlich später dokumentiert, keine Implementierung. Maßgeblicher Detailvertrag im zentralen Checkpoint; laufende Arbeit wird nicht unterbrochen und kein paralleler Strang eröffnet.

# Neu vorgemerkt: kleiner UI-Nachtrag und spätere FLH-PROJ01 · 28.10.2026

AktuellenalleinigenSonic-Nachweisschnitt regulärfertigstellen, keineTests/PRs/Deploymentsunterbrechen. AmnächstensichereneignetenUI-Schritt gegenaktuellesmain prüfen/kleinstumsetzen: vorhandeneVerlauf-AkkordeonsmitLucide `shield-check`, `chart-no-axes-combined`, `clipboard-check`; Mobile-/Desktop-Zugänglichkeit „Liquidität & Fälligkeiten“ reproduzierenundnurbestätigtenDarstellungsfehlerkorrigieren; letzteAnbieter-Trennlinieentfernen, Zwischentrennlinienerhalten. Erledigtesüberspringen, Design/Abstände/Farben/Interaktionenerhalten, Mobile/Desktop/A11y undvollständigeRelease-/Livegates. Danach bestehendeMasterreihenfolgefortsetzen; keinparallelerUI-Strang.

**FLH-PROJ01 ausdrücklichnurvorgemerkt, NICHTjetztimplementieren:** nachrelevantenFLH03-Historien-/Renditegrundlagen vierteraufklappbarerVerlaufbereichZukunftsprojektion; aktuellesVermögen, monatlicheSparrate/Horizont; Renditebasisauto/historisch/manuell, historischeTWRnurdatenqualitätsbelegt; autoAnnahmennachAnlageklassen/belastbarerHistorie; vorsichtig/Basis/optimistischtransparent; nominal/inflationsbereinigt; getrenntesPrognosediagramm. SimulationenohneBuchungs-/Bestands-/Historien-/Backupänderung, keineScheinpräzisionbeiunvollständigenDaten. KeinaktuellerCodescope/keineParallelplanung. Details imzentralenCheckpoint.

# v194 begrenzter P-Chain-Nachweis abgenommen · 28.10.2026

Rang3/UI17-09/10/1W DONEv193. Rang4 vorhandene07/16-Eingänge abgeglichen, readonly16/v189/Preview18v190 nichtwiederholt; vollständigeBrokeroriginale/Anfang-End/Cashreferenzen konkretweiterextern. Rang5 ersterPChain-UTXO-Vertrag DONEbegrenztv194/PR183/mainb2d5789, vollständigeMain/Pages/Live40664337654SUCCESS/783Units/3Engines/110Hashes/SW194/Nullmutation; keine aktivePChain-Bestandsübernahme.09weiterPARTIAL, Adress-/globalIdentitäts-/konsistenterStaking-/C↔P-/Fee-/Sollwertvertrag offen. NächsterkleinerRang5SchnittSonic10-Zustands-/Generationsvertrag, aktuelleverifizierte4.0.5-Implementierungsquellejetztlesendbelegt. KeinweitererfunktionalerStrangvorvorherigerLiveabnahme. BestehendeGesamtfolgeunverändert; CI-Zwischenoptimierung nachgemessenerlesenderStichprobeweiterzurückgestellt, keinApp-Performancenachweis.

# UI17-09/10 und 1W abgeschlossen · v193 · 28.10.2026

Rang3 jetzt DONE im beschriebenen begrenzten Umfang: v191/v192/v193 vollständig LIVE_ACCEPTED. PR182/main7dbb9c24, Main/Pages/Live40659623976 SUCCESS;767Units/3Engines/109Hashes/SW193, neuer Zielablauf tatsächlich live in allen3Engines und achtProduktionsbilder geprüft. Keine Finanz-/Storage-/Backupengineänderung. Maschinenbeleg release-evidence/ui-small-rests-v193-release.json. Nächster Rang4 vorhandeneFLH03-07/16-Eingänge/externenOriginalabgleich, danach Rang5Protokollverträge; bestehende Gesamtsequenz unverändert. Keine weitere UI-Neuimplementierung ohne konkretenBefund.

# Aktueller UI-Releasefortschritt 28.10.2026

v191/PR179–180 und v192/PR181 sind vollständig LIVE_ACCEPTED. Schlanke Mehrfachauswahl im Listenkopf beider Listen DONE, unveränderte Finanz-/Auswahl-/Speicherengine. v192 main6dab772e, Main/Pages/Live40645289206 sowie tatsächliche Auswahl-/Buchungs-Produktion40647218802 SUCCESS; Vollbeleg im Mastercheckpoint/ui-selection-v192-release.json. Nächster bestehender Rang3: UI17-09/10 und1W. Frühere offene Statusangaben für den schlanken Listenkopf darunter sind historisch; übrige Gesamtsequenz unverändert.

# Releasefortschritt 28.10.2026

PR179/180, v191-Buchungs-UI und Sichtbarkeitsarchiv sind LIVE_ACCEPTED: main5b9bb792, Main/Pages/Live40642187590 und gezielte Buchungs-Produktion40643428354 SUCCESS. Der neuere schlanke Mehrfachauswahl-Listenkopf bleibt nächster ausführbarer UI-Schnitt; danach UI17-09/10/1W. Keine neue Gesamtplanung; die bestehende Sequenz unten bleibt verbindlich. Vollbeleg: WORK_RESTPAKETE_CHECKPOINT.md und release-evidence/booking-ui-v191-release.json.

# Aktuelle verbindliche Gesamtsequenz nach Vorgänger-Gesamtaudit v188

Der aktuelle Audit in KONSOLIDIERTER_RESTARBEITEN_AUDIT.md übersteuert die historische Reihenfolge darunter. Audit DONE als Bestandsaufnahme, Gesamtumsetzung PARTIAL. CI176 ist nach erlaubtem sicherem Checkpoint begründet abgeschlossen; weitere CI-/Performancevorziehung ist kein Ersatz für Vorgänger. FLH05-A gesperrt, bis alle ohne echte externe Blocker ausführbaren beauftragten Vorgänger abgeschlossen sind. Nur ein aktiver funktionaler Hauptstrang, kein Redesign.

| Rang | Nächster begrenzter Schritt | Voraussetzung / Abschluss |
| --- | --- | --- |
| 1 · DONE | PR175/v189 readonly Kontonachweise vollständig live abgenommen | main8ac0b2f /Tree1101b31; PR40567910132+Wallet40567910143 und Main/Pages/Live40569298229 SUCCESS,743Units/3Engines/107Hashes/SW189. Zusätzliche tatsächliche Konto-Live40571543151,5Breiten/Axe/Keyboard/Nullmutation und finale Bilder PASS. Vollständiger Providerabgleich bleibt separat offen. |
| 2 · DONE Preview / PARTIAL Gesamtumfang | FLH03-18/#159 native lokale Ledger-Prüfvorschau v190 live abgenommen | PR178/main7b7fae7,757Units/3Engines; Main/Pages/Live40577138273 und echte Ledger-Live40578647542 SUCCESS,109Hashes/SW190/5Breiten/Axe/Offline/Nullmutation und Bilder. Keine native Finanzübernahme. Vollständige Verbuchung je Fall an Locator-/Fee-/Ownership-/Transfer-/Original-/Sollwertvertrag und eigene kritische Freigabe gebunden; unbekannte Fälle gesperrt, #159 offen. |
| 3 · v191 DONE / UI-Reste OPEN | UI-Nachtrag Buchungsaktionen/Positionsparität, offene UI17-09/10 und1W; bedingte04/07/08 nur bei Reproduktion | Bereits erledigte v187/v188-Auswahlteile/Fünf-Bereiche-Audit überspringen. Neuer Nachtrag #149/#165: dieselbe kompakte zweispaltige mobile Auswahl-/Aktionsleiste wie Positionen; direkte rechte Zeilenicons Bearbeiten/Löschen/Archivieren-Wiederherstellen ohne Auswahlmodus; gemeinsamer kontextabhängiger Dialog und Herkunfts-/Feldmatrix gemäß BOOKING_MANAGEMENT_CHECKPOINT.md. Reversibles Archiv ohne Finanzwirkung, Ignorieren als getrennte belegpflichtige Fachmutation; Quelloriginale/Reimport-/Gruppen-/Vorschau-/Bestätigungs-/CAS-/Undo-/Restorevertrag. Breitere kritische Kategorien erst vollständig geprüfter Kandidat plus konkrete Releasefreigabe. Bestehende Komponenten,320/390/430/Desktop/44px/Axe/Keyboard/Sperrgründe. Keine zweite Finanzengine oder vorzeitige kritische Freischaltung. Weitere kleine Copy-/Dialog-/SharedPeriod-Deltas gemäß Befund. |
| 4 | FLH03-07/16/statusbezogene Restlücken mit vorhandenen Eingängen;02–05/AT03-C nur belegbereit | Keine Bestands-/Cashhistorie erfinden. Fehlende regionale Originale und Anfang-Endreferenzen konkret extern führen, unabhängige sichere Schritte nicht blockieren. |
| 5 | FLH03-09/10 Wallet-/Staking-Capability-/Semantiknachweise | Offizielle P-Chain-/Sonic-Belege vor Funktionscode; derzeit ausführbare Vorarbeit OPEN, externe API-/Realbelege getrennt. Vorhandene Scanner/Historyengine erhalten. |
| 6 | Bestehendes Drive-Backup: aktiver Sitzungs-Duecheck und fehlende reale Gates | Neues belegtes Timerdelta, nicht mit Sync vermischen; Token/Password/Busy/Visibility/keine Doppeluploads/Fehler-/Restoretests. Kritische Backupveröffentlichung braucht eigene konkrete Freigabe; fehlendes echtes OAuth blockiert nicht alle Mock-/Contractarbeiten. |
| 7 | FLH04/#160 im bestehendenPR161 weiterführen | Erst reiner Sicherheits-/Revisions-/Konfliktvertrag und Tests, keine neue Persistenz/Transportgarantie ohne Beleg. Operator-/Remote-CAS-/Neugerät-/Recovery und produktiver Sync externe/eigene Freigabegates. |
| 8 | FLH-PERF01/#177 / BENCH018 P1 | Nach obigen ausführbaren Schnitten bzw.deren expliziten externen Checkpoints: tatsächlichen dann aktuellenmain profilieren, gültige synthetische Fixtures/ColdWarm/CPU/LongTasks, erst danach kleinste gemessene Optimierung.30%-Medianziel App, kein CI-Wert. Keine Storage-/Finanzgarantien abschwächen. |
| 9 | Noch ausführbare beauftragte02–06/11/12/13-/AT-/BENCH-Reste nach Evidenz | Original-/Lizenz-/CORS-/Fach-/Hardwareblocker konkret, keine blanketBLOCKED-Erklärung für noch mögliche Code-/Contractarbeit. Optionalen Komfort ohne belegten Nutzen nicht bauen. |
| 10 | Erst nach explizitem Vorgängerabschluss/-Blockerabgleich FLH05-A–E | Eine erhaltene konsolidierte Spezifikation mit12Vektoren, keine vorgezogene Parserimplementierung. Originalvalidierung getrennte spätere Abnahme. |

#165 zusätzliche wirtschaftliche Kategorien nur nach eigenem belegtem Fachvertrag; erlaubtes v188-MVP nicht wiederholen. #44 echte Hardware/Crash/Eviction/OAuth und #52/AT05-B Fach-/Originalbelege bleiben externe Gates. PR157/D-P2 nur mit neuer Browser-Evidenz, keine History-Traps; blockiert unabhängige Schritte nicht. Die Reihenfolge darf nur mit konkretem Abhängigkeits-/P0/P1-/externem Gatebeleg aktualisiert werden, niemals stillschweigend.

---

## Historische Roadmap v179 (Nachweise erhalten, aktuelle Reihenfolge oben)

# Konsolidierte Roadmap nach tatsächlich abgenommenem v179

Stand26.10.2026, main `5397ca73d3ce8281920973a9916c9fadbd65596d`, [Produktion](https://foliolab.unperfekt.at/). Fachliche Vollmatrix: [KONSOLIDIERTER_RESTARBEITEN_AUDIT.md](KONSOLIDIERTER_RESTARBEITEN_AUDIT.md). Dieser separate Phase-B-Checkpoint ist ausschließlich Dokumentation. Keine funktionale Änderung/Deployment während des Audits.

Aktualisierung: v180/Archiv14 ist live abgenommen. Neu beauftragte UI-/UX-Stabilisierung hat nach laufendem Release Vorrang vor weiteren großen Roadmap-Erweiterungen; siehe UI_QUALITAET_STABILISIERUNG_CHECKPOINT.md.162 nur finales Integrationsgate, Buchungsfinanzmutationen eigener PR/eigene Releaseentscheidung.

## Bereits abgeschlossen — nicht wiederholen

FLH01, FLH02/WH01–07, Indexed DB-only A/B, AT01, AT02-A/B, AT03-A/B, AT05-A, AT04-No-Code-Deltaaudit, UI07, FLH03-00/01(v177), ABCE(v178), sichere Positionsmehrfachauswahl/-löschung08(v179). Die jeweilige Begrenzung bleibt verbindlich: Flatex Beta ist keine vollständige Broker-/AT-Steuerabnahme; sichere08 blockiert verwobene Positionen statt universeller Cascade; dokumentierende Jahresübersicht ist keine Steuerbescheinigung. Aktuelle Code-/Releasebelege gehen alten Issue-Bodies vor.

## Reihenfolge der kleinsten sicheren Inkremente

Reihenfolge berücksichtigt Datenintegrität, Nutzwert, Nachweisbarkeit und **tatsächliche Freigaben**. Ein fehlender Brokerbeleg blockiert unabhängige UI-/Qualitäts-/Archivarbeiten nicht. Nur ein aktiver funktionaler Hauptstrang, jedes neue Paket von dann aktuellem main; Dokumentationsreferenz separat erhalten.

| Rang / Schnitt | Ursprung / Prio | Konkreter Umfang | Voraussetzungen / Wiederverwendung | Eindeutige Abnahme | Releasebefugnis |
| --- | --- | --- | --- | --- | --- |
| 0, erledigt | Phase A/08 P1 | v179/#154/#155 produktiv, 105Hashes/3Engine08/Offline/Restore/CAS | Siehe v179 Maschinenbelege | Main/Pages40362303355 und echte Liveabnahme PASS | Verwendete08-Freigabe erfüllt |
| 1 | D-P2 / AUD04 | Gemeinsamer temporärer beforeunload-Guard nur bei offenemdirty Dialog; interne Cancel/Escape/Save/Fokus bewahren | Aktueller shared Dialog Guard, Wizard und CSV; alte151-CO-Tests/Logs unverändert als Referenz | Dirty reload verweigert behält Eingaben; bestätigt verlässt; clean/saved keine Warnung; Provider/Wizard/CSV,3Engines/Mobile/Axe/Offline/CAS/Backup/volle CI | **Ausdrücklich erteilt**, erst nach finalen Gates/Review/Live; keine Browser-CO-Garantie |
| 2 | FLH03-14 P1 | Ein kontrolliertes Archivfeld, aus-/einblenden und ausdrücklich wiederherstellen, Auswahl-/Filtersemantik | Model/safe Import,08, vorhandene Suche/History; Modellvertrag vor Code | Journal/Snapshots/Preis-/Wallet-/Importidentität unverändert; Restbestand zähltweiter; Reimport kein Duplikat/Entarchivieren; vollständiger Restore/CAS/3Engines | **DONE PR158/v180**; konkrete Fortsetzungsfreigabe, finale PR/Main-CI und tatsächliche3Engine-Archiv-Liveabnahme bestanden |
| 3 | FLH03-16/07 P1 | Kleine readonly Kontosynthese aus vorhandener Quelle/Coverage/Cash/Transferstatus; nächste Aktion | AT01/AT03/FLH02, keine Neue Persistenz/Prozentzahl | Mehrere Konten, fehlende Eröffnung/FX/partial/stale/Transfers, keine Nullsetzung/Schreibmutation;3Engines/6Breiten/Axe | Eigener geprüfter PR, eigene Releaseentscheidung |
| 4 | UI17-03/08/09/10 P2/P3 | Nur fortbestehende konkrete Abstands-/Copy-/Konto Voraussetzungsdeltas, kein Redesign | Vorhandene Onboarding-/Dialogkomponenten, aktuelle Reproduktion | Nach Save ggf.Kontoschritt, Cancel/Escape/Fokus korrekt, kein zusätzlicher Workflow, physische Limits ehrlich | Eigener Scope, keinepauschale Freigabe |
| 5 | Neuer 1W-Vermögenszeitraum P2 | Shared wealthPerioden um7T ergänzen, dieselbeRead-onlyProjektion | chart-periods.js/FLH02 | Grenzdatum/fehlendePunkte, Übersicht+Verlauf identischeFilter,3Engines/Responsive/Axe, keineFinanzwrites | EigenerScope/Releaseentscheidung |
| Belegbereit vorziehen | FLH03-02 TR P1 | Originalformat-Guard, reine Preview, wirtschaftliches Trade/Cash-Matching, danach Übernahme/Undo | Freigegebene regionale Formatprobe;01/Journal/Identität | Zweiidentische Käufe getrennt, Trade/Cash einmal, Fees/Steuer/FX/unbekannt; Replay/Overlap/Undo/CAS/Restore/offline | Nochkeinepauschale Freigabe |
| Belegbereit | FLH03-03 Kraken P1 | Trades+Ledgers, separate Balancesanker, Alias/Ref ID/Fees | Originaldialekt/Beziehungsnachweis, keine Margin/Futures Erfindung | Trades/Ledgers einmal, Balanceskeine Einzahlung, exakte Endmengen/Cash, overlap/replay/conflicts/Undo/3Engines | Eigener PR/Entscheidung |
| Belegbereit | FLH03-04 Bitpanda P1 | Tatsächlicher CSV-Dialekt statt erfundener Unterstützung | Originalheader/Felder pro Produkt/Jahr | Operations/Fees/Reversals/Flows belegt, Wiederholung/Walletabgleichohne Doublecount | Eigener PR/Entscheidung |
| Belegbereit | FLH03-05/AT03-C P1 | Existierende Flatex Beta mit belegtem Depot+Kontocash/Valuta/Fees/FX ergänzen | Zeitgleiches AT-Depot+Cash, Anfang/Endsaldo; vorhandene Beta behalten | Unabhängige Saldo-/Mengenreferenzen, alle Datums-/FX-/Steuerlücken konkret, keineautomatische Ausgleichseinzahlung | Eigener PR/Entscheidung |
| Nach gemeinsamen Eingängen | FLH03-07 P0 Abschluss | Provider-/Konto Anfang-Endabgleich, Geschichte/Qualität/Analyse integrieren |02–05/18 und bestehende FLH02, keinezweite Engine | Mehrjahresportfolio, echte Teilsegmente, geschlossene Positionen/Transfers/Fees, kein unbekannter Gesamtwert als0 | Eigener PR/Entscheidung |
| Protokollbelegt | FLH03-09/10 P1 | Natives P-Chain-Staking und Sonic Withdrawal/Unbonding jeeinzeln | Offizielle Protokoll-/Eigentums-/öffentliche Transportbelege | Stake/Unbond/claim/paid Zustände einer Menge, keine Doppelzählung/Rewarderfindung, Gebühren/Reimport/Fehlerabdeckung | Getrennte PRs/Entscheidungen |
| Nachweis-/kontobereit | FLH03-06/11 P2 | Optionale Read-only APIs undzusätzliche Kursanbieter | Origin CORS, minimale Rechte, Lizenz/Tarif/Quote/Raw Close/Identity/Secrets | Direkter Browser,401/403/429/Paging/Offline/Nonce; kein Worker Ausweg;alte Quellenbisbewiesenem Ersatz | Getrennte PRs/Entscheidungen; blockiertkeine CSV |
| Beleg-/fachbereit | FLH03-12/AT05-B/#52 P1/P2 | Originalbezogene AT-Steuer-/Kapitalmaßnahmenkleinschnitte | Broker/Oe KB/Settlement/Fachprüfung | Cash+Shares atomar, keine Scheincashflows/ATBasisannahmen, Referenzfälle/Restore/Mehrtab | Kritische Fach-/Releaseentscheidungzwingend |
| Unabhängig bereitstellen | FLH03-13/AT06 P1 | Reale Device-/Drive-/Crash/Eviction-/Archivnachweise | Isolierte Testhardware und Testkonto | Exaktes Portfolio+Settings+History+Identity Restore/Offline; echte Notch/Tastatur/AT je Gate | Keine Abnahmeohne Umgebungbehaupten |
| Phase D eigener Scope | FLH03-18 P1 | Zuerstprivater Ledger-Schemaaudit, dann belegte CSV-Preview/Mapping/Commit/Undo | Benanntezugängliche Dateilokal;01/Wallet/Bittr/FLH02 | IN/OUT/FEES/failed/Delegation/Unbond/Swap nurbelegt; TXIdentity/Reimport/Walletabgleich, Bittr Costbasisnuraus Kaufbeleg | Eigener PR;keinepauschale Produktionsfreigabe |
| Phase E eigener Scope | FLH04 P1Sicherheit | Eigenes Issue/Branch/Checkpoint, Sicherheits-/Revisions-/Konfliktvertragvor Transport/UI | Vorhandene Backupcrypto nachechter Eignungsprüfung; öffentliche OAuth Client-/Google App Data Folder-/Operatorgates | E2EE, Offline Revision/CAS/Parallelwriter/Konflikt/UI, echtes Neugerät/Restore; kein LWW/geschlossene PWAversprechen | Neuekritische Scope-/Releasefreigabeerforderlich |
| Später | BENCH018/019/024 / Analysekomfort P3 | Messengpass, nützliche Presets, Supportdiagnose, Sparplan-/Zielgewichtsideennurbei Nutzwert | Keinaktuellerblockierender Defektbelegt | Erstklarer Produktvertrag/Privacy-/Performancebeleg, keine Framework-/Engineexpansion | Separatentscheiden; keinaktuelles Pflichtrelease |

## Ledger-Live-Vertrag vor Implementierung

Das Vorhandensein einer benannten Datei ist kein Beweis für vollständige Wirtschaftssemantik. Originale ausschließlich lokal verarbeiten; keine echten Adressen, Tx IDs, Kontobezeichnungen, personenbezogenen Dateinamen/-inhalte oder API-Schlüssel in Git Hub/CI. Öffentlich nur abstrahierter Schema-/Abdeckungsbefund und rein synthetische Fixtures.

Zuerst nachweisen: Header/Delimiter/Encoding/Zeit/Assetpräzision/Kontoidentität/Operationstyp/Status/Transaktionsidentität/Gebühren und Bedeutung von Gegenwertfeldern. Ledger-Countervalue ist nicht automatisch Kaufpreis, EUR-Anschaffungskosten oder Steuerbasis. On-chain IN kann interner Transfer sein, OUT kann Delegation/Swap/Fees umfassen; failed Operation kann nur Gebühr haben. Unbekannt oder mehrdeutig bleibt vor Commit ungeklärt. Bestands-/Wallet-/Brokerbelege nur mit belegter Identität verknüpfen, nicht Tag/Betrag raten. Bittr-Nachweise aus FLH02-A wiederverwenden. Erst tatsächliche Mindestformatprobe und unabhängige Sollwerte rechtfertigen einen aktivierbaren Importer.

## FLH04-Vertrag vor Implementierung

Backup und Synchronisierung sind verschiedene Operationen. Bestehende AES-GCM/Passwort-/vollständige Exportverträge prüfen, nicht ungeprüft als fertiges Syncprotokoll bezeichnen. Lokal kanonisches IDB bleibt vollständig offline funktionsfähig. Ein Syncmanifest benötigt eindeutige Portfolio-/Geräteidentität, authentisierte Revision/Elternbeziehungen und Replay-/Rollback-/Konfliktstrategie. Lokaler CAS schützt nur das lokale Gerät; Remote Parallelwriter brauchen zusätzlich serverseitig wirksame Vorbedingungen oder einen nachweislich konfliktfesten Append-/Revisionsvertrag. Keine unbewiesene Drive-ETag-Garantie. Änderungen an demselben Objekt verlangen ausdrückliche Konfliktauflösung, kein unkontrolliertes Last Write Wins. Automerge nur bewiesen unabhängiger Änderungen unter Finanz-/Referenzinvarianten. Schlüsselrotation/Passwortänderung/neues Gerät/Remote Löschung/teilweiser Upload/Widerruf/Quota/Offline Recovery separat spezifizieren.

Betreiberseitige öffentliche Google OAuth-Konfiguration, exakte Origin und app Data Folder-Rechte/Verifikation sind externe Nachweise; bestehende private Client-ID-Option bleibt erhalten. Keine Secrets im Appcode und keine Work-Connector-Tokens für die Produktapp übernehmen. UI erst nach Sicherheitsvertrag dezent „Mehr → Deine Daten“. Automatischer Abgleich ausschließlich bei offener aktiver autorisierter App, manuelle Aktion immer erreichbar. Keine Background Garantie bei geschlossener PWA. Echte Drive-/Neugerät-Abnahme bleibt ausdrücklich ausstehend bis verfügbar.

## Verbindlicher Freigabe- und Sicherungsablauf

1. Vor jedem neuen Scope aktuellenmain/offene PRs/Checkpoint prüfen; einfunktionaler Strang. Keine altenabgenommenen Pakete neu bauen.
2. Vor kritischer Modell-/Finanz-/Syncänderung kleinstenreviewbaren Vertrag sichern, dann Pure Funktionen/Tests, dann bestehende UI/Persistenz integrieren.
3. Nach sicherem Schritt passende Tests, Commit/Push/PR/Checkpoint. Unit/Syntax und relevantevollständige3Engine-,Finance-,IDB/CAS/Mehrtab-,Import/Dedupe/Undo-,Backup/Restore-,Offline/Mobile/Axe-Gates tatsächlich ausführen. Fremde Branchänderungen nicht überschreiben.
4. Review unabhängig von Implementierungsannahmen durchführen; echte kritische Findings beheben. Keine ungedeckte Gatesumme behaupten; native Hardware/OAuth getrennt.
5. Nur konkretfreigegebene Pakete nach vollständiggrünenfinalen Gates mergen. Bei neuerfehlender Releaseentscheidung zunächst vollständigenreviewbaren PR sichern; Freigabe gilt nicht durch Zeitablauf.
6. Nach Deployment exakte Domain-Version/SW/Assets/Kern- und Zielszenarien synthetisch liveprüfen. Grüne CI allein ist keine Liveabnahme. Nachweisundnächste Aktion remote.

## Exakter Wiedereinstieg nach diesem Audit

Audit-PR und `docs/FLH03_WORK_CHECKPOINT.md` auf `feature/consolidated-rest-audit-v179` lesen; der v179-Nachweis ist bereits gesichert. Nach remote gesicherter vollständiger Matrix PhaseB abschließen, ohne diesendokumentarischenZwischenschrittzu deployen. Dann boundedD als ersten bereitsproduktfreigegebenen kleinen main-basiertenPR ausführen; #151 unverändert alsFehlreferenzerhalten. Anschließend14/16 und zugänglicheOriginalformatnachweise in obigerReihenfolge; unfreigegebeneScopesnuralsgeprüftePRs sichern. FLH03-18 und FLH04 jeweils eigenständig verfolgen, keineOriginaldaten/Secrets veröffentlichen. Gesamtauftrag erst abgeschlossen nennen, wenn seinewirklichenAnforderungenabgenommenoderbewusstersetzt sind; fehlendeHardware/Belege/Freigabenkonkret offenlassen.
