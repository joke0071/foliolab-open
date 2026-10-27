# FLH05 — verbindliche konsolidierte Spezifikation

Version1.0,27.10.2026. Besitzer: Issue174, gemeinsamer fachlicher Bezug FLH03/#148/#159/#165. Diese Spezifikation konsolidiert den Masterauftrag abv188, alle FLH05-Ergänzungen und den gehärteten Auftrag. Frühere FLH05-Einzelgliederungen sind durch die Zuordnung unten ersetzt; fachliche Anforderungen, Negativ-Leitplanken und sämtliche zwölf Testvektoren bleiben verbindlich. Zentraler Gesamtcheckpoint: [WORK_RESTPAKETE_CHECKPOINT.md](../WORK_RESTPAKETE_CHECKPOINT.md). Keine parallele Roadmap/Engine.

## Verbindliche Ausführungsreihenfolge

Aktuelle Nutzerkorrektur: Die Konsolidierung darf abgeschlossen werden; **FLH05-A danach noch nicht beginnen oder als abgeschlossen melden.** Zuerst alle bestehenden Master-/FLH03-/FLH04-/UI-/Reliability-/Wallet-/Backup-/CI-Vorgängerpakete gegen aktuelle Nachweise prüfen und sämtliche ohne externe Blocker ausführbaren Anteile sequenziell abschließen. Externe Belege, Hardware, OAuth-/Operatornachweise und konkrete Releaseentscheidungen separat offen führen. Erst danach A–E ausführen. Bereits gesammelte Recherche bleibt ein unveröffentlichter Zwischenstand, keine vorgezogene Phasenabnahme.

## Ziel, Scope und Wiederverwendung

Eine zuverlässige lokale Importpipeline mit bekannten versionierten Anbieterprofilen und einem verständlichen Mapping für unbekannte geeignete CSVs. Bestehendes Vanilla-JS-Design, FLH03-/Journal-/Asset-/Reconciliation-/CAS-/Backup-/Undo-Verträge erhalten. Keine Pflichtcloud, Worker-Server, externes Backend oder KI. Optionale lokale WebWorkers sind nur ein gemessener Performancebaustein, keine Cloud- oder geschlossene-PWA-Garantie.

IN SCOPE: CSV-Dialekt/Anbietererkennung, sichere Normalisierung, deterministische Identität, Idempotenz/Reihenfolge, Quellenabgleich, Asset-Zuordnung, historische Datenabdeckung, Parser-/Mappingversionen und kontrollierte Neuverarbeitung, Simulation und Regressionen. Community-JSON ist ein begrenztes Vorlagenformat, keine neue Plattform.

OUT OF SCOPE: vollständige Steuer-/Tax-Lot-/Corporate-Action-Engine, neue Kursanbieter oder Blockchain-Scanner, automatische Token-Migrationshistorie, Communityplattform, PDF-Parserimplementierung, allgemeines Redesign und neues Finanzjournal. Notwendige Fachverträge hierfür werden als begrenzte Abhängigkeit dokumentiert und bleiben ohne Beleg gesperrt. Technische Klassifizierung ist keine steuerliche Behandlung.

Vor jeder Implementierung aktuellen main/HEAD/offene PRs/CI/Checkpoints prüfen; tatsächliche Dateien, öffentliche Funktionen, Modelle, Fixtures und bestehende erfolgreiche Nachweise erfassen. Bereits erledigte Funktionen überspringen. Keine Dateien/Schnittstellen aufgrund bloßer Vermutungen annehmen. Inkompatibilitäten zuerst dokumentieren und die kleinste kompatible Lösung wählen. Bestandsaufnahme: [TECHNICAL_BASELINE.md](TECHNICAL_BASELINE.md).

## Fünf Phasen und alte Nummern

| Phase | Verbindlicher Inhalt | Zuordnung bisheriger Nummern | Gate zum nächsten Schritt |
| --- | --- | --- | --- |
| **A Recherche/Architektur** | tatsächlicher Bestand, Primärquellen/OSS/Fixtures/Versionen/Lizenzen/Browser-Eignung, Format-/Quellen-/Kompatibilitätsmatrix, Gap, Datenverträge und Reihenfolgeentscheidung | FLH05-00, Architekturanteile01/03/07, gehärtet1–4/15 | Für jeden A-Anbieter konkrete Regeln ODER nachvollziehbare Recherchelücke; tatsächliche Schnittstellen und Wiederverwendung, eindeutige Identitäts-/Semantikgrenzen, Phasen-/Testzuordnung dokumentiert. Keine neue Parserimplementierung vor diesem Gate. |
| **B Parser/Mapping** | robuste Offlineeingabe, Dialekt/Encoding/Header, deklarative Profile/DE-EN-Heuristik, manueller Assistent, sichere lokale Mappingvorlagen und JSON-Schema/-Import/-Export |01/02, syntaktische Teile03, begrenztes07 | Rohwerte unverändert; Mehrdeutigkeit explizit; Anbieter nicht anhand Filename allein; versionierte/validierte Profile; bestehende Parser gleichwertig erhalten; keine finanziellen Writes aus Erkennung. |
| **C Transaktionen/Reconciliation** | exakte fachliche Normalisierung, vier Identitäten, Asset-/Zeit-/Fee-/Tax-Verträge, PartialFills/Mehrbeine, Quellenklassen, inkrementelle Reihenfolge, unvollständige Historien, Parser-Neuverarbeitungs-Diff |03/04/05, gehärtet4–10 | Kanonische fachliche Ergebnisse der Reihenfolgen stimmen überein; keine Rohdatenlöschung/unerlaubte Korrektur; Eindeutigkeit belegt oder NEEDS_REVIEW. Bestehende Journalengine entscheidet über Zulässigkeit. |
| **D Simulation/Sicherheit/Performance** | P0-Vorschau, ausdrückliche Bestätigung, atomare Übernahme/Protokoll/Undo, Versionierungs-/Abbruch-/Storage-/Backup-/Security-/Browser-/A11y-Gates,10k/50k/100k-Messungen |06/08/09, semantischer07-Abschluss, gehärtet11–14 | Alle anwendbaren zwölf Finanzvektoren und metamorphe/Regressions-/Releasegates bestanden; keine Tests abgeschwächt. Kritischer Scope nur nach eigener konkreter Produktionsentscheidung. |
| **E Originalvalidierung/Abnahme** | präzise Exportanforderung, private lokale Validierung, unabhängige Anfang-/End-/Cash-/Bestands-/Historienreferenzen, versionsbezogene Kompatibilitätsmatrix, Release-/Live-Nachweis und verbleibende Gates |10, ursprüngliche Originalabnahme, gehärtet16 | Keine vollständige Format-/Bestandsvalidierung ohne tatsächliche Originale/Abgleiche behaupten. Fehlende Originale als konkrete externe Gates; sichere Vorarbeit/B–D darf fortgesetzt werden. |

Die Phasen sind sequenziell, Inkremente klein und überprüfbar. Testplanung begleitet A–C; die Finanztests werden früh mit dem betroffenen Inkrement ausgeführt, nicht bisD aufgeschoben. E-Vorbereitung/Dateianforderung darf inA entstehen, tatsächliche E-Abnahme ersetzt B–D nicht. Zwischen bestandener Recherche und sicherer Implementierung keine unnötige Wartefreigabe.

## A — Recherche und Formatbibliothek

PrioritätA vollständig recherchieren: flatex Österreich, Bittr, Ledger Live, Kraken, Bitpanda, Trade Republic. PrioritätB: Binance, Coinbase, Bitstamp, Crypto.com, Scalable Capital, Revolut, DEGIRO, ING, DADAT. Weitere Anbieter nur nach dokumentiertem Nutzwert/Datenqualität/Aufwand.

Pflichtprojekte: Poveroh/transaction-parser; buchen/portfolio (kanonischer heutiger Pfad portfolio-performance/portfolio); ghostfolio/ghostfolio; alan-turing-institute/CleverCSV; rotki/rotki; mholt/PapaParse. Zusätzlich Actual Budget, beangulp/Beancount-, Ledger-/hledger-Importer, flatex-/Kraken-/Bitpanda-/Ledger-Importer und weitere belegte Quellen.

Tatsächliche Parserdateien, Anbieter-/Feldzuordnungen, Transaktionscodes, Gebührenlogik, Tests/öffentliche Fixtures, bekannte Fehler/Formatänderungen, Aktualitätsanker/Commit, Lizenz und Browserkompatibilität lesen. README/Projektliste genügt nicht. Keine angebliche Unterstützung übernehmen und PDF-Extraktoren nicht als CSV-Parser ausgeben. Öffentliche Beispiele analysieren, keine fremden tatsächlichen Finanzzeilen auf GitHub kopieren; eigene synthetische Fälle erstellen. Keine ungeprüfte/unzulässige Codeübernahme. Mitgenutzte MIT-/Apache-Komponenten benötigen konkrete Nutzen-/Lizenz-/Noticeprüfung; AGPL/GPL/EPL-Code ist nicht pauschal zur Übernahme freigegeben.

Je Format: Exporttyp/Version, Original-Header einschließlich leerer/doppelter Spalten, Separator/Encoding/Headerposition, Zahlen/Datum/Zeit/Zone, Typen/Codes, Asset-/Währung, Gebühren/Steuern/Brutto/Netto, IDs/Gruppierung/zugehörige Dateien, Sonderfälle/Varianten, erwartete Mapping-/Validierungsregeln, genaue URLs/Revisionen/Code-/Fixturepfade und verfügbare Testdaten dokumentieren.

Evidenz getrennt pro Version/Feld/Umfang: **E1 offiziell dokumentiert; E2 OSS rekonstruiert; E3 eigene synthetische Tests; E4 private Originale; E5 vollständiger Bestand-/Historienabgleich.** Exportexistenz ist keine offizielle Spaltenspezifikation; vorhandene fremde Tests sind kein bestandener FolioLab-Test; ein validierter Header ist kein vollständiger wirtschaftlicher Abgleich. Für jeden A-Anbieter gilt Regeln-ODER-begründete-Recherchelücke als Abschlusskriterium fürA, nicht pauschales BLOCKED wegen fehlender Originale.

Vergleich: Erkennung/automatisches Mapping, Normalisierung/Mehrdateien, Reconciliation, strukturierte Fehler, Dubletten, Historie, erweiterbare Profile. FolioLab-Gap vor neuer Funktion bestimmen. Quellen und Formate: catalog.v1.json, sources.v1.json und begleitende nachvollziehbare A-Anbieter-Matrix.

## B — Offlinepipeline und Profile

Verbindliche Pipeline:

Datei → Dialekt → Header → Anbieterprofil/Mapping → Rohbuchung → fachliches Event → Reconciliation → Staging → bestätigter Import.

UTF-8/UTF-8-BOM sowie belegte Legacy-Encodings, Komma/Semikolon/Tab, Quotes/Escaping/Mehrzeilen, Metadaten/Disclaimer/Leerzeilen vor Header, Headerkandidaten/Reihenfolgen/Synonyme/unbekannte Zusatzspalten, deutsche/internationale Zahlen und Zeitvarianten unterstützen. Rohwerte, Originalvorzeichen und Dateibelege bleiben erhalten. Mehrdeutige Quote-/Encoding-/Header-/Zahl-/Datumsinterpretationen nicht still auswählen. Dynamische Typkonversion darf Präzision nicht verlieren. Bestehende Parser erst nach funktionaler Gleichwertigkeit ersetzen oder kompatibel erweitern.

Profile deklarativ/versioniert: Anbieter-ID/Exporttyp/Formatversion/Fingerprint, Pflicht-/optionale Header, DE-/EN-Synonyme/Lokalisierung, Feld-/Transaktionstyp-/Fee-/Tax-/Referenz-/Gruppierungs-/Validierungsregeln. Dateiname allein identifiziert keinen Anbieter. Unbekannte Zusatzspalten behalten und beurteilen; wirtschaftlich relevante unerkannte Felder nicht still ignorieren.

Fallback-Scoring nutzt nachvollziehbare Header/Synonyme, Datentypen/Werte, Spaltenkontext, Konsistenz mehrerer Zeilen, Pflichtkombinationen und Plausibilität. Score ist keine unkalibrierte Wahrscheinlichkeit; Gründe/Mehrdeutigkeiten offenlegen. Ergebnis mindestens exakt/proposal/ambiguous/blocked unterscheiden. Kritische Fälle im visuellen Assistenten zeigen, Spalten und Typcodes manuell zuordnen; keine automatische Übernahme.

Bestätigte Vorlagen lokal in kanonischer IndexedDB-Infrastruktur wiederverwenden, nach Profil-/Fingerprintänderung neu bestätigen. Versioniertes striktes JSON-Schema: keine ausführbaren Ausdrücke, eval/dynamischer Code, unbeschränkte Regex-/Befehlsregeln, Prototype-Pollution oder automatische Communityinstallation. Import/Export eigener Profile, Kompatibilität/Manipulations-/Ressourcenprüfung und Änderungsbestätigung. Geteilte Struktur enthält keine Transaktionswerte, Konten/Adressen/Keys oder persönlichen Dateifingerprints. Eine Communityplattform wird nicht gebaut. Neue Persistenz-/Backuperweiterung ist ein eigenes geprüftes Gate.

## Logische Datenverträge, keine zweite permanente Engine

Die folgenden JSDoc-Formen sind semantische Adapterverträge. InA auf vorhandene FolioLab-Typen/Felder abbilden, kompatible V1-Daten unverändert lassen. Kein neues dauerhaftes Journal-/Transaktionsmodell einführen. Fehlende Architekturleistungen als Lücke ausweisen; zuerst begrenzte Pure-Vorschau/Diff statt umfassender Migration.

```js
/** @typedef {{sourceId:string, providerId:string, exportType:string,
 * sourceFingerprint:string, sourceRecordId:string|null, rowIndex:number,
 * rawValues:Object, parserVersion:string, mappingVersion:string|null}} SourceRecord */
/** @typedef {{transactionId:string, sourceReferences:SourceReference[],
 * eventType:string, assetId:string|null, quantity:string|null,
 * cashAmount:string|null, currency:string|null, timestamp:string|null,
 * timestampPrecision:string, status:'VALID'|'NEEDS_REVIEW'|'INVALID'}} NormalizedTransaction */
/** @typedef {{recognizedRecords:number, validTransactions:number,
 * duplicates:number, needsReview:number, invalidRecords:number,
 * warnings:ImportDiagnostic[], errors:ImportDiagnostic[],
 * proposedChanges:Object[]}} ImportResult */
/** @typedef {{code:string, sourceReference:SourceReference|null,
 * message:string}} ImportDiagnostic */
```

`SourceReference` muss auf Quelle/konkreten Dateifingerprint/Datensatz verweisen, soweit bekannt; ein Dateifehler darf eine null-Quellreferenz haben. `sourceFingerprint` ist SHA256 des tatsächlichen Dateiinhalts, nicht Name oder normalisierte Zeilen. `sourceRecordId` stammt aus dem Export oder ist null. `rowIndex` ist ein dokumentierter stabiler nullbasierter CSV-Datensatzindex innerhalb der unveränderten Datei; bei mehrzeiligen Feldern physische Zeilenspanne zusätzlich anzeigen. Raw Values vor fachlichem Trim/Normalisierung unverändert behalten; Dateifingerprint, Rohzeilenidentität und wirtschaftliche ID nicht verwechseln.

`providerId` in einer übernahmefähigen SourceRecord ist eine belegte/bestätigte vorhandene FolioLab-Anbieterzuordnung, nicht ein aus Dateiname/Ticker erfundener Broker. Solange unbekannt, bleibt der Eingang ein ausdrücklich ungebundener Staging-Entwurf (providerId null/NEEDS_REVIEW), keine fertige übernahmefähige SourceRecord. Herstellerformat-ID und benutzerdefinierte Depotanbieter-ID sind verschiedene Begriffe.

`eventType` ist ein definierter unterstützter Typ oder UNKNOWN. Finanzwerte sind Dezimalstrings/bestehende Exact-Repräsentation; kein Float/NaN/Infinity. Fehlend=null, bekannte Gebühr0=exakt0. Keine implizite FX-Konversion. Originalvorzeichen und normalisierte Richtung separat. Buchungs-/Valuta-/Ausführungszeit unterscheiden. Offset erhalten; ohne belegte Zone keine erfinden. ISO-Datum ohne Uhrzeit bleibt Datum mit Präzision date, kein fingierter UTC-Mitternachtszeitpunkt. Mehrdeutiges Datum/Zone → NEEDS_REVIEW. Abgeleitete Werte benötigen Herkunft, feste dokumentierte Formel/Inputs und Status, keine frei ausführbare Formel.

`recognizedRecords` zählt erkannte Quellrecords, Transaktionszähler wirtschaftliche Events; mehrere Zeilen können ein Event ergeben. Neue/bestehende/unsupported/Asset-unresolved-Zähler in Simulation ergänzen. Stabile Codes und Quellreferenzen sind die Maschinen-API; keine deutsche Fehlermeldung per Regex auswerten. Vorhandene Legacy-Schnittstellen erst kompatibel adaptieren.

## C — Finanzsemantik, Identitäten und Reconciliation

### Vier Identitäten

A Quellzeile (Datei/Record), B Anbietertransaktion (Provider+Konto+belegte Referenzart), C wirtschaftliches Event (ggf.mehrere Belege/Legs), D Importlauf (zeitliche Ausführung). Dateihash ist keine Transaktions-ID. Anbieterreferenzen nur nach belegter Semantik, Order-ID ist nicht automatisch eine einzelne Ausführung. Keine zufälligen UUIDs als Ersatz für deterministische Wiedererkennung. Kanonische Fallback-Fingerprints ausschließlich aus dokumentierten stabilen Merkmalen; identischer Betrag/Zeitpunkt/Asset ist kein hinreichender Beweis. Kollision/fehlende Unterscheidbarkeit → Konflikt/AMBIGUOUS. Parser-/Mappingversionen dokumentieren, aber nicht ungeprüft in wirtschaftliche Identität aufnehmen. Importlauf-ID/Zeit/UI-Ties dürfen abweichen; Endbestände/Cashflows/Fees/Dubletten/historische Wirkungen nicht.

### Asset-/Zeit-/Finanzmodell

Bestehende Registry/Listing-/Mappingfunktionen verwenden. Wertpapier: vorhandene gültige ISIN bevorzugen, WKN/Ticker ergänzend, Börsenplatz/Listing bei instrumentabhängiger Identität beachten. Krypto: Chain/Chain-ID und Tokencontract; Native/Wrapped und gleicheTicker verschiedenerChains getrennt. Fehlende IDs und nicht gesicherte manuelle Assetzuordnungen nicht überschreiben. Keine Tokenmigrationshistorie erfinden. Fallunterscheidung bei Contract-Normalisierung (EVM vs case-sensitives Mint) beachten; keine globale Registrymigration ohne eigenes Gate.

Käufe/Verkäufe, Ein-/Auszahlungen, Dividenden/Zinsen, Gebühren/Steuern, interneTransfers, Swaps, Staking/Rewards/Airdrops/Mining/Gas/Dust/LP/LiquidityMining, Teilverkäufe, Währungsumrechnung und belegte Kapitalmaßnahmen/Barabfindungen nach tatsächlichem gemeinsamen Engine-Vertrag klassifizieren. Ununterstützt/ungeklärt bleibt sichtbar und gesperrt, statt eine neue Steuer-/Tax-Lot-/Corporate-Action-Engine zu bauen.

PartialFills anhand belastbarer Order-/Trade-IDs gruppieren, Ausführungen erhalten, Mengen/Fees aggregieren, VWAP mit Exact-Arithmetik; Gebührenwährungen nicht vermischen. Zeitnähe nur Vorschlag. Separate Fee-/Tax-Zeilen referenzbasiert und originalgetreu zuordnen; bereits imBrutto/Netto enthaltene Fees nicht erneut addieren. Fehlende historische FX/Anschaffungspreise nie aus aktuellem Kurs schätzen. Brutto/Netto/Menge/Wert/Vorzeichen/Assetpräzision prüfen; dokumentierte quellenbezogene Rundungstoleranzen, materiale Differenzen als Konflikt. Ableitung nur aus eindeutig belegten Inputs.

### Quellenklassen

| Klasse | Bedeutung / Wirkung |
| --- | --- |
| EXACT_DUPLICATE | dieselbe belegte Buchung erneut geliefert; Rohbeleg behalten, keine zweite Wirkung |
| SAME_EVENT_COMPLEMENT | ergänzende Belege desselben Events; Herkunft/fehlende Felder ergänzen nur bei Widerspruchsfreiheit und geschützter Bestätigung |
| RELATED_TRANSFER_LEG | unterschiedliche belegte Transferseiten, keine Dublettenlöschung; Fee/Eigentum/Chain/Referenz prüfen |
| DISTINCT_EVENT | selbständiger Vorgang; gleicheBeträge/Zeit nicht verschmelzen |
| AMBIGUOUS | sichere Zuordnung nicht möglich; Vorschau/Prüfung, kein automatischer Merge |

Keine Rohbuchungen zur Dublettenbehandlung löschen. Belastbare Transaktions-/Order-/Blockchainreferenzen samt Namespace vorziehen. Gebührenunterschiede/mehrere Ereignis-Locators berücksichtigen; keine Betrags-/Zeitfenster-Autozuordnung. CSV/API/Wallet/manuell gemeinsam mit vorhandenen Reconciliation-Verträgen abgleichen. Manuelle Änderungen und bestätigte Zuordnungen schützen.

### Inkrementelle Reihenfolge und unvollständige Historie

A→B, B→A, A→A, A→B→A, A→Teilmenge(A), Teilmenge(A)→A vergleichen gegen dasselbe belegte kanonische fachliche Ergebnis. Innerhalb eines freigegebenen neuen Stagings deterministisch zeitlich/referenzbasiert ordnen. Nicht bestätigte/unklare Bewegungen dürfen zunächst als Beleg/Review ohne finanzielle Wirkung bleiben und später belegt ergänzt werden. Bestehende bestätigte Buchungen nicht still neu abspielen oder rückdatieren. Fehlt dauerhafte sichere Pending-/Replayfähigkeit, dies als Gate dokumentieren; erste Lösung bleibt begrenzte Simulation/Diff. Keine Umgehung der bestehenden Chronologie-/Bestands-/CAS-Sperren.

Fehlende Anfangs-/Anschaffungswerte, unbekannte Gegenbuchungen, unzugeordnete Transfers, Exportlücken und Bestandsdifferenzen explizit zeigen. Datenabdeckung ist keine Vermögensentwicklung. Belegte Ereignisse aus unvollständiger Historie können als Records erhalten bleiben; keine fiktiven Eröffnungen/Käufe/Datum/Kapital/Kurse/Ausgleichs- oder Steuerbuchungen zum Erzwingen eines Journals.

### Parserwechsel

Originaldaten unverändert; InterpretationV2 zuerst getrennt im Staging, Alt/Neu jeTransaktion/Bestand/Fees/Cashflow/Historie vergleichen, manuelle Änderungen markieren. IDs stabil halten; Konflikte/Veränderungen nicht automatisch übernehmen. Erst nach ausdrücklicher Bestätigung und CAS persistieren. Keine stillen Dubletten, verlorenen Edits oder Backupinkompatibilität. Bestehende V1-Importherkunft/ownedSnapshot nicht umetikettieren. Falls nur Diff sicher möglich, genau das implementieren. Keine umfassende StorageMigration ohne gesonderte Freigabe.

## D — P0-Simulation, Security und Performance

Vor jeder produktiven Übernahme: geleseneZeilen, erkannte/neue/bestehende/Dubletten/unsupported/invalid/needsReview-Events, Warnungen/Konflikte/unaufgelösteAssets, Einzelbuchung/Quelldaten, konkrete Mengen-/Kontostands-/Cashflow-/Historienabdeckungsänderungen zeigen. Kritische Konflikte sperren. Simulation erzeugt ausschließlich proposedChanges und verändert keine produktiven Daten. Bestätigung umfasst genau die angezeigten Änderungen; nachfolgend neu prüfen gegen exaktesVorabbild/Revision/CAS. Bei Fehler atomarerRollback/equivalenter belegterSchutz, keineTeilbuchungen. Protokoll und sichere Rücknahme unter vorhandenen Undo-/Ownershipgrenzen. Abbrechen/Dateiwechsel/Escape/Reload/Offline/StaleIDs/ParallelTab/Quota/post-putAbort/Backup/Restore/PWA absichern. Vorlagenspeichern ist eine getrennte ausdrückliche Metadatenentscheidung, kein automatischer Nebenwrite der Simulation.

Inputs untrusted: CSV-Injection, kaputteQuotes, großeFelder/Dateien, Unicode/Bidi/Controls, gemischteZahlen/Datum, doppelte/fehlendeHeader, falscheProfilzuordnung, widersprüchlicheWerte, Replay/Mehrdateien, manipulierteJSON-/Prototype-/Regex-/Ressourcenfälle. Keine CSV-Werte als HTML, Formeln oder Code ausführen; Exporte gegen Spreadsheet-Injection absichern. Keine Originaldaten an Server/KI. Keine automatischen externen Links/Includes/Profilinstallationen aus Dateiinhalten.

PapaParse, Streaming und optionale lokale WebWorkers anhand echter reproduzierbarer10.000/50.000/100.000-Zeilen-Messungen vergleichen. Fortschritt/Abbruch/Backpressure/Memorylimits, vermeidbareKopien und MainThread-Blockaden messen. Node/Browseremulation/physischeMobile unterscheiden; keine realenGerätenachweise erfinden. Bestehende kanonische Portfolio-/Backupgrößenlimits nicht still erhöhen: großeParsingfähigkeit ist keine Freigabe für ungetestete100k-Finanzbuchungen. Neue Bibliothek erst bei nachgewiesenem Vorteil, gepinnt/offline/lizenziert. Kein Pflichtworker.

Unit-/Integrations-/End-to-End-Tests müssen Bestände/Cashflows/Fees/Identitäten/Historie prüfen, nicht nur CSV-Readiness. Bestehende Anbieter-/Journal-/Storage-/Backup-/Offline-/Securitytests und volle relevante Chromium-/Firefox-/WebKit-/Mobile320/390/430/Desktop-/Axe-Gates erhalten. Keine Snapshots ändern, um falsche Sollwerte zu verdecken. Metamorphe Tests für Dateipermutation, Replay, nichtpersistierendeSimulation, null/fehlend und getrennteAssets; keine neue Testframeworkpflicht.

### Zwölf unveränderte fachliche Testvektoren

Alle Beispiele synthetisch. Konkrete fehlende Source-/Konto-/Zeit-/Fee-Inklusionsannahmen in Fixtures explizit machen; keine Quelleninformation erfinden, um einen Test grün zu bekommen. Asset-ID im fachlichen Test ist eine interne Referenz, keine automatische Bestätigung einer externen ISIN-Prüfziffer. Cashflow inBuy/Sell-Vektoren meint den Cashleg; keine fiktiven externen Anleger-Ein-/Auszahlungen für die Renditeengine erzeugen.

1. **Wiederholungsimport:** A: Kauf, Order123, Asset-ID `ISIN:AT0000000001`, Menge10, Brutto100EUR, Fee1EUR. A zweimal → genau1wirtschaftlicherKauf,10Stück,101EUR gesamterMittelabfluss; zweiterImportDuplikat, keinezweiteWirkung.
2. **Reihenfolge:** A Kauf10Stück, Brutto100EUR, Fee1; B Verkauf4Stück, Brutto60EUR, Fee1. A→B undB→A →6Stück, Kauf-Cashleg−101EUR, Verkauf+59EUR, netto−42EUR. Keine erfundenen Anschaffungskosten. B darf bis zur belegten Ergänzung keine fiktiven Bestände erzeugen.
3. **Transfer:** A KrakenWithdrawal, BTC0.100, Netzwerkfee0.001; B LedgerDepositBTC0.099, passendeBlockchainreferenz. Erwartet zusammengehörigerTransfer mit2nachvollziehbarenQuellbewegungen und separaterFee; keineKauf-/Verkaufsperformance/Doppelzählung. Präzisierung: DasBeispiel beschreibt einenGesamtabgang0.100 mit darin belegterFee0.001. Ob ein konkretes nativesFeld brutto/netto/feeexklusive ist, muss dasProfil beweisen; widersprüchliche nativeFeldsemantik bleibtKonflikt stattZahlenzwang.
4. **GleicherTicker:** USDT Ethereum undUSDT Tron → unterschiedliche technischeAssetidentitäten, keinTicker-Merge. Kein neuerScanner erforderlich.
5. **Unvollständig:** Verkauf5Stück ohne vorherigenKauf → belegtesEreignis erhalten, fehlendeAnschaffung markieren; kein erfundenerKauf/Kostenbasis. Wenn sichereBestandsbuchung nicht möglich, Record/Review ohne erfundene finanzielleWirkung.
6. **MehrdeutigeDublette:** gleicherBetrag/Tag/Asset, unterschiedlicheReferenzen → eigenständigeEvents oderAMBIGUOUS nachBelegen, keinautomatischesVerschmelzen.
7. **Parserwechsel:** gleicheQuellzeileFeeV1=1EUR, V2=1.50EUR → bestätigteBuchungunverändert, Diff+0.50EURFee, ohneBestätigungkeinePersistenz.
8. **Abbruch:** 50.000synthetischeZeilen vorÜbernahmebestätigungabbrechen → produktiverBestandexaktunverändert, keineTeilfinanzbuchungen, erneuterImportmöglich.
9. **null:** Menge leer, Preisleer, Fee0, WährungEUR →Menge=null, Preis=null, Feeexakt0, WährungEUR; keinFehlend=0/Divisiondurch0.
10. **CSV/manuell:** BrokerCSV undmanuelleBuchung möglicherweisegleicherKauf →belegabhängigerAbgleichvorschlag; keineautomatischeLöschung; nachbestätigterZuordnungkeinedoppelteWirkung, manuelleEditsgeschützt.
11. **PartialFills:** Order456, Trade1:2Stück/20EURBrutto/0.20EURFee; Trade2:3Stück/33EURBrutto/0.30EURFee →5Stück,53EURBrutto,0.50EURFee,VWAP10.60EUR/Stück; beideAusführungennachvollziehbar, Order-IDallein nichtdeduplizieren.
12. **MehrdeutigesDatum:** `03/04/2026` ohnebelegtesFormat →NEEDS_REVIEW; weder3.Aprilnoch4.Märzstillwählen.

Jeder Vektor erhält im Testnachweis tatsächlichen Code-/Testpfad und Status. Ein vorhandener Architektur-/Originalbelegblocker wird konkret ausgewiesen, nicht als PASS umetikettiert. Blocker dürfen unabhängige sichere Inkremente nicht verhindern.

## E — Originale, Release und Abschluss

Originalpaket später gesondert: flatexAT(Depot+Cash+Abrechnungen/Anfang/Ende), Bittr(Kaufbelege), Ledger(nativeOperationen+Wallet-Bezüge), Kraken(Trades+Ledgers+Balances gleicheZeiträume), Bitpanda(Retail/Pro/Produkt+Fee/Staking/Swaps), TR/weiterebeiVerfügbarkeit. Präzise Zeilen-/Referenz-/Gebühren-/Steuer-/FX-/PartialFill-/Storno-/Transferfälle anfordern. Bereits frühere zugängliche Ledger-/Bittr-Originalformatnachweise wiederverwenden; keine erneut erfundene Fehlbelegbehauptung. Private Originale ausschließlich lokal, keine tatsächlichen Zeilen/Adressen/Keys/Dateifingerprints inGitHub/CI.

Evidenz jeProfil getrennt von generischerKernreife ausweisen. FehlendeOriginale verhindern keine vorbereitendeRecherche/Implementierung, aber vollständigeFormat-/Bestandsabgleichbehauptungen. RealeAndroid/TalkBack/Safari/Eviction/Crash/OAuth/Neugerät-Gates separat; Emulator ist keineHardwareabnahme.

Kleine nachvollziehbareCommits/PRs, einaktiverHauptstrang, bestehendeBranches erhalten, sichereZwischenstände remote. Keine laufendenfremdenPRs/Tests/Deployments abbrechen. Nach erfolgreichenrelevantenGates Scope/Freigaben prüfen; bereits konkretfreigegebeneÄnderungen kontrolliertveröffentlichen. Neue finanz-/migrations-/backup-/sicherheitskritischeProduktion braucht eigenekonkreteFreigabe. v188-Freigabe gilt nicht pauschalfürFLH05/Sync. NachDeploymentVersion/SW/Assets/Finanz-/Nutzerabläufe tatsächlichliveprüfen, PR-CI ist keineLiveabnahme.

Abschluss: produktiveVersion/Commit, gemergte/offenePRs, konkreteImplementierungen, Test-/CI-/Security-/Performancenachweise, Anbieter-/Evidenzmatrix, Quelle/Format/Gaps, Originalanforderungen, Risiken/Blocker/externeEntscheidungen und nächsterSchritt; zentralenCheckpoint aktualisieren. DONE/PARTIAL/OPEN/BLOCKED korrektbenennen. Auftrag erstfachlichabgeschlossen,wennRecherche/A-Matrix/Verträge, Replay/Reihenfolge/Quellenklassen/Historiengrenzen/Versionierungs-Diff/nichtpersistierendeSimulation, alleanwendbarenVektoren/Regressionen und transparenteOriginalgates nachgewiesensind.

## Verbindliche Negativ-Leitplanken (alle erhalten)

- Keine produktiven Finanzdaten still überschreiben oder bestätigte Buchungen ohne Einwilligung neu interpretieren.
- Keine unbelegten historischen Buchungen, Käufe, Eröffnungen, Kaufdaten, Anschaffungskapitalien, Preise, Kurse, Kostenbasis, Ausgleichs- oder steuerlichen Zuordnungen erzeugen.
- Fehlende Werte nicht durch0/aktuellePreise/fingierteFX ersetzen; keine NaN/Infinity/Float-Finanzrechnung.
- Mehrdeutige Transfers/Dubletten nicht automatisch zusammenführen und eigenständigeEvents nicht nach Betrag/Zeit verschmelzen.
- Rohbuchungen nicht zur Dublettenbehandlung löschen; Quellbewegungen und PartialFills erhalten.
- Bestätigte manuelle Korrekturen und Asset-/Transferzuordnungen nicht ohne ausdrückliche Bestätigung überschreiben.
- Keine konkurrierenden Finanzjournale/Tax-Lot-/Steuer-/Scanner-/Corporate-Action-Systeme oder impliziteScope-Erweiterung.
- Bestehende APIs nicht unnötig brechen; keine ungeprüften Datenmodell-/StorageMigrationen oder Backupinkompatibilität.
- Keine CSV-/Finanz-/Walletdaten an externeServer/KI senden, keine zentralenNutzerschlüssel und keine neuenPflichtclouddienste.
- Communityprofile nicht als Code behandeln oder ungeprüft automatisch installieren; keine eval/dynamischenAusdrücke.
- Keine stillen Teilcommits/Originaldatenverluste bei Fehler/Abbruch; Simulation verändert den produktiven Bestand nicht.
- Fehlende Original-/Realgeräte-/Quellenvalidierung nicht verschweigen und ungeprüfte Formate nicht als vollständig unterstützt melden.
- Keine Tests/Snapshots/Sicherheits-/Releasegates abschwächen, überspringen oder allein zum Grünwerden ändern.
- Keine ungeprüften Releases und keine kritischen Produktionsänderungen ohne erforderliche konkrete Freigabe.

## FLH06 und andere Masterpakete

FLH06 nur Folge-Recherche/Architektur: TR, Scalable, Baader, comdirect, flatex, DADAT und geeigneteDACH-Broker, PortfolioPerformance-PDF-Extraktoren und lokales pdfjs-dist prüfen. Text-/Mehrseiten-/Layout-/Belegreferenz-/Extraktionsunsicherheit/CSV-Duplikate undPrivatsphäre in dieselbeEvent-/Reconciliation-Schicht einordnen; keine umfangreiche PDF-Implementierung vor priorisierterCSV-Engine. NeueKursanbieter/Scanner/Sync/AT-Steuerarbeit bleiben getrennte Masterpakete mit eigenenBelegen/Freigaben. Bestehende UI-/Reliability-/FLH01–04-Funktionen nicht erneut bauen.
