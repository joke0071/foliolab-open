# Konsolidierter Restarbeiten-Audit — v179

Stand: 26.10.2026. Geprüfte Anwendungsbasis und Produktion: `5397ca73d3ce8281920973a9916c9fadbd65596d`, Service Worker `foliolab-open-v179`, https://foliolab.unperfekt.at/. Phase A ist tatsächlich abgeschlossen. Dieser separate Phase-B-Checkpoint verändert ausschließlich Dokumentation und synthetische Release-Evidenz; kein funktionaler Diff, Merge oder Deployment durch den Audit.

## Bewertungsregeln und Quellenrang

DONE bedeutet den jeweils ausdrücklich abgegrenzten, belegten Umfang, keine allgemeine Finanz-, Steuer-, Hardware- oder Sicherheitszertifizierung. PARTIAL hat eine konkrete Restlücke; OPEN ist noch nicht umgesetzt; BLOCKED benötigt einen konkret benannten Nachweis; SUPERSEDED bezeichnet einen durch eine spätere Entscheidung/Funktion ersetzten Auftrag. Prioritäten P0–P3 sind fachlich, keine Releasefreigabe. Fehlende Originalbelege sind kein Testfehler; ein synthetischer Parser-Test beweist keinen realen Exportdialekt.

Aktuelle Nutzerentscheidungen und tatsächliche Code-/Releasebelege gehen historischen Issue-Bodies vor. Insbesondere sind die alten „B offen“-/„noch Draft“-Texte zu AT02, AT03-B und AT05-A überholt. Ebenfalls sind alte CURRENT-Blöcke im FLH03-Checkpoint historische Zwischenstände. Die Originalfehlnachweise bleiben erhalten.

| Quelle | Erfasster Umfang / Nachweisgrenze |
| --- | --- |
| Library `FLH03_Broker_Exchange_Import_Historien_Rekonstruktion_2026-10-25.md` | Vollständiger Inhalt Version 4, Library-Revision 3, 63.276 Bytes, 309 Zeilen; 00–17 einschließlich UI17-01–12 und Sicherheits-/Freigabegates. Keine private Originaldatei ins Repository kopiert. |
| #148 | Body und Kommentarverlauf bis zur tatsächlichen v179-Abnahme, einschließlich #150/v177, #151-Diagnose, #153/v178, #154/#155/v179 und neuer Phasenreihenfolge. |
| #124 und `BENCHMARK_RESTARBEITEN_2026-10.md` | BENCH-001–024, R00–R15, WP01–15, PLUS01–04, Bereiche A–G, ursprünglicher rotki-/Sure-Vergleich und AT01–06; spätere Abschlusskommentare und `WORK_RESTPAKETE_CHECKPOINT.md` übersteuern alten Planungsstatus. |
| #149 | Vollständiger Auditbody: AUD-01–05, Reproduktion, weitere Risiken, Zuordnung UI17 und dokumentierte Grenzen; Kommentare einschließlich v178-Abnahme. |
| #44, #52, #125–129 | Aktuelle Bodies, vorhandene Kommentare und kanonische Fach-/Geräte-/Formatgates. Issue offen ist nicht gleich Funktion unimplementiert. |
| Repository | Aktueller Code, bestehende Unit-/Browsertests, `WORK_RELEASE_GATES.md`, FLH01-/FLH02-/IndexedDB-/AT-Verträge, Release-Checkpoints und Maschinenberichte. Historische Tests werden als solche bezeichnet; nicht als neuer Auditdurchlauf ausgegeben. |
| Spätere Produktentscheidungen | D=P2, universelle Cross-Origin-Warngarantie ausdrücklich gestrichen; FLH03-18 Ledger und FLH04 optionaler verschlüsselter Drive-Sync neu beauftragt; Produktvereinfachung und Integration vor Erweiterung; kein pauschales neues Produktionsrecht. |

Das Altplan-Mapping übernimmt die bereits vollständig konsolidierten Originalquellen aus dem Benchmark-Checkpoint. Dessen Quellenliste nennt die acht Library-Actionplan-/Priorisierungs-/PLUS-Dateien sowie separat WP15; keine erneute Implementierung dieser abgeschlossenen Analyse. Die Library-Vollreferenz `REFERENZ_Alle_Work-Auftraege.md` bestätigt R/WP-Gliederung und ursprüngliche Freigabegrenzen; sie enthält WP01–14, WP15 bleibt separat in der Benchmarkquelle referenziert. Neue konkrete Deltaentscheidungen unten basieren auf v179-Code und späteren Abschlussbelegen. Keine neue Ausführung oder Lizenz-/Versionsprüfung der externen Benchmarkanwendungen behauptet.

## Release- und Testanker

| Kürzel | Tatsächlicher Nachweis |
| --- | --- |
| E150 | #130–132 / `01a681960c0823010efe7e3599eb1d8512383673`, v150, CI40170530838, 555 Tests; AT03-A und AT02-A. |
| E156 | #133/#134 integriert, AT02-B und Anlageklassensymbole; #124 Kommentar6396425150, spätere v169/v176/v179-Regressionen erhalten diese Funktionen. |
| E169 | `WORK_RESTPAKETE_CHECKPOINT.md`, `FINAL_RELEASE_AND_LIVE_ACCEPTANCE.md`, #137–142; `839b51e37b234cc4a7fe202eeb68118a786e0b78`, CI40198408959; 98 Live-Dateihashes/18 Axe. FLH01, IDB-B, AT03-B, AT05-A, AT01, AT04-No-Code, UI07 abgeschlossen. |
| E176 | `FLH02_FINAL_RELEASE_AND_LIVE_ACCEPTANCE.md`, #143–147, CI40220923062, v176; 658 Tests, 103 Live-Dateihashes, gemeinsame Bestands-/Marktpreis-/FX-Projektion, Bittr-Belege und retained history. |
| E177 | #150 / `c23519bd1c473e602aa08e8753019de3537b9a6b`, CI40227044608; FLH03-00/01 produktiv abgenommen. |
| E178 | #153 / `fafe97d3d85de5ab7282f15842da6c85f77981e8`, CI40283585457; A/B/C/E live, 104 Assethashes; `release-evidence/flh03-v178-*.json`. D ausdrücklich ausgeschlossen. |
| E179 | #154 und #155 / `5397ca73d3ce8281920973a9916c9fadbd65596d`; finaler PR155-CI40361231324 und Wallet40361231093, Main/Pages40362303355 erfolgreich. 689 Unit-Tests und vollständige erforderliche Chromium-/Firefox-/WebKit-Regressionsgates; konkrete Logs/Schlusskorrekturen im Checkpoint. |
| L179 | Tatsächliche Produktion: `release-evidence/flh03-v179-live.json` und `flh03-v179-release.json`; 105 exakte SHA256-Dateimatches, geladene App/CSS, aktiver SW179, Kern6Gruppen/18Axe, echte lokale UI-Schreib-/Restore-/Offlinepfade. Neue08-UI zusätzlich in Chromium, Firefox157 und WebKit27.2, 36Axe, sechs Breiten/560px Höhe, echte IDB-Quota/Abbruch/CAS und Offline-Löschen/Reload. Nur synthetische Profile. |

Links zu Läufen: `https://github.com/joke0071/foliolab-open/actions/runs/<CI-ID>`. Frühere rote CI40324527596 (späte Controller-Voraussetzung) und40359264272 (signierte Ubuntu-Paketdownloads vor Browsertests) bleiben echte Fehlnachweise. #155 korrigiert Testbootstrap und ephemere signierte Paketquelle; kein Test wurde entfernt oder gelockert. Live-Runner hatte eine dokumentierte HTTPS-Inspektionszertifikatsausnahme; daraus keine unabhängige Zertifikatsabnahme ableiten. Physische Android-/Safari-/Assistenztechnik-/OAuth-Gates bleiben separat.

## FLH03 — vollständige Paketmatrix

In „kleinster Schnitt / Abnahme“ steht die nächste konkrete Aktion, nicht eine bereits bestehende Freigabe. Wiederverwendung und genaue externe Abhängigkeiten sind ausdrücklich angegeben.

| ID / Quelle | Status | Code / Tests / Release | Funktionale Restlücke | Prio / Abhängigkeit | Wiederverwendung | Kleinster Schnitt / eindeutige Abnahme |
| --- | --- | --- | --- | --- | --- | --- |
| FLH03-00 / v4 §4 | DONE | Provider-Matrix, Checkpoint, #150/E177 | Keine neue Startprüfung implementieren | P0; abgeschlossen | Bestehende Release-/Quelleninventare | Nur bei neuem Paket HEAD/Kollision prüfen; FLH02 nicht wiederholen |
| FLH03-01 / v4 §4 | DONE für generischen Vertrag | `csv-batch.js`, `import-identity.js`, `csv-import.js`; csv-batch.test, browser-csv-batch; E177/E179 | Generische atomare Mehrdateibasis ist kein fertiger TR/Kraken/Bitpanda-Adapter; deren N:M-Semantik separat | P0; Basisschnitt abgeschlossen | Ein Journal, vorhandene Preview/Undo/CAS | Neue Adapter müssen Replay/Overlap/Konflikte derselben Basis bestehen; kein Neuaufbau01 |
| FLH03-02 TR / #127-C | BLOCKED | Kein nativer TR-Adapter; Provider-Matrix; generische CSV vorhanden | Freigegebener regionaler Originalheader/Feldtypen und Trade↔Cash-Semantik fehlen als abgenommener Nachweis | P1; Originalformat/AT-Kontext |01, import identity, Transactions, FLH02 | Private autorisierte Formatprobe → Guard/Preview; zwei gleichartige echte Käufe erhalten, Trade+Settlement einmal; unbekannte Fälle blockiert |
| FLH03-03 Kraken | BLOCKED für produktiven Import | Keine nativen Trades/Ledgers/Balances-Module; offizielle Exportwege in Matrix | Konkrete Dialekte/IDs/Fees/Pairaliases und Dateiüberlappung noch nicht verifiziert | P1; datenschutzgeprüfte Format-/Semantikbelege |01, Decimal, Journal, Kontrollanker | Erst CSV-Contract/Tests mit belegten IDs; Trades+Ledger genau einmal, Balance kein Deposit, Margin/Futures offen |
| FLH03-04 Bitpanda | BLOCKED | Kein nativer CSV-Adapter; neue API nicht aktiviert | Tatsächlicher Produkt-/Jahresheader fehlt; neue API-CORS/Scopes nicht live bestätigt | P1 CSV/P2 API; Format-/Rechtegate |01, Transactions, Provider-Matrix | CSV-Headerguard und reine Vorschau erst nach Originalbeleg; kein erfundenes „unterstützt“ |
| FLH03-05 flatex AT / PLUS03 / AT03-C | PARTIAL; Vollfreigabe BLOCKED | `flatex-import`, settlements, settlement-audit, cash-audit, reconciliation, backfill, cost-basis; flatex-Tests/browser; E176/E179 | Beta ist vorhanden; echtes Depot+Cash gleicher Zeitraum, Anfang/Endsaldo, Valuta/FX/Fees/Steuern/Classic/Next nicht vollständig fachlich abgenommen | P1; freigegebene AT-Originalbelege | Vorhandene Beta/Quarantäne/Backfill; keine zweite Cashengine | Formatmatrix vervollständigen, belegtes Settlement-Matching; exakte Mengen/Cash/Fees, Wiederimport/Undo; ungesicherte Cashzeilen bleiben lesend |
| FLH03-06 optionale APIs | BLOCKED | Provider-Matrix; kein Kraken-/Bitpanda-Secretadapter freigeschaltet | Origin-CORS, minimale Leserechte, Konto/History/Pagination/Rate, Secret-/Nonce-Multitab-Gate fehlen | P2; Live-Rechte und Security | Bestehende Transport-/Credential-/Statuspfade | Origin-getestete reine Capability-Evidenz; ohne Beweis CSV. Kein Proxy/Worker oder Login-Scraping |
| FLH03-07 Rekonstruktion/Abgleich | PARTIAL | `historical-position-value`, `historical-portfolio-value`, booking-history, cash-reconciliation, transfer matching; E169/E176–179 | Providerübergreifende vollständige Eingänge/Anfang-Endabgleiche noch nicht vorhanden; Kontostatus16 fehlt | P0 für Gesamtabschluss;02–05/16 | Ausschließlich FLH02-Projektion; AT03-A/B | Je belegtem Teilkonto Anfang/Endmenge/Cash, Gebühr/Flow/Transfer vergleichen; 999→1059 bleibt korrekt, Lücken niemals0/volle Kurve |
| FLH03-08 Auswahl/sicheres Löschen | DONE im v4 ausdrücklich erlaubten sicheren MVP | `position-selection.js`, gemeinsames `deletePositions`, app.js;18 Domainfälle, browser-position-selection/removal; E179/L179 | Universelle Cascade-Löschung verwobener Daten bewusst nicht geliefert; solche Positionen werden konkret blockiert | P1; abgeschlossen im freigegebenen Umfang | Ein bestehender Lösch-/IDB-CAS-Pfad, komplette Backups | Einzel/alle/alle gefilterten vor Pagination, versteckte/stale IDs, explizite Vorschau, ein Commit/Rollback/Restore/offline bestanden. Keine universelle Cascade als Restpflicht erfinden |
| FLH03-09 AVAX P-Chain | OPEN; Nachweisgate | `staking-discovery`, `market`, native-staking-networks; AT04-Matrix; C-Chain/sAVAX vorhanden | Kein natives P-Chain-Staking/zuverlässiger C↔P-Eigentums-/Auszahlungsnachweis | P1; offizielle öffentliche Protokoll-/Adress-/Transportbelege | Watch-only-Scanner, Wirtschaftslinks, FLH02 | Erst reine Capability/Belege; Validator/Delegator/C-P-Transfer/Fees/Maturity korrekt, kein doppeltesAVAX, keine Zukunftsrewardbuchung |
| FLH03-10 Sonic | PARTIAL | SFC-Delegation in staking-discovery; Kommentar „Pending withdrawal requests are not discoverable from this snapshot“; native Tests/E179 | Auszahlungsanträge/Unbonding/claimable/ausgezahlt und Rewardevents nicht vollständig | P1; offizielle Protokoll-/Ereignisnachweise | Vorhandener SFC-Scanner, st S-Repräsentation | Separater Zustandsvertrag; mehrere Validatoren/Teilentnahmen, Wiederholung/Fehler, Summenerhaltung; keine APY-History |
| FLH03-11 Kursquellen | PARTIAL; Zusatzadapter BLOCKED | market/historical-provider Pfade, EODHD/FMP/Twelve, Coin Gecko/Crypto Compare; FLH02 capability guard | Yahoo/Rapid API-Anbieter/Lizenz/CORS und CMC-Basic-Entitlements nicht abgenommen | P2; konkreter Provider/Tarif/Konto | Bestehender Fallback/Quellenwahl/retained history | Nur belegte optionale Quelle integrieren; Identität/raw-close/FX/401/429/Offline prüfen; FMP/Twelve bis funktionsgleichem Beweis erhalten |
| FLH03-12 / AT05-B / #52 | BLOCKED | Transactions verweigert unsicheren Barausgleich; ledger-multistep-fx-corporate; AT05-A lesend produktiv | Cash-in-lieu, AT-KESt/Oe KB/Basisfortführung fachlich nicht vollständig belegt | P1/P2; Originalbelege+unabhängige Fachprüfung | Ein Journal, AT05-A/Decimal/FX | Cash+Anteile einmal atomar, exakte Fraktion/Datum/FX, keine externe Scheineinzahlung; ohne Regel nur Originalbetrag/Herkunft |
| FLH03-13 / AT06 / #44 | PARTIAL; reale Gates BLOCKED | IDB A/B, atomic-storage, browser recovery/complete backup; E169/E176/E179/L179 | Echtes Drive-OAuth/Neugerät, Android/Talk Back, native Safari, OS-Crash/Eviction/große reale Archive fehlen | P1; Hardware/Testkonto/isolierte Umgebung | Bestehender Vollbackup-/Recovery-/CAS-Vertrag | Je reales Gate ein protokollierter exakter Restorevergleich inkl. Settings/History/Identität/Offline; Emulation nicht Hardware nennen |
| FLH03-14 Archivieren | OPEN | Kein Archivfeld/Archivfilter im aktuellen Modell/UI; Positionssuche/Auswahl bestehen | Nichtdestruktives Aus-/Einblenden mit erhaltener Identität und Bewertungsumfang fehlt | P1; Modell-/Reimportvertrag und eigene Releaseentscheidung | Model factory/safe Import, Suche,08, vorhandene Summen/History | Ein Feld, eine Semantik; aktive Bestände weiter zählen, History unverändert; CSV/Wallet findet archivierte ID; Restore/CAS/Filter/6Breiten/3Engines |
| FLH03-15 Detailwünsche | PARTIAL | Assetclass icons #134/E156; complete-backup/backup-vault; FLH02 Historieneinstieg/FX E176 | Backup mit künftigem Archivfeld erst nach14 prüfen; keine fehlenden Symbole/FX neu behaupten | P2;14 für Archiv | Vorhandene Icons/Vollbackup/History | Nur konkretes neues Delta; plain keine Secrets, optional verschlüsselt Settings, kein zweiter Recoverycode, undatierte Lücken sichtbar |
| FLH03-16 Kontovollständigkeit | PARTIAL | position-quality-review/valuation-status, cash-reconciliation, FLH02 Coverage, AT03-B/AT01 | Kompakte kontoweise Bestands-/Cash-/Transfer-/Preisabdeckung noch nicht einheitlich verdichtet | P1; belastbare vorhandene Statusquellen | Rein abgeleitete AT01-/FLH02-/Abgleichdaten | Zuerst readonly Kontoübersicht: kein künstlicher Prozentwert, unterschiedliche Konten/fehlende Eröffnung/FX/Teilhistory/stale; konkrete bestehende Aktionen, Nullmutationen |
| FLH03-17 UI | PARTIAL | AUD-A/B/C/E in #153/E178, weitere mobile08-Korrekturen E179 | P2-D und einzelne UI17-Wording/Onboarding/Accountfortsetzung/Gerätenachweise offen, siehe Einzelmatrix | P1/P2/P3; Hardware separat | Native Dialoge, vorhandenes ruhiges Design | Nur nachgewiesene Einzelreste, kein Redesign; alle geöffneten Zielzustände testen |
| FLH03-18 Ledger Live / neuer Auftrag | OPEN; Format-/Semantikprüfung ausstehend | Noch kein nativer Importer; vorhandene generische CSV-/Wallet-/Bittr-Projektionen | Referenzdatei ist benannt, Inhalt/Transaktionssemantik hier noch nicht als validiert behauptet | P1; zugängliche autorisierte Originalreferenz lokal, Tx-/Flowbelege |01, import identity, wallet replay, purchase evidence, FLH02 | Erst privater Schemaaudit ohne PII-Export; IN/OUT/FEES keine automatische Trade-/Rewardinterpretation; unbekannte Delegation/Swap/Costbasis blockieren; eigener PR |
| FLH04 Sync / neuer Auftrag | OPEN; OAuth-/Operatorgates BLOCKED | `drive-backup.js`, `complete-backup.js`, `backup-vault.js` vorhanden, aber Backup ist kein revisionierter Sync | Portfolio-/Geräte-ID, E2EE-Revisionen, Konflikte/Offline-Merge fehlen; gemeinsamer öffentlicher Client nicht belegt | P1 Sicherheit; eigenes Issue/Branch, OAuth/Betreiber/Releaseentscheidung | Lokal kanonisches IDB, Backup AES-GCM/Passwortvertrag nach Eignungsprüfung | Erst Sicherheits-/Konfliktvertrag und Capability-Nachweise; kein LWW, keine automatische Mehrdeutigkeitsauflösung, echter Neugerät-/Offline-/CAS-Test vor Veröffentlichung |

## Benchmark AT01–AT06 — tatsächlicher Endstand statt alter Planungsstände

| ID / Quelle | Status | Code / Tests / Release | Restlücke | Prio / Gate | Wiederverwendung / kleinster Schnitt / Abnahme |
| --- | --- | --- | --- | --- | --- |
| AT01 / #125 | DONE im vereinbarten abgeleiteten Scope | position-quality-review, browser-quality-review, position-quality-review.test; #141/E169/E179 | Keine neue globale Provider-Issuedatenbank; unstrukturierte Abruffehler bewusst im Kontext | P2; abgeschlossen | Dedupe pro Position/Quelle/Zeit/Aktion, Filter/Reset und Nullmutationen bestanden;16 ist neues Konto-Delta |
| AT02-A / #126 | DONE | cash Terms/account-opening/allocation-ui; #132/E150 | Keine automatische Auszahlung bei Fälligkeit beabsichtigt | P1; abgeschlossen | Bestehende Fälligkeits-/Liquiditätsansicht weiter nutzen; Guthaben unverändert |
| AT02-B / #126 | DONE | interest-scenario/account/ui, unabhängige Python-Fraction-Referenzen; #133/E156/E179 | Prognose absichtlich kein gebuchter Ertrag/FX/Steuerbetrag | P1; abgeschlossen | ACT/365F/360, Zukunftsbestätigung, Brutto/Einmalrundung bereits getestet; nicht neu bauen |
| AT03-A / #127 | DONE | cash-reconciliation und browser-cash-reconciliation; #131/E150 | Kein historischer oder automatisch korrigierender Banksaldo versprochen | P1; abgeschlossen | Aktueller expliziter Referenzsaldo rein lesend, exakte Präzision |
| AT03-B / #127 | DONE im dokumentierten sicheren Scope | transactions/transfer-matching-ui, transfer-matching.test/browser; #139/E169/E179 | FX/Gebühren/unklare Gegenbelege bleiben ausdrücklich blockiert; kein stilles Matching | P1; abgeschlossen | Explizite Gegenbewegung, Split, Beleg, Undo/Idempotenz, Ownership und Rendite-Zwischenfenster vorhanden |
| AT03-C / #127 / PLUS03 | BLOCKED | Bestehende Flatex Beta und readonly settlement audit | Regional originale Cash-/Depot-/TR-Formate, Salden/Steuern/FX nicht vollständig belegt | P1; Originaldaten | FLH03-02/05 statt neuer paralleler Brokerengine; erwartete Anfang-/Endsalden vor Freigabe |
| AT04 / #128 | DONE als begründeter No-Code-Deltaaudit | Kommentar6398005023,133 fokussierte Tests/8Browser-Suites; E169, weiter E179 | Neue P-Chain-/Sonic-Erweiterungen sind09/10, nicht nachträglich fehlgeschlagener AT04 | P2; abgeschlossen | Bestehende Capability-Matrix/Doublecount-Schutz erhalten; nur reproduzierbare neue Deltas |
| AT05-A / #129 | DONE | booking-insights annual overview, annual-overview.test/browser; #140/E169/E179 | Keine Steuerbescheinigung/Erfindung steuerlicher Basis | P1; abgeschlossen | Jahr/Konto/Einzelbelege, Posting-ID einmal, Lücken/FX sichtbar, keine Mutation |
| AT05-B / #129 / PLUS04 | BLOCKED | Sichere unbekannt-/Ablehnungsgates vorhanden | AT-Steuer-/Oe KB-Originalbelege und Fachvalidierung fehlen | P1; Fach-/Beleggate |12/#52; bestehende wirtschaftliche Kostenbasis nicht pauschal als Steuerbasis umstellen |
| AT06 / #44 | PARTIAL | IDB/Backup/CAS/Recovery synthetisch implementiert und breit bestanden, zuletzt L179 | Physische Geräte/Drive/Crash/Eviction/Archive bleiben offen | P1; externe Umgebung |13/FLH04; jeden fehlenden Nachweis einzeln führen, kein zweiter Speicherkern |

## BENCH-001–024 mit Rückbindung an die Originalanforderungen

Die Originalvergleichsentscheidung bleibt bestehen: rotki und Sure lieferten Konzepte für Identität, Nutzerkorrekturschutz, expliziten Abgleich und objektbezogene Aktionen. Keine AGPL-Codeübernahme, kein SQL-Issuebackend, kein Rails-/Queue-/Serverumbau. Historische Referenzen: rotki `6cd6a9e029830b2495218dd7f69da4ec502e9cf5`, Sure `bc02ce5594fcff21641aa752c50047f6f36091ab`; keine Behauptung, dies seien heute neu geprüfte HEADs.

| ID / Originalzuordnung | Status | Beleg / wiederverwendbare Implementierung | Konkreter Rest / kleinster Schnitt und Abnahme | Prio / Abhängigkeit |
| --- | --- | --- | --- | --- |
| BENCH-001 R03/04 WP04/05 PLUS01 | DONE | import-identity/csv-import, p0-import tests, #115/E177/E179 | Neue Provider verwenden dieselbe Identität; keine zweite Dedupeengine | P0; abgeschlossen |
| BENCH-002 R04/05 WP05/06 PLUS01 | DONE | open CSVImport/Review, browser-csv-review-a11y/p0-import/E179 | Adapterpreview nur mit belegtem Format ergänzen | P1;02–05/18 |
| BENCH-003 R03/04 WP04/05 PLUS01 | DONE | Ownership/vergleichender Reimport, p0-import-conflicts/E179 | Kein stilles Überschreiben bestätigter Nutzerkorrekturen | P0; abgeschlossen |
| BENCH-004 R09 WP07 | DONE für AT01 | position-quality-review/#141/E169/E179 | Kontosynthese neu unter16, konkrete Aktion ohne neue Persistenz | P2;16 |
| BENCH-005 R08 WP07 | PARTIAL | refresh-ui/wallet-history-state/AT01, E169/E179 | Quelle-/Abrufstatus noch nicht überall gleichartige Aktion; kleinster readonly Statusvertrag, tatsächliche429/partial erhalten | P2;16/Providersemantik |
| BENCH-006 R02 WP03 PLUS02 | PARTIAL | IDB A/B/CAS/Recovery #135/#138/E179 | Technische Opt-in-Architektur durch IDB-only ersetzt; reale Eviction/Crash13/AT06 offen | P1; Hardware |
| BENCH-007 R01 WP02 PLUS01 | DONE | performance/capital-flows, p0-performance-boundaries, ledger-reference-arithmetic/E179 | Unknown/XIRR-Gates erhalten, keine zweite Renditeengine | P0; abgeschlossen |
| BENCH-008 R13 WP12/15-D PLUS04 | BLOCKED | Transactions cash-in-lieu Ablehnung, #52 |12: dokumentierter Cash+Shares-Vertrag mit Originalsettlement, atomarer Sollwerttest | P1/P2; Fachbelege |
| BENCH-009 R10 WP08 | SUPERSEDED | economic-form-ui/open Booking/Dialogarbeit E169/E179 | Vorhandene Kontextfelder erfüllen praktischen Assistentenzweck; kein Intent-Neubau | P2; keine neue Arbeit |
| BENCH-010 R08/11 WP07/08 | DONE für belegte vorhandene Quellen | quote-quality/position-detail/AT01, E169/E176/E179 | Neue Providerprovenienz unter11/16, keine unbekannte Lizenz als bestätigt markieren | P2; Providerbelege |
| BENCH-011 R01/11 WP02/08 | DONE | dashboard/performance/capital-flows, FLH02/E178/E179 | Vermögensdifferenz ist keine geldflussbereinigte Rendite; bewährte Projektion nutzen | P0; abgeschlossen |
| BENCH-012 R00/10 WP01/08 | PARTIAL | dialog-discard/native dialogs, browser-dialog suites/E179 | Bounded D und reales Talk Back/Safari; getrennte Abnahme, alte Cross Origin-Garantie ersetzt | P2; D/Hardware |
| BENCH-013 R06 WP09/15-A/B PLUS03 | PARTIAL; Vollformate BLOCKED | Flatex Beta/01/E176/E177/E179 |02–05 mit Originalformaten vervollständigen; generischer Mapper kein Providerpass | P1; Formatbelege |
| BENCH-014 R07 WP10/15-B PLUS03 | PARTIAL | AT03-A/B #131/#139/E169/E179 | Generischer Abgleich abgeschlossen; brokerkonkrete Cashsemantik/gesamte Kontenabdeckung05/07/16 fehlt | P1; Belege |
| BENCH-015 R08/09/11 WP07/08/13 | SUPERSEDED für alten Neubau | WH01–07 + FLH01/02/AT01, E176/E179 | Neue fehlende Kontoeingänge unter07/16, kein erneuter Historykern | P1; Quellen |
| BENCH-016 R08 WP07 | PARTIAL | blockchain-adapters/staking-catalog/Provider-Matrix/AT04 | Benutzerverständliche aktuelle vs historische Providerfähigkeiten in16/11; kein Label aus Katalog als Livepass | P2; CORS-/Historybeleg |
| BENCH-017 R14 WP13 | SUPERSEDED | BTC/ETH/SOL native histories WH01–07, E169/E176/E179 | Generischer Blockchainpilot durch vorhandene Engines erfüllt;09/10 konkrete neue Deltas | P1; Protokollbeleg |
| BENCH-018 R15 WP14 | OPEN, bewusst zurückgestellt | portfolio-scale, Browser Performanceaudit; E179 | Kein nachgewiesener neuer Engpass; erst reproduzierbare reale Messung, dann kleinstes inkrementelles Delta | P3; Messbeleg |
| BENCH-019 R12 WP11 | PARTIAL | position-search/booking filters/AT01/08, E179 | Keine persistenten Zusatzpresets; nur bei belegtem Nutzen später; Reset/Filterkontrakt erhalten | P3; Nutzwertentscheidung |
| BENCH-020 R00/G5 WP01/08 PLUS02 | BLOCKED | mobile/offline/Axe automatisiert E179 | Physisches Android/AT06-Protokoll; kein Emulationsersatz | P1; Hardware |
| BENCH-021 R12/G6 WP11 PLUS02 | DONE | credential-visibility/complete-backup/backup-vault/privacy tests/E179 | Optional Settings nur verschlüsselt, offene Exporte keyfrei; Sync muss Sicherheitsgrenze neu nachweisen | P0; abgeschlossen/FLH04neu |
| BENCH-022 R00/G0–6 WP01 PLUS01/02 | DONE im CI-Vertrag | WORK_RELEASE_GATES/import.yml/E179 | main organisatorisch ungeschützt; keine ungefragte Adminänderung; neue PRs brauchen eigene finale Gates | P0; kontinuierlich |
| BENCH-023 R10 WP08 | SUPERSEDED für breiten Neubau | vorhandene Dialog-/Wording-/Leerzustände + ABCE/E178 | Konkrete UI17-Reste separat, kein Redesign | P2/P3; UI17 |
| BENCH-024 R12 optional WP11 | OPEN, bewusst zurückgestellt | market-diagnostics vorhanden | Kein allgemeiner Rohdiagnoseexport ohne belegten Supportnutzen/PII-Vertrag | P3; Nutzwert-/Privacygate |

## R-/WP-/PLUS-Vollmapping

Diese Zeilen erhalten die ursprüngliche ID und ordnen Restarbeit genau einmal fachlich zu. „Träger“ verweist auf die ausführlichen Status-/Abnahmekriterien oben; keine zweite Parallelroadmap.

| Ursprung | Status | Implementierungsnachweis / Restträger / Abnahme |
| --- | --- | --- |
| R00 / WP01 | PARTIAL | CI/#103 und E179 DONE; reale Geräteschlussnachweise AT06/13 BLOCKED |
| R01 / WP02 | DONE | PLUS01/#115, performance/Decimal und E179; konservative unbekannte Rendite erhalten |
| R02 / WP03 | PARTIAL | PLUS02/#117, IDB-only A/B #135/#138 DONE; reale44/13-Gates offen |
| R03 / WP04 | DONE | import-identity/Ownership, #115/E179 |
| R04 / WP05 | DONE | atomare Importkonflikt-/Nutzerkorrekturengine, #115/E177/E179 |
| R05 / WP06 | DONE | tatsächliche Vorschau/Zuordnung/Undo, E177/E179 |
| R06 / WP09 | PARTIAL | Flatex Beta DONE; reale Providerformate05/AT03-C BLOCKED |
| R07 / WP10 | PARTIAL | AT03-A/B DONE; brokerkonkrete Settlementvollständigkeit05/07 BLOCKED |
| R08 / WP07 | PARTIAL | Quellen-/Wallet-/AT01/FLH02 DONE;11/16 Provider-/Kontosynthese offen |
| R09 / WP07 | DONE für ursprünglichen Prüfeinstieg | AT01 #141/E169/E179; neue Kontosynthese16 separat |
| R10 / WP08 | PARTIAL | Kontextdialoge/UI07/ABCE DONE; bounded D und kleine UI17-Reste offen |
| R11 / WP08 | DONE für ursprüngliche Rendite-/Kursanzeige | FLH02/AT01/E178; keine erfundene Rendite |
| R12 / WP11 | PARTIAL | Suche/Filter/Privacy DONE; optionale Presets/Diagnoseexport P3 bewusst zurückgestellt |
| R13 / WP12 | BLOCKED | Gemischter Barausgleich #52/12 nur mit Belegen; sichere Ablehnung vorhanden |
| R14 / WP13 | SUPERSEDED | WH01–07 ersetzt Pilot;09/10/18 nur gezielte belegte Deltas |
| R15 / WP14 | OPEN P3 | Messen vorhanden; spekulativer inkrementeller Refactor zurückgestellt, zuerst Engpassbeweis |
| WP15-A/B / PLUS03 | PARTIAL | Flatex Beta/AT03-A/B vorhanden; reale Broker-Cash-/Steuer-/Settlementbelege05/AT03-C fehlen |
| WP15-C/D / PLUS04 | PARTIAL | AT05-A dokumentierende Jahresübersicht DONE; AT05-B/12/#52 BLOCKED |
| PLUS01 | DONE | #115/Finanzimportkonsolidierung; keine alten #104–106/#111 wieder mergen |
| PLUS02 | PARTIAL | technischer Kern/#117 und IDB-only DONE; physische #44-Nachweise offen |

## UI17 / AUD — kein erneuter A–E-Neubau

| ID / Quelle | Status | Tatsächlicher Beleg | Rest / kleinster Schnitt / Abnahme | Prio / Abhängigkeit |
| --- | --- | --- | --- | --- |
| AUD-01 / A / UI17-01 / UI17-02 / UI17-11 | DONE für bestätigten Befund | sync Portfolio State/recovery guards, browser-flh03-abce, E178/E179 | Keine bestätigten0-Werte/Onboarding bei Lesefehler, Schreibwege gesperrt, sichere Originalrettung/Restore/CAS erhalten; ursprünglicher privater Fehlerauslöser nicht pauschal als Korruption diagnostiziert | P1; abgeschlossen |
| AUD-02 / B / UI17-05 | DONE | dashboard-ui/shared wealth View, E178, 999→1059 synthetisch live | Vorhandene History statt manueller Stichtagpflicht; Differenz/Flow/Rendite korrekt getrennt; partial/missing benannt | P1; abgeschlossen |
| AUD-03 / C / UI17-12 | DONE für sieben belegte Texte | styles scoped helper/Drive #4d6756, ausgeklappte Settings-Axe E178/E179 | Keine globale Paletteänderung; normale Texte≥4,5:1 in geprüften Zuständen | P2; abgeschlossen |
| AUD-04 / D | PARTIAL | Interner dialog-discard vorhanden; #151 closed/unmerged enthält unveränderte Linux/mac OS-Web Kit-Fehler | Zusatzschutz Reload/Verlassen nur wo Browser unterstützt; eigenständiger bounded D-PR, dirty Provider/Wizard/CSV, clean/saved keine Warnung, verweigert bleibt Entwurf, bestätigt verlässt; keine History-Trap/Persistenz | P2; konkrete Nutzerfreigabe nach eigenen Gates |
| D universelle Cross-Origin-Garantie | SUPERSEDED | Explizite spätere Produktentscheidung, im FLH03-Checkpoint übernommen | Keine neue Behauptung bestandener strenger Tests; Originaltests/-Logs in151 erhalten, keine identischen Diagnoserunden | P2; keine Pflichtgarantie |
| AUD-05 / E / UI17-06 | DONE | render History/empty states, browser-flh03-abce, E178/E179 | Einzentraler Leerstatus und passende bestehende Aktion; keine Nullkurve | P2; abgeschlossen |
| UI17-03 Abstand Hero/Onboarding | OPEN, kleiner visueller Rest | #149 visuell bestätigt; index.html gleicher benachbarter Panel-Aufbau; kein neuer eigener Abstandsfix belegt | Erst aktuellen leeren Sichtzustand visuell vergleichen, bei fortbestehendem Befund ausschließlich bestehenden Abstand anwenden | P2; aktuelle Reproduktion |
| UI17-04 Erststart-Aktionsraster | PARTIAL | Direkter Wizard/Backup vorhanden; #149 kein blockiertes Ziel, flextoolbar bleibt | Kein Redesign allein wegenungleicher Breite; nur nachgewiesene Fehlbedienung/Überlauf klein korrigieren | P2; Nutzwertnachweis |
| UI17-07 kompakte leere Charts | PARTIAL | Leerer Historyzustand E178 kompakter; belegte Charts erhalten | Leerer Donut/alle Periodezustände nicht pauschal vollabgenommen; tatsächliches Delta erst reproduzieren, keine Nullsegmente | P2; gezielte UIPrüfung |
| UI17-08 kürzester Anlage-/Importweg | PARTIAL | Direkt Wizard/Import und History Leeraktion vorhanden, E178/E179 | Gesamte Texte/Provider Voraussetzungen noch kein vollständiger Konsistenzabschluss; konkrete kurze Texte bei nächstem Zielinkrement | P2; keine neue Navigation |
| UI17-09 Marken-/Buchungswording | PARTIAL | Buchungen nennen CSV; app.js weiterhin „Willkommen bei Foliolab Open“ | KleinerCopyfix beim nächsten passendenUI-PR; FolioLab Open konsistent, keine breiteTextkampagne | P3; keineFachabhängigkeit |
| UI17-10 Konto ohne Anbieter | PARTIAL | open Account→open Provider; #149 Fokusrückgabe bereits korrekt | Ursprünglichen Kontoschritt nach Provider Save optional fortsetzen fehlt; klarer Voraussetzungstext, cancel/ESC/focus/save testen | P2; shared Dialog Kontrakt |
| UI17-12 Geometrie/Hardware | PARTIAL | UI07/ABCE plus08 320–1440/560px und echte Axe bestanden, E169/E178/L179 | Virtuelle Tastatur/Safe-area/physischer Zoom/Talk Back/Voice Over offen; i OS13px Inputzoom nur Risiko, kein bestätigter Defekt | P1 reale Abnahme; Hardware |

Kleine Checkboxgrafik allein beweist keinen Touchzielverstoß. Dark Mode ist kein beauftragtes fehlendes Feature. Die bestandene synthetische 1.000-Positionen-/1.825-Stichtage-Probe aus #149 ist kein Hardware-SLA und kein Anlass für ein Framework oder spekulative Virtualisierung.

## Durchgängiger Workflow und Integrationsrisiken

| Schritt | Wiederverwendbarer Iststand | Tatsächlicher Rest / harte Abnahme |
| --- | --- | --- |
| Import | CSV/01/Flatex Beta, provenance/ownership, Bittr-A | Native Provideradapter und Ledger nur nach Formatnachweis; eine Quellzeile nicht pauschal ein Wirtschaftsevent; mehrere gleiche Käufe behalten |
| Abgleich | Exakter Cashvergleich AT03-A, bestätigte interne Transfers AT03-B, Flatexreadonly Mengen/Settlement | Trades/Cash/Wallet müssen N:M-belegt verknüpft werden; Betrag/Tag allein kein Beweis, Balances keine Einzahlungen, keine automatische Nullungsbuchung |
| Historie | FLH01/FLH02/WH01–07, raw-close×tatsächliche Tagesmenge×belegte FX, retained history | Neue Provider-/Stakingeingänge, geschlossene Konten/Anfangsanker und klarer Kontoumfang; aktueller Bestand beweist keine Vergangenheit |
| Datenqualität | Kurs-/Historygruppen AT01, Herkunft/Lücken, CAS/Recovery | Kontoüberblick16 und konsistente Provideraktionen; kein künstlicher Vollständigkeitsprozentsatz oder zweites Issuebackend |
| Analyse | Vermögen/Allokation, tatsächliche Erträge/Kosten/Steuern, getrennte Brutto-Szenarien, konservative Rendite | Kontoweise Datenabdeckung erklären; Teilportfolio nicht Gesamtvermögen; historische Kostenbasis nicht automatisch AT-Steuerbasis |

**Neue konkrete Lücke aus aktuellem Code:** `chart-periods.js` bietet für Marktcharts 7T/1M/3M/6M/1J und belegabhängig3J/5J/Max, für Gesamtvermögenscharts jedoch erst1M/3M/6M/1J/3J/5J/Max. Der neu ausdrücklich gewünschte **1W-Gesamtvermögenszeitraum** ist OPEN/P2. Kleinstes Delta: vorhandene gemeinsame wealth-Periodendefinition um7T ergänzen, dieselbe Projektion filtern; grenzdatierte Sollwerte, beide gemeinsamenAnsichten, leere/partielleDaten und3Engines/Mobile/Axe prüfen. Keine neue Berechnung oder behauptete längere Providerhistorie. Eigene Releasefreigabe erforderlich, sofern nicht in einem konkret freigegebenen Scope.

## Blockerregister und Freigaben

| Gate | Fehlender konkreter Nachweis | Betroffene Pakete | Was unabhängig weitergeht |
| --- | --- | --- | --- |
| FMT-TR/KRAKEN/BITPANDA/FLATEX | Freigegebene regionale Originalformate, IDs/Beziehungsfelder und unabhängige Anfang-/Endsalden |02–05/07/AT03-C | bounded D, Archivvertrag14, readonly16, neue Ledgerreferenz separat prüfen |
| TAX-AT | Tatsächliche Broker-/Oe KB-Belege, Zeitraum/Vertragskontext und unabhängige Fachvalidierung |12/AT05-B/#52 | AT05-A bleibt nutzbar, keine erfundenen Steuerwerte |
| API-ORIGIN | Tatsächliches Origin-CORS, minimale Rechte/Tarif/History/Lizenz/Nonce/Secrets |06/11 | Lokale CSV/retained History/andere UI |
| CHAIN-PROOF | Offizielle Eigentums-/Zustands-/Eventsemantik und öffentliche Transportabdeckung |09/10 | Bestehende Scanner nutzen, keine unbewiesenen Rewards |
| DEVICE | Reale Android/Safari/AT/Crash/Eviction/Archivumgebung |13/AT06/UI17-12 | Automatisierte isolierte Regressionen/andere Inkremente |
| SYNC-OAUTH | Betreiberbereitstellung öffentlicher Client, Google Freigaben/Origin/app Data Folder, reales Neugerät-Testkonto |FLH04 | Reiner Konflikt-/Kryptovertrag und synthetische Tests als eigener PR; kein echtes OAuth vortäuschen |
| RELEASE | Konkrete Produktionsentscheidung für neue Scopes und sicherheitskritische Migrationen |02–07/09–18/FLH04/neue Wealth1W | Erst reviewbare Implementation/Tests/PR sichern, dann genau nötige Freigabe einholen |

Verbindlich fortgeltend: FLH03-08 war ausdrücklich produktiv freigegeben und ist jetzt erledigt; A/B/C/E/00/01/FLH02 ebenfalls erledigt. Ein klar begrenzter sicherer D-Teilschritt besitzt ausdrückliche Merge-/Deploymentfreigabe **nach eigenen vollständig grünen finalen Gates**, inklusive unabhängiger Prüfung und Liveabnahme. Für andere neue Umfänge enthält dieser Audit keine erfundene pauschale Freigabe. Fehlende Gates werden nicht umbenannt/übersprungen. Keine Hardware-, Konto- oder Lizenznachweise aus Browseremulation/curl/Synthetik ableiten.

## Ergebnis und nächster Schritt

v179 ist tatsächlich produktiv akzeptiert. Der ursprüngliche Benchmarkkern, FLH01/FLH02,00/01 und bestätigte ABCE/08-Teile bleiben erledigt. Der Gesamtauftrag ist **PARTIAL**, nicht abgeschlossen: mehrere Originalformat-/Fach-/Gerätegates sowie14/16/18/FLH04 und begrenztesD sind offen. Die konsolidierte Reihenfolge und überprüfbaren kleinen Inkremente stehen in `KONSOLIDIERTE_ROADMAP.md`. Audit zuerst separat remote sichern; danach ohne erneute Freigabefrage die bereits autorisierte sichere D-Verbesserung evaluieren und in eigenem main-basiertem PR bearbeiten. Keine Produktänderung während dieses Dokumentationsschritts.
