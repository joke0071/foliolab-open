# FolioLab Open – konsolidierte Benchmark-Restarbeiten

Stand 25.10.2026 · Master [#124](https://github.com/joke0071/foliolab-open/issues/124) · Basis `e29910e2cca75bc5578da3f063243179b0280ed9` · PWA v148.

## Entscheidung und belastbarer Ausgangspunkt

Kein erneuter Releaseaudit #123, keine Wiederimplementierung WH01–WH07. Keine offenen PRs/Drafts bei Start; offene Issues #44, #47, #52, #119 vollständig samt relevanten Fortschrittskommentaren geprüft. Branchinventar enthält historische Audit-/Featurestände; keine andere aktive v2-Roadmap gefunden. main erneut per API/git festgestellt. Produktionslauf [40164677403](https://github.com/joke0071/foliolab-open/actions/runs/40164677403) erfolgreich; jüngste Wallet-Läufe 40164482589/598 erfolgreich. Lokale Baseline: `npm test` 535 bestanden, 0 fehlgeschlagen/übersprungen. Neue Codeänderungen benötigen eigene Tests; alte CI ist keine Abnahme eines neuen Diffs.

Keine neu bestätigten P0-Fehler. Priorität liegt auf generischem Kontostandsabgleich und Bankkomfort, daneben belegabhängiger Broker-/Steuervervollständigung. Der erste startbereite Schnitt ist **AT03-A: aktueller, rein lesender Cashsaldovergleich**, keine wertändernde Reconciliation und keine automatische Einzahlung. Gesamtes AT03 bleibt nach A teilweise offen.

## Quellen und Prüfumfang

Alle acht angeforderten Library-Dateien vollständig gelesen: Benchmark_Actionplan, Actionplan_Revidiert, REFERENZ_Revidierter_Actionplan, REFERENZ_Alle_Work-Auftraege, PLUS_PRIORISIERUNG, PRIORISIERUNG_FolioLab_Work, PLUS03 und PLUS04. Zusätzlich WP15 separat gelesen; die Vollreferenz enthält nur WP01–14. Keine Informationslücke dieser Referenzen. Keine freigegebenen anonymisierten Original-Brokerbelege für diesen Lauf bereitgestellt; keine privaten Bankdateien aus anderen Quellen gesucht.

Historische Roadmaps sind Quellen für Absichten, nicht aktueller Implementierungsnachweis. Codepfade und Tests unten beziehen sich auf Basis-SHA; Dateinamen ohne Pfadpräfix liegen in `src/`, Testnamen in `tests/`. Bestehende Module gezielt gelesen, vorhandene Regressionen und Integrationsdokumentation geprüft; keine neue allgemeine Release-/Sicherheitszertifizierung.

## Vollständige Abdeckungsmatrix

| BENCH | Thema | Einstufung | Alte Zuordnung | Wesentliche Evidenz | Verbleibendes Delta / Entscheidung |
|---|---|---|---|---|---|
| BENCH-001 | Importidentität | Vollständig umgesetzt und nachgewiesen | R03/R04 · WP04/05 · PLUS01 | import-identity.js, csv-import.js; p0-import-identity/conflicts.test.mjs; #115 | Kein Neubau; zukünftige Brokerregeln AT03 |
| BENCH-002 | Import-Vorprüfung | Vollständig umgesetzt und nachgewiesen | R04/R05 · WP05/06 · PLUS01 | app.js openCSVImport; browser-csv-review-a11y, browser-p0-import; #115/#118 | Bestehende Zuordnung/Skip/Fehlerblockade weiterverwenden |
| BENCH-003 | Nutzerkorrekturen/Herkunft | Vollständig umgesetzt und nachgewiesen | R03/R04 · WP04/05 · PLUS01 | import-identity.js Vergleichsstand; p0-import-conflicts; #115 | Keine zweite Ownership-Persistenz |
| BENCH-004 | Prüfen-Einstieg | Teilweise umgesetzt mit konkreter Restlücke | R09 · WP07 | valuation-status.js, app.js showValuationIssues; browser-valuation-drilldown | Kurs-Drilldown vorhanden; andere vorhandene Kontexte gezielt ableiten → AT01 |
| BENCH-005 | Sync-Status | Teilweise umgesetzt mit konkreter Restlücke | R08 · WP07 | refresh-ui.js, wallet-scan-update.js, wallet-history-state.js; refresh-ui/wallet-scan-valuation tests | Gemeinsame Aktion/Statusdarstellung, kein globaler Serviceumbau → AT01/04 |
| BENCH-006 | Opt-in-IDB-Abnahme | Teilweise umgesetzt mit konkreter Restlücke | R02 · WP03 · PLUS02 | browser-portfolio-storage.js, atomic-storage.js; browser-p0-storage/idb-*; #117/#44 | Technik vorhanden; reale Crash/Eviction-Abnahme → AT06 |
| BENCH-007 | Renditegrenzfälle | Vollständig umgesetzt und nachgewiesen | R01 · WP02 · PLUS01 | performance.js; p0-performance-boundaries, ledger-reference-arithmetic; #115 | Konservative XIRR-Gates erhalten |
| BENCH-008 | Barausgleich | Durch fehlende Belege blockiert | R13 · WP12/WP15-D · PLUS04 | transactions.js, ledger-multistep-fx-corporate; #52 | Bewusste Ablehnung sicher erhalten → #52/AT05 |
| BENCH-009 | Buchungsassistent | Durch neuere Funktionen ersetzt | R10 · WP08 | app.js openBooking; economic-form-ui.js; browser-dialog-financial-choices/staking-dialog-scope | Kontextfelder/Common types vorhanden; kein kompletter Intent-Neubau |
| BENCH-010 | Kursprovenienz | Teilweise umgesetzt mit konkreter Restlücke | R08/R11 · WP07/08 | quote-quality.js, position-detail-ui.js, app.js Kursdetails; position-detail-priority | Wert/Datum/Quelle vorhanden; kontextübergreifende Prüfaktion → AT01 |
| BENCH-011 | Vermögen vs Rendite | Vollständig umgesetzt und nachgewiesen | R01/R11 · WP02/08 | dashboard-ui.js, performance.js, capital-flows.js; dashboard-ui/performance-integration | Vermögenskurve/Cashflow-Gates getrennt, keine erneute Dashboardrunde |
| BENCH-012 | Dialogkontrakt | Teilweise umgesetzt mit konkreter Restlücke | R00/R10 · WP01/08 | dialog-discard.js, app.js showDialog; docs/DIALOG_FORM_CONSISTENCY_AUDIT_2026-10-24.md; browser-dialog-* | Automatisiert abgedeckt; echtes TalkBack/Safari offen → AT06 |
| BENCH-013 | Brokeradapter | Durch fehlende Belege blockiert | R06 · WP09/WP15-A/B · PLUS03 | flatex-import/backfill/cash-audit/settlements; flatex-* tests; #97/#115 | Flatex-Beta vorhanden; Cash/weitere Dialekte/TR nicht voll freigegeben → AT03-C |
| BENCH-014 | Transfer-/Saldenabgleich | Sinnvoll und tatsächlich noch offen | R07 · WP10/WP15-B · PLUS03 | transactions.js transfer vorhanden; flatex-reconciliation/settlements lesend; ledger-v3/flatex-reconciliation | Generischer Saldenvergleich + bestätigte Vorschläge fehlen → AT03-A/B |
| BENCH-015 | Historienqualität | Durch neuere Funktionen ersetzt | R08/R09/R11 · WP07/08/13 | position-history.js, wallet-history-core/days/valuation/state; wallet-history-* tests; #120–123 | Coverage/Herkunft vorhanden; verbleibende Darstellung → AT01, Praxisgrenzen → AT06 |
| BENCH-016 | Provider-Capabilities | Teilweise umgesetzt mit konkreter Restlücke | R08 · WP07 | blockchain-adapters.js, staking-catalog.js, security-sources.js; blockchain-adapters/staking-coverage tests | Netzwerkfähigkeiten vorhanden; aktuelle vs historische Fähigkeiten explizit dokumentieren → Matrix/AT04 |
| BENCH-017 | Blockchainpilot | Durch neuere Funktionen ersetzt | R14 · WP13 | bitcoin-history.js, ethereum-history.js, solana-history.js; #119–123 | WH01–07 statt neuem Decoder. Automatisches Reward-/Steuerjournal bewusst zurückgestellt |
| BENCH-018 | Inkrementelles Rechnen | Bewusst zurückgestellt | R15 · WP14 | docs/BROWSER_PERFORMANCE_AUDIT_2026-10-23.md; portfolio-scale/browser-portfolio-scale | Kein neu gemessener Engpass; kein spekulativer Refactor |
| BENCH-019 | Filterpresets | Teilweise umgesetzt mit konkreter Restlücke | R12 · WP11 | position-search.js, app.js renderPositions/renderBookings; browser-booking-filters/position-search | Suche/Konto/Anbieter/Typ/Prüfen vorhanden; persistente zusätzliche Presets nur bei Nutzen → AT01 P2 |
| BENCH-020 | Reale Android-Abnahme | Durch fehlende Belege blockiert | R00/G5 · WP01/08 · PLUS02 | docs/DIALOG_AUDIT_ANDROID_TALKBACK_CHECKLIST.md; browser-offline-mobile/accessibility-audit | Hardware fehlt → AT06, Emulation nicht als Ersatz |
| BENCH-021 | Secret-/Privacy-UX | Vollständig umgesetzt und nachgewiesen | R12/G6 · WP11 · PLUS02 | credential-visibility.js, crypto-backup.js, complete-backup.js; privacy-dataflow/security-privacy/complete-backup | Offene Exporte ohne Secrets; explizit verschlüsselte Vollsicherung optional mit Settings. Sitzungsmodus nicht erforderlich |
| BENCH-022 | Risikobasierte Gates | Vollständig umgesetzt und nachgewiesen | R00/G0–G6 · WP01 · PLUS01/02 | docs/WORK_RELEASE_GATES.md; .github/workflows/import.yml; #103/#115/#117 | CI-Zwang für Deploy vorhanden; ungeschütztes main ist organisatorisches Restrisiko, keine Adminänderung |
| BENCH-023 | Wording/Leerzustände | Durch neuere Funktionen ersetzt | R10 · WP08 | onboarding-suggestions.js, economic-form-ui.js, app.js; browser-modal-clarity/dialog-*; #116/#118 | Keine breite erneute UX-Runde, neue reproduzierte Defekte gezielt |
| BENCH-024 | Diagnoseexport | Bewusst zurückgestellt | R12 optional · WP11 | market-diagnostics.js vorhanden; kein allgemeiner Diagnoseexport | Kein belegter Supportnutzen; neue Rohdaten-/PII-Exportfläche derzeit nicht erforderlich |

„Vollständig“ meint den eng definierten Benchmarkzweck, keine vollständige Finanz-/Steuerproduktzertifizierung. „Ersetzt“ bedeutet vorhandener anderer Weg erfüllt den praktischen Zweck; nicht jede ursprünglich vorgeschlagene Architektur wurde nachgebaut.

## Vollständiges Altplan-Mapping

| R | WP | Neuer Stand / Träger |
|---|---|---|
| R00 | WP01 | #103 CI integriert; AT06 Hardware-Gates, kein neues Basisaudit |
| R01 | WP02 | PLUS01/#115 integriert; nur echte neue Regressionen |
| R02 | WP03 | PLUS02/#117 Kern integriert, #44/AT06 reale Restgates |
| R03 | WP04 | PLUS01 integriert, Importidentität/Schutz |
| R04 | WP05 | PLUS01 integriert, atomare Konfliktengine |
| R05 | WP06 | vorhandene Vorschau/Review, kein Neubau |
| R06 | WP09 | AT03-C / PLUS03, Realbeleg-Gate |
| R07 | WP10 | AT03-A/B, allgemeiner Abgleich; Broker-Cash unter PLUS03 |
| R08 | WP07 | bestehende Quellen-/Walletstatus, Rest AT01/04 |
| R09 | WP07 | bestehender Prüfen-Einstieg, enges Delta AT01 |
| R10 | WP08 | vorhandene Dialog-/Buchungs-/Wordingarbeit, reale Abnahme AT06 |
| R11 | WP08 | vorhandene Rendite-/Kursanzeige, Rest AT01 |
| R12 | WP11 | Filterbestand/Privacy vorhanden; Rest AT01, Diagnoseexport zurückgestellt |
| R13 | WP12 | #52 bleibt kanonisch, Belege fehlen; AT05 verlinkt |
| R14 | WP13 | durch WH01–07 ersetzt; Steuer-/Rewardklassifikation zurückgestellt |
| R15 | WP14 | Messung vorhanden, inkrementeller Refactor ohne neuen Engpass zurückgestellt |
| neu | WP15 A/B | AT03-C / PLUS03 mit Belegen |
| neu | WP15 C/D | AT05 / PLUS04; #52 nur beim konkreten Sonderfall |

PLUS01 nicht neu starten. PLUS02 nicht neu bauen, nur #44-Restgates. PLUS03/04 produktiv blockiert. Alte Drafts #104–106/#111 nicht wieder mergen; relevante Inhalte sind durch #115/#117 ersetzt. #47 besitzt `legacy-quote-audit.js` und Browser-/Unitnachweise; kein neues Repricing, bestehendes Issue bei Review anhand aktueller Nachweise bereinigen. #119 ist technisch erledigte Referenz; offene Hardware-/Providerbelege in AT06 halten. In diesem Lauf keine alten Issues ungefragt geschlossen.

## Fachliches Produktdelta A–G

| Bereich | Vorhanden | Tatsächlich offen / Grenze |
|---|---|---|
| A Broker | Flatex CSV-Beta, Konto-/Depotmodell, Kaufen/Verkaufen/Teilverkäufe, generischer Import, Herkunft/Dedupe/Korrekturschutz, Backfill mit Mengen-/Unbekannt-Gates | Kein freigegebener vollständiger Kontojournal-/Steuerimport, TR-Adapter fehlt, reale Dialekt-/Sparplan-/Übertrags-/Settlementnachweise fehlen → AT03-C |
| B Reconciliation | Importidentität; explizite Journaltransfers; lesender Flatex-Stückvergleich/Settlementkandidaten | Generischer tatsächlicher vs erfasster/rechnerischer Saldo und sichere bestätigte Transferzuordnung → AT03-A/B. Drei Prozesse bleiben getrennt |
| C Bank/Liquidität | Mehrere Konten/Anbieter, Fremdwährung, manuelle Eröffnungen ohne fiktive Einzahlung, gebuchte Zinsen | Zinssatzabschnitte, Prognose, Laufzeit/Fälligkeit, Wiederanlage/Auszahlung und Liquiditätsstatus → AT02. Keine Prognose im Vermögen |
| D Steuern | Gebuchte Steuer-/Gebühren-/Ertragssummen, unbekannte Flatex-Basis bleibt unbekannt | Belegbezogene Jahres-/Kontenübersicht; KESt/Quellensteuer/OeKB-/Basisanpassungen nur mit Belegen und Fachvalidierung → AT05 |
| E Krypto | Siehe Matrix, WH01–07 und Wirtschaftlichkeits-/Doppelzählungsmodell vorhanden | Kein pauschaler Full-DeFi/Rewards-/Steueranspruch; reale Archive/Providerlimits AT06, nur konkrete Integritätsdeltas AT04 |
| F Analyse/Komfort | Vermögen/Klassen/Anbieter/Konten, Suche, Buchungsartfilter, Kalender/Stichtage, begrenzte TWR/XIRR, schnelle Erfassung | Keine im Kontenmodell nachgewiesene Sparplanplanung oder Zielgewichte/Rebalancingplanung; P2/P3 spätere Nutzwertentscheidung, kein Handel. Liquidität zunächst AT02; kein neuer Analytics-Hauptauftrag |
| G Daten/Kosten | Qualität/Quelle, Requests/Timeout/Rate-Fallback, CSV/offenes JSON, verschlüsselte Vollsicherung optional mit Settings, freiwilliges Drive, Key-freier Kernbetrieb, Skalensmokes | Gemeinsame vorhandene Prüfaktionen AT01, reale Recovery/Hardware/Archivgrenzen AT06. Kostenlose Anbieter garantieren keine Vollhistorie. Keine neue Engine |

## Krypto-Capability-Matrix (Codefähigkeiten, keine Live-Vollständigkeitsgarantie)

Legende: J = implementiert, T = teilweise/best effort, — = nicht implementiert bzw. nicht anwendbar. Historische EUR-Werte erfordern identitätskorrekte datierte Preise und belegte Tagesmengen; selbst dann Schätzung mit Coverage, kein steuerlicher Anschaffungswert. Rewards meint separat nachgewiesene tatsächliche Ertragsereignisse, nicht steigenden Tokenpreis oder Differenz zweier Salden.

| Netzwerk | Aktuell nativ | Token | History-Ereignisse | History EUR | Native Staking | Delegation/Unbonding | LST-Bestand | Rewards | Grenzen / Evidenz |
|---|---|---|---|---|---|---|---|---|---|
| BTC / HD | J | — | J | T | — | — | — | — | Esplora, Receive/Change/Gap/Overlap, Providerpagination; bitcoin-hd/history + Tests |
| Ethereum Mainnet | J | T | J ETH/ERC20 | T | — | — | T stETH/rETH | — | Blockscout/Logs/Fees, Rebase nicht als Reward; ethereum-history, ethereum-fallback, defi |
| Solana | J | T SPL | J SOL/SPL | T | T Stake-Accounts | T Zustand, keine komplette Abwicklungshistorie | T Token, keine Full-LST-Auflösung | — | indexfähiger RPC/Archiv, geschlossene Accounts/Slots/Token2022 partial; solana-history/rpc, staking-discovery |
| Polygon | J | T | — | — | — | — | T nur unterstütztes Token | — | POL/ERC20, Scanner ist keine Historienengine |
| BNB Smart Chain | J | T BEP20 | — | — | — | — | T nur Token | — | Binplorer/RPC, native Delegation separat; native-staking-networks/bnb-token-scanner |
| Avalanche | J C-Chain | T | — | — | — P-Chain | — | T sAVAX | — | C-Chain-LST ist kein P-Chain-Nativestake; market/staking-discovery |
| Sonic | J | T | — | — | T SFC | T delegierter Stand; Unbonding nicht vollständig | T stS | — | SFC/Validatorerkennung best effort, keine erfundene Rewardhistorie |
| Base/Arbitrum/Optimism | J | T | — | — | — | — | T nur Token | — | gemeinsame EVM-Scanner, WH03 nur Mainnet |
| Cosmos Hub | J ATOM | — weitere Denoms | — | — | T | T delegiert/unbondend | — | — | LCD/Pagination; ausstehende Rewards nicht vollständig |
| Hedera | J HBAR | — | — | — | T Stakinginfo | — | — | — | Stake im Gesamt-HBAR enthalten, keine zweite Guthabenposition |
| NEAR | T frei/locked | — | — | — | T locked | — Poolvollständigkeit | — | — | keine vollständige Staking-Pool-Historie |
| XRP | J | T Trustlines | — | — | — | — | — | — | Issueridentität beachten, XRP ist kein native-Staking-Netz |
| Cardano/TON/Sui/Aptos u.a. | manuell | manuell | — | — | manuell | manuell | manuell | — | Katalogeintrag ist kein automatischer Adapter |

Evidenz: `blockchain-adapters.js NETWORKS/getCapabilities`, `market.js`, `staking-discovery.js`, `native-staking-networks.js`, `staking-catalog.js`, `defi.js`; `blockchain-adapters`, `native-staking-networks`, `mvp-staking-wallets`, `wallet-scan-valuation`, `wallet-history-*` Tests. ERC20/SPL-Erkennung ist best effort, niemals Vollständigkeit. Fehler/Teilergebnisse dürfen bestätigte Bestände nicht nullen. Liquid-Staking-Repräsentation/`valuationMode` vor Addition beachten.

## Primärquellen Österreich – geprüft 25.10.2026

- [Trade Republic offizielle AT-Mitteilung, 24.04.2025](https://assets.traderepublic.com/assets/files/250424_TradeRepublic_Pressemitteilung_BranchLaunchAustria_AT_DE_V2.pdf): steuereinfaches AT-Angebot angekündigt. [Aktuelle Kundenvereinbarung Österreich](https://assets.traderepublic.com/assets/files/CA_AT-de.pdf), Anlage 11: Bestandskunden benötigen abgeschlossenen Migrationsprozess; der Produktname allein beweist keinen individuellen Steuerstatus. Zeitraum, Vertrags-/Migrationsstatus und Produkt am tatsächlichen Beleg prüfen, keine rückwirkende Pauschalisierung.
- [BMF inländische Kapitalerträge](https://www.bmf.gv.at/themen/steuern/sparen-veranlagen/besteuerung-kapitalertraege-inland.html): 25 % für Einlagenzinsen, grundsätzlich 27,5 % für andere einschlägige Kapitalerträge; Quellensteueranrechnung und Sonderfälle sind kein pauschaler einfacher Gebührenabzug. Hieraus werden keine neuen Berechnungsregeln implementiert.
- [BMF Kryptowährungen](https://www.bmf.gv.at/themen/steuern/sparen-veranlagen/steuerliche-behandlung-von-kryptowaehrungen.html): Alt-/Neuvermögen und klassisches Validierungsstaking versus Kapitalüberlassung unterscheiden. Reward-Label allein ist kein steuerlicher Vorgang; keine allgemeine Steuerableitung aus Wallet-Deltas.
- [OeKB Steuerdaten](https://www.oekb.at/kapitalmarkt-services/unser-datenangebot/fonds/steuerdaten.html): Meldungen öffentlich in my.oekb, elektronische Datenlieferung gegebenenfalls kostenpflichtig. ISIN, Meldungsart, Zeitraum/Datum und belegte Anschaffungskostenanpassung benötigt. Kein neuer Vollkatalogdownload oder ungesicherter Crawler.

Zusätzliche geprüfte Fachgrenze: [BMF realisierte Wertsteigerungen](https://www.bmf.gv.at/themen/steuern/sparen-veranlagen/substanzgewinne-bzw-einkuenfte-aus-realisierten-wertsteigerungen.html) unterscheidet die steuerliche Behandlung von Anschaffungsnebenkosten bei Wertpapieren von einer wirtschaftlichen Portfolio-Kostenrechnung. Die vorhandene gebühreninklusive Journalbasis darf nicht als österreichische Steuerbasis ausgegeben werden; keine bestehenden Portfolio-Daten pauschal umstellen. [BMF Verlustausgleich](https://www.bmf.gv.at/themen/steuern/sparen-veranlagen/verluste-aus-veraeusserung-von-kapitalvermoegen-und-derivaten.html) begrenzt zulässige Verrechnung und beschreibt das Steuerreporting für Einkünfte ab 2025. Tatsächliche Brokerreports sind geeignete Belegquellen, keine Aufforderung zur eigenen automatischen Steuerrechnung. Ein öffentlicher OeKB-Einzeldatensatz war per Textextraktion nicht vollständig zugänglich; deshalb keine numerischen Fondsmeldungs-Sollwerte als verifiziert behauptet.

Eine dokumentierende Jahresübersicht ist vor automatischer Steuerengine priorisiert. Brokerabzug, exakte eigene Rechnung, Schätzung und unbekannt sind getrennte Nachweisqualitäten. Für produktive Steuer-/Brokerregeln fehlen freigegebene Belege und unabhängige Fachvalidierung; offizielle allgemeine Quellen ersetzen diese nicht.

## Erneute Benchmarkentscheidung und Lizenzen

Benchmark-HEADs erneut abgerufen: rotki `6cd6a9e029830b2495218dd7f69da4ec502e9cf5`, Sure `09df1b14f14389a02c3939f98410a6cbff64fef9` (unverändert zur historischen Analyse). Erneut gelesen: rotki `history/data_issues/manager.py`, Sure `account/provider_import_adapter.rb` und `account/reconciliation_manager.rb`, beide AGPL-v3-Lizenzen.

Sinnvolle Konzepte: Quellen-/Kontoidentität und Nutzerkorrekturschutz (bereits umgesetzt), expliziter Abgleich statt ungefragter Cashflow, objektbezogene handlungsfähige Hinweise. Nicht übernehmen: rotkis SQL-Issue-Persistenz/Full-DeFi-Decoder, Sures Rails-/Server-/Queuearchitektur oder heuristisches automatisches Claimen von Betragsmatches. Keine Codeschnipsel übernommen; FolioLab-Änderung eigenständig auf bestehenden JS-Modulen. Vollständige Benchmarkanwendungen nicht neu ausgeführt.

## Priorisierung (Planungswerte, keine gemessenen Qualitätsnoten)

Bewertung 1–5, höher ist besser. K = finanzielle Korrektheit/Sicherheit 30 %, N = Nutzen 25 %, U = Einfachheit/UX 20 %, W = Wartbarkeit 15 %, E = geringer Aufwand/Risiko 10 %. Summe = 0,30 K + 0,25 N + 0,20 U + 0,15 W + 0,10 E. Keine neue P0-Lücke bestätigt. Daten- und Hardwaregates übersteuern Startbereitschaft, nicht fachliche Priorität.

| Rang | Paket | K/N/U/W/E | Score | Prio / Aufwand | Start / Abhängigkeit |
|---|---|---|---|---|---|
| 1 | [AT03 #127](https://github.com/joke0071/foliolab-open/issues/127) | 5/5/4/4/3 | 4,45 | P1 · M, A=S | A jetzt; B Fachvertrag; C Realbelege/PLUS03 blockiert |
| 2 | [AT02 #126](https://github.com/joke0071/foliolab-open/issues/126) | 4/5/4/4/3 | 4,15 | P1 · M | A Fälligkeit unabhängig; B Zinskonvention/Referenzwerte |
| 3 | [AT05 #129](https://github.com/joke0071/foliolab-open/issues/129) | 5/4/3/4/3 | 4,00 | P1 · M | Übersicht Fachvertrag; automatische Regeln PLUS04/Belege blockiert; Barausgleich #52 |
| 4 | [AT06 #44](https://github.com/joke0071/foliolab-open/issues/44) | 5/4/3/4/2 | 3,90 | P1 · M verteilt | autorisierte Drive-/Hardware-/Archivumgebung je Untergate |
| 5 | [AT01 #125](https://github.com/joke0071/foliolab-open/issues/125) | 4/4/4/4/3 | 3,90 | P2 · M | bestehende Kurs-/Historydaten unabhängig; AT03-Konflikte später |
| 6 | [AT04 #128](https://github.com/joke0071/foliolab-open/issues/128) | 4/3/3/4/2 | 3,35 | P2 · S je Fix | nur reproduzierbarer bestehender Integritätsmangel, keine neue Chain |

Aufwand S/M/L sind relative Größen, keine Laufzeit-/Creditgarantie. Pro Lauf eine abgeschlossene kleine Scheibe; unabhängige Analyse nicht mit konkurrierenden Codeänderungen verwechseln.

## Ausführbare Pakete und Abhängigkeiten

Die sechs oben verlinkten Issues enthalten Ziel/IST–SOLL, Scope, Ausschlüsse, Module, Start-/Datengates, Sicherheits-/Testregeln, Abnahme, Stop-Gates und Checkpoint-/Resume-Vertrag. AT06 verwendet bewusst #44 weiter, #52 bleibt Barausgleich, #119 technische Historyreferenz. Kein Doppelissue für vorhandene Probleme.

Sequenz: AT03-A → unabhängiges AT02-A → AT03-B nach Fachvertrag. AT03-C erst mit CSV-/Abrechnungsbelegen; AT05-B danach oder mit eigenständig ausreichenden bestätigten Belegen. AT01 kann vorhandene Statusquellen unabhängig bündeln. AT04 nur konkretes Delta, AT06 manuelle Nachweise unabhängig von Produktentwicklung.

## Wiederaufnahme / sicherer Checkpoint

1. Master #124 und neueste Kommentare lesen.
2. Dieses Dokument und oben verlinkte Paketissues prüfen.
3. Dokumentationsbranch `docs/benchmark-restarbeiten-2026-10` und zugehörigen Draft-PR prüfen.
4. Featurebranch `feature/at03-current-cash-reconciliation` und zugehörigen PR prüfen; letzten Remote-Commit/Tests/offene Schritte lesen.
5. main vergleichen. Bereits bestätigte BENCH-Analyse nicht neu beginnen, nur Änderungen seit Basis gezielt bewerten.
6. AT03-A ist inzwischen in [Feature-Draft-PR #131](https://github.com/joke0071/foliolab-open/pull/131) implementiert und in kleinen Remote-Commits gesichert. Letzter Code-/Testcheckpoint: `98c6c033dc209f6958d66626eab64bb7554fc3b3`. Vollsuite 541 Tests und lokale Chromium-Regressionen bestanden; finale Cross-Engine-/CI-Ergebnisse und exakter Wiedereinstieg stehen im Master/PR. Erst diese prüfen, keine neue Implementierung beginnen. Keine produktiven Brokerregeln, kein Merge/Deployment.

Nach jeder fachlichen Scheibe prüfen/testen/committen/pushen und Issue/PR aktualisieren. WIP ist erlaubt, muss klar unvollständig heißen. Dokumentations- und Featurebranches bleiben getrennt; beide basieren auf geeignetem main. Der Feature-PR braucht keinen Merge des Dokumentations-PRs.

## Qualitätsbewertung mit Grenzen

- Funktionsumfang: breite lokale Multi-Asset-/Wallet-/Journalbasis nachgewiesen; Banklebenszyklus und Broker-/Steuerbelegintegration noch lückenhaft.
- Finanzielle Zuverlässigkeit: exaktes Journal, Herkunftsschutz und konservative unknown-Gates durch Tests belegt; keine vollständige Bank-/Steuerabstimmung realer Konten bestätigt.
- UX: mehrfach geprüfte responsive Dialoge und kompakte Drilldowns vorhanden; Hardware-TalkBack/Safari und echte Nutzeraufgaben bleiben Nachweise.
- Datenschutz: lokale Daten, freiwillige öffentliche Provider/Drive und offene Exporte ohne Secrets; Provideranfragen können Wallet-/Instrumentinteressen offenlegen. Lokale API-Schlüssel sind keine vollverschlüsselte Gerätesicherheitsgrenze.
- Sicherheit/Recovery: atomare Pfade/CAS/Web Locks, verschlüsselte Vollsicherung und synthetische Restoretests vorhanden. Reales Konto, Crash/Eviction und Hardware sind offen; main ist ungeschützt, keine Konfiguration geändert.
- Wartbarkeit: Vanilla JS und vorhandene Engines weitergenutzt; `app.js` bleibt groß, pauschaler Refactor ohne Mess-/Fehlerbeleg zurückgestellt.

Keine numerische Gesamtnote, keine Behauptung einer Steuer-/Sicherheitszertifizierung. Diese Bewertung trennt Implementierungs-/Testnachweise von realweltlichen offenen Gates.
