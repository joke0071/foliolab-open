## Fortschreibung – 10.11.2026 EFF03-Zwei-Agenten-Pilot PR326/v305 abgeschlossen

**v305 LIVE_ACCEPTED und V138 tatsächlich wiederhergestellt.** [Abnahme](release-evidence/v305-live-accepted.json), [Messreview](release-evidence/eff03-pr326-pilot-result.json), [reguläre HND01-R-Abgabe](HANDOVER_93890745b277_2026-11-10.md). Zwei fachlich zusammengehörige Backup-/Safari-Copy-Änderungen; Hauptagent allein Code/Integration/Sicherung, unabhängige QA nur lesend plus ein redigiertes SHA-gebundenes PR-Review. DEV_ACTIVE→QA_READY→QA_ACCEPTED→MERGE_READY→LIVE_ACCEPTED real durchlaufen; Hauptagent hat Reviews UND Kommentare selbst frisch gelesen.0Produktbefunde,0Korrekturrevisionen nach Freeze, keine CI-Retries/Abbrüche/Duplikat-Messläufe. Bestehende QA-Automatisierung unverändert, keine neue Plattform oder weitere Automatisierung.

| Beobachtung | Tatsächlicher Beleg / Grenze |
| --- | --- |
| QA-Übergabe | [PR326](https://github.com/joke0071/foliolab-open/pull/326), eingefrorener HEAD40632c0ddf335493c6a6900beee29049be7b3e5e, unabhängige [Review5848989116](https://github.com/joke0071/foliolab-open/pull/326#pullrequestreview-5848989116) |
| Zeitliche Überlappung | Review3:41nach PR-Erstellung, vor Ende der Pflicht-CI; das ist keine gemessene aktive QA-Zeit |
| PR-CI / Main inklusive Produktion |29:30 /60:24 Wandzeit; erfolgreiche Main-Jobs zusammen99:48, keine Work-Credits |
| Qualität |1353Units/0Fehler/0Skips; alle unveränderten PR/Wallet/Main/Deploy/gewöhnlichenTLS-/3Engine-Produktionsgates;627neueCI-JSON/5537dekodiertePNG/14Originalarchive vollständig zugeordnet; unabhängige eigene Source-/Tree-/DOM-/Tastatur-/Layout-/Axe-Gegenprüfung |
| Sicherung | V137-PR-Originale und V138-Main-/Produktionsoriginale dauerhaft gepinnt bytegleich; V138 tatsächlicher inkrementellerRestore59Manifestpfade/0Fehler, komplette Vorgängerkette erhalten |
| Aktive Aufwände / Credits | Entwicklung,QA,Korrektur,Auswertung,Sicherung,Dokumentation undWork-Credits UNKNOWN; keine aktive Zeit aus Wand-/Jobzeit erfinden |
| Historischer Vergleich | anderer Scope und PR325-Versuch2; vorhandene API-Zeitstempel erhalten, kein kontrollierter Einzelversuch-Vergleich und keine Prozentersparnis ableiten |
| Ergebnis | Rollen-/PR-Kommunikation und SHA-Schutz funktionieren im ersten kleinen Paket; kein belastbarer quantitativer Effizienznachweis und keine weitere Automatisierung daraus |

Der lokale WebKit-Offlinefehler ist als Debian-Umgebungsgrenze mit exaktemv304-Gegenbeleg erhalten; die unveränderten CI-PWA-/Offlinegates bestanden in allen3Engines mitv305. Zusätzliche neueCopy direktinveröffentlichterWebKit-Seite geprüft; zusätzliche lokaleChrome-/Firefox-Probes durchHosttransport/Proxy-CA begrenzt, keinPASS undkeineTLS-Ausnahme daraus. Alle verpflichtenden tatsächlichenProduktionsgates bestanden separat mitgewöhnlichemTLS. NativeGeräte-/Safari-/ITP-/TalkBack-/OAuth-/Originalankergrenzen bleibenextern, K6-TRUSTgesamtVERIFY.

Danach K1–K6 seriell gemäß kanonischerMatrix; fertigenPilot nichtwiederholen, keine neueGesamtanalyse/Roadmap/CI-Plattform. HND01-R sowie sämtliche Finanz-/Datenintegritäts-/Backup-/Restore-/Releaseverträge bleiben verbindlich.

## Fortschreibung – v304 sicher abgeschlossen · 10.11.2026

[v304 LIVE_ACCEPTED](release-evidence/v304-live-accepted.json), Main/Deploy/tatsächliche Produktion SUCCESS. Bereits qualifizierte identische PR-/Quell-/V133-Belege wiederverwendet; keine neue CI, kein Retry/Abbruch, keine Gateabschwächung. Neue Main-/Produktionsoriginale getrennt und unveränderlich gesichert, bestehender Root versionsgeschützt 133→134 fortgeschrieben und gepinnt vollständig rückgeprüft; tatsächlicher inkrementeller Restore 67 Manifestpfade/0 Fehler. Unveränderte frühere Vollrestorebelege wiederverwendet.

Gezielte neue Wallet-Prüfung zusätzlich direkt in drei Produktionsbrowsern belegt; keine Abdeckung aus einem Kommentar oder bloßem Istwert angenommen. EFF03 bleibt beim bereits qualifizierten begrenzten Verdichter; keine neue Workflow-/CI-Plattform und keine automatische Freigabeentscheidung. Danach K1–K6 seriell; aktuelle Zuständigkeit ausschließlich im zentralen Checkpoint. [Reguläre HND01-Abgabe](HANDOVER_e595fcc6d453_r3_2026-11-10.md).

## Fortschreibung – EFF03 lokaler Verdichter · 10.11.2026

**Begrenzter lokaler Kandidat implementiert und am vorhandenen v303-Satz validiert**, nur auf bestehender Checkpointref, keine Main-/CI-/Gate-/Produktänderung. [Vertrag und Nachweise](EFF03_RESULT_DIGEST_2026-11-10.md).8OriginalZIPs/398JSON/745explizite Ergebnisfelder,0FINDINGS/15UNKNOWN;3472PNG nurCRC, keine neue Bildabnahme. Kompakte Ausgabe4793Bytes/2,831s; technische Erstübersicht1Zusammenfassungsread+15expliziteDetailberichte statt398Einzelberichte, keine Gleichsetzung mit vollständiger fachlicher Qualifikation. Aktive frühere Auswertungszeit/Workverbrauch UNKNOWN.10adversarialeTests und4v303-bezogeneNegativkontrollen bestanden; Originale unverändert, keine PASS-Automatik.

V303/Main/Tree und V132 samt Originalkette unverändert. Unterstützender lokaler Kandidat, keine neue CI-Plattform/automatische Gateentscheidung. Nächster Produktumfang wieder K1–K6 gemäß kanonischer Matrix; keine Erweiterung des Optimierungsprojekts.

# EFF01 – Verbindlicher Arbeitsplan für effiziente FolioLab-Entwicklung

## EFF03 – Vereinfachung und Entkopplung der Entwicklungsprozesse

### EFF03 – Zwei-Agenten-Modell · Nutzerentscheidung 10.11.2026

**Verbindlicher Ablauf ab dem nächsten geeigneten Fachpaket nach regulärem Abschluss des bereits laufenden PR325-Main-/Produktionslaufs.** Keine laufende CI abbrechen, duplizieren oder überholen. Der bisherige Ergebnisverdichter bleibt ein begrenztes Hilfsmittel ohne automatische Freigabe; diese organisatorische Entkopplung ersetzt weder Pflichtgates noch HND01-R. Erste praktische Erprobung mit PR326/v305 abgeschlossen; [Messreview und Grenzen](release-evidence/eff03-pr326-pilot-result.json). Keine gemessene Prozent-/Creditersparnis, aktive Aufwände UNKNOWN; weitere Automatisierung nur bei belegtem Nutzen.

| Rolle | Verantwortung und Schreibrechte |
| --- | --- |
| Hauptagent | Alleiniger Owner für Produktcode, Entwicklungsbranches, Checkpoint, Integration, Releases und private Sicherungen; führt notwendige lokale Tests aus, stellt den vollständigen Kandidaten bereit und entscheidet anhand aller unabhängigen Nachweise. |
| QA-Agent | Unabhängige Prüfung genau des eingefrorenen PR-Kandidaten. Ausschließlich lesen sowie redigierte Reviews/Kommentare am betreffenden PR schreiben. Keine Code-, Branch-, Checkpoint-, Workflow-, Release- oder Sicherungsänderungen; keine Ownerübernahme. |

**Paket und Freeze:** Zwei bis vier fachlich zusammengehörige Änderungen auf einem Entwicklungsbranch bündeln; risikoarme UI-Änderungen nicht unnötig mit Finanz- oder Speichermutationen mischen. Notwendige lokale Tests bereits während der Entwicklung ausführen. Erst den vollständigen Kandidaten fertigstellen, dann Commit-SHA und Prüfvertrag einfrieren. Der Hauptagent stellt am PR Scope, konkrete Risiken, Test-/Negativkriterien, Commit-SHA, relevante unverändert wiederverwendbare Belege und tatsächlich offene externe Grenzen bereit. Keine privaten Originale, Kontowerte oder Sicherungsidentitäten in öffentliche Übergaben.

**Verbindliche Übergabestelle ist der GitHub-PR, nicht der Chat oder eine automatische Benachrichtigung.**

| Status | Zuständiger Schritt / Übergang |
| --- | --- |
| DEV_ACTIVE | Hauptagent entwickelt und testet das zusammenhängende Paket. |
| QA_READY | Vollständiger Kandidat und Prüfvertrag sind unter exakter Commit-SHA eingefroren; QA-Auftrag mit Scope/Risiken/Kriterien steht am PR. |
| QA_FINDINGS | QA hinterlegt unabhängig belegte, redigierte Befunde mit geprüfter SHA direkt am PR; Hauptagent korrigiert notwendige Punkte. |
| QA_ACCEPTED | QA bestätigt den unabhängig geprüften benannten Umfang unter exakter SHA und nennt verbleibende Grenzen. Kein Ersatz für CI, Main-, Produktions- oder sonstige Pflichtgates. |
| MERGE_READY | Hauptagent hat neue Reviews UND Kommentare selbst frisch abgerufen, notwendige Befunde geklärt und erfolgreiche verpflichtende CI sowie alle sonstigen Integrationsgates für den eingefrorenen Stand belegt. |
| LIVE_ACCEPTED | Erst nach Integration des exakt qualifizierten Stands, vollständiger Main-/Produktionsabnahme und privater Sicherung mit Versions-, Integritäts-, Rücklese- und Restore-Schutz. |

**Korrekturschleife:** Geänderter Commit-SHA erfordert erneute unabhängige Prüfung der betroffenen Aussagen und eine neue SHA-Zuordnung am PR. Unverändert gültige Belege gezielt wiederverwenden; keine pauschale Übernahme einer alten QA_ACCEPTED-Aussage auf geänderten Code. QA prüft unabhängig und meldet Findings oder Acceptance direkt am PR; Hauptagent ruft diese vor Integration selbst ab. Kein Selbstreview durch den Hauptagenten als Ersatz für den QA-Agenten. Notwendige Korrekturen bleiben beim alleinigen Hauptagenten.

**Historischer Pilotauftrag, inzwischen PR326/v305 abgeschlossen:** Nach dem aktuellen regulären Releaseabschluss das nächste geeignete zusammenhängende K1–K6-Fachpaket gemäß kanonischer Matrix auswählen, Umfang und Risiken vor Entwicklung benennen, zwei Rollen einsetzen und das vollständige DEV_ACTIVE→QA_READY→QA_FINDINGS/QA_ACCEPTED→MERGE_READY→LIVE_ACCEPTED-Verfahren am PR nachvollziehbar ausführen. Kein künstlicher Produktpatch oder zweiter CI-Lauf allein zum Ausprobieren des Prozesses. Fertige UNKNOWN-FX-, UI-R1/R2/R3-, Frequenz-, Wallet-/Hilfenschnitte nicht neu implementieren. HND01-R gilt unverändert; der nächste alleinige Owner übernimmt den Pilotauftrag bei regulärer Rotation.

**Bewertung nach genau diesem ersten gemeinsamen Paket:** Tatsächlich gemessenen aktiven Entwicklungs-, QA-, Korrektur-, Auswertungs-, Sicherungs- und Dokumentationsaufwand sowie Wandzeit, notwendige Detailreads/CI-Wiederholungen/Übergaben und Nutzen der unabhängig gefundenen Fehler knapp am Pilot-PR und hier verlinkt bewerten. Vorhandene Vergleichsdaten verwenden, unterschiedliche Paketrisiken und wiederverwendete Belege benennen; fehlende Messwerte UNKNOWN lassen. Weder Jobzeit als Work-Credits noch eine ungeprüfte Prozentersparnis ausgeben. Prüfqualität umfasst belegte Befunde/Negativgegenproben, erfüllte unveränderte Pflichtgates und offen ausgewiesene Grenzen. Erst bei nachgewiesenem Nutzen weiter automatisieren.

Keine zusätzliche CI-Plattform, zweite Roadmap oder umfangreichen Checkpointstrukturen. Finanz-, Datenintegritäts-, Backup-, Restore-, Release- und HND01-R-Verträge bleiben vollständig gültig. Der allgemeine historische Datenschutz-Audit bleibt gemäß gesonderter Nutzerentscheidung optional; die hier beauftragte unabhängige Kandidaten-QA ist ein eigenes Integrationsgate.


### Historischer erster Optimierungsschritt: Ergebnisverdichtung

**Historischer Stand des Ergebnisverdichters:** Mess-/Priorisierung abgeschlossen; begrenzter lokaler Ergebnisverdichter LOCAL_CANDIDATE_VALIDATED, auf Checkpointref verfügbar. v303 ist inzwischen LIVE_ACCEPTED. Der neue verbindliche organisatorische Ablauf und der noch ausstehende Zwei-Agenten-Pilot stehen oben; K1–K6 bleiben die Produktziele. Keine zweite Roadmap.

**Ziel:** Die FolioLab-Entwicklung skalierbarer, schneller und zuverlässiger gestalten. Den organisatorischen Aufwand pro Release reduzieren, ohne Abstriche bei Finanzintegrität, Datensicherheit oder Produktqualität.

### Verbindlicher Prüf- und Optimierungsumfang

1. **Agenten entlasten:** Produktentwicklung, Testausführung, Sicherungen, Dokumentation und Releaseprüfung so weit wie sinnvoll voneinander entkoppeln.
2. **CI-Ergebnisse verdichten:** Maschinenlesbare Zusammenfassungen statt wiederholter manueller Auswertung Tausender Artefakte. Detaillierte Originale bleiben verfügbar.
3. **Prüfungen effizienter gestalten:** Identische bereits qualifizierte Nachweise wiederverwenden, redundante Analysen und unnötige Werkzeugaufrufe vermeiden.
4. **Sicherungen optimieren:** Inkrementelle, wiederaufnehmbare Sicherungsschritte mit unverändertem Versions-, Integritäts- und Readback-Schutz.
5. **Dokumentation vereinfachen:** Ein kompakter aktueller Checkpoint, eine kanonische Roadmap und verlinkte Detailnachweise statt mehrfacher Protokollierung.
6. **Work-Sitzungen stabilisieren:** HND01-R anwenden, kurze Fachpakete, frühzeitige Übergaben und rekonstruierbare Zwischenstände.
7. **Wiederholungen reduzieren:** Bereits erledigte Aufgaben und akzeptierte Releases nicht erneut analysieren oder abnehmen.

### Umsetzung und erster begrenzter Schritt

Zuerst die tatsächlich zeit- und ressourcenintensiven Abläufe anhand vorhandener GitHub-/CI-Nachweise identifizieren. Keine separate Gesamtprojektprüfung und keine neuen CI-Läufe nur für diese Dokumentationsänderung.

Nach sicher abgeschlossenem v303 als ersten begrenzten Schritt vorhandene v303-Run-/Jobzeiten und den tatsächlich angefallenen Aufwand für Artefaktqualifikation, Sicherung und Dokumentation knapp auswerten. Bereits vorliegende Nachweise verwenden; unbekannte Verbrauchswerte ausdrücklich unbekannt lassen. Danach eine kleine, risikoarme Verbesserung nach messbarem Nutzen auswählen und ihren begrenzten Umfang sowie Vorher-/Nachher-Maß festhalten. Keine vorgezogene Implementierung während des laufenden Releases.

Keine neue komplexe Infrastruktur schaffen, wenn bestehende Werkzeuge ausreichen. Alle verpflichtenden Tests, Schutzverträge und externen Abnahmen bleiben vollständig erhalten. Automatisierung darf keine ungeprüften PASS-Erklärungen erzeugen. Detailoriginale und nachvollziehbare Ergebniszuordnung bleiben erhalten; bestehende alleinige Integrationsverantwortung und HND01-R gelten weiter.

**Erfolgskriterium:** Weniger redundante Werkzeugaufrufe, geringerer Dokumentations- und Sicherungsaufwand, zuverlässigere Agentenübergaben und kürzere Entwicklungszyklen bei gleichbleibender nachweisbarer Qualität.

### Erster begrenzter EFF03-Schritt – 10.11.2026 nach v303/V132

**Messbasis verdichtet; begrenzter lokaler Kandidat inzwischen validiert, siehe aktuelle Fortschreibung oben.** Erst nach tatsächlich qualifiziertem v303 und dauerhaft bytegleich rückgeprüfter V132 ausgewertet; keine neue Mess-CI und keine Änderung an Gates/Testauswahl. [Abnahme](release-evidence/v303-live-accepted.json), [vorhandene Run-/Jobmesswerte](release-evidence/v303-eff03-baseline.json).

| Bestehender Mainlauf42814350681, Versuch1 | Zeit |
| --- | --- |
| Workflow-Wandzeit |65:06|
| Summe erfolgreicher Jobs |98:47|
| Chromium / Cross1 / Cross2 / Cross3 |15:17 / 10:39 / 7:55 / 22:16|
| Deployment / tatsächliche Live-Abnahme |0:42 / 41:50|

Acht neue OriginalZIPs,398JSON-Berichte und3472PNG qualifiziert. Inkrementelle Sicherung: zwei unveränderliche neue Teile mit19+9Manifestpfaden; Root enthält vollständige unveränderte V131,5Rootmanifestpfade;33extrahierte inkrementelle Pfade tatsächlich geprüft. Frühere identische PR-/V302-Nachweise wiederverwendet. Keine zweite CI, kein Retry/Abbruch. Tatsächliche Work-Credits, aktive manuelle Analysezeit und Dokumentationszeit **UNKNOWN**; Jobzeiten sind keine Abrechnungseinheiten. Der erste Root-Latestabruf war nach Erfolg132 noch131; erneute Metadaten und gepinnter Byteabruf bestätigten132, ohne zweiten Schreibversuch.

**Historischer Auswahlstand vor Umsetzung, inzwischen durch obige Kandidatenprüfung fortgeschrieben:** ein kleiner lokaler Ergebnisverdichter für vorhandene OriginalZIPs/JSON/Metadaten. Je SHA/Tree/Run/Versuch vollständige Originalzuordnung mit Digest/Größe/CRC, erwarteten Berichten, Fehlern und UNKNOWN liefern; Detailoriginale verfügbar halten. Keine neue Plattform, kein Gate-/Workflowwechsel, keine automatische PASS-Erklärung. Tatsächliche Bild-/Fachprüfung und Pflichtgates bleiben erhalten. Vorher/Nachher-Maß: Anzahl notwendiger Detailreads und aktive Auswertungszeit auf demselben vorhandenen v303-Satz; jetzige aktive Zeit UNKNOWN, keine Prozentersparnis behaupten. Negative Kontrollen: fehlender Bericht, falscher Digest und echter Fehlerflag müssen sichtbar scheitern. Vor Implementierung Umfang knapp festlegen; bei fehlendem Nutzen stoppen. K1–K6 unverändert, HND01-R nach diesem Release regulär abgeben.

## HND01-R – Resiliente Work-Ausführung · verbindlich ab 10.11.2026

Neuere ausdrückliche Nutzerentscheidung; ersetzt die älteren Schwellen von zwei Releases/drei Paketen. Reguläre Chat-Rotation **spätestens nach einem LIVE_ACCEPTED-Release oder einem größeren abgeschlossenen Fachpaket**, früher bei instabilem Chat oder zunehmender Kontextlast. Laufende Actions regulär beenden, keine Abbrüche zur Rotation.

Kompakte wiederaufnehmbare GitHub-Checkpoints nach fachlicher Abgrenzung, Implementierung, PR-Erstellung, CI-Abschluss, Veröffentlichung und Sicherung: alleiniger Owner, exakte Main-/Kandidaten-/Tree-/Run-Identität, letzter LIVE_ACCEPTED, tatsächlicher Sicherungsstand, offene Grenzen und genau nächste Aktion. Große Werkzeugoperationen in abgeschlossene Abschnitte mit erhaltenen Zwischenergebnissen unterteilen.

Keine wiederholten vollständigen Projektanalysen. Bereits qualifizierte identische Belege bei unveränderter relevanter Aussage wiederverwenden; alle verpflichtenden neuen Kandidaten-/Main-/Produktionsgates bleiben erhalten. Keine engen Polling-Schleifen. Private Sicherungen möglichst inkrementell, mit Versionsschutz und weiterhin vollständiger Integritäts- und Originalerhaltungsprüfung; keine leeren/unvollständigen Ersatzarchive.

Am sicheren Übergabepunkt reguläre HND01-Abgabe, alleinige Schreibverantwortung eindeutig beenden und einen **kopierfertigen Nachfolgerprompt dauerhaft im zentralen Checkpoint** hinterlegen. Bei instabilem Chat frühzeitig WIP/Belege/konkrete nächste Aktion sichern; keine wiederholten Übergabeaufforderungen an ausgefallene Agenten.

Unverändert: sämtliche technischen, finanziellen, Datenschutz-, Datenintegritäts-, CI-, Backup- und Release-Schutzverträge. Keine zusätzlichen Workflows oder CI-Läufe ausschließlich für diese Prozessdokumentation. Keine zweite Roadmap oder Architektur.

## Fortschreibung – UI-R3/v302 LIVE_ACCEPTED, 10.11.2026

**UI-R3/PR322 regulär integriert**, Main `179d424aef1f6f35c3f6f72600e4bbe885ef329c`/Tree `1d0e20afc7aefce1d5a4b9446356addc53bd7f66`, exakt qualifizierter Tree. Mainlauf42770050654 Versuch1 vollständig SUCCESS, einschließlich Deployment und echter Live-Abnahme129682873647. v302 LIVE_ACCEPTED, [Abnahmeindex](release-evidence/v302-live-accepted.json). **v301 LIVE_ACCEPTED / UI-R2 DONE** bleibt bestätigte Vorgängerbasis, [Abnahmeindex](release-evidence/v301-live-accepted.json). Reguläre vorhandene Integration/Wallet/Main/Produktion vollständig qualifiziert, kein Retry/Abbruch/identischerDuplikatlauf. 1345Tests,3Engines,153gewöhnlicheTLS-Pfade und echteProduktionsbilder PASS. Seit ausdrücklicher Nutzerentscheidung10.11.2026 ist die historische Datenschutzkontrolle unter QUALITY-TRUST01/K6-TRUST optional und kein Entwicklungs-/Integrations-/Release-Gate. Keine Unbedenklichkeit ungeprüfter Inhalte behaupten. UI-R3/K1–K6 ohne allgemeinen Auditabschluss fortsetzen; konkrete bestätigte Vorfälle und alle übrigen Pflichtgates bleiben verbindlich. [Entscheidung und begrenzter Auftrag](PRIVACY_REVIEW_POLICY_2026-11-10.md); alle41Scopes/externenGates/Originale erhalten.

## Historischer Zusatzauftrag09.11. – durch optionalen begrenzten Auftrag10.11. fortgeschrieben

Die folgende damalige Vollständigkeitsforderung ist keine aktuelle Produkt- oder Releasevoraussetzung. Maßgeblich ist die ausdrückliche [Nutzerentscheidung10.11.](PRIVACY_REVIEW_POLICY_2026-11-10.md); allgemeiner Auditabschluss entfällt als Gate.

Im bestehenden QUALITY-TRUST01#298 und K6-TRUST/EFF02, keine neue Roadmap/Entwicklungsübernahme: zunächst vollständig lesender Audit aller erreichbaren Refs/Historie/gelöschten Gitdateien, PR-/Issue-Texte und Kommentare, Actions-Artefakte/ZIPs/Logs, Release-/Fixture-/Screenshot-/Kompressionsinhalte und Pages-/Runtime-Assets. Bereits tatsächlich geprüfte Inhalte per exakten Git-/Dateihashes wiederverwenden; synthetic-Label allein genügt nicht. Abdeckung pro Bereich mit realen Zahlen und BESTÄTIGT UNBEDENKLICH/FINDING/NICHT VOLLSTÄNDIG PRÜFBAR führen, keine pauschale100%-Behauptung.

Bestehenden Owner und Produkt-CI erhalten; nur bestätigter sensibler Fund erzwingt Veröffentlichungsstopp betroffener Inhalte und private Fund-/Risikodokumentation. Keine sensiblen Werte/Pfade/Commit-Locators in öffentliche Fundberichte, keine eigenmächtigen Force-Pushes/Historienbereinigungen/CI-Abbrüche. Bereinigung erst konkret und freigegeben. Kollisionsfrei begrenzte Original-/Backupmuster, risikobasierten tracked-Blob-/Commit-Scan, explizit begründete synthetische Fixtures und datensparsame Beleg-/Artefakt-/Logregeln prüfen. Kein umfangreicher Pipeline-/Architekturumbau. Abschluss nur redigiert in #298 und EFF02; Originale/private Sicherungsidentität erhalten. Danach bestehenden1.0-Plan fortsetzen.


## Fortschreibung – UI-R1/v300 abgeschlossen, 09.11.2026

**v300 LIVE_ACCEPTED**, [vollständiger SHA-/Abnahmeindex](release-evidence/v300-live-accepted.json); genau nächster Schritt **UI-R2**, danach UI-R3/K1–K6 gemäß [kanonischer 41-Teilumfang-Matrix](KONSOLIDIERTE_ROADMAP.md). Alle EFF01/EFF02/HND01- und Schutzverträge unverändert. Aktueller Owner-/STOPPED-Status ausschließlich im [zentralen Checkpoint](WORK_RESTPAKETE_CHECKPOINT.md); [HND01-Abgabe nach einem akzeptierten Release wegen Kontextlast](HANDOVER_0f34093e6ee3_2026-11-09.md).

Regulärer Main-/Produktionslauf42573930681 Versuch1 SUCCESS: Workflow-Wandzeit66:36, Summe erfolgreicher Jobs104:54; Chromium20:03, Cross1/2/3 11:47/6:39/21:05, Deploy0:14, Live44:57. Gemessene Job-/Runzeitstempel, keine Abrechnungseinheiten. Keine Optimierung umgesetzt oder Ersparnis behauptet; Work-/Copilot-Verbrauch UNKNOWN. Vorhandene PR320-Qualifikation wiederverwendet; keine doppelte CI/kein Retry/Abbruch. CI-B/C weiterhin getrennte spätere Pakete.

## EFF02 – aktueller verbindlicher Fortsetzungsplan, 08.11.2026 nach v299

**v299 LIVE_ACCEPTED** auf Main `1f051a7059d24751f961fcf2af7fa226b319079e`, Tree `c4d3208a342ab5f8d5217b9f01de7b49b1cc44e6`; [bestehender SHA-Belegindex](release-evidence/v299-live-accepted.json). Owner `8cb2927f295c` allein ACTIVE; keine neue Übernahme. Alle bisherigen EFF01-/HND01-/Finanz-/Journal-/CAS-/Mehrtab-/Backup-/Restore-/Offline-/PWA-/Datenschutzverträge gelten weiter. Historische Prioritätsangaben weiter unten werden durch diese neuere Nutzerentscheidung präzisiert, nicht als neuer Auftrag zum Wiederbau gelesen.

**Genau eine kanonische Restpaket-Matrix:** [KONSOLIDIERTE_ROADMAP.md](KONSOLIDIERTE_ROADMAP.md#kanonische-restpaket-matrix). Die vollständige bestehende Bibliotheksprüfung wurde gelesen; ihre31-Issue-Matrix ist nach frischer vollständiger Issueabfrage und gezielter Main-/Releaseprüfung weiterverwendet. Kein zweiter Masterplan oder erneuter Grundlagengesamtaudit. Jede Teilanforderung hat getrennt Ziel 1.0/NACH_1.0 und DONE/PARTIAL/VERIFY/BLOCKED_EXTERNAL/PLANNED, Rest, Beleg, Abhängigkeit und nächste Aktion. Issuezahlen sind keine Fertigstellungsprozente; Gesamtissues werden nicht automatisch geschlossen.

### Endliche 1.0-Ziellinie und nächste Arbeit

Verbindlich sind [EFF02](https://github.com/joke0071/foliolab-open/issues/229#issuecomment-6725697219), [CI-Messreview](https://github.com/joke0071/foliolab-open/issues/229#issuecomment-6725922043), [Roadmap-Audit](https://github.com/joke0071/foliolab-open/issues/124#issuecomment-6725960013) und die neuere [FolioLab 1.0-Entscheidung](https://github.com/joke0071/foliolab-open/issues/124#issuecomment-6726116758) / [EFF02-Verknüpfung](https://github.com/joke0071/foliolab-open/issues/229#issuecomment-6726124312). Nach sicher abgeschlossenem v299 nicht routinemäßig den nächsten Finanzsonderfall eröffnen.

Sechs Pflichtpakete: **K1** gemeinsamer belegter Fünf-Anbieter-Import mit unterstützten Chainbezügen; **K2** ehrliche Finanzübersicht/Kurse/UNKNOWN; **K3** nutzbare sichere Verwaltung; **K4** lokale Speicherung/Offline/Backup/FreshRestore/Altversionsschutz; **K5** tatsächliche Android-PWA-Praxis; **K6** fertige begrenzte Kernbedienung samt klaren Daten-/Backup-/Fehlerhinweisen. Details und externe Gegenproben ausschließlich in der kanonischen Matrix. 1.0 erst bei belegtem Abschluss aller zugeordneten Pflichtteile, ohne bekannten P0/P1-Kernfehler und mit tatsächlich durchgeführter Android-Praxis. Keine Umbenennung von SW-Version, Schema, Origin oder Installationsidentität.

**Nächster konkreter Entwicklungsschritt: UI-R1.** Die vorhandene Kolben-Loaderdarstellung (`index.html`, `src/loading-ui.js`, `styles.css`) und zwei Downloadpfeil-Installationsglyphen im vorhandenen System eng abgrenzen. Taskkarte/Abnahmevertrag und Konfliktgrenzen stehen in der Roadmap. Noch kein neuer Produktpatch/PR/CI durch diese Dokumentation. Anschließend UI-R2 Auswahl/Buttons, UI-R3 Zeitraum/gezielte Icons sowie wirklich fehlende K2/K3/K4-Kernabläufe nach Abhängigkeit. Android A01–A10 und getrennte Safari/OAuth/Tastatur/200%-Schrift/TalkBack-Protokolle früh vorbereiten; ohne echte Durchführung kein Geräte-PASS. UI-R4/Dust mit noch unbestätigter0,01 EUR-Schwelle, Sekundärnavigation, Allokationsring und übrige Spezialfälle bleiben NACH_1.0. Neue belegte P0/P1-Kernfehler haben Vorrang, keine spontane Scopeerweiterung aus Ideen.

### CI-A – angewandter SHA-Belegindex und Kandidaten-Freeze

**Prozess umgesetzt**, keine neue Nachweisinfrastruktur. Der vorhandene Releaseindex trägt Produkt-HEAD/Tree, getesteten PR-Merge, Main-/Live-SHA, Workflow-Gitblob, reproduzierbaren Testmanifest-Fingerprint, Browser-/Toolversionen, Ergebnis und Artefakt-ID/Digest/Größe/Erstellung/Ablaufdatum sowie Grenzen. Originale/Decimal-Oracles bleiben privat; Belegpfade und vorhandene Berichte werden wiederverwendet. Ablauf des GitHub-Artefakts beendet nicht automatisch die gesicherte qualifizierte Aussage; Digest/Metadaten/Berichte und nötige unabhängige Belege sind vorher privat zu sichern. Kein bloßer Hash ohne tatsächlich erfolgte Inhaltsqualifikation als PASS.

Vor finaler Kandidaten-CI: vollständiger kleiner Fachvertrag, lokale gezielte Repros/Negativ-/Legacy-/Finanz-/Storage-/drei-Engine-Prüfungen soweit betroffen, Syntax/Units, klare Dateien und SW-/Assetidentität; danach Kopf einfrieren. Nur neuer echter Fehler rechtfertigt neue Produktrevision. Lauf regulär beenden und Originalfehler/Artefakte behalten, weil `cancel-in-progress:true` sonst den bestehenden Lauf überholen könnte. Keine kosmetischen oder Planänderungen auf die laufende Kandidatenref pushen. Frische Main-/Owner-/Refs-/PR-/Review-/Actions-/WIP-/Sicherungsprüfung und erwarteter HEAD vor Merge; exakt qualifizierter Tree auf Main. Keine neue Architektur oder paralleler Writer. Nur eng beauftragte unabhängige **lesende** Reviews; Hauptowner allein verantwortlich.

Ein alter PASS darf nur für identische relevante Code-/Test-/Workflow-/Dependency-/Build-/Konfigurationsaussage ohne transitive Änderung übernommen werden. Alle vorgeschriebenen Integrations-, Main-, Deployment- und echten Produktionsgates je neuem Kandidaten bleiben bindend. Bereits akzeptierte Releases nicht erneut abnehmen und keine gleiche CI aus Gewohnheit duplizieren. Dokumentation auf bestehender Checkpointref erzeugt keine zusätzliche Full-CI; Checkpointbranch niemals vollständig nach Main mergen.

### Tatsächlich gemessene reguläre Baseline, keine Mess-CI gestartet

| Bestehender Lauf | Chromium | Cross1 | Cross2 | Cross3 | Deploy | Live | Workflow-Wandzeit | Summe erfolgreicher Joblaufzeiten |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PR319/R4 [42514005224](https://github.com/joke0071/foliolab-open/actions/runs/42514005224), Versuch 1 |20:10|12:56|6:33|23:16|nicht auf PR|nicht auf PR|23:31|63:05|
| Main [42516298459](https://github.com/joke0071/foliolab-open/actions/runs/42516298459), Versuch 1 |14:58|10:28|5:38|26:55|0:17|32:34|60:06|90:59|

Quelle: abgeschlossene GitHub-Run-/Jobzeitstempel, nicht Abrechnungsdaten. Wandzeit=created_at→updated_at des fertigen Workflows; Jobsumme enthält erfolgreiche Jobs einschließlich Planungsjob, keine übersprungenen FAST-Jobs. Beide Läufe prüfen denselben Produkt-Tree, 407 Testquelldateien, Testmanifest-SHA256 `b7d3ff7709abe7bf28f5ce761ae260d1f83b76e140808f42a85ac08bd1da1835` und Workflow-Gitblob `1e4aa051fee8b36d737cc30d4c69a98586e30629`. Main besitzt zusätzlich Deployment/Live und ist deshalb nicht als ganze Wandzeit mit einem PR-Lauf gleichzusetzen. Toolstand: Node 22.23.4/npm 10.9.9, Playwright 1.56.1, Axe 4.10.3; Chromium 141.0.7390.37, Firefox 157.0, WebKit 27.2. Der bestehende unabhängige 17-Läufe-Review ergänzt diese zwei regulären Baselines; seine Stichprobe ist keine Verbrauchsprognose.

**Befund:** Cross3 liegt um 16:43 bzw. 21:17 über Cross2 und bestimmt beide Integrationspfade. Die echte serielle Live-Abnahme ist mit 32:34 der größte zusätzliche Mainblock. Bereits vorhandene drei Shards/Caches/FAST-/INTEGRATION-/RELEASE-Regeln nicht erneut entwickeln. Zusätzliche Browsercachearbeit hat nach dem Review geringere Priorität als das belegte Ungleichgewicht.

### CI-B – erster separater technischer Kandidat, noch PLANNED

Cross3→Cross2 anhand tatsächlicher Testgruppenlaufzeiten und unabhängiger Ressourcen balancieren. Vor Patch genau die verschobenen vollständigen Aufrufe/Browser/Artefaktpfade und Konfliktfreiheit belegen; **jeder bisherige Testaufruf, Browser, jede Assertion, Sicherheits-/Finanz-/Journal-/CAS-/Quota-/Backup-/Offline-/A11y-Prüfung und Frist bleibt erhalten**. Kein Testverschieben zur Umgehung eines Originalfehlers, keine Gateauswahl-/Timeoutlockerung. Kleine eigene CI-Taskkarte und Negativkontrolle vor technischer Umsetzung, nicht gleichzeitig mit UI-/Finanzpatch oder CI-C.

Für technische Änderung 2–3 vergleichbare vollständige reguläre Läufe mit unverändertem fachlichem Testmanifest dokumentieren: kritischer Pfad/Wandzeit, summierte Jobzeiten, Zeit bis erstem verwertbarem Fehler, Artefaktarbeit, tatsächliche Regressionen und Pflicht-PASS. Bestehende passende Läufe und reguläre PR-/Mainläufe bevorzugen; keine identischen Läufe nur für Statistik oder schöne Zahlen. Echte Verringerung erst nach Messung behaupten. CI-B ist kein neues 1.0-Pflichtprojekt; nur bei belastbarem Nutzen konfliktfrei vorziehen.

### CI-C – erst danach separat bewerten, noch PLANNED

Live-Chromium und Live-Firefox/WebKit nur nach gesonderter Risiko-/Nutzenprüfung in isolierten Profilen/Seeds und eindeutigen Artefaktpfaden parallelisieren. **Ein zwingender abschließender Gesamt-PASS** muss sämtliche Browser, Release-SHA/SW, gewöhnliches TLS, Pages/Gitblobs/Assetbytes sowie sämtliche Finanz-/Speicher-/Backup-/Offline-/A11y-Gates binden. Kein Teil-PASS ersetzt Freigabe; keine konkurrierenden produktiven Portfoliomutationen.2–3 vergleichbare vollständige echte Releasebelege erforderlich. Kann aufsummierte Runnerzeit erhöhen; noch keine Workflowänderung und keine garantierte Ersparnis. Reihenfolge CI-A→CI-B→CI-C erhalten, nicht zur zusätzlichen 1.0-Pflicht ausweiten.

### Aufwand und kurzer v299-Postmortem

**Getrennte Größen:** GitHub-Job-/Wandzeiten oben sind gemessen; abrechenbare Runner-Einheiten nicht erhoben. ChatGPT-Work-Verbrauch und Copilot-Credits sind ohne echte Nutzungsdaten **UNKNOWN**; keine Euro-/Credit-/Prozenteinsparung behauptet, keine Zusatzpakete/Resets/Käufe. Artefaktgröße/-zahl und Qualifikationsarbeit sind konkrete Arbeit, aber keine Work-Creditabrechnung. Bestehende Archive/Hash-/JSON-/Bildprüfungen bei identischer Aussage wiederverwenden, keine zweite Datenbank.

v299 benötigte fünf vollständige Integrationskandidaten auf **verschiedenen** Heads:42502695638 scheiterte am unverträglichen alten automatischen Snapshot-Test; korrekt durch unabhängige manuelle Beobachtung und stärkere Erhaltungsassertion ersetzt.42505404269,42508122473,42511302432 waren SUCCESS, aber vor Merge durch tatsächlich reproduzierte offene manuelle/quellabgelöste Restore-, leere UNKNOWN-Referenz-/CAS- und unpassende eigene Cashrollen-Grenzen überholt. Finale42514005224 und Main42516298459 vollständig SUCCESS, jeweils Versuch 1. Alte Läufe regulär beendet, keine identischen Duplikate/Abbrüche oder gelockerten Schutzprüfungen. Alle Originalfehler/Revisionen und vollständigen Qualifikationsbelege privat erhalten. Prozessfolgerung: diese konkreten Aufrufer-/Provenienz-/Kontorollengrenzen künftig **vor Freeze** im lokalen vollständigen Vertrag abdecken; daraus keinen neuen pauschalen Gesamtaudit ableiten.

### Statuspflege und HND01

Nach sicherem Punkt nur kompakt: letzter LIVE_ACCEPTED, alleiniger Owner, aktueller Kandidat/CI, erledigte und verbleibende 1.0-Teilpakete, konkrete externe Voraussetzung, nächste Aktion und verifizierte private Sicherung. Kanonische Matrix hier verlinken, nicht mehrfach kopieren. Vorhandene Originale/Oracles und alle NACH_1.0-Aufträge erhalten. Spätestens zwei akzeptierte Releases oder drei fachliche Produktpakete je Work-Chat bzw. früher bei Kontextlast reguläre HND01-Abgabe vollständig sichern; reine Dokumentation zählt nicht als Produktpaket. Keine neue Übernahme durch diese Integration. Laufende CI nicht zur Rotation abbrechen. Ausführliche HND01-Regeln unten bleiben unverändert.

---


Nutzerauftrag vom 01.11.2026. Ergänzt CI-OPT01 #229 und den gesamten bestehenden Masterauftrag. **Prozessregeln ab sofort verbindlich; technische Pipelineänderungen erst nach eigenem belegtem Test.** Kein neuer Produktbranch, keine Entwicklungsübernahme, kein Abbruch laufender Actions. Der aktive Work-Owner bleibt verantwortlich.

## 1. Ziel, Geltung und Priorität

Mehr tatsächlich nutzbare, sicher veröffentlichte Funktionen je verfügbarem Work-Kontingent. Nicht die Zahl der Commits, Testaufrufe oder Statusmeldungen maximieren. Weder Produktumfang noch Finanz-/Datensicherheitsqualität zur Einsparung still reduzieren.

**Historischer Prioritätssnapshot vom01.11.2026, durch den EFF02-/1.0-Kopf oben fortgeschrieben:** laufenden Marktquellen-Korrekturrelease sicher abschließen; #266 einschließlich Alt-API-/Schlüsselbereinigung; anschließend gemeinsamer CSV-/Blockchain-Import UH01–UH05 nach `IMPORT_HISTORY_UNIFIED_PLAN_2026-11-01.md`. #257 und #149 einschließlich Long-Press, tatsächlich verfügbarer Chartzeiträume und CSV-Werkzeugen im kompakten Mehr-Menü bleiben aktiv. Keine neue mehrtägige CI-Optimierung vor diesen Nutzerfunktionen.

Dieses Dokument ist der verbindliche Ergänzungsplan, nicht eine neue Roadmap. Im nächsten regulären Owner-Checkpoint jeweils nur einen Link hierher und die konkrete nächste Aktion aufnehmen. Aktuelle Release-/Owner-Daten nicht durch historische Werte ersetzen; den historischen Checkpointbranch niemals vollständig nach main mergen.

## 2. Modell-, Reasoning- und Budgetregeln

**Standardpräferenz des Nutzers: GPT-6.1 Sol, Standardgeschwindigkeit, normalerweise mittlerer Reasoning-Aufwand**, sofern in der tatsächlichen Work-Umgebung auswählbar. Für klar mechanische, risikoarme Doku-/Text-/CSS-Korrekturen niedrigen Aufwand erwägen. Kein pauschales Maximum-Reasoning, Fast oder Ultrafast.

Höheren Aufwand bzw. ein leistungsfähigeres Modell gezielt für neue wirtschaftliche Invarianten, komplexen Quellenabgleich, Migration/Restore/Kryptografie, schwierige Nebenläufigkeit oder eine gezielte unabhängige Prüfung dieser Änderungen einsetzen. Nicht jedes Paket mehrfach durch verschiedene Modelle analysieren. Nach höchstens zwei erfolglosen gezielten Reparaturversuchen zunächst Repro, fehlende Daten/Zugriffe und alternative Ursache prüfen; ein größeres Modell ersetzt keine fehlenden Belege.

**Ein Prompt schaltet das Modell nicht technisch um.** Nur eine tatsächlich vorhandene Einstellmöglichkeit verwenden; sonst Nutzerpräferenz dokumentieren, keine automatische Umschaltung behaupten und nicht wegen einer optionalen Modellwahl die sichere Routinearbeit blockieren. Eine sinnvolle Eskalation auf einen anderen Work-Chat verlangt gesicherte Übergabe und alleinigen Owner, keinen parallelen Schreibzugriff.

Keine zusätzlichen Credits, kostenpflichtigen Resets, Abonnements, Tarif-Upgrades oder API-Ausgaben ohne neue ausdrückliche Freigabe. Bereits vorhandene Budgets nur im Rahmen bestehender Freigaben verwenden. Tatsächliche Restnutzung/Resetzeiten nur nennen, wenn zugänglich; aus API-Preisen keine feste Pro-Kontingent-Ersparnis ableiten. Bei fehlendem Kontingent soweit möglich WIP und nächsten Schritt sichern, nicht Tests überspringen. Dieser Plan ändert keine Abrechnungseinstellung und verhindert technisch keinen etwaigen automatischen Guthabenverbrauch.

## 3. Kleiner vertikaler Schnitt statt Mikropatches oder Großumbau

Vor Beginn eines Pakets höchstens eine kurze Taskkarte erstellen: Nutzerziel, Nicht-Ziele, betroffene Dateien/Verträge, Risikostufe, 3–5 Abnahmekriterien, nächster sicherer Releasepunkt. Bestehende Issue-/Originalanalysen verlinken statt kopieren.

Ein Paket soll einen nutzbaren Ablauf abschließen: Eingabe → Prüfung → sichere Übernahme → Reload/Wiederimport, soweit dies sein Fachumfang ist. Ein weiterer dauerhaft gesperrter Preview-Parser erfüllt den Importauftrag nicht.

Zwei bis drei eng zusammengehörige, risikoarme UI-/Textkorrekturen derselben Ansicht dürfen zu einem klar begrenzten gemeinsamen Kandidaten gebündelt werden, sofern gleiche Testbasis, übersichtlicher Diff und eindeutige Rücknahmegrenze bestehen. Nicht für jede Beschriftung ein eigener Vollrelease. **Keine Bündelung unabhängiger Finanz-, Schema-, Credential-, Restore- oder Kryptoumstellungen nur zur CI-Ersparnis.** Bereits erteilte risikobasierte Merge-/Deploymentfreigabe nutzen; echte neue Risikogrenzen weiterhin gesondert behandeln.

Ein aktiver Produkt-/Integrationsstrang. Unabhängige Leseabfragen dürfen gebündelt werden. Bereits vorhandene isolierte CI-Shards sind zulässig, aber keine zusätzlichen parallelen schreibenden Agenten.

## 4. Drei Prüfphasen, bestehende CI-Verträge erhalten

| Phase | Verbindliches Verhalten |
| --- | --- |
| Entwicklung | Lokal die kleinsten aussagekräftigen Repros und direkt betroffenen Tests zuerst; danach bestehende schnelle Unit-/Syntaxprüfungen. Im aktuellen Workflow bereits erlaubtes FAST nur für dessen tatsächlich zugelassene Draft-Deltas verwenden. |
| Integrationskandidat | Paket fertigstellen und Diff einfrieren; exakten Kandidaten gegen die unverändert erforderlichen Integrations-/Crossbrowser-/Sicherheitsgates prüfen. Unbekannter oder kritischer Impact erzwingt den vollständigen Pfad. |
| Release | Bereits verpflichtende Main-, Deployment- und tatsächliche Produktionsprüfungen erhalten. Veröffentlichte Asset-/Versionsidentität und veränderten Nutzerablauf prüfen. Erst belegten Erfolg LIVE_ACCEPTED nennen. |

Keine pauschale Freigabe, finale Browser, Finanz-, Import-, IDB-/CAS-/Mehrtab-, Offline-/SW-, Backup-/Restore-, Sicherheits- oder relevante Accessibility-Gates zu streichen. Anfassen gemeinsamer App-Router, Model-, DOM-/Form-/Speicherverträge ist nicht automatisch risikoarme Optik. FAST ist niemals ein Releasebeleg.

Vor der ersten teuren Kandidaten-CI: Syntax/Units, geänderte ausgelieferte Assets und notwendiger SW-Cachebump, gerichteter Repro, 320px-Layout bei UI-Änderungen, Fokus/Selectorscoping, relevante Daten- und Secret-Nichtmutation prüfen. Bekannte triviale Selektor-, Versions- oder Formatfehler nicht erst von einer langen CI-Schleife finden lassen.

### Nachweise sinnvoll wiederverwenden

Bereits gelesene Logs, Artefakte und Originalanalysen für denselben Zustand referenzieren, nicht neu erzeugen oder wiederholt vollständig lesen. Für jeden Beleg mindestens Commit/Tree, Testumfang, Umgebung/Browser-/Abhängigkeitsversion und Ergebnis erhalten.

Ein alter PASS gilt nicht automatisch für neuen Code. Wiederverwendung nur bei identischem relevantem Code/Tests/Build/Abhängigkeiten/Konfiguration und belegter fehlender transitiver Auswirkung; unbekannter Impact bedeutet neu testen. Geänderte Parser, Schema, Quellen- oder Identitätsregeln invalidieren betroffene alte Originalabnahmen. Finale in der Pipeline vorgeschriebene Läufe werden nicht allein per Dokumentation übersprungen. Produktions-/Liveanbieterbelege sind zeitabhängig und werden nicht aus lokalen Mocks oder einem alten Release abgeleitet.

Bei grünem, eingefrorenem Kandidaten nicht zusätzlich dieselbe volle lokale Suite aus Gewohnheit starten. Gezielte unabhängige fachliche Sollwerte und nötige visuelle Kontrolle bleiben erhalten.

## 5. CI-Aufrufe, Polling und Fehlerbehandlung

**Konkret geprüfter Workflowbefund:** `.github/workflows/import.yml` hat PR-/Main-bezogene Concurrency mit `cancel-in-progress: true`. Ein neuer Push in dieselbe Gruppe kann laufende Arbeit automatisch abbrechen. Deshalb finale CI starten, Kandidat einfrieren und bis zum Ende nicht mit bloßen Status-/Doku-/Formatänderungen erneut pushen. Notwendige Produktkorrektur zunächst lokal bzw. rekonstruierbar sichern; aktuellen Lauf nicht eigenmächtig abbrechen. Reine Plan-Nachträge getrennt auf dem bestehenden Dokumentationsbranch sichern.

Kein Sekunden-Polling und keine wiederholten Vollreads unveränderter GitHub-Daten. Wenn ein Warte-/Ereignismechanismus verfügbar ist, diesen nutzen; andernfalls wenige Statusabfragen mit zunehmendem Abstand. Nicht allein für einen kleinen UI-Nachtrag gesamten Checkpoint, Roadmap und sämtliche Issues erneut lesen. Keine Hintergrundarbeit oder spätere Benachrichtigung behaupten, wenn kein entsprechender Mechanismus läuft.

Fehler zuerst klassifizieren: Produktfehler, nichtdeterministischer Test, Infrastruktur oder Anbieter/Quota. Originalfehler behalten. Höchstens ein gezielter Retry eines nachweislich transient fehlgeschlagenen Jobs auf unverändertem Kandidaten; kein blindes Neuwerfen der ganzen Pipeline. Wiederholter Fehler verlangt Ursachenbehebung. Finanz-/IDB-/Identitätsassertionen nicht durch Retries, längere Fristen, Skip oder blinde Snapshotänderung grün machen.

Bei technisch unabhängiger, rein lesender Originaldateianalyse während CI darf Vorarbeit erfolgen; keine zweite produktive Implementierung oder konkurrierende Integration.

## 6. Reale Daten früher prüfen, externe Kontingente schonen

Vor umfangreicher Anbieter-/Parserintegration einen kleinen autorisierten Original-/Livebeleg bis zum fachlich erwarteten Ergebnis prüfen. Nicht erst nach Deployment erkennen, dass reale Spaltenvarianten, Nullkurse oder Tarifgrenzen den Normalfall verhindern. HTTP200, passende Zeilenzahl und korrekte Metadaten sind noch keine vollständige Wertvalidierung.

Bestehende private Originaldateien und Analysebelege zuerst wiederverwenden. Fehlende konkrete Belege nur nach gezielter Suche privat anfordern. Öffentliche Fixtures synthetisch; keine Originalbestände, Walletkennungen, Schlüssel oder Passwörter veröffentlichen.

Liveanbieteranfragen sparsam: vorhandene redigierte Belege und lokal isolierte Antworten für unveränderte Semantik nutzen, Quoten über Sitzungswechsel hinweg dokumentieren, keine identischen Vier-ETF-Livetests nach jedem CSS-Schritt. Echte finale Anbieter-/Produktionsprobe weiterhin durchführen, wenn sich der relevante Pfad geändert hat. Momentane Kurse und vollständige Historie getrennt abnehmen; Lücken nicht mit Null oder erfundenen Werten schließen.

Finanz-Sollwerte unabhängig berechnen; nicht dieselbe Produktionsfunktion als einzigen Test-Oracle verwenden. Importreihenfolge, Dubletten, Transfers, Gebühren und Restore müssen unabhängig nachweisbar bleiben.

## 7. Kurzer Einstieg, kompakte Statusführung, saubere Übergabe

Pro Wiederaufnahme zuerst nur aktuellen Checkpointkopf, aktive PR/HEAD/Actions und betroffene Issue-Nachträge lesen. Weitere Dateien gezielt nach Diff und Abhängigkeiten. Gesamtaudit nur bei widersprüchlicher Basis, relevanter neuer Architektur oder konkretem Sicherheitsbefund, nicht als Routine.

Checkpointziel: ein kurzer aktueller Kopf mit Owner, Main, letztem wirklich akzeptiertem Release, aktivem Kandidaten/Run, Blocker und nächster ausführbarer Aktion. Umfangreiche Belege verlinken. Keine identischen langen Releaseprotokolle in Checkpoint, Roadmap, Priorisierung und mehreren Issues vervielfachen.

Historische Belege dürfen bei einem späteren sicheren Dokumentationsschnitt in ein verlinktes Archiv wandern; nichts löschen, Quellenlinks erhalten, keine große Archivierungsaktion während aktiver Fremdschreibvorgänge. Erst kürzer schreiben, nicht erst eine neue Dokumentationsplattform bauen.

Bei zunehmender Kontextlast am nächsten sicheren Meilenstein übergeben, nicht bis zum nicht mehr reagierenden Chat warten. WIP/Commit/Tests/Blocker/Owner/Nächster-Schritt und private Zugangslocator getrennt sichern. Neuer Chat erhält Links und Delta, keine vollständige historische Projektchronik. Vorherigen Owner stoppen; fehlende Chatantwort allein beweist keinen Stillstand. Chatwechsel ist kein Kontingentreset.

## 8. Technische Beschleuniger nur mit Beleg und kurzer Amortisation

Bestehende versionierte Browser-Caches und drei Crossbrowser-Shards zuerst nutzen, nicht erneut implementieren. Die aktuellen Grundregeln und Cacheeinträge wurden in `.github/workflows/import.yml` gelesen.

Weitere Pipelineänderungen sind ein begrenzter CI-OPT01-Kandidat, nicht Voraussetzung für Nutzerfunktionen: reproduzierbare Toolinstallation, korrekt schlüsselnde Caches, kompakte maschinenlesbare Ergebniszusammenfassung; Chromium-Sharding oder breitere Testselektion erst bei gemessenem Engpass. Cache-Key muss Laufzeit/OS/Architektur/Browser-/Dependency-Versionen abbilden; nie Secrets oder private Portfolios cachen.

Vorher/Nachher mit identischem Testmanifest und relevanter Negativkontrolle. Unbekannte/geänderte Workflows, Finanz-/Storage-/Backup-/Auth-/Provider-/PWA-Dateien dürfen nicht durch Dateinamensheuristik in FAST rutschen. Schutzregeln nicht für einen grünen Lauf umgehen. Änderungen an Gateauswahl oder Caching separat prüfen, nicht im laufenden Markt-/Importfix verstecken.

Optimierung stoppen oder zurückstellen, wenn sie voraussichtlich mehr Arbeit bindet als sie in den nächsten wenigen Paketen spart. Keine neue Testinfrastruktur ohne konkreten Nutzen.

## 9. Minimale Erfolgskontrolle und sofortiger nächster Schritt

Für die nächsten drei vergleichbaren abgeschlossenen Pakete bestehende CI-Zeiten und Anzahl vollständiger Läufe/gezielter Retries auswerten; dazu erforderliche Wiederholungsanalysen und Rückläufer festhalten. Eine kurze Zeile je Paket genügt. GitHub-Runner-Minuten und Work-Kontingent getrennt behandeln; tatsächlichen Credit-/Tokenverbrauch nur bei vorhandenen Nutzungsdaten. Keine garantierte Prozentersparnis oder feste Restlaufzeit versprechen.

Der aktive Work-Owner übernimmt diese Regeln am nächsten sicheren Checkpoint ohne weitere allgemeine Freigabeschleife. Nur Link und veränderten nächsten Schritt in `WORK_RESTPAKETE_CHECKPOINT.md`, `KONSOLIDIERTE_ROADMAP.md` und `MASTER_PRIORITAETEN_RESTAUDIT_2026-10-30.md` ergänzen. Die derzeitige Release-/Korrekturarbeit bleibt unangetastet. Bestehende Veröffentlichungserlaubnis sicher nutzen, fertige Pakete nicht in wiederholten Audits liegen lassen.

**Sofort anwendbar:** kürzere Kontexte, gezielte Reads, sinnvolle Paketgröße, lokale Vorprüfung, Kandidatenstopp, einmalige Belegauswertung, selektive Eskalation und keine Zusatzkäufe. **Noch nicht implementiert:** etwaige neue CI-Auswahl-/Sharding-/Archivierungsmechanismen. **Nicht geändert:** Produktcode, Secrets, Originaldaten, laufende Jobs, Modellwahl des privaten Work-Chats oder Abrechnungseinstellungen.

## Quellen und geprüfte Grundlage

Projekt: CI-OPT01 #229, aktueller Mastercheckpoint und `.github/workflows/import.yml` (gelesener Blob `ebdbc96fbc071c496ef6ba6872db244b6e893c88`). Neuere Produkt-/Ownerzustände stets frisch prüfen, keine Versionswerte dieses Plans als aktuellen Produktionsstatus übernehmen.

Offizielle OpenAI-Dokumentation, geprüft 01.11.2026:
- https://openai.com/index/introducing-gpt-6-1-sol/ — Modellverfügbarkeit und Positionierung; API-Preisvergleich ist keine Garantie einer proportionalen Abo-Ersparnis.
- https://help.openai.com/en/articles/20001516-managing-usage-with-gpt-6-astra-in-work-and-codex — Verbrauch hängt von Modell, Kontext, Reasoning, Geschwindigkeit und Aufgabe ab; tatsächliche Modellauswahl über verfügbare Einstellungen.
- https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan — verfügbare Nutzung und Kontingentanzeige; keine feste Zahl von Aufgaben aus einer Roadmap ableiten.


## 10. HND01 – verbindliche Work-Sitzungsrotation

**Nutzerentscheidung vom 01.11.2026:** Um wiederholt nicht mehr reagierenden überlangen Work-Chats vorzubeugen, wird die sichere, gitbasierte **Chat-Rotation als organisatorischer Standard** eingeführt. Sie darf laufende Releases und sicherheitskritische Arbeit weder unterbrechen noch einen konkurrierenden Integrationsstrang erzeugen. Sie ist eine Ablaufregel, **keine Behauptung einer technischen automatischen Chat-Neuerstellung oder eines Kontingentresets**.

### Auslöser und Zeitpunkt

- **Spätestens nach zwei tatsächlich LIVE_ACCEPTED Releases oder drei fachlich abgeschlossenen Arbeitspaketen pro Work-Chat – je nachdem, was zuerst eintritt – eine Übergabe vorbereiten.** Release- und Paketzähler gelten ab Übernahme durch den jeweiligen Work-Chat, nicht ab Projektbeginn. Eine reine Dokumentationsänderung zählt nicht als fertiges Produktpaket.
- **Früher**, wenn der Kontext zunehmend unübersichtlich wird, viele wiederholte Tool-/Logausgaben entstehen, Antworten instabil werden oder der Nutzer eine Übergabe verlangt.
- **Nur am sicheren Integrationspunkt beenden:** erst laufende CI-/Deployment-/Live-Prüfungen abgleichen und ihren Status wahrheitsgemäß dokumentieren; keine GitHub Action zur Rotation abbrechen, keine ungeprüfte PR mergen, keine laufende Mutation einfach vergessen. Wenn CI noch läuft, ist eine kontrollierte Übergabe mit ausdrücklich *IN_PROGRESS* dokumentiertem Lauf zulässig; der Nachfolger wartet/sichtet die bestehende CI statt sie zu duplizieren.

### Minimaler, nachvollziehbarer Abschluss

1. Frisch GitHub-Main/Tree, offene PRs/Branches, Actions und aktuellem Checkpointkopf abgleichen. Bereits dokumentierte Nachweise nicht erneut vollständig lesen.
2. Ein einzelner kompakter **HANDOVER_READY**-Block am **Anfang des zentralen Checkpoints** (bestehender Checkpoint-Branch) enthält: Zeitpunkt, abgebenden Owner/Sitzung sofern bekannt, Main-SHA/letzte wirklich abgenommene Version, aktive Branch-/PR-/HEAD-IDs, CI-/Release-/Livejob mit präzisem Status, nicht remote gesicherte lokale Änderungen mit reproduzierbarem Patch oder ausdrücklich „keine“, tatsächliche Blocker, priorisierter nächster Schritt und alleinige Schreibverantwortung. Neuere fremde Einträge mittels SHA-/Versionsabgleich nie überschreiben; den historischen Checkpointbranch niemals komplett nach Main mergen.
3. Zusätzlich einen **kurzen, vollständig kopierbaren Startprompt für einen frischen Work-Chat** bereitstellen, **ohne private Daten**. Prompt nur auf Repo, Checkpoint, aktuelle relevante Issue-/PR-Links, Übernahmesicherheit und nächste Aufgabe stützen. Keine alten Masterprompts oder gesamte Roadmap erneut hinein kopieren. Diesen Prompt möglichst auch dauerhaft im Checkpoint-Handover-Block oder als dort verlinkte kleine Datei sichern, damit er bei einem hängenden Chat rekonstruierbar bleibt.
4. Am Abschluss den Nutzer ausdrücklich informieren: **„Übergabe bereit – neuen Work-Chat mit diesem Prompt öffnen“**. Nach bestätigter Abgabe keine neuen Implementierungen/PRs/Merges/Deployments mehr starten. Laufende GitHub Actions unverändert lassen.
5. Neuer Chat prüft vor seinem ersten Schreibvorgang aktuellen Main/PR/CI/Checkpoint und mögliche aktive alte Owner. GitHub-Status allein beweist nie, dass eine vorherige Chat-Sitzung beendet ist. Bei nachgewiesener Kollision keine parallele Umsetzung; gegebenenfalls erst STOP/Abgabe aus dem alten Chat oder einen eindeutigen kollisionsfreien Stand herstellen.

### Notfall, falls der alte Chat nicht mehr antwortet

Der Nutzer kann **jederzeit** manuell einen frischen Work-Chat mit einem kurzen GitHub-Übernahmeprompt starten. Der neue Chat nimmt eine **read-only Übernahmeprüfung** vor, sichert/dokumentiert vorhandene WIP-Zustände ohne fremde Branches zu überschreiben, lässt CI unverändert auslaufen und führt erst bei belegter Kollisionsfreiheit Produktänderungen aus. **Nicht** auf eine Antwort des hängenden Chats oder auf einen künstlichen Zeitablauf als Beweis für Stillstand vertrauen.

### Technische und Produktgrenzen

- **ChatGPT Work kann nicht durch ein GitHub-Dokument oder GitHub Action automatisch einen neuen Chat öffnen.** Die eigentliche neue Chat-Erstellung ist ein expliziter Nutzerschritt. Kein automatisches Senden von Zugangsdaten zwischen Chats; erforderliche Secrets nur über den privaten neuen Chat bzw. autorisierte sichere Verbindungen.
- Keine zusätzlichen GitHub-Actions/PRs nur für die Rotation, kein neuer Bot/Workflow, kein Hintergrund-Watcher ohne eigenständigen Nutzwertbeleg. Nutze bestehenden Checkpoint und bestehende Issues. Keine wiederholten Gesamtprojekt-Audits beim Wiedereinstieg.
- Modell-, Kosten- und Kontextgrenzen nicht spekulativ behaupten. Eine Rotation reduziert typischerweise die Chatkomplexität, garantiert aber weder Schutz vor Plattformproblemen noch eine konkrete Kontingentersparnis.
- Erfolgskriterium: Ein neuer Work-Chat kann **ohne erneute Projektanalyse** anhand des aktuellen GitHub-Checkpoints den richtigen einzelnen Integrationsstrang weiterführen; kein WIP-Verlust, kein doppelter Release, keine abgebrochene CI und kein Verlust privater Zugangsdaten.

**Operative Standard-Startformel für den Nutzer:** „Übernimm FolioLab Open anhand von `docs/WORK_RESTPAKETE_CHECKPOINT.md` auf `feature/flh05-import-foundation`. Aktuellen Main, offene PRs, CI und aktiven Owner vor jeder Mutation abgleichen. Letzten HANDOVER_READY-Block lesen und den dort genannten nächsten Arbeitsschritt seriell ausführen. Laufende CI nicht abbrechen; keine parallele Implementierung. EFF01/HND01-Regeln anwenden, bei erfolgreicher Abnahme veröffentlichen und neu checkpointen.“


