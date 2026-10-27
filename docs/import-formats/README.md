# FLH05 — Formatbibliothek, Stand 27.10.2026

Status: Recherche IN PROGRESS, keine neue Parser-/Produktionsfreigabe. Zentraler Gesamtstatus: [WORK_RESTPAKETE_CHECKPOINT.md](../WORK_RESTPAKETE_CHECKPOINT.md), Issue174. Aktiver Branch feature/flh05-import-foundation auf v188. Der frühere Ledger-Vorschauversuch ist remote geparkt, kein paralleler Importkern.

Die Bibliothek trennt zwingend:

1. **Offiziell dokumentiert:** Exportexistenz und tatsächlich beschriebene Felder separat bewerten.
2. **OSS rekonstruiert:** konkreter Commit/Codepfad; Annahmen des fremden Importers sind kein offizieller Anbieter-Vertrag.
3. **Eigene synthetische Fixtures getestet:** strukturelle, Erkennungs- und wirtschaftliche Tests separat benennen; öffentliche Testverfügbarkeit allein ist kein bestandener FolioLab-Test.
4. **Private Originale validiert:** Dialekt/Zeitraum/Produkt und Umfang lokal dokumentieren; keine Originaldaten auf GitHub.
5. **Bestands-/Historienabgleich:** Anfang/Ende, Cash/Assets/Fees/Tax/Transfers und Vollständigkeit unabhängig belegen.

Evidenz ist feld- und versionsbezogen. Keine pauschale „Anbieter unterstützt“-Aussage aus einer Liste von Headern. API, Broker-App, Bankkonto, Depotübersicht, nativer CSV-Export, PDF und durch Drittanbieter erzeugte CSV sind verschiedene Dialekte.

## Bereits belastbare neue Befunde

- Portfolio Performance enthält einen aktuellen TradeRepublicCSVExtractor mit veröffentlichten Testheadern; offizieller Exportnachweis/Region/Version bleiben davon getrennt. Headerunterschiede (value_date/mcc_code) und Gebühren-/Steuer-Sonderfälle nicht ignorieren.
- Bitpanda hat einen belegten16-Spalten-Dialekt mit variablem Vorspann. Ein API-Adapter ist kein CSV-Adapter; Bitpanda Pro und Retail sind nicht identisch.
- Kraken Ledgers/Trades/Balances haben verschiedene Rollen. Alte9-/10-Spalten-Ledgers und neuere zusätzliche Felder erfordern explizite Versionen. Exchange-Referenz ist kein Blockchainhash; Trades/Ledgers nicht doppelt verbuchen.
- Scalable-Drittanbieter-/Bookmarklet-/PP-Exporte strikt von nativem PRIME-CSV trennen. ING-Depotübersichten sind Bestandsbelege und keine erfundenen historischen Käufe. DEGIRO kann unbeschriftete Währungs-/Betragsspalten enthalten.
- Poveroh liefert Bank-Mapping-Heuristiken, kein präzises mehrbeiniges Portfoliojournal. CleverCSV ist Python/C, keine direkt nutzbare Browserbibliothek. PapaParse ist ein Parsing-/Streamingkandidat, keine Finanzengine; Bibliotheksadoption erst nach Messung.
- Bestehende FolioLab Exact-, CSV-/Batch-/Identity-, Vorschau-, Journal-, Reconciliation-, CAS-, Backup- und Undo-Verträge bleiben kanonisch.

## Quellenarbeit und Übernahmeregel

Aktuell gelesene Default-Branch-Revisionen, tatsächliche Quelldateien und Lizenzen werden im Quellenregister festgehalten. Keine fremden Implementierungen oder echten öffentlichen Beispielbuchungen werden übernommen. Synthetische Fixtures werden unabhängig aus den belegten Schemas erzeugt. AGPL/GPL/EPL-Quellcode dient hier ausschließlich als Recherchequelle; eine Übernahme ist nicht vorgesehen. Auch bei MIT/Apache wird nichts ohne konkreten Vorteil und vollständige Lizenz-/Noticeprüfung eingebunden.

Der endgültige versionierte Katalog, die Anbieter-Kompatibilitätsmatrix, Benchmark-/Gap-Analyse, Architekturentscheidung, synthetischen Fixtures und präzisen Originaldateianforderungen werden in diesem Verzeichnis sequenziell vervollständigt. Bis dahin ist FLH05-00 ausdrücklich nicht DONE. Keine weitere Parserimplementierung vor Abschluss dieses Schritts.
