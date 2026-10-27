# Aktiver Master-Checkpoint ab v188 — 27.10.2026

Aktueller verifizierter main/Produktion: `ca1fa8fd46b3060d10a13095400bc3d33b0f3c42`, SW188. PR173 nach konkreter Nutzerfreigabe gemergt und vollständig live abgenommen: Main/Pages/Core/UI-CI40534397532 sowie zusätzliche gezielte Drei-Engine-Mutations-Live-CI40536412182 SUCCESS;735 Unit-Tests,106 exakte veröffentlichte Assethashes,6Kerngruppen/18Axe. Keine laufenden Releases oder funktionalen Parallelstränge beim FLH05-Einstieg. Persistenter Releasebeleg: `qa/v188-live-targeted:docs/release-evidence/booking-management-v188-release.json` /6bbe2b7cf52283a3cc133895c554915cdba2cb3d.

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
| 6: CI/Playwright | Vorhandene Messbaseline PR172-Kommentar6441822234 wiederverwendet: Chromium-Setup5–6s, Cross-Setup41–69s; erfolgreiche Crossjobs433/552/623/649s, Tests356/485/573/582s. Unterschiedliche Teststände/Runner, keine Einsparungsbehauptung; keine konkurrierenden Workflowänderungen | OPEN, nach sicherem funktionalem Checkpoint separater PR: reale Vorher/Nachher-Minuten/%, reproduzierbare Dependencies/Caches/Parallelisierung; sämtliche Tests erhalten. |
| FLH03-02/03/04/05, AT03-C | Native TR/Kraken/Bitpanda und vollständiger Flatex Depot+Cash-Abgleich fehlen als End-to-End-Nachweis | PARTIAL/BLOCKED je Original-/Semantikgate. Generischer Import und Flatex-Beta bleiben vorhanden. Spätere FLH05-Forschung ersetzt keinen fehlenden realen Abgleich. |
| FLH03-09/10/11, Wallet/API | P-Chain-Eigentum/öffentlicher Transport; Sonic-Auszahlungs-/Unbondingereignisse; optionale Lizenz-/CORS-/Tarifnachweise | OPEN/PARTIAL: erst konkrete offizielle Capability-/Semantiknachweise, danach kleinster sicherer Schnitt. Neue Scanner/Kursanbieter nicht aus FLH05 ableiten. Kein Pflichtworker. |
| #44/AT06/FLH03-13 und UI-Hardware | IDB/CAS/Recovery/Restore schon produktiv und breit bestanden | PARTIAL: echte Android/TalkBack/nativeSafari/OS-Crash/Eviction/Drive-Neugerät/große reale Archive extern offen. Emulation ist keine physische Abnahme. |
| #52/AT05-B/FLH03-12 | Sichere Ablehnung und dokumentierende Jahresübersicht vorhanden | BLOCKED für neue AT-/OeKB-/Cash-in-lieu-Semantik: Originalsettlements und unabhängige Fachvalidierung. Keine erfundene Steuerbasis. |
| D/P2/#157 | Unveränderte Firefox-Fehlnachweise, keine neue Browser-Evidenz | BLOCKED/geparkt, nicht erneut identisch testen. Keine History-Traps. |
| BENCH018/019/024 | Bewusst zurückgestellte optionale Komfort-/Diagnose-/Skalierungsideen ohne neuen Engpass/Nutzwertbeleg | OPEN/bedingt, keine Pflicht zur spekulativen Neuentwicklung. Konkreten Nutzen-/Privacy-/Messbeleg zuerst prüfen. |
| FLH05-A–E/#174 | Einzige konsolidierte Spezifikation, zwölf Testvektoren, technische Ist-Schnittstellen gesichert | ZURÜCKGESTELLT bis sämtliche ohne externe Blocker ausführbaren beauftragten Vorgängeranteile abgeschlossen sind. Keine neue A-Recherche/Parserimplementierung jetzt. |

Kein Paket wird allein wegen fehlender Produktionsfreigabe als technisch unmöglich erklärt: erst vollständig reviewbaren sicheren Kandidaten und tatsächliche Gates herstellen. Releaseentscheidung bleibt konkret separat. Eine fehlende externe Abnahme blockiert unabhängige Vorgängerarbeit nicht. Nur ein funktionaler Hauptstrang; Recherchezwischenstände/PR157/PR161 nicht unterbrechen.

## Technischer Wiederaufnahme-Checkpoint

Aktueller vollständiger Kandidat auf GitHub: PR175, `dd6ec31bf7687b833442f247d150130f1ac5f8b3`, Tree `2802cc931fa6bd10344a693b923f3107e94f55a7`. Rein lesende Kontoevidenz, bestehende Engines; keine Finanz-/Storage-/Backup-/Workflowänderung. Konkrete Tests, fehlgeschlagene Zwischenläufe und Korrekturen: `docs/FLH03_ACCOUNT_COMPLETENESS_CHECKPOINT.md` auf diesem PR. Alle bisherigen Jobs vor Folgepush natürlich beendet; kein PR/Test/Deployment abgebrochen. SW189 bleibt Kandidat, Produktion v188.

**Temporärer externer Arbeitsumgebungsblocker:** ausgewählte Work-Ausführungsumgebung nicht mehr verfügbar (Tool bestätigt „No usable execution environment is available“). Remote-GitHub-Checkpoint und laufende Actions bleiben erhalten. Finale Remote-Ergebnisse ausgewertet: CI40558301803/Wallet40558301991 SUCCESS, getesteter Merge69071b3 hat exakt denselben Tree2802cc9 wie dd6ec31; main unverändertca1fa8f. Keine lokale Bild-/Browser-/Dateisystemprüfung behaupten. Nach tatsächlicher finaler CI noch aktuelle gerenderte320/390/430/1440-Kontobilder und Closed/Open-Pfeile prüfen, unabhängigen Source-/main-/Mergebaumreview abschließen. Erst danach Releaseentscheidung; Main/Pages/Live sowie tatsächliche neue Zielabläufe in3Engines sind vor einer v189-Abschlussmeldung zwingend. Falls Umgebung weiter fehlt, diesen Nachweis offen lassen, nichts ungeprüft veröffentlichen. FLH05-A bleibt unverändert zurückgestellt.

Automatisierter Kandidatennachweis: [release-evidence/flh03-account-evidence-candidate.json](release-evidence/flh03-account-evidence-candidate.json). **Kein Release-/Live-PASS:** aktuelle Kandidatenbilder noch nicht tatsächlich angesehen, PR175 bleibt Draft. Sichere Wiederaufnahme beginnt mit dieser fehlenden Sichtprüfung, nicht mit erneuter Entwicklung oder identischen v188-/Finanztestläufen.

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
